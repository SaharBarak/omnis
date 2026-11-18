import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from './route'
import { CONSENT_COOKIE, type ConsentRecord } from '@/lib/analytics/consent'
import { forgetServerAnalyticsState } from '@/lib/analytics/server'

/**
 * The OAuth and email-link return leg is a top-level navigation: no script
 * runs and no script header arrives, only cookies. `user_logged_in` names the
 * account only when that navigation's own consent cookie and headers allow
 * it (docs/analytics/north-star.md, "Server events and consent").
 */

const mocks = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  captureImmediate: vi.fn(),
  waitUntil: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: async () => ({ auth: { exchangeCodeForSession: mocks.exchangeCodeForSession } }),
}))

vi.mock('posthog-node', () => ({
  PostHog: class {
    captureImmediate = mocks.captureImmediate
  },
}))

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: () => ({ ctx: { waitUntil: mocks.waitUntil } }),
}))

const ANY_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

/** The browser arriving back from Google through Supabase, as Lax cookies let it. */
function oauthReturn(record: ConsentRecord | null, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('https://pleiad.io/auth/callback?code=one-time&redirectTo=/app', {
    headers: {
      referer: 'https://accounts.google.com/',
      'cf-ipcountry': 'US',
      ...(record ? { cookie: `sb-pkce=verifier; ${CONSENT_COOKIE}=${record}` } : {}),
      ...headers,
    },
  })
}

async function loggedIn(request: NextRequest) {
  const response = await GET(request)
  await Promise.all(mocks.waitUntil.mock.calls.map(([promise]) => promise))
  expect(response.headers.get('location')).toBe('https://pleiad.io/app')
  expect(mocks.captureImmediate).toHaveBeenCalledTimes(1)
  return mocks.captureImmediate.mock.calls[0][0]
}

beforeEach(() => {
  vi.clearAllMocks()
  forgetServerAnalyticsState()
  vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', 'phc_test_key')
  vi.stubEnv('NEXT_PUBLIC_POSTHOG_ENV', 'preview')
  mocks.captureImmediate.mockResolvedValue(undefined)
  mocks.exchangeCodeForSession.mockResolvedValue({
    data: { user: { id: 'u1', app_metadata: { provider: 'google' } } },
    error: null,
  })
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('GET /auth/callback analytics', () => {
  it('names the account when the visitor allowed analytics', async () => {
    const message = await loggedIn(oauthReturn('granted'))

    expect(message).toMatchObject({
      distinctId: 'pleiad:user:u1',
      event: 'user_logged_in',
      properties: {
        method: 'google',
        $current_url: 'https://pleiad.io/auth/callback?code=redacted&redirectTo=/app',
        site: 'pleiad',
        env: 'preview',
      },
    })
    expect(message.properties).not.toHaveProperty('$process_person_profile')
  })

  it('sends unattributed when the visitor refused', async () => {
    const message = await loggedIn(oauthReturn('denied'))

    expect(message.distinctId).toMatch(ANY_UUID)
    expect(message.properties).toEqual({
      method: 'google',
      site: 'pleiad',
      env: 'preview',
      $process_person_profile: false,
    })
  })

  it('sends unattributed for an unanswered visitor in a region that asks first', async () => {
    const message = await loggedIn(oauthReturn('unanswered', { 'cf-ipcountry': 'NL' }))

    expect(message.distinctId).toMatch(ANY_UUID)
    expect(message.properties.$process_person_profile).toBe(false)
  })

  it('sends unattributed for a link opened in a browser that never ran the consent layer', async () => {
    const message = await loggedIn(oauthReturn(null))

    expect(message.distinctId).toMatch(ANY_UUID)
    expect(message.properties.$process_person_profile).toBe(false)
  })
})
