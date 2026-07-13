/**
 * Subscription sync — single source of truth.
 *
 * Follows the t3dotgg/stripe-recommendations pattern: a webhook payload is only
 * a signal that *something* changed for a user. We never write state from the
 * payload. Instead we re-fetch that user's current entitlement from the billing
 * provider and upsert THAT, which makes duplicate deliveries naturally
 * idempotent and out-of-order deliveries convergent.
 *
 * Because the provider's customer id IS our user id (RevenueCat `app_user_id` ===
 * Auth0 sub), everything keys off `user_id` — there is no separate provider
 * subscription id to resolve.
 *
 * SYSTEM context: {@link syncSubscription} writes via the system-context repo
 * functions and must only be reached from a verified webhook or from a route
 * already scoped by `requireUserId()` ({@link resyncSubscriptionIfStale}).
 */

import { getBillingProvider } from '@/lib/services/billing-provider'
import {
  getSubscription,
  upsertSubscriptionByUserId,
  type SubscriptionRow,
  type SubscriptionWriteInput,
} from '@/lib/db/repositories/subscriptions-repo'

export type SyncResult = 'synced' | 'unresolved_user'

/**
 * Re-fetch the user's entitlement from the provider (the source of truth) and
 * upsert it locally.
 *
 * Throws on provider/DB failure so webhook callers can return non-2xx and let
 * the provider retry. Returns `'unresolved_user'` for an empty user id — a
 * permanent condition retries will not fix.
 */
export async function syncSubscription(userId: string): Promise<SyncResult> {
  if (!userId) return 'unresolved_user'

  const provider = await getBillingProvider()
  const entitlement = await provider.fetchEntitlement(userId)

  // Founding Lifetime guard: a lifetime grant is permanent by product decision.
  // Once a local row is on 'lifetime', no later sync may pull a founding member
  // off it — a lapsed or canceled subscription must not downgrade them.
  const local = await getSubscription(userId)
  if (local?.plan === 'lifetime' && entitlement.plan !== 'lifetime') {
    return 'synced'
  }

  const write: SubscriptionWriteInput = {
    plan: entitlement.plan,
    status: entitlement.status,
    billing_provider: provider.name,
    billing_customer_id: entitlement.customerId,
    billing_subscription_id: entitlement.subscriptionId,
    cancel_at_period_end: entitlement.cancelAtPeriodEnd,
    current_period_start: entitlement.currentPeriodStart,
    // null = never expires (lifetime); getUserPlan treats null as "not expired".
    current_period_end: entitlement.currentPeriodEnd,
  }

  await upsertSubscriptionByUserId(userId, write)
  return 'synced'
}

/** Local rows older than this are re-fetched from the provider on read. */
const STALE_AFTER_MS = 24 * 60 * 60 * 1000

/**
 * USER context. Read the caller's subscription, re-syncing from the provider
 * first when forced (`?refresh=1`) or when the local row is stale (>24h since
 * last write). Sync failures are logged and the last-known local state is
 * served — webhooks remain the authoritative update path.
 */
export async function resyncSubscriptionIfStale(
  userId: string,
  options: { force?: boolean } = {}
): Promise<SubscriptionRow | null> {
  const current = await getSubscription(userId)

  const isStale =
    !current ||
    Date.now() - new Date(current.updated_at).getTime() > STALE_AFTER_MS
  if (!options.force && !isStale) return current

  try {
    await syncSubscription(userId)
  } catch (error) {
    console.error(
      `[billing] re-sync failed for user ${userId} (serving cached state):`,
      error
    )
    return current
  }
  return (await getSubscription(userId)) ?? current
}
