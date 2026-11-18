import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CONSENT_COOKIE, type ConsentRecord } from './consent'
import {
  attributionFor,
  captureServerException,
  deterministicUuid,
  forgetServerAnalyticsState,
  trackServer,
} from './server'

const mocks = vi.hoisted(() => ({
  construct: vi.fn(),
  captureImmediate: vi.fn(),
  captureExceptionImmediate: vi.fn(),
  waitUntil: vi.fn(),
}))

vi.mock('posthog-node', () => ({
  PostHog: class {
    constructor(...args: unknown[]) {
      mocks.construct(...args)
    }
    captureImmediate = mocks.captureImmediate
    captureExceptionImmediate = mocks.captureExceptionImmediate
  },
}))

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: () => ({ ctx: { waitUntil: mocks.waitUntil } }),
}))

const UUID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const ANY_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

/** An app fetch from a page, outside the regions that ask first unless the test says otherwise. */
function visit(record: ConsentRecord | null, headers: Record<string, string> = {}): Request {
  return new Request('https://pleiad.io/api/profile', {
    headers: {
      'cf-ipcountry': 'US',
      referer: 'https://pleiad.io/onboarding',
      'x-posthog-session-id': '0190-session',
      ...(record ? { cookie: `sb-auth=token; ${CONSENT_COOKIE}=${record}` } : {}),
      ...headers,
    },
  })
}

/** The one message PostHog was given. */
function sent() {
  expect(mocks.captureImmediate).toHaveBeenCalledTimes(1)
  return mocks.captureImmediate.mock.calls[0][0]
}

function expectUnattributed(message: { distinctId: string; properties: Record<string, unknown> }) {
  expect(message.distinctId).toMatch(ANY_UUID)
  expect(message.properties.$process_person_profile).toBe(false)
  expect(message.properties).not.toHaveProperty('$session_id')
  expect(message.properties).not.toHaveProperty('$current_url')
}

/** Every send is handed to waitUntil; awaiting those is awaiting delivery. */
async function delivered(): Promise<void> {
  await Promise.all(mocks.waitUntil.mock.calls.map(([promise]) => promise))
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.captureImmediate.mockResolvedValue(undefined)
  mocks.captureExceptionImmediate.mockResolvedValue(undefined)
  forgetServerAnalyticsState()
  vi.stubEnv('NODE_ENV', 'production')
  vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', 'phc_test_key')
  vi.stubEnv('NEXT_PUBLIC_POSTHOG_ENV', 'preview')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('missing configuration', () => {
  beforeEach(() => vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', ''))

  it('is a silent no-op in production', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    trackServer('user_signed_up', { actor: { userId: 'u1' }, properties: { method: 'email' } })
    captureServerException(new Error('boom'))

    expect(warn).not.toHaveBeenCalled()
    expect(mocks.construct).not.toHaveBeenCalled()
    expect(mocks.waitUntil).not.toHaveBeenCalled()
  })

  it('logs the documented message once outside production, and keeps running', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    trackServer('user_signed_up', { actor: { userId: 'u1' }, properties: { method: 'email' } })
    trackServer('user_signed_up', { actor: { userId: 'u2' }, properties: { method: 'email' } })

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledWith(
      'NEXT_PUBLIC_POSTHOG_KEY variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_KEY is configured'
    )
    expect(mocks.construct).not.toHaveBeenCalled()
  })
})

