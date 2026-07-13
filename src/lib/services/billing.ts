/**
 * Billing Service — plans and entitlements.
 *
 * Provider-free by design. Paid access is sold exclusively as an in-app
 * purchase through the App Store / Google Play; the stores are the merchant of
 * record. Entitlements are mirrored into our `subscriptions` table by the
 * billing provider (see `billing-provider.ts`), and the web app gates on that
 * table via `usage.ts`. Nothing here knows or cares which provider wrote it.
 *
 * RevenueCat entitlement identifiers are configured to match these plan tiers
 * exactly (`explorer` | `complete` | `practitioner` | `lifetime`), which is what
 * makes {@link getPlanFromEntitlementId} a straight lookup.
 */

// Plan types
export type PlanTier = 'free' | 'explorer' | 'complete' | 'practitioner' | 'lifetime'

/**
 * Plans that can be purchased. 'lifetime' is a one-time (non-consumable)
 * purchase rather than a renewing subscription.
 */
export type PaidPlanTier = Exclude<PlanTier, 'free'>

export const PAID_PLAN_TIERS: readonly PaidPlanTier[] = [
  'explorer',
  'complete',
  'practitioner',
  'lifetime',
] as const

export function isPaidPlanTier(value: unknown): value is PaidPlanTier {
  return (PAID_PLAN_TIERS as readonly string[]).includes(value as string)
}

// Subscription status (internal representation)
export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'

// Plan configuration.
// `storeProductId` is the App Store / Play product identifier backing the tier.
// It is informational here (the paywall renders RevenueCat Offerings); plan
// resolution keys off the entitlement identifier, not the product id.
export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    priceILS: 0,
    storeProductId: null,
    limits: {
      profiles: 3,
      systems: ['dreamspell'] as string[],
      aiInterpretations: 0,
      boards: 0,
      exports: false,
      timeline: false,
      relationships: false,
      groupAnalysis: false,
      apiAccess: false,
    },
  },
  explorer: {
    name: 'Explorer',
    price: 5,
    priceILS: 18,
    storeProductId: process.env.STORE_PRODUCT_EXPLORER,
    limits: {
      // The whole map at small scale: every system, a few people, no AI.
      profiles: 5,
      systems: ['dreamspell', 'tzolkin', 'longcount', 'humandesign', 'astrology', 'gematria'],
      aiInterpretations: 0,
      boards: 2,
      exports: false,
      timeline: true,
      relationships: false,
      groupAnalysis: false,
      apiAccess: false,
    },
  },
  complete: {
    name: 'Complete',
    price: 9,
    priceILS: 33,
    storeProductId: process.env.STORE_PRODUCT_COMPLETE,
    limits: {
      profiles: 10,
      systems: ['dreamspell', 'tzolkin', 'longcount', 'humandesign', 'astrology', 'gematria'],
      aiInterpretations: 30,
      boards: 5,
      exports: true,
      timeline: true,
      relationships: 'basic' as const,
      groupAnalysis: false,
      apiAccess: false,
    },
  },
  practitioner: {
    name: 'Practitioner',
    price: 29,
    priceILS: 107,
    storeProductId: process.env.STORE_PRODUCT_PRACTITIONER,
    limits: {
      profiles: Infinity,
      systems: ['dreamspell', 'tzolkin', 'longcount', 'humandesign', 'astrology', 'gematria'],
      aiInterpretations: Infinity,
      boards: Infinity,
      exports: true,
      timeline: true,
      relationships: 'advanced' as const,
      groupAnalysis: true,
      apiAccess: true,
    },
  },
  lifetime: {
    // Founding Lifetime — one-time purchase, Complete entitlements forever.
    // Mirrors PLANS.complete.limits (keep the two in lockstep; a test enforces it).
    name: 'Founding Lifetime',
    price: 79,
    priceILS: 292,
    storeProductId: process.env.STORE_PRODUCT_LIFETIME,
    limits: {
      profiles: 10,
      systems: ['dreamspell', 'tzolkin', 'longcount', 'humandesign', 'astrology', 'gematria'],
      aiInterpretations: 30,
      boards: 5,
      exports: true,
      timeline: true,
      relationships: 'basic' as const,
      groupAnalysis: false,
      apiAccess: false,
    },
  },
} as const

export type PlanLimits = typeof PLANS['free']['limits']

/**
 * Precedence when a customer somehow holds more than one active entitlement
 * (e.g. an upgrade mid-period, or a lifetime purchase alongside a live
 * subscription). Highest wins.
 */
const PLAN_RANK: Record<PlanTier, number> = {
  free: 0,
  explorer: 1,
  complete: 2,
  lifetime: 3,
  practitioner: 4,
}

export function planRank(plan: PlanTier): number {
  return PLAN_RANK[plan]
}

/** Pick the strongest of a set of plan tiers. */
export function highestPlan(plans: readonly PlanTier[]): PlanTier {
  return plans.reduce<PlanTier>(
    (best, p) => (planRank(p) > planRank(best) ? p : best),
    'free'
  )
}

/**
 * Map a store/RevenueCat entitlement identifier to our internal plan tier.
 * Entitlements are named after the tiers, so this is a guarded lookup.
 */
export function getPlanFromEntitlementId(
  entitlementId: string | undefined | null
): PlanTier {
  if (!entitlementId) return 'free'
  return isPaidPlanTier(entitlementId) ? entitlementId : 'free'
}

/**
 * Check if a feature is available for a plan
 */
export function isPlanFeatureAvailable(
  plan: PlanTier,
  feature: keyof PlanLimits
): boolean {
  const limits = PLANS[plan].limits
  const value = limits[feature]

  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value > 0
  if (Array.isArray(value)) return value.length > 0
  return !!value
}

/**
 * Get plan limits for a specific tier
 */
export function getPlanLimits(plan: PlanTier) {
  return PLANS[plan].limits
}
