/**
 * Billing provider seam.
 *
 * The app never talks to a billing vendor directly — it goes through this
 * interface. Only provider-neutral types cross the boundary (no vendor SDK
 * types), so swapping or adding a provider is contained to one file under
 * `billing-providers/`.
 *
 * Today there is exactly one provider: RevenueCat, fronting App Store / Google
 * Play in-app purchases (the stores are the merchant of record). A web card
 * acquirer can be added here later without touching the webhook, the sync, or
 * any entitlement logic.
 */

import type { PlanTier, SubscriptionStatus } from '@/lib/services/billing'
import type { SubscriptionStatus as RowStatus } from '@/lib/db/repositories/subscriptions-repo'

/** Provider-neutral view of a customer's current entitlement. */
export interface NormalizedSubscription {
  plan: PlanTier
  /** Row-level status (superset of billing's — includes `paused`). */
  status: RowStatus
  /** The provider's customer identifier. For RevenueCat this is the Auth0 sub. */
  customerId: string | null
  /** Identifier of the purchase granting the entitlement (product id). */
  subscriptionId: string | null
  currentPeriodStart: Date | null
  /** `null` means it never expires (Founding Lifetime). */
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
}

/** Provider-neutral webhook event: a signal that a user's state changed. */
export interface NormalizedEvent {
  /** Vendor event type, for logging only. */
  type: string
  /** Users whose entitlement must be re-fetched. Usually one; TRANSFER yields two. */
  userIds: string[]
  /** Vendor event id, for logging/dedupe. */
  eventId?: string
}

export interface BillingProvider {
  readonly name: string

  /**
   * Fetch the customer's current entitlement from the provider — the source of
   * truth. Throws on provider/network failure so callers can retry.
   * Returns a `free` NormalizedSubscription when the customer has no
   * active entitlement (including when the customer is unknown to the provider).
   */
  fetchEntitlement(userId: string): Promise<NormalizedSubscription>

  /**
   * Verify a webhook request and parse it into a provider-neutral event.
   * Returns null when the signature/secret does not verify — callers MUST
   * treat null as a rejection, never as an empty event.
   */
  verifyWebhook(
    rawBody: string,
    headers: Headers
  ): Promise<NormalizedEvent | null>

  /** Where the user manages/cancels the purchase (OS subscription settings). */
  getManagementUrl(userId: string): Promise<string | null>
}

// Re-export for consumers that only need the status union.
export type { SubscriptionStatus }

let cached: BillingProvider | null = null

/**
 * Resolve the configured provider. `BILLING_PROVIDER` defaults to `revenuecat`.
 * Lazily imported and memoized so provider modules (and their env reads) are
 * only touched when billing is actually exercised.
 */
export async function getBillingProvider(): Promise<BillingProvider> {
  if (cached) return cached
  const name = (process.env.BILLING_PROVIDER || 'revenuecat').toLowerCase()

  switch (name) {
    case 'revenuecat': {
      const { revenueCatProvider } = await import(
        '@/lib/services/billing-providers/revenuecat'
      )
      cached = revenueCatProvider
      return cached
    }
    default:
      throw new Error(`Unknown BILLING_PROVIDER: ${name}`)
  }
}

/** Test seam — drop the memoized provider. */
export function resetBillingProvider(): void {
  cached = null
}