describe('trackServer', () => {
  it('sends immediately, inside waitUntil, with the namespaced id, the visit and reserved properties', async () => {
    trackServer('user_signed_up', {
      actor: { userId: 'u1' },
      properties: { method: 'google' },
      request: visit('granted'),
    })
    await delivered()

    expect(mocks.waitUntil).toHaveBeenCalledTimes(1)
    expect(mocks.captureImmediate).toHaveBeenCalledWith({
      distinctId: 'pleiad:user:u1',
      event: 'user_signed_up',
      uuid: undefined,
      properties: {
        $current_url: 'https://pleiad.io/onboarding',
        $session_id: '0190-session',
        method: 'google',
        site: 'pleiad',
        env: 'preview',
      },
    })
  })

  it('reuses one client per process, with GeoIP off', async () => {
    trackServer('user_logged_in', { actor: { userId: 'u1' }, properties: { method: 'email' } })
    trackServer('user_logged_in', { actor: { userId: 'u2' }, properties: { method: 'email' } })
    await delivered()

    expect(mocks.construct).toHaveBeenCalledTimes(1)
    expect(mocks.construct).toHaveBeenCalledWith('phc_test_key', {
      host: 'https://us.i.posthog.com',
      flushAt: 1,
      flushInterval: 0,
      disableGeoip: true,
    })
  })

  it('does not let event properties overwrite the reserved ones or the person flag', async () => {
    const smuggled = {
      method: 'email',
      site: 'other',
      env: 'production',
      $process_person_profile: true,
    } as unknown as { method: string }
    trackServer('user_signed_up', { actor: { userId: 'u1' }, properties: smuggled })
    await delivered()

    expect(sent().properties).toEqual({
      method: 'email',
      site: 'pleiad',
      env: 'preview',
      $process_person_profile: false,
    })
  })

  it('gives a webhook-sourced event the same uuid on every delivery', async () => {
    const purchase = {
      actor: { userId: 'u1' },
      properties: { plan: 'complete', product_id: 'p', value: 9, currency: 'USD' },
      dedupeKey: 'revenuecat:evt_1',
    } as const
    trackServer('checkout_completed', purchase)
    trackServer('checkout_completed', purchase)
    trackServer('checkout_completed', { ...purchase, dedupeKey: 'revenuecat:evt_2' })
    await delivered()

    const [first, retry, other] = mocks.captureImmediate.mock.calls.map(([message]) => message.uuid)
    expect(first).toMatch(UUID_SHAPE)
    expect(retry).toBe(first)
    expect(other).not.toBe(first)
  })

  it('counts a signed-out visitor without a person profile or a shared id', async () => {
    const input = { actor: { anonymous: true }, properties: { placement: 'landing_download_cta' } } as const
    trackServer('newsletter_subscribed', input)
    trackServer('newsletter_subscribed', input)
    await delivered()

    const [a, b] = mocks.captureImmediate.mock.calls.map(([message]) => message)
    expect(a.properties.$process_person_profile).toBe(false)
    expect(a.distinctId).not.toBe(b.distinctId)
    expect(a.distinctId.startsWith('pleiad:user:')).toBe(false)
  })

  it('never lets a send failure reach the caller', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.captureImmediate.mockRejectedValue(new Error('network down'))

    expect(() =>
      trackServer('user_logged_in', { actor: { userId: 'u1' }, properties: { method: 'email' } })
    ).not.toThrow()
    await expect(delivered()).resolves.toBeUndefined()
    expect(error).toHaveBeenCalledTimes(1)
  })
})

describe("trackServer follows the visitor's consent", () => {
  const signedUp = (request?: Request) =>
    trackServer('user_signed_up', { actor: { userId: 'u1' }, properties: { method: 'email' }, request })

  it('names the account when the visitor allowed analytics', async () => {
    signedUp(visit('granted'))
    await delivered()

    expect(sent().distinctId).toBe('pleiad:user:u1')
    expect(sent().properties).not.toHaveProperty('$process_person_profile')
  })

  it('sends unattributed when the visitor refused', async () => {
    signedUp(visit('denied'))
    await delivered()

    expectUnattributed(sent())
    expect(sent().properties).toMatchObject({ method: 'email', site: 'pleiad', env: 'preview' })
  })

  it('sends unattributed while a visitor in a region that asks has not answered', async () => {
    signedUp(visit('unanswered', { 'cf-ipcountry': 'DE' }))
    await delivered()

    expectUnattributed(sent())
  })

  it('names an unanswered visitor where silence counts as permission, as the browser does', async () => {
    signedUp(visit('unanswered', { 'cf-ipcountry': 'US' }))
    await delivered()

    expect(sent().distinctId).toBe('pleiad:user:u1')
  })

  it("lets the request's own privacy signal refuse an unanswered visitor", async () => {
    signedUp(visit('unanswered', { 'sec-gpc': '1' }))
    await delivered()

    expectUnattributed(sent())
  })

  it('lets an explicit grant outrank the privacy signal, as the browser does', async () => {
    signedUp(visit('granted', { 'cf-ipcountry': 'FR', 'sec-gpc': '1' }))
    await delivered()

    expect(sent().distinctId).toBe('pleiad:user:u1')
  })

  it('gives no region default to a request without the consent cookie', async () => {
    signedUp(visit(null, { 'cf-ipcountry': 'US' }))
    await delivered()

    expectUnattributed(sent())
  })

  it('fails toward unattributed on a duplicated or malformed cookie', async () => {
    signedUp(visit(null, { cookie: `${CONSENT_COOKIE}=granted; ${CONSENT_COOKIE}=granted` }))
    signedUp(visit(null, { cookie: `${CONSENT_COOKIE}=yes` }))
    await delivered()

    expect(mocks.captureImmediate).toHaveBeenCalledTimes(2)
    for (const [message] of mocks.captureImmediate.mock.calls) expectUnattributed(message)
  })

  it("sends unattributed without the visitor's request: a server action, or a webhook's own", async () => {
    signedUp()
    trackServer('checkout_completed', {
      actor: { userId: 'u1' },
      properties: { plan: 'complete', product_id: 'p', value: 9, currency: 'USD' },
      request: new Request('https://pleiad.io/api/billing/webhook', {
        method: 'POST',
        headers: { authorization: 'secret', 'cf-ipcountry': 'US' },
      }),
      dedupeKey: 'revenuecat:evt_1',
    })
    await delivered()

    expect(mocks.captureImmediate).toHaveBeenCalledTimes(2)
    for (const [message] of mocks.captureImmediate.mock.calls) expectUnattributed(message)
  })

  it('never names a signed-out actor, even with consent', async () => {
    trackServer('newsletter_subscribed', {
      actor: { anonymous: true },
      properties: { placement: 'landing_download_cta' },
      request: visit('granted'),
    })
    await delivered()

    expect(sent().distinctId.startsWith('pleiad:user:')).toBe(false)
    expect(sent().properties.$process_person_profile).toBe(false)
    expect(sent().properties.$current_url).toBe('https://pleiad.io/onboarding')
  })
})

