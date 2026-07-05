import { eq, sql } from 'drizzle-orm'
import { getDb } from '@/lib/db/client'
import { subscriptions, usage } from '@/lib/db/schema'
import { serialize } from '@/lib/db/serialize'

/**
 * Billing data repository (subscriptions + usage tables).
 *
 * Ports the Postgres RPCs from the original Supabase schema:
 *   - `get_user_plan`   -> {@link getUserPlan}
 *   - `increment_usage` -> {@link incrementUsage}
 *
 * Tenant scoping is enforced here. Owner-scoped functions take a `userId`
 * (Auth0 sub from `requireUserId()`) and filter by `user_id === userId`.
 * NEVER pass an owner id sourced from client input.
 *
 * The ONLY exception is {@link updateByPaddleCustomerId} /
 * {@link updateByPaddleSubscriptionId}, which run in SYSTEM context for the
 * Paddle webhook (authenticated by the Paddle signature, not a user session)
 * and therefore key off Paddle identifiers instead of an owner filter.
 */

export type SubscriptionPlan = 'free' | 'explorer' | 'complete' | 'practitioner'
export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'paused'
  | 'canceled'
  | 'incomplete'

// Serialized row shapes (the Supabase row contract: dates as ISO strings,
// nullable fields as `string | null`).
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
export interface SubscriptionWriteInput {
  plan?: SubscriptionPlan
  status?: SubscriptionStatus
  paddle_customer_id?: string | null
  paddle_subscription_id?: string | null
  current_period_start?: string | Date | null
  current_period_end?: string | Date | null
  cancel_at_period_end?: boolean
  trial_end?: string | Date | null
}

function toWrite(data: SubscriptionWriteInput) {
  const iso = (v: string | Date | null | undefined) =>
    v instanceof Date ? v.toISOString() : v
  const out: Record<string, unknown> = { ...data }
  if ('current_period_start' in data) out.current_period_start = iso(data.current_period_start)
  if ('current_period_end' in data) out.current_period_end = iso(data.current_period_end)
  if ('trial_end' in data) out.trial_end = iso(data.trial_end)
  out.updated_at = new Date().toISOString()
  return out
}

// =============================================================================
// SUBSCRIPTIONS — owner-scoped (USER context)
// =============================================================================

/** Returns the caller's subscription, or null when they have none. */
export async function getSubscription(
  userId: string
): Promise<SubscriptionRow | null> {
  const db = getDb()
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.user_id, userId))
    .limit(1)
  return row ? serialize<SubscriptionRow>(row) : null
}

/**
 * Upsert the caller's single subscription row (keyed by `user_id`).
 * Mirrors the Supabase `.upsert({...}, { onConflict: 'user_id' })`.
 */
export async function upsertSubscriptionForUser(
  userId: string,
  data: SubscriptionWriteInput
): Promise<SubscriptionRow> {
  const db = getDb()
  const write = toWrite(data)
  const [row] = await db
    .insert(subscriptions)
    .values({ user_id: userId, ...write })
    .onConflictDoUpdate({ target: subscriptions.user_id, set: write })
    .returning()
  return serialize<SubscriptionRow>(row)
}

/**
 * Update the caller's subscription. Returns the updated row, or null if the
 * caller has no subscription (no row is created).
 */
export async function updateSubscriptionForUser(
  userId: string,
  data: SubscriptionWriteInput
): Promise<SubscriptionRow | null> {
  const db = getDb()
  const [row] = await db
    .update(subscriptions)
    .set(toWrite(data))
    .where(eq(subscriptions.user_id, userId))
    .returning()
  return row ? serialize<SubscriptionRow>(row) : null
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
  const db = getDb()
  const [sub] = await db
    .select({
      plan: subscriptions.plan,
      status: subscriptions.status,
      current_period_end: subscriptions.current_period_end,
    })
    .from(subscriptions)
    .where(eq(subscriptions.user_id, userId))
    .limit(1)

  if (!sub) return 'free'

  const isActiveStatus = sub.status === 'active' || sub.status === 'trialing'
  const notExpired =
    sub.current_period_end == null ||
    new Date(sub.current_period_end).getTime() > Date.now()

  if (isActiveStatus && notExpired) {
    return sub.plan as SubscriptionPlan
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
  const db = getDb()
  const rows = await db
    .update(subscriptions)
    .set(toWrite(data))
    .where(eq(subscriptions.paddle_customer_id, customerId))
    .returning({ id: subscriptions.id })
  return rows.length > 0
}

/**
 * SYSTEM context. Update the subscription matching a Paddle subscription id.
 * Returns true if a row was matched.
 */
export async function updateByPaddleSubscriptionId(
  subscriptionId: string,
  data: SubscriptionWriteInput
): Promise<boolean> {
  const db = getDb()
  const rows = await db
    .update(subscriptions)
    .set(toWrite(data))
    .where(eq(subscriptions.paddle_subscription_id, subscriptionId))
    .returning({ id: subscriptions.id })
  return rows.length > 0
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
  const db = getDb()
  const write = toWrite(data)
  await db
    .insert(subscriptions)
    .values({ user_id: userId, ...write })
    .onConflictDoUpdate({ target: subscriptions.user_id, set: write })
}

// =============================================================================
// USAGE — owner-scoped (USER context)
// =============================================================================

/** Returns the usage row for `{ user_id, period }`, or null if none exists. */
export async function getUsage(
  userId: string,
  period: string
): Promise<UsageRow | null> {
  const db = getDb()
  const [row] = await db
    .select()
    .from(usage)
    .where(sql`${usage.user_id} = ${userId} and ${usage.period} = ${period}`)
    .limit(1)
  return row ? serialize<UsageRow>(row) : null
}

const USAGE_COLUMNS = {
  profiles_count: usage.profiles_count,
  ai_interpretations_used: usage.ai_interpretations_used,
  boards_count: usage.boards_count,
  exports_count: usage.exports_count,
} as const

/**
 * Port of the Postgres `increment_usage(p_user_id, p_period, p_metric, p_amount)`
 * RPC. Upserts the `{ user_id, period }` row and increments the named metric
 * column by `amount`. The other metric columns default to 0 on insert.
 */
export async function incrementUsage(
  userId: string,
  period: string,
  metric: UsageMetric,
  amount = 1
): Promise<void> {
  const db = getDb()
  const column = USAGE_COLUMNS[metric]
  await db
    .insert(usage)
    .values({ user_id: userId, period, [metric]: amount })
    .onConflictDoUpdate({
      target: [usage.user_id, usage.period],
      set: {
        [metric]: sql`${column} + ${amount}`,
        updated_at: new Date().toISOString(),
      },
    })
}
