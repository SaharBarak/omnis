import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  captureServerException,
  deterministicUuid,
  forgetServerAnalyticsState,
  requestProperties,
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
  it('sends immediately, inside waitUntil, with the namespaced id and reserved properties', async () => {
    trackServer('user_signed_up', { actor: { userId: 'u1' }, properties: { method: 'google' } })
    await delivered()

    expect(mocks.waitUntil).toHaveBeenCalledTimes(1)
    expect(mocks.captureImmediate).toHaveBeenCalledWith({
      distinctId: 'pleiad:user:u1',
      event: 'user_signed_up',
      uuid: undefined,
      properties: { method: 'google', site: 'pleiad', env: 'preview' },
    })
  })

  it('reuses one client per process', async () => {
    trackServer('user_logged_in', { actor: { userId: 'u1' }, properties: { method: 'email' } })
    trackServer('user_logged_in', { actor: { userId: 'u2' }, properties: { method: 'email' } })
    await delivered()

    expect(mocks.construct).toHaveBeenCalledTimes(1)
    expect(mocks.construct).toHaveBeenCalledWith('phc_test_key', {
      host: 'https://us.i.posthog.com',
      flushAt: 1,
      flushInterval: 0,
    })
  })

  it('does not let event properties overwrite the reserved ones', async () => {
    const smuggled = { method: 'email', site: 'other', env: 'production' } as unknown as { method: string }
    trackServer('user_signed_up', { actor: { userId: 'u1' }, properties: smuggled })
    await delivered()

    expect(mocks.captureImmediate.mock.calls[0][0].properties).toEqual({
      method: 'email',
      site: 'pleiad',
      env: 'preview',
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

describe('requestProperties', () => {
  it('joins the browser session and page, with tokens redacted', () => {
    const request = new Request('https://pleiad.io/api/profile', {
      headers: {
        referer: 'https://pleiad.io/onboarding?token=t',
        'x-posthog-session-id': ' 0190-session\n',
      },
    })
    expect(requestProperties(request)).toEqual({
      $current_url: 'https://pleiad.io/onboarding?token=redacted',
      $session_id: '0190-session',
    })
  })

  it('uses the request URL when the referrer is another site', () => {
    const request = new Request('https://pleiad.io/auth/callback?code=abc', {
      headers: { referer: 'https://accounts.google.com/' },
    })
    expect(requestProperties(request)).toEqual({
      $current_url: 'https://pleiad.io/auth/callback?code=redacted',
    })
  })

  it('is empty without a request', () => {
    expect(requestProperties()).toEqual({})
  })
})

describe('captureServerException', () => {
  it('sends inside waitUntil with reserved properties', async () => {
    const error = new Error('boom')
    captureServerException(error, {
      actor: { userId: 'u1' },
      context: { route: 'billing_webhook', url: '/x?sig=abc' },
    })
    await delivered()

    expect(mocks.captureExceptionImmediate).toHaveBeenCalledWith(error, 'pleiad:user:u1', {
      route: 'billing_webhook',
      url: '/x?sig=redacted',
      site: 'pleiad',
      env: 'preview',
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