describe('attributionFor', () => {
  it('joins the browser session and page, with tokens redacted', () => {
    const request = visit('granted', {
      referer: 'https://pleiad.io/onboarding?token=t',
      'x-posthog-session-id': ' 0190-session\n',
    })
    expect(attributionFor({ userId: 'u1' }, request)).toEqual({
      distinctId: 'pleiad:user:u1',
      visit: { $current_url: 'https://pleiad.io/onboarding?token=redacted', $session_id: '0190-session' },
      person: {},
    })
  })

  it('uses the request URL when the referrer is another site', () => {
    const request = new Request('https://pleiad.io/auth/callback?code=abc', {
      headers: { referer: 'https://accounts.google.com/', cookie: `${CONSENT_COOKIE}=granted` },
    })
    expect(attributionFor({ userId: 'u1' }, request).visit).toEqual({
      $current_url: 'https://pleiad.io/auth/callback?code=redacted',
    })
  })

  it('draws a new id for every unattributed event', () => {
    const [a, b] = [attributionFor({ userId: 'u1' }), attributionFor({ userId: 'u1' })]
    expect(a.distinctId).toMatch(ANY_UUID)
    expect(a.distinctId).not.toBe(b.distinctId)
    expect(a).toMatchObject({ visit: {}, person: { $process_person_profile: false } })
  })
})

describe('captureServerException', () => {
  it('names the account and joins the visit only with consent', async () => {
    const error = new Error('boom')
    captureServerException(error, {
      actor: { userId: 'u1' },
      request: visit('granted'),
      context: { route: 'billing_webhook', url: '/x?sig=abc' },
    })
    await delivered()

    expect(mocks.captureExceptionImmediate).toHaveBeenCalledWith(error, 'pleiad:user:u1', {
      $current_url: 'https://pleiad.io/onboarding',
      $session_id: '0190-session',
      route: 'billing_webhook',
      url: '/x?sig=redacted',
      site: 'pleiad',
      env: 'preview',
    })
  })

  it('sends unattributed without consent, with redacted context', async () => {
    const error = new Error('boom')
    captureServerException(error, { actor: { userId: 'u1' }, context: { route: 'billing_webhook' } })
    await delivered()

    const [, distinctId, properties] = mocks.captureExceptionImmediate.mock.calls[0]
    expect(distinctId).toMatch(ANY_UUID)
    expect(properties).toEqual({
      route: 'billing_webhook',
      site: 'pleiad',
      env: 'preview',
      $process_person_profile: false,
    })
  })
})

describe('deterministicUuid', () => {
  it('is stable for the same parts and shaped as a UUID', async () => {
    const id = await deterministicUuid(['pleiad', 'checkout_completed', 'revenuecat:evt_1'])
    expect(id).toMatch(UUID_SHAPE)
    expect(await deterministicUuid(['pleiad', 'checkout_completed', 'revenuecat:evt_1'])).toBe(id)
    expect(await deterministicUuid(['pleiad', 'checkout_completed', 'revenuecat:evt_2'])).not.toBe(id)
  })
})
