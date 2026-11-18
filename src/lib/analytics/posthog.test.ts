import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CaptureResult, PostHogConfig } from 'posthog-js'
import {
  applyConsent,
  captureException,
  forgetAnalyticsState,
  identify,
  initAnalytics,
  reset,
  track,
} from './posthog'

const sdk = vi.hoisted(() => ({
  init: vi.fn(),
  register: vi.fn(),
  capture: vi.fn(),
  identify: vi.fn(),
  reset: vi.fn(),
  captureException: vi.fn(),
  opt_in_capturing: vi.fn(),
  opt_out_capturing: vi.fn(),
  get_explicit_consent_status: vi.fn(() => 'pending'),
  get_distinct_id: vi.fn(() => 'anonymous-device'),
}))

vi.mock('posthog-js', () => ({ default: sdk }))

const KEY = 'phc_test_key'

function configure(env: Record<string, string>): void {
  for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value)
}

function initConfig(): Partial<PostHogConfig> {
  return sdk.init.mock.calls[0][1]
}

beforeEach(() => {
  vi.clearAllMocks()
  sdk.get_explicit_consent_status.mockReturnValue('pending')
  sdk.get_distinct_id.mockReturnValue('anonymous-device')
  forgetAnalyticsState()
  configure({ NODE_ENV: 'production', NEXT_PUBLIC_POSTHOG_KEY: KEY, NEXT_PUBLIC_POSTHOG_ENV: 'production' })
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('missing configuration', () => {
  beforeEach(() => configure({ NEXT_PUBLIC_POSTHOG_KEY: '' }))

  it('is a silent no-op in production', () => {
    const reportError = vi.fn()
    vi.stubGlobal('reportError', reportError)

    initAnalytics()
    applyConsent('granted')
    track('landing_cta_clicked')
    identify('user-1')
    reset()
    captureException(new Error('boom'))

    expect(reportError).not.toHaveBeenCalled()
    for (const call of Object.values(sdk)) expect(call).not.toHaveBeenCalled()
  })

  it('raises the documented message once in development, and still does nothing', () => {
    configure({ NODE_ENV: 'development' })
    const reportError = vi.fn()
    vi.stubGlobal('reportError', reportError)

    initAnalytics()
    track('landing_cta_clicked')

    expect(reportError).toHaveBeenCalledTimes(1)
    expect(reportError.mock.calls[0][0].message).toBe(
      'NEXT_PUBLIC_POSTHOG_KEY variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_KEY is configured'
    )
    expect(sdk.init).not.toHaveBeenCalled()
    expect(sdk.capture).not.toHaveBeenCalled()
  })
})

describe('initAnalytics', () => {
  it('initialises once, with the app-class mode and the reserved properties', () => {
    initAnalytics()
    initAnalytics()

    expect(sdk.init).toHaveBeenCalledTimes(1)
    expect(sdk.init.mock.calls[0][0]).toBe(KEY)
    expect(initConfig()).toMatchObject({
      api_host: 'https://us.i.posthog.com',
      defaults: '2026-08-30',
      cookieless_mode: 'on_reject',
      person_profiles: 'identified_only',
      capture_exceptions: true,
    })
    expect(sdk.register).toHaveBeenCalledWith({ site: 'pleiad', env: 'production' })
  })

  it('stays off in a development build unless asked to report', () => {
    configure({ NODE_ENV: 'development', NEXT_PUBLIC_POSTHOG_ENV: '' })
    initAnalytics()
    expect(sdk.init).not.toHaveBeenCalled()

    configure({ NEXT_PUBLIC_POSTHOG_DEV: '1' })
    initAnalytics()
    expect(sdk.init).toHaveBeenCalledTimes(1)
    expect(sdk.register).toHaveBeenCalledWith({ site: 'pleiad', env: 'development' })
  })

  it('stamps reserved keys on, and redacts tokens from, every outgoing event', () => {
    initAnalytics()
    const beforeSend = initConfig().before_send as (event: CaptureResult | null) => CaptureResult | null

    const sent = beforeSend({
      uuid: 'u',
      event: '$pageview',
      properties: { site: 'other', env: 'development', $current_url: 'https://pleiad.io/auth/callback?code=abc' },
      $set_once: { $initial_current_url: 'https://pleiad.io/?token=t' },
    } as CaptureResult)

    expect(sent?.properties).toEqual({
      site: 'pleiad',
      env: 'production',
      $current_url: 'https://pleiad.io/auth/callback?code=redacted',
    })
    expect(sent?.$set_once).toEqual({ $initial_current_url: 'https://pleiad.io/?token=redacted' })
    expect(beforeSend(null)).toBeNull()
  })
})

describe('track', () => {
  beforeEach(() => {
    initAnalytics()
    applyConsent('granted')
    vi.clearAllMocks()
  })

  it('sends the event with the reserved properties', () => {
    track('person_created', { is_self: true })
    expect(sdk.capture).toHaveBeenCalledWith(
      'person_created',
      { is_self: true, site: 'pleiad', env: 'production' },
      { timestamp: expect.any(Date) }
    )
  })

  it('does not let a caller overwrite the reserved properties', () => {
    // The types reject these keys; this is the runtime guarantee behind them.
    const smuggled = { kin: 7, site: 'other', env: 'development' } as unknown as { kin: number }
    track('calculate_completed', smuggled)
    expect(sdk.capture.mock.calls[0][1]).toEqual({ kin: 7, site: 'pleiad', env: 'production' })
  })
})

describe('consent', () => {
  beforeEach(() => initAnalytics())

  it('sends nothing while the answer is pending', () => {
    track('landing_cta_clicked')
    identify('user-1', { email: 'a@b.co' })

    expect(sdk.capture).not.toHaveBeenCalled()
    expect(sdk.identify).not.toHaveBeenCalled()
    expect(sdk.opt_in_capturing).not.toHaveBeenCalled()
    expect(sdk.opt_out_capturing).not.toHaveBeenCalled()
  })

  it('on acceptance: enables storage, identifies with the namespaced id, sends what was held', () => {
    track('landing_cta_clicked')
    identify('user-1', { email: 'a@b.co' })

    applyConsent('granted')

    expect(sdk.opt_in_capturing).toHaveBeenCalledTimes(1)
    expect(sdk.identify).toHaveBeenCalledWith('pleiad:user:user-1', { email: 'a@b.co' })
    expect(sdk.capture).toHaveBeenCalledTimes(1)
    expect(sdk.capture.mock.calls[0][0]).toBe('landing_cta_clicked')
  })

  it('on refusal: switches to cookieless, sends what was held, never identifies', () => {
    track('landing_cta_clicked')
    identify('user-1')

    applyConsent('denied')
    identify('user-1')

    expect(sdk.opt_out_capturing).toHaveBeenCalledTimes(1)
    expect(sdk.opt_in_capturing).not.toHaveBeenCalled()
    expect(sdk.capture).toHaveBeenCalledTimes(1)
    expect(sdk.identify).not.toHaveBeenCalled()
  })

  it('does not re-announce an answer PostHog already holds', () => {
    sdk.get_explicit_consent_status.mockReturnValue('granted')
    applyConsent('granted')
    expect(sdk.opt_in_capturing).not.toHaveBeenCalled()
  })

  it('holds a bounded number of events for a visitor who never answers', () => {
    for (let i = 0; i < 50; i += 1) track('landing_cta_clicked')
    applyConsent('granted')
    expect(sdk.capture).toHaveBeenCalledTimes(20)
  })
})

describe('identity', () => {
  beforeEach(() => {
    initAnalytics()
    applyConsent('granted')
  })

  it('skips a repeat identify for the same user', () => {
    sdk.get_distinct_id.mockReturnValue('pleiad:user:user-1')
    identify('user-1')
    expect(sdk.identify).not.toHaveBeenCalled()
  })

  it('resets on sign-out and forgets the user', () => {
    identify('user-1')
    reset()
    expect(sdk.reset).toHaveBeenCalledTimes(1)

    sdk.identify.mockClear()
    applyConsent('granted')
    expect(sdk.identify).not.toHaveBeenCalled()
  })
})

describe('captureException', () => {
  it('reports with reserved properties and redacted context', () => {
    initAnalytics()
    const error = new Error('boom')
    captureException(error, { digest: 'abc', url: '/x?token=t' })
    expect(sdk.captureException).toHaveBeenCalledWith(error, {
      digest: 'abc',
      url: '/x?token=redacted',
      site: 'pleiad',
      env: 'production',
    })
  })
})
