/**
 * Billing Service - Stripe Integration
 * Handles subscriptions, checkout, and billing management
 */

import Stripe from 'stripe'

// Lazy-initialized Stripe client
let _stripe: Stripe | null = null

function getStripeClient(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2026-01-28.clover',
    })
  }
  return _stripe
}

// Plan types
export type PlanTier = 'free' | 'complete' | 'practitioner'

// Subscription status
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
    stripePriceId: null,
    limits: {
      profiles: 1,
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
  complete: {
    name: 'Complete',
    price: 9,
    priceILS: 33,
    stripePriceId: process.env.STRIPE_PRICE_COMPLETE_MONTHLY,
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
    stripePriceId: process.env.STRIPE_PRICE_PRACTITIONER_MONTHLY,
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
} as const

export type PlanLimits = typeof PLANS['free']['limits']

// Subscription data interface
export interface SubscriptionData {
  userId: string
  plan: PlanTier
  status: SubscriptionStatus
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
  cancelAtPeriodEnd?: boolean
}

/**
 * Get or create a Stripe customer for a user
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<string> {
  // Search for existing customer
  const existingCustomers = await getStripeClient().customers.search({
    query: `metadata['omnis_user_id']:'${userId}'`,
  })

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0].id
  }

  // Create new customer
  const customer = await getStripeClient().customers.create({
    email,
    name: name || undefined,
    metadata: {
      omnis_user_id: userId,
    },
  })

  return customer.id
}

/**
 * Create a Stripe Checkout session for subscription
 */
export async function createCheckoutSession(
  userId: string,
  email: string,
  plan: 'complete' | 'practitioner',
  successUrl: string,
  cancelUrl: string
): Promise<{ url: string | null }> {
  const customerId = await getOrCreateStripeCustomer(userId, email)
  const priceId = PLANS[plan].stripePriceId

  if (!priceId) {
    throw new Error(`No Stripe price configured for plan: ${plan}`)
  }

  const session = await getStripeClient().checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    customer_update: {
      address: 'auto',
    },
    subscription_data: {
      trial_period_days: 7,
      metadata: {
        omnis_user_id: userId,
        omnis_plan: plan,
      },
    },
    metadata: {
      omnis_user_id: userId,
      omnis_plan: plan,
    },
  })

  return { url: session.url }
}

/**
 * Create a Stripe Billing Portal session
 */
export async function createBillingPortalSession(
  stripeCustomerId: string,
  returnUrl: string
): Promise<{ url: string }> {
  const session = await getStripeClient().billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  })

  return { url: session.url }
}

/**
 * Cancel a subscription at period end
 */
export async function cancelSubscription(
  stripeSubscriptionId: string
): Promise<Stripe.Subscription> {
  return await getStripeClient().subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: true,
  })
}

/**
 * Reactivate a subscription that was set to cancel
 */
export async function reactivateSubscription(
  stripeSubscriptionId: string
): Promise<Stripe.Subscription> {
  return await getStripeClient().subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: false,
  })
}

/**
 * Get subscription details from Stripe
 */
export async function getStripeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return await getStripeClient().subscriptions.retrieve(subscriptionId)
}

/**
 * Get customer's invoices
 */
export async function getCustomerInvoices(
  customerId: string,
  limit: number = 12
): Promise<Stripe.Invoice[]> {
  const invoices = await getStripeClient().invoices.list({
    customer: customerId,
    limit,
  })
  return invoices.data
}

/**
 * Construct and verify a webhook event
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET not configured')
  }
  return getStripeClient().webhooks.constructEvent(payload, signature, webhookSecret)
}

/**
 * Extract plan from Stripe subscription
 */
export function getPlanFromSubscription(
  subscription: Stripe.Subscription
): PlanTier {
  const priceId = subscription.items.data[0]?.price?.id
  
  if (priceId === PLANS.complete.stripePriceId) {
    return 'complete'
  }
  if (priceId === PLANS.practitioner.stripePriceId) {
    return 'practitioner'
  }
  
  return 'free'
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
  
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'number') {
    return value > 0
  }
  if (Array.isArray(value)) {
    return value.length > 0
  }
  return !!value
}

/**
 * Get plan limits for a specific tier
 */
export function getPlanLimits(plan: PlanTier) {
  return PLANS[plan].limits
}

export { getStripeClient as stripe }
