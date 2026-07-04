import { and, eq, gte, lt, sql } from 'drizzle-orm'
import { getDb } from '@/lib/db/client'
import { email_send_log, newsletter_subscribers } from '@/lib/db/schema'
import { serialize, serializeMany } from '@/lib/db/serialize'

/**
 * Newsletter / email-send-log repository.
 *
 * Unlike the people domain, these are SYSTEM / PUBLIC operations and are NOT
 * scoped to a user. Newsletter signup is public (anyone can subscribe by
 * email) and the daily-kin cron — authorized by CRON_SECRET in its route —
 * legitimately operates across ALL subscribers. So there is no `userId` first
 * argument and no owner filter here; tenant scoping does not apply to this
 * domain. Authorization lives in the callers (public subscribe route, cron
 * bearer check).
 */

/** Plain (serialized) subscriber shape returned to callers. */
export interface SubscriberRecord {
  id: string
  email: string
  subscribed_at: string | null
  confirmed: boolean
  confirmed_at: string | null
  unsubscribed_at: string | null
  preferences: Record<string, unknown>
  created_at: string
  updated_at: string
}

/** Minimal subscriber projection used by the cron loop. */
export interface SubscriberRef {
  id: string
  email: string
}

export interface EmailSendLogInput {
  subscriber_id?: string | null
  email_type: string
  subject?: string | null
  resend_id?: string | null
  status?: string
  error_message?: string | null
}

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

/** Look up a single subscriber by (normalized) email. Null if none. */
export async function findByEmail(email: string): Promise<SubscriberRecord | null> {
  const db = getDb()
  const [row] = await db
    .select()
    .from(newsletter_subscribers)
    .where(eq(newsletter_subscribers.email, normalizeEmail(email)))
    .limit(1)
  return row ? serialize<SubscriberRecord>(row) : null
}

/**
 * Subscribe (or re-subscribe) an email. Upserts on the unique `email` index so
 * concurrent signups never raise a duplicate-key error and a previously
 * unsubscribed address is reactivated.
 *
 * Returns `{ subscriber, created }` where `created` is true when this call
 * inserted a brand-new subscriber (used by callers to decide whether to send a
 * welcome email).
 */
export async function subscribe(
  email: string
): Promise<{ subscriber: SubscriberRecord; created: boolean }> {
  const db = getDb()
  const normalized = normalizeEmail(email)
  const now = new Date().toISOString()

  const [existing] = await db
    .select({ id: newsletter_subscribers.id })
    .from(newsletter_subscribers)
    .where(eq(newsletter_subscribers.email, normalized))
    .limit(1)
  const created = !existing

  // Always (re)activate: clears unsubscribed_at and refreshes subscribed_at.
  // Preferences only seed on first insert; the conflict path doesn't touch them.
  const [row] = await db
    .insert(newsletter_subscribers)
    .values({
      email: normalized,
      unsubscribed_at: null,
      subscribed_at: now,
      confirmed: true,
      confirmed_at: now,
      preferences: { daily_kin: true },
    })
    .onConflictDoUpdate({
      target: newsletter_subscribers.email,
      set: {
        unsubscribed_at: null,
        subscribed_at: now,
        confirmed: true,
        confirmed_at: now,
        updated_at: now,
      },
    })
    .returning()

  return { subscriber: serialize<SubscriberRecord>(row), created }
}

/** Mark a subscriber confirmed (double opt-in path). Null if not found. */
export async function confirm(email: string): Promise<SubscriberRecord | null> {
  const db = getDb()
  const now = new Date().toISOString()
  const [row] = await db
    .update(newsletter_subscribers)
    .set({ confirmed: true, confirmed_at: now, updated_at: now })
    .where(eq(newsletter_subscribers.email, normalizeEmail(email)))
    .returning()
  return row ? serialize<SubscriberRecord>(row) : null
}

/**
 * Unsubscribe an email. Idempotent — updating a non-existent email simply
 * affects zero rows without erroring. Returns true if a row was matched.
 */
export async function unsubscribe(email: string): Promise<boolean> {
  const db = getDb()
  const now = new Date().toISOString()
  const rows = await db
    .update(newsletter_subscribers)
    .set({ unsubscribed_at: now, updated_at: now })
    .where(eq(newsletter_subscribers.email, normalizeEmail(email)))
    .returning({ id: newsletter_subscribers.id })
  return rows.length > 0
}

/** Hard-delete a subscriber by email. Returns true if one was removed. */
export async function deleteByEmail(email: string): Promise<boolean> {
  const db = getDb()
  const rows = await db
    .delete(newsletter_subscribers)
    .where(eq(newsletter_subscribers.email, normalizeEmail(email)))
    .returning({ id: newsletter_subscribers.id })
  return rows.length > 0
}

/**
 * All active subscribers opted in to daily kin: confirmed, not unsubscribed,
 * and `preferences.daily_kin === true` (JSONB path query).
 */
export async function listActiveSubscribers(): Promise<SubscriberRecord[]> {
  const db = getDb()
  const rows = await db
    .select()
    .from(newsletter_subscribers)
    .where(
      and(
        eq(newsletter_subscribers.confirmed, true),
        sql`${newsletter_subscribers.unsubscribed_at} is null`,
        sql`${newsletter_subscribers.preferences}->>'daily_kin' = 'true'`
      )
    )
  return serializeMany<SubscriberRecord>(rows)
}

/**
 * Subscribers eligible for the daily-kin cron: confirmed and not unsubscribed.
 * Returns only `{ id, email }`.
 */
export async function listSubscribersForCron(): Promise<SubscriberRef[]> {
  const db = getDb()
  const rows = await db
    .select({ id: newsletter_subscribers.id, email: newsletter_subscribers.email })
    .from(newsletter_subscribers)
    .where(
      and(
        eq(newsletter_subscribers.confirmed, true),
        sql`${newsletter_subscribers.unsubscribed_at} is null`
      )
    )
  return rows
}

/** Append a row to email_send_log. Best-effort dedup audit trail. */
export async function logEmailSend(input: EmailSendLogInput): Promise<void> {
  const db = getDb()
  await db.insert(email_send_log).values({
    subscriber_id: input.subscriber_id ?? null,
    email_type: input.email_type,
    subject: input.subject ?? null,
    resend_id: input.resend_id ?? null,
    status: input.status ?? 'sent',
    error_message: input.error_message ?? null,
  })
}

/**
 * Dedup guard: has an email of `email_type` already been logged as `sent` to
 * this subscriber within the current UTC day? Prevents the cron from
 * double-sending if it is (re)triggered the same day.
 */
export async function wasEmailSentToday(
  subscriberId: string,
  emailType: string,
  now: Date = new Date()
): Promise<boolean> {
  const db = getDb()
  const startOfDay = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  )
  const startOfNextDay = new Date(startOfDay)
  startOfNextDay.setUTCDate(startOfNextDay.getUTCDate() + 1)

  const [row] = await db
    .select({ id: email_send_log.id })
    .from(email_send_log)
    .where(
      and(
        eq(email_send_log.subscriber_id, subscriberId),
        eq(email_send_log.email_type, emailType),
        eq(email_send_log.status, 'sent'),
        gte(email_send_log.sent_at, startOfDay.toISOString()),
        lt(email_send_log.sent_at, startOfNextDay.toISOString())
      )
    )
    .limit(1)
  return Boolean(row)
}
