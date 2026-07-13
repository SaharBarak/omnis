/**
 * RevenueCat billing provider — App Store / Google Play in-app purchases.
 *
 * The stores are the merchant of record; RevenueCat is the entitlement ledger
 * in front of them. The mobile app calls `Purchases.logIn(<auth0 sub>)`, so a
 * RevenueCat `app_user_id` IS our Auth0 user id. That single fact is what lets
 * the web app unlock from a purchase made on a phone: we look the user up by
 * the same id they signed in with.
 *
 * Entitlement identifiers in the RevenueCat dashboard are named after our plan
 * tiers (`explorer` | `complete` | `practitioner` | `lifetime`).
 *
 * No SDK — the REST API is two endpoints and keeps the Workers bundle small.
 */

import { timingSafeEqualStr } from '@/lib/api/cron-auth'
import {
  getPlanFromEntitlementId,
  highestPlan,
  type PlanTier,
} from '@/lib/services/billing'
import type {
  BillingProvider,
  NormalizedEvent,
  NormalizedSubscription,
} from '@/lib/services/billing-provider'
import type { SubscriptionStatus } from '@/lib/db/repositories/subscriptions-repo'

const API_BASE = 'https://api.revenuecat.com/v1'

/** Shape of the bits of the RevenueCat subscriber payload we rely on. */
interface RCEntitlement {
  /** ISO date, or null for a non-expiring (lifetime) entitlement. */
  expires_date: string | null
  purchase_date: string | null
  product_identifier: string | null
}

interface RCSubscription {
  expires_date: string | null
  period_type?: string | null
  unsubscribe_detected_at?: string | null
  billing_issues_detected_at?: string | null
}

interface RCSubscriber {
  original_app_user_id?: string | null
  management_url?: string | null
  entitlements?: Record<string, RCEntitlement> | null
  subscriptions?: Record<string, RCSubscription> | null
}

const FREE: NormalizedSubscription = {
  plan: 'free',
  status: 'canceled',
  customerId: null,
  subscriptionId: null,
  currentPeriodStart: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
}

function secretKey(): string {
  // Read per-request: module-scope capture reads an empty env on Workers.
  const key = process.env.REVENUECAT_SECRET_KEY
  if (!key) throw new Error('REVENUECAT_SECRET_KEY is not set')
  return key
}

/** An entitlement is live when it has no expiry (lifetime) or expires later. */
function isActive(e: RCEntitlement, now: number): boolean {
  if (!e.expires_date) return true
  return new Date(e.expires_date).getTime() > now
}

async function fetchSubscriber(userId: string): Promise<RCSubscriber | null> {
  const res = await fetch(
    `${API_BASE}/subscribers/${encodeURIComponent(userId)}`,
    {
      headers: {
        Authorization: `Bearer ${secretKey()}`,
        'Content-Type': 'application/json',
      },
    }
  )

  // RevenueCat returns 404 only for a genuinely unknown customer — that is a
  // legitimate "no purchase", not a failure.
  if (res.status === 404) return null
  if (!res.ok) {
    throw new Error(
      `RevenueCat subscriber fetch failed (${res.status}): ${await res.text()}`
    )
  }

  const body = (await res.json()) as { subscriber?: RCSubscriber }
  return body.subscriber ?? null
}

function normalize(
  subscriber: RCSubscriber | null,
  userId: string,
  now: number
): NormalizedSubscription {
  if (!subscriber) return FREE

  const entitlements = Object.entries(subscriber.entitlements ?? {}).filter(
    ([, e]) => isActive(e, now)
  )
  if (entitlements.length === 0) return { ...FREE, customerId: userId }

  // A customer can hold more than one active entitlement (upgrade mid-period,
  // or lifetime alongside a live subscription) — the strongest one wins.
  const plans = entitlements.map(([id]) => getPlanFromEntitlementId(id))
  const plan: PlanTier = highestPlan(plans)
  if (plan === 'free') return { ...FREE, customerId: userId }

  const granting = entitlements.find(
    ([id]) => getPlanFromEntitlementId(id) === plan
  )!
  const entitlement = granting[1]
  const productId = entitlement.product_identifier ?? null

  // Renewal/billing state lives on the subscription, not the entitlement.
  // A lifetime (non-consumable) purchase has no subscription entry at all.
  const sub = productId ? subscriber.subscriptions?.[productId] : undefined

  let status: SubscriptionStatus = 'active'
  if (sub?.billing_issues_detected_at) status = 'past_due'
  else if (sub?.period_type === 'trial') status = 'trialing'

  return {
    plan,
    status,
    customerId: subscriber.original_app_user_id ?? userId,
    subscriptionId: productId,
    currentPeriodStart: entitlement.purchase_date
      ? new Date(entitlement.purchase_date)
      : null,
    // null = never expires (Founding Lifetime).
    currentPeriodEnd: entitlement.expires_date
      ? new Date(entitlement.expires_date)
      : null,
    // The user turned off auto-renew but still has access until period end.
    cancelAtPeriodEnd: Boolean(sub?.unsubscribe_detected_at),
  }
}

interface RCWebhookBody {
  event?: {
    id?: string
    type?: string
    app_user_id?: string
    original_app_user_id?: string
    transferred_from?: string[]
    transferred_to?: string[]
  }
}

export const revenueCatProvider: BillingProvider = {
  name: 'revenuecat',

  async fetchEntitlement(userId: string): Promise<NormalizedSubscription> {
    return normalize(await fetchSubscriber(userId), userId, Date.now())
  },

  async verifyWebhook(
    rawBody: string,
    headers: Headers
  ): Promise<NormalizedEvent | null> {
    const secret = process.env.REVENUECAT_WEBHOOK_SECRET
    if (!secret) {
      // Fail closed: an unconfigured secret must never mean "accept anything".
      throw new Error('REVENUECAT_WEBHOOK_SECRET is not set')
    }

    // RevenueCat sends the exact Authorization header value configured in the
    // dashboard. Compare in constant time.
    const provided = headers.get('authorization')
    if (!provided || !timingSafeEqualStr(provided, secret)) return null

    let body: RCWebhookBody
    try {
      body = JSON.parse(rawBody) as RCWebhookBody
    } catch {
      return null
    }

    const event = body.event
    if (!event?.type) return null

    // A TRANSFER moves entitlements between users — both sides must re-sync.
    const userIds = [
      event.app_user_id,
      ...(event.transferred_from ?? []),
      ...(event.transferred_to ?? []),
    ].filter((id): id is string => typeof id === 'string' && id.length > 0)

    if (userIds.length === 0) return null

    return {
      type: event.type,
      eventId: event.id,
      userIds: [...new Set(userIds)],
    }
  },

  async getManagementUrl(userId: string): Promise<string | null> {
    const subscriber = await fetchSubscriber(userId)
    return subscriber?.management_url ?? null
  },
}

/** Exported for unit tests — pure, no network. */
export const __test = { normalize }
