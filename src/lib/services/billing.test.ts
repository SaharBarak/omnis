import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * Billing plan/entitlement tests.
 *
 * PLANS captures STORE_PRODUCT_* env vars at module load, so tests stub the env
 * and re-import the module per test.
 */

const PRICE_IDS = {
  STORE_PRODUCT_EXPLORER: 'pleiad_explorer_monthly',
  STORE_PRODUCT_COMPLETE: 'pleiad_complete_monthly',
  STORE_PRODUCT_PRACTITIONER: 'pleiad_practitioner_monthly',
  STORE_PRODUCT_LIFETIME: 'pleiad_founding_lifetime',
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
  it('defines all five tiers', async () => {
    const { PLANS } = await importBillingWithEnv()
    expect(Object.keys(PLANS)).toEqual([
      'free',
      'explorer',
      'complete',
      'practitioner',
      'lifetime',
    ])
  })

  it('prices ascend across paid tiers', async () => {
    const { PLANS } = await importBillingWithEnv()
    expect(PLANS.free.price).toBe(0)
    expect(PLANS.explorer.price).toBe(5)
    expect(PLANS.complete.price).toBe(9)
    expect(PLANS.practitioner.price).toBe(29)
  })

  it('founding lifetime is a $79 one-time purchase that is genuinely top-tier', async () => {
    const { PLANS } = await importBillingWithEnv()
    const lifetime = PLANS.lifetime.limits
    expect(PLANS.lifetime.price).toBe(79)
    // It is sold as "Founding", so it must be the best thing you can buy —
    // never a capped tier a founder is stuck behind forever.
    expect(lifetime.profiles).toBe(Infinity)
    expect(lifetime.boards).toBe(Infinity)
    expect(lifetime.relationships).toBe('advanced')
    expect(lifetime.groupAnalysis).toBe(true)
    expect(lifetime.apiAccess).toBe(true)
    // Metered AI is the ONE axis a live Practitioner subscription buys more of.
    expect(lifetime.aiInterpretations).toBe(50)
  })

  it('every paid tier includes the map — relationships are the product', async () => {
    const { PLANS } = await importBillingWithEnv()
    // A paid tier that computed readings but drew no bonds would be selling the
    // commodity half of Pleiad. Free is the only tier without the map.
    expect(PLANS.free.limits.relationships).toBe(false)
    expect(PLANS.explorer.limits.relationships).toBe('basic')
    expect(PLANS.complete.limits.relationships).toBe('basic')
    expect(PLANS.practitioner.limits.relationships).toBe('advanced')
    expect(PLANS.lifetime.limits.relationships).toBe('advanced')
  })

  it('explorer holds the whole map at small scale', async () => {
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
    expect(limits.profiles).toBe(15)
    expect(limits.aiInterpretations).toBe(5)
    expect(limits.boards).toBe(2)
    expect(limits.timeline).toBe(true)
    expect(limits.exports).toBe(false)
    expect(limits.groupAnalysis).toBe(false)
    expect(limits.apiAccess).toBe(false)
  })

  it('paid tiers never shrink limits relative to the tier below', async () => {
    const { PLANS } = await importBillingWithEnv()
    expect(PLANS.explorer.limits.profiles).toBeGreaterThan(PLANS.free.limits.profiles)
    expect(PLANS.complete.limits.profiles).toBeGreaterThan(PLANS.explorer.limits.profiles)
    expect(PLANS.practitioner.limits.profiles).toBeGreaterThan(
      PLANS.complete.limits.profiles
    )
    expect(PLANS.complete.limits.boards).toBeGreaterThan(PLANS.explorer.limits.boards)
    expect(PLANS.complete.limits.aiInterpretations).toBeGreaterThan(
      PLANS.explorer.limits.aiInterpretations
    )
  })

  it('no cliff: the people cap never jumps more than ~4x between tiers', async () => {
    const { PLANS } = await importBillingWithEnv()
    // The old ladder went 10 -> Infinity, forcing a 3.2x price jump on the 11th
    // person. Keep each finite step within reach of the one below it.
    expect(PLANS.explorer.limits.profiles / PLANS.free.limits.profiles).toBeLessThanOrEqual(5)
    expect(
      PLANS.complete.limits.profiles / PLANS.explorer.limits.profiles
    ).toBeLessThanOrEqual(4)
  })
})

