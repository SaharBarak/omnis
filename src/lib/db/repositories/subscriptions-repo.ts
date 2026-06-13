import { connectMongo } from '@/lib/db/connection'
import { Subscription, Usage } from '@/lib/db/models'
import type {
  ISubscription,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@/lib/db/models'
import type { IUsage } from '@/lib/db/models'
import { serialize } from '@/lib/db/serialize'

/**
 * Billing data repository (subscriptions + usage collections).
 *
 * Replaces the Supabase `subscriptions`/`usage` reads/writes and the Postgres
 * RPCs from `supabase/migrations/00006_billing_schema.sql`:
 *   - `get_user_plan`   -> {@link getUserPlan}
 *   - `increment_usage` -> {@link incrementUsage}
 *
 * Tenant scoping is enforced here now that Postgres RLS is gone. Owner-scoped
 * functions take a `userId` (Better Auth id from `requireUserId()`) and filter
 * by `user_id === userId`. NEVER pass an owner id sourced from client input.
 *
 * The ONLY exception is {@link updateByPaddleCustomerId} /
 * {@link updateByPaddleSubscriptionId}, which run in SYSTEM context for the
 * Paddle webhook (authenticated by the Paddle signature, not a user session) and
 * therefore key off Paddle identifiers instead of an owner filter.
 */

// Serialized row shapes (mirror the old Supabase row contract: dates as ISO
// strings, `_id` -> `id`, nullable fields as `string | null`).
export interface SubscriptionRow {
  id: string
  user_id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  paddle_customer_id: string | null
  paddle_subscription_id: string | null
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  trial_end: string | null
  created_at: string
  updated_at: string
}

export interface UsageRow {
  id: string
  user_id: string
  period: string
  profiles_count: number
  ai_interpretations_used: number
  boards_count: number
  exports_count: number
  created_at: string
  updated_at: string
}

export type UsageMetric =
  | 'profiles_count'
  | 'ai_interpretations_used'
  | 'boards_count'
  | 'exports_count'

/** Writable subscription fields (timestamps/`user_id` are managed elsewhere). */
export type SubscriptionWriteInput = Partial<
  Pick<
    ISubscription,
    | 'plan'
    | 'status'
    | 'paddle_customer_id'
    | 'paddle_subscription_id'
    | 'current_period_start'
    | 'current_period_end'
    | 'cancel_at_period_end'
    | 'trial_end'
  >
>

// =============================================================================
// SUBSCRIPTIONS — owner-scoped (USER context)
// =============================================================================

/** Returns the caller's subscription, or null when they have none. */
export async function getSubscription(
  userId: string
): Promise<SubscriptionRow | null> {
  await connectMongo()
  const doc = await Subscription.findOne({ user_id: userId }).lean()
  return doc ? serialize<SubscriptionRow>(doc) : null
}

/**
 * Upsert the caller's single subscription row (keyed by `user_id`).
 * Mirrors the Supabase `.upsert({...}, { onConflict: 'user_id' })`.
 */
export async function upsertSubscriptionForUser(
  userId: string,
  data: SubscriptionWriteInput
): Promise<SubscriptionRow> {
  await connectMongo()
  const doc = await Subscription.findOneAndUpdate(
    { user_id: userId },
    { $set: { ...data, user_id: userId } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean()
  return serialize<SubscriptionRow>(doc)
}

/**
 * Update the caller's subscription. Returns the updated row, or null if the
 * caller has no subscription (no row is created).
 */
export async function updateSubscriptionForUser(
  userId: string,
  data: SubscriptionWriteInput
): Promise<SubscriptionRow | null> {
  await connectMongo()
  const doc = await Subscription.findOneAndUpdate(
    { user_id: userId },
    { $set: data },
    { new: true }
  ).lean()
  return doc ? serialize<SubscriptionRow>(doc) : null
}

/**
 * Port of the Postgres `get_user_plan(p_user_id)` RPC.
 *
 * Returns the subscription's plan only when the subscription is still valid —
 * status in (`active`, `trialing`) AND (`current_period_end` is null OR in the
 * future). Otherwise (no subscription, expired, or non-active status) returns
 * `'free'`.
 */
export async function getUserPlan(userId: string): Promise<SubscriptionPlan> {
  await connectMongo()
  const sub = await Subscription.findOne({ user_id: userId })
    .select('plan status current_period_end')
    .lean()

  // NOT FOUND -> free
  if (!sub) return 'free'

  const isActiveStatus = sub.status === 'active' || sub.status === 'trialing'
  const notExpired =
    sub.current_period_end == null ||
    new Date(sub.current_period_end).getTime() > Date.now()

  if (isActiveStatus && notExpired) {
    return sub.plan
  }

  return 'free'
}

// =============================================================================
// SUBSCRIPTIONS — SYSTEM context (Paddle webhook only)
// =============================================================================
//
// These functions DO NOT filter by an owner id. They are reachable only from
// the Paddle webhook handler, which is authenticated by the verified Paddle
// signature (not a user session). They key off Paddle identifiers carried in
// the verified event payload. Do not call them from user-facing routes.

/**
 * SYSTEM context. Update the subscription matching a Paddle customer id.
 * Returns true if a row was matched.
 */
export async function updateByPaddleCustomerId(
  customerId: string,
  data: SubscriptionWriteInput
): Promise<boolean> {
  await connectMongo()
  const res = await Subscription.updateOne(
    { paddle_customer_id: customerId },
    { $set: data }
  )
  return res.matchedCount > 0
}

/**
 * SYSTEM context. Update the subscription matching a Paddle subscription id.
 * Returns true if a row was matched.
 */
export async function updateByPaddleSubscriptionId(
  subscriptionId: string,
  data: SubscriptionWriteInput
): Promise<boolean> {
  await connectMongo()
  const res = await Subscription.updateOne(
    { paddle_subscription_id: subscriptionId },
    { $set: data }
  )
  return res.matchedCount > 0
}

/**
 * SYSTEM context. Upsert a subscription keyed by `user_id` taken from verified
 * Paddle transaction/subscription custom data. Mirrors the prior
 * upsert-on-conflict(user_id) behavior.
 */
export async function upsertSubscriptionByUserId(
  userId: string,
  data: SubscriptionWriteInput
): Promise<void> {
  await connectMongo()
  await Subscription.updateOne(
    { user_id: userId },
    { $set: { ...data, user_id: userId } },
    { upsert: true, setDefaultsOnInsert: true }
  )
}

// =============================================================================
// USAGE — owner-scoped (USER context)
// =============================================================================

/** Returns the usage row for `{ user_id, period }`, or null if none exists. */
export async function getUsage(
  userId: string,
  period: string
): Promise<UsageRow | null> {
  await connectMongo()
  const doc = await Usage.findOne({ user_id: userId, period }).lean()
  return doc ? serialize<UsageRow>(doc) : null
}

/**
 * Port of the Postgres `increment_usage(p_user_id, p_period, p_metric, p_amount)`
 * RPC. Atomically upserts the `{ user_id, period }` row and increments the named
 * metric column by `amount` in a single `$inc` upsert. The other metric columns
 * default to 0 on insert via the schema, so no explicit seeding is required.
 */
export async function incrementUsage(
  userId: string,
  period: string,
  metric: UsageMetric,
  amount = 1
): Promise<void> {
  await connectMongo()
  await Usage.updateOne(
    { user_id: userId, period },
    { $inc: { [metric]: amount } },
    { upsert: true, setDefaultsOnInsert: true }
  )
}

export type { IUsage }
