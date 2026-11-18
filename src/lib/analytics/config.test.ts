import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  SITE,
  analyticsEnv,
  distinctIdFor,
  isReportingEnv,
  missingConfigMessage,
  resolveEnv,
  withReserved,
} from './config'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('resolveEnv', () => {
  it('prefers the explicit variable', () => {
    expect(resolveEnv({ explicit: 'preview', platform: 'production', nodeEnv: 'production' })).toBe('preview')
  })

  it("falls back to the host platform's variable", () => {
    expect(resolveEnv({ platform: 'preview', nodeEnv: 'production' })).toBe('preview')
  })

  it('falls back to the build mode', () => {
    expect(resolveEnv({ nodeEnv: 'development' })).toBe('development')
    expect(resolveEnv({ nodeEnv: 'production' })).toBe('production')
    expect(resolveEnv({})).toBe('production')
  })

  it('ignores a value that is not an environment', () => {
    expect(resolveEnv({ explicit: 'staging', platform: 'qa', nodeEnv: 'development' })).toBe('development')
  })

  it('reads the build-time variables', () => {
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_ENV', 'preview')
    expect(analyticsEnv()).toBe('preview')
  })
})

describe('isReportingEnv', () => {
  it('reports from production and preview', () => {
    expect(isReportingEnv('production')).toBe(true)
    expect(isReportingEnv('preview')).toBe(true)
  })

  it('reports from development only when asked to', () => {
    expect(isReportingEnv('development')).toBe(false)
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_DEV', '1')
    expect(isReportingEnv('development')).toBe(true)
  })
})

describe('distinctIdFor', () => {
  it('namespaces the auth provider id by site', () => {
    expect(distinctIdFor('8b1f0c2e-user')).toBe('pleiad:user:8b1f0c2e-user')
    expect(distinctIdFor('x').startsWith(`${SITE}:user:`)).toBe(true)
  })
})

describe('withReserved', () => {
  it('adds site and env', () => {
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_ENV', 'preview')
    expect(withReserved({ kin: 7 })).toEqual({ kin: 7, site: 'pleiad', env: 'preview' })
    expect(withReserved()).toEqual({ site: 'pleiad', env: 'preview' })
  })

  it('wins over a caller that smuggles the reserved keys in', () => {
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_ENV', 'production')
    const smuggled = { site: 'other', env: 'development', kin: 7 }
    expect(withReserved(smuggled)).toEqual({ kin: 7, site: 'pleiad', env: 'production' })
  })
})

describe('missingConfigMessage', () => {
  it('names the variable, twice', () => {
    expect(missingConfigMessage('NEXT_PUBLIC_POSTHOG_KEY')).toBe(
      'NEXT_PUBLIC_POSTHOG_KEY variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_KEY is configured'
    )
  })
})
