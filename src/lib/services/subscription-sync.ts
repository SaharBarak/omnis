/**
 * Paddle subscription sync — single source of truth.
 *
 * Follows the t3dotgg/stripe-recommendations pattern adapted to Paddle:
 * webhook payloads are treated only as a signal that *something* changed.
 * On any subscription event we re-fetch the current subscription from the
 * Paddle API and upsert THAT, so duplicate deliveries are naturally
 * idempotent and out-of-order deliveries converge on the latest state.
 *
 * SYSTEM context: {@link syncPaddleSubscription} writes via the system-context
 * repo functions and must only be reached from signature-verified webhook
 * handling or from a route already scoped by `requireUserId()`
 * ({@link resyncSubscriptionIfStale}).
 */

import { getPlanFromPriceId, paddle as getPaddleClient } from '@/lib/services/billing'
import {
  getSubscription,
  getByPaddleSubscriptionId,
  updateByPaddleSubscriptionId,
  upsertSubscriptionByUserId,
  type SubscriptionRow,
  type SubscriptionStatus,
  type SubscriptionWriteInput,
} from '@/lib/db/repositories/subscriptions-repo'

export type SyncResult = 'synced' | 'unresolved_user'

/** Local status mapping (superset of billing's — includes `paused`). */
function mapStatus(status: string): SubscriptionStatus {
  switch (status) {
    case 'active':
      return 'active'
    case 'trialing':
      return 'trialing'
    case 'past_due':
      return 'past_due'
    case 'paused':
      return 'paused'
    case 'canceled':
      return 'canceled'
    default:
      return 'incomplete'
  }
}

/**
 * Fetch the subscription from the Paddle API (the source of truth) and upsert
 * it locally. Event payload data is deliberately NOT written — only the
 * subscription id (and optionally a user id) are taken from the event.
 *
 * Resolution order for the owning user when no local row matches the Paddle
 * subscription id: `custom_data.omnis_user_id` on the fetched subscription
 * (set at checkout), then `fallbackUserId` (e.g. from the verified event).
 *
 * Throws on Paddle API/DB failures so webhook callers can return non-2xx and
 * let Paddle retry. Returns `'unresolved_user'` when the subscription cannot
 * be attributed to a user — a permanent condition retries will not fix.
 */
export async function syncPaddleSubscription(
  paddleSubscriptionId: string,
  fallbackUserId?: string
): Promise<SyncResult> {
  const sub = await getPaddleClient().subscriptions.get(paddleSubscriptionId)

  // Founding Lifetime guard: lifetime is granted by a one-time transaction
  // (transaction.completed) and must never be downgraded or expired by
  // subscription lifecycle syncs. A local row already on 'lifetime' is left
  // untouched — canceling or letting an old subscription lapse cannot pull a
  // founding member off their lifetime plan.
  const localRow = await getByPaddleSubscriptionId(sub.id)
  if (localRow?.plan === 'lifetime') return 'synced'

  const status = mapStatus(sub.status)
  const write: SubscriptionWriteInput = {
    // A canceled subscription drops to the free plan regardless of its items.
    plan: status === 'canceled' ? 'free' : getPlanFromPriceId(sub.items?.[0]?.price?.id),
    status,
    paddle_customer_id: sub.customerId,
    cancel_at_period_end:
      status !== 'canceled' && sub.scheduledChange?.action === 'cancel',
    current_period_start: sub.currentBillingPeriod?.startsAt
      ? new Date(sub.currentBillingPeriod.startsAt)
      : null,
    current_period_end: sub.currentBillingPeriod?.endsAt
      ? new Date(sub.currentBillingPeriod.endsAt)
      : null,
  }

  const matched = await updateByPaddleSubscriptionId(sub.id, write)
  if (matched) return 'synced'

  // No local row yet (e.g. events arrived before checkout wrote anything, or
  // updated arrived before created) — backfill keyed by the user id.
  const customUserId = (sub.customData as Record<string, unknown> | null)?.[
    'omnis_user_id'
  ]
  const userId =
    typeof customUserId === 'string' && customUserId ? customUserId : fallbackUserId
  if (!userId) return 'unresolved_user'

  // Same lifetime guard for the backfill path: never overwrite a lifetime
  // row keyed by user id with subscription-derived state.
  const localByUser = await getSubscription(userId)
  if (localByUser?.plan === 'lifetime') return 'synced'

  await upsertSubscriptionByUserId(userId, {
    ...write,
    paddle_subscription_id: sub.id,
  })
  return 'synced'
}

/** Local rows older than this are re-fetched from Paddle on read. */
const STALE_AFTER_MS = 24 * 60 * 60 * 1000

/**
 * USER context. Read the caller's subscription, re-syncing it from Paddle
 * first when forced (`?refresh=1`) or when the local row is stale (>24h since
 * last write). Sync failures are logged and the last-known local state is
 * served — webhooks remain the authoritative update path.
 */
export async function resyncSubscriptionIfStale(
  userId: string,
  options: { force?: boolean } = {}
): Promise<SubscriptionRow | null> {
  const current = await getSubscription(userId)
  if (!current?.paddle_subscription_id) return current

  const isStale =
    Date.now() - new Date(current.updated_at).getTime() > STALE_AFTER_MS
  if (!options.force && !isStale) return current

  try {
    await syncPaddleSubscription(current.paddle_subscription_id, userId)
  } catch (error) {
    console.error(
      `[billing] Paddle re-sync failed for user ${userId} (serving cached state):`,
      error
    )
    return current
  }
  return (await getSubscription(userId)) ?? current
}

/**
 * Timing-safe Paddle webhook signature verification (defense in depth ahead
 * of the SDK's `unmarshal`, whose HMAC comparison is a plain `===`).
 *
 * Header format: `ts=<unix seconds>;h1=<hmac-sha256 hex>` where the MAC is
 * computed over `<ts>:<raw body>` with the webhook secret. Uses Web Crypto,
 * available on Cloudflare Workers and Node 18+.
 */
export async function verifyPaddleWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string
): Promise<boolean> {
  let ts = ''
  let h1 = ''
  for (const part of signatureHeader.split(';')) {
    const [key, value] = part.split('=')
    if (key === 'ts' && value) ts = value
    if (key === 'h1' && value) h1 = value
  }
  if (!ts || !h1) return false

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const mac = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${ts}:${rawBody}`)
  )
  const expected = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return timingSafeEqualStrings(expected, h1)
}

/** Constant-time string comparison (no early exit on first mismatch). */
function timingSafeEqualStrings(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}