describe('getPlanFromEntitlementId', () => {
  it('maps each store entitlement id to its plan', async () => {
    const { getPlanFromEntitlementId } = await importBillingWithEnv()
    expect(getPlanFromEntitlementId('explorer')).toBe('explorer')
    expect(getPlanFromEntitlementId('complete')).toBe('complete')
    expect(getPlanFromEntitlementId('practitioner')).toBe('practitioner')
    expect(getPlanFromEntitlementId('lifetime')).toBe('lifetime')
  })

  it('falls back to free for unknown or missing ids', async () => {
    const { getPlanFromEntitlementId } = await importBillingWithEnv()
    // An entitlement configured in RevenueCat that we do not know about must
    // never accidentally grant a paid tier.
    expect(getPlanFromEntitlementId('enterprise')).toBe('free')
    expect(getPlanFromEntitlementId('free')).toBe('free')
    expect(getPlanFromEntitlementId(undefined)).toBe('free')
    expect(getPlanFromEntitlementId(null)).toBe('free')
  })
})

describe('highestPlan', () => {
  it('picks the strongest tier when several entitlements are active at once', async () => {
    const { highestPlan } = await importBillingWithEnv()
    expect(highestPlan(['explorer', 'complete'])).toBe('complete')
    expect(highestPlan(['complete', 'practitioner'])).toBe('practitioner')
    // Lifetime outranks the tier it mirrors, but not Practitioner.
    expect(highestPlan(['complete', 'lifetime'])).toBe('lifetime')
    expect(highestPlan(['lifetime', 'practitioner'])).toBe('practitioner')
    expect(highestPlan([])).toBe('free')
  })
})

describe('isPaidPlanTier', () => {
  it('accepts every purchasable tier and rejects everything else', async () => {
    const { isPaidPlanTier } = await importBillingWithEnv()
    expect(isPaidPlanTier('explorer')).toBe(true)
    expect(isPaidPlanTier('complete')).toBe(true)
    expect(isPaidPlanTier('practitioner')).toBe(true)
    expect(isPaidPlanTier('lifetime')).toBe(true)
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
    // Explorer gets the map (a small AI allowance and basic bonds); exports,
    // groups and API are what the tiers above it sell.
    expect(isPlanFeatureAvailable('explorer', 'aiInterpretations')).toBe(true)
    expect(isPlanFeatureAvailable('explorer', 'relationships')).toBe(true)
    expect(isPlanFeatureAvailable('explorer', 'exports')).toBe(false)
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

  it('meters AI interpretations rather than blocking them', async () => {
    const { checkLimit } = await importUsageWithRepo(null)
    const result = await checkLimit('user-1', 'ai_interpretations_used')
    expect(result.allowed).toBe(true)
    expect(result.limit).toBe(5)
  })

  it('blocks the sixth AI interpretation', async () => {
    const { checkLimit } = await importUsageWithRepo({
      user_id: 'user-1',
      period: '2026-07',
      profiles_count: 0,
      ai_interpretations_used: 5,
      boards_count: 0,
      exports_count: 0,
    })
    const result = await checkLimit('user-1', 'ai_interpretations_used')
    expect(result.allowed).toBe(false)
  })

  it('allows profiles under the 15-person cap', async () => {
    const { checkLimit } = await importUsageWithRepo({
      user_id: 'user-1',
      period: '2026-07',
      profiles_count: 14,
      ai_interpretations_used: 0,
      boards_count: 0,
      exports_count: 0,
    })
    const result = await checkLimit('user-1', 'profiles_count')
    expect(result.allowed).toBe(true)
    expect(result.limit).toBe(15)
  })

  it('blocks the sixteenth profile', async () => {
    const { checkLimit, requireLimit, LimitExceededError } =
      await importUsageWithRepo({
        user_id: 'user-1',
        period: '2026-07',
        profiles_count: 15,
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
