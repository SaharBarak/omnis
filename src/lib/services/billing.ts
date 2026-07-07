/**
 * Billing Service — Paddle Integration
 * Handles subscriptions, checkout, and billing management.
 *
 * Paddle is the merchant of record. Checkout is a hosted Paddle transaction;
 * subscription lifecycle is reconciled via verified Paddle webhooks. Plan tiers
 * and entitlements below are billing-provider agnostic.
 */

import {
  Paddle,
  Environment,
  type Subscription as PaddleSubscription,
} from '@paddle/paddle-node-sdk'

// Lazy-initialized Paddle client
let _paddle: Paddle | null = null

function getPaddleClient(): Paddle {
  if (!_paddle) {
    const apiKey = process.env.PADDLE_API_KEY
    if (!apiKey) {
      throw new Error('PADDLE_API_KEY is not set')
    }
    const environment =
      process.env.PADDLE_ENV === 'production'
        ? Environment.production
        : Environment.sandbox
    _paddle = new Paddle(apiKey, { environment })
  }
  return _paddle
}

// Plan types
export type PlanTier = 'free' | 'explorer' | 'complete' | 'practitioner' | 'lifetime'

// Plans that can be purchased through Paddle checkout.
// 'lifetime' is a one-time transaction (no billing_cycle), not a subscription.
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

// Plan configuration
export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    priceILS: 0,
    paddlePriceId: null,
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
    paddlePriceId: process.env.PADDLE_PRICE_EXPLORER,
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
    paddlePriceId: process.env.PADDLE_PRICE_COMPLETE,
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
    paddlePriceId: process.env.PADDLE_PRICE_PRACTITIONER,
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
    paddlePriceId: process.env.PADDLE_PRICE_LIFETIME,
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

export interface SubscriptionData {
  userId: string
  plan: PlanTier
  status: SubscriptionStatus
  paddleCustomerId?: string
  paddleSubscriptionId?: string
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
  cancelAtPeriodEnd?: boolean
}

/**
 * Get or create a Paddle customer for a user, keyed by email and tagged with
 * the OmnisX user id in custom data.
 */
export async function getOrCreatePaddleCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<string> {
  const paddle = getPaddleClient()

  // Paddle enforces unique customer emails — reuse if present.
  const existing = paddle.customers.list({ email: [email] })
  for await (const customer of existing) {
    if (customer.email === email) return customer.id
  }

  const created = await paddle.customers.create({
    email,
    name: name || undefined,
    customData: { omnis_user_id: userId },
  })
  return created.id
}

/**
 * Create a hosted Paddle checkout transaction for a paid plan.
 * Works for both recurring prices (subscription tiers) and one-time prices
 * ('lifetime' — no billing_cycle, so Paddle treats it as a plain transaction).
 * Returns the hosted checkout URL (null if Paddle did not provide one).
 */
export async function createCheckoutTransaction(
  userId: string,
  email: string,
  plan: PaidPlanTier
): Promise<{ url: string | null }> {
  const priceId = PLANS[plan].paddlePriceId
  if (!priceId) {
    throw new Error(`No Paddle price configured for plan: ${plan}`)
  }

  const customerId = await getOrCreatePaddleCustomer(userId, email)
  const transaction = await getPaddleClient().transactions.create({
    items: [{ priceId, quantity: 1 }],
    customerId,
    customData: { omnis_user_id: userId, omnis_plan: plan },
  })

  return { url: transaction.checkout?.url ?? null }
}

/**
 * Create a Paddle customer portal session for self-service management.
 */
export async function createPortalSession(
  paddleCustomerId: string,
  subscriptionIds: string[] = []
): Promise<{ url: string }> {
  const session = await getPaddleClient().customerPortalSessions.create(
    paddleCustomerId,
    subscriptionIds
  )
  return { url: session.urls.general.overview }
}

/**
 * Cancel a subscription at the end of the current billing period.
 */
export async function cancelSubscription(
  paddleSubscriptionId: string
): Promise<PaddleSubscription> {
  return getPaddleClient().subscriptions.cancel(paddleSubscriptionId, {
    effectiveFrom: 'next_billing_period',
  })
}

/**
 * Reactivate a subscription scheduled to cancel by clearing the scheduled change.
 */
export async function reactivateSubscription(
  paddleSubscriptionId: string
): Promise<PaddleSubscription> {
  return getPaddleClient().subscriptions.update(paddleSubscriptionId, {
    scheduledChange: null,
  })
}

/**
 * Verify and unmarshal a Paddle webhook into a typed event.
 */
export async function unmarshalWebhookEvent(
  rawBody: string,
  signature: string
) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET
  if (!secret) {
    throw new Error('PADDLE_WEBHOOK_SECRET not configured')
  }
  return getPaddleClient().webhooks.unmarshal(rawBody, secret, signature)
}

/** Map a Paddle price id to our internal plan tier. */
export function getPlanFromPriceId(priceId: string | undefined | null): PlanTier {
  if (!priceId) return 'free'
  if (priceId === PLANS.explorer.paddlePriceId) return 'explorer'
  if (priceId === PLANS.complete.paddlePriceId) return 'complete'
  if (priceId === PLANS.practitioner.paddlePriceId) return 'practitioner'
  if (priceId === PLANS.lifetime.paddlePriceId) return 'lifetime'
  return 'free'
}

/** Map a Paddle subscription status to our internal status enum. */
export function mapPaddleStatus(status: string): SubscriptionStatus {
  switch (status) {
    case 'active':
      return 'active'
    case 'trialing':
      return 'trialing'
    case 'past_due':
      return 'past_due'
    case 'canceled':
      return 'canceled'
    default:
      return 'incomplete'
  }
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

export { getPaddleClient as paddle }
