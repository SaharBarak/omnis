import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * Billing plan/entitlement tests.
 *
 * PLANS captures PADDLE_PRICE_* env vars at module load, so price-id mapping
 * tests stub the env and re-import the module per test.
 */

const PRICE_IDS = {
  PADDLE_PRICE_EXPLORER: 'pri_explorer_test',
  PADDLE_PRICE_COMPLETE: 'pri_complete_test',
  PADDLE_PRICE_PRACTITIONER: 'pri_practitioner_test',
} as const

async function importBillingWithEnv() {
  vi.resetModules()
  for (const [key, value] of Object.entries(PRICE_IDS)) {
    vi.stubEnv(key, value)
  }
  return import('./billing')
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('PLANS', () => {
  it('defines all four tiers', async () => {
    const { PLANS } = await importBillingWithEnv()
    expect(Object.keys(PLANS)).toEqual([
      'free',
      'explorer',
      'complete',
      'practitioner',
    ])
  })

  it('prices ascend across paid tiers', async () => {
    const { PLANS } = await importBillingWithEnv()
    expect(PLANS.free.price).toBe(0)
    expect(PLANS.explorer.price).toBe(5)
    expect(PLANS.complete.price).toBe(9)
    expect(PLANS.practitioner.price).toBe(29)
  })

  it('explorer holds the whole map at small scale with no AI', async () => {
    const { PLANS } = await importBillingWithEnv()
    const limits = PLANS.explorer.limits
    expect(limits.systems).toEqual([
      'dreamspell',
      'tzolkin',
      'longcount',
      'humandesign',
      'astrology',
      'gematria',
    ])
    expect(limits.profiles).toBe(5)
    expect(limits.aiInterpretations).toBe(0)
    expect(limits.boards).toBe(2)
    expect(limits.timeline).toBe(true)
    expect(limits.exports).toBe(false)
    expect(limits.relationships).toBe(false)
    expect(limits.groupAnalysis).toBe(false)
    expect(limits.apiAccess).toBe(false)
  })

  it('paid tiers never shrink limits relative to the tier below', async () => {
    const { PLANS } = await importBillingWithEnv()
    expect(PLANS.explorer.limits.profiles).toBeGreaterThan(PLANS.free.limits.profiles - 1)
    expect(PLANS.complete.limits.profiles).toBeGreaterThan(PLANS.explorer.limits.profiles)
    expect(PLANS.complete.limits.boards).toBeGreaterThan(PLANS.explorer.limits.boards)
    expect(PLANS.complete.limits.aiInterpretations).toBeGreaterThan(
      PLANS.explorer.limits.aiInterpretations
    )
  })
})

describe('getPlanFromPriceId', () => {
  it('maps each configured price id to its plan', async () => {
    const { getPlanFromPriceId } = await importBillingWithEnv()
    expect(getPlanFromPriceId(PRICE_IDS.PADDLE_PRICE_EXPLORER)).toBe('explorer')
    expect(getPlanFromPriceId(PRICE_IDS.PADDLE_PRICE_COMPLETE)).toBe('complete')
    expect(getPlanFromPriceId(PRICE_IDS.PADDLE_PRICE_PRACTITIONER)).toBe('practitioner')
  })

  it('falls back to free for unknown or missing ids', async () => {
    const { getPlanFromPriceId } = await importBillingWithEnv()
    expect(getPlanFromPriceId('pri_unknown')).toBe('free')
    expect(getPlanFromPriceId(undefined)).toBe('free')
    expect(getPlanFromPriceId(null)).toBe('free')
  })
})

describe('isPaidPlanTier', () => {
  it('accepts every purchasable tier and rejects everything else', async () => {
    const { isPaidPlanTier } = await importBillingWithEnv()
    expect(isPaidPlanTier('explorer')).toBe(true)
    expect(isPaidPlanTier('complete')).toBe(true)
    expect(isPaidPlanTier('practitioner')).toBe(true)
    expect(isPaidPlanTier('free')).toBe(false)
    expect(isPaidPlanTier('enterprise')).toBe(false)
    expect(isPaidPlanTier(undefined)).toBe(false)
    expect(isPaidPlanTier(null)).toBe(false)
  })
})

describe('isPlanFeatureAvailable', () => {
  it('reflects the explorer entitlement split', async () => {
    const { isPlanFeatureAvailable } = await importBillingWithEnv()
    expect(isPlanFeatureAvailable('explorer', 'systems')).toBe(true)
    expect(isPlanFeatureAvailable('explorer', 'timeline')).toBe(true)
    expect(isPlanFeatureAvailable('explorer', 'aiInterpretations')).toBe(false)
    expect(isPlanFeatureAvailable('explorer', 'exports')).toBe(false)
    expect(isPlanFeatureAvailable('explorer', 'relationships')).toBe(false)
    expect(isPlanFeatureAvailable('explorer', 'groupAnalysis')).toBe(false)
    expect(isPlanFeatureAvailable('explorer', 'apiAccess')).toBe(false)
  })
})

describe('usage enforcement for explorer', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('@/lib/db/repositories/subscriptions-repo', () => ({
      getUserPlan: vi.fn().mockResolvedValue('explorer'),
      getUsage: vi.fn(),
      incrementUsage: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.doUnmock('@/lib/db/repositories/subscriptions-repo')
  })

  async function importUsageWithRepo(usageRow: Record<string, unknown> | null) {
    const repo = await import('@/lib/db/repositories/subscriptions-repo')
    vi.mocked(repo.getUsage).mockResolvedValue(
      usageRow as Awaited<ReturnType<typeof repo.getUsage>>
    )
    return import('./usage')
  }

  it('blocks AI interpretations outright', async () => {
    const { checkLimit } = await importUsageWithRepo(null)
    const result = await checkLimit('user-1', 'ai_interpretations_used')
    expect(result.allowed).toBe(false)
    expect(result.limit).toBe(0)
  })

  it('allows profiles under the 5-person cap', async () => {
    const { checkLimit } = await importUsageWithRepo({
      user_id: 'user-1',
      period: '2026-07',
      profiles_count: 4,
      ai_interpretations_used: 0,
      boards_count: 0,
      exports_count: 0,
    })
    const result = await checkLimit('user-1', 'profiles_count')
    expect(result.allowed).toBe(true)
    expect(result.limit).toBe(5)
  })

  it('blocks the sixth profile', async () => {
    const { checkLimit, requireLimit, LimitExceededError } =
      await importUsageWithRepo({
        user_id: 'user-1',
        period: '2026-07',
        profiles_count: 5,
        ai_interpretations_used: 0,
        boards_count: 0,
        exports_count: 0,
      })
    const result = await checkLimit('user-1', 'profiles_count')
    expect(result.allowed).toBe(false)
    await expect(requireLimit('user-1', 'profiles_count')).rejects.toBeInstanceOf(
      LimitExceededError
    )
  })

  it('caps boards at 2', async () => {
    const { checkLimit } = await importUsageWithRepo({
      user_id: 'user-1',
      period: '2026-07',
      profiles_count: 0,
      ai_interpretations_used: 0,
      boards_count: 2,
      exports_count: 0,
    })
    const result = await checkLimit('user-1', 'boards_count')
    expect(result.allowed).toBe(false)
    expect(result.limit).toBe(2)
  })

  it('blocks exports on explorer', async () => {
    const { checkLimit } = await importUsageWithRepo(null)
    const result = await checkLimit('user-1', 'exports_count')
    expect(result.allowed).toBe(false)
  })
})
