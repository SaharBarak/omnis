import { connectMongo } from '@/lib/db/connection'
import { NewsletterSubscriber, EmailSendLog } from '@/lib/db/models'
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
 *
 * Replaces the former Supabase `newsletter_subscribers` / `email_send_log`
 * tables (service-role client) with Mongoose via connectMongo().
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
  await connectMongo()
  const doc = await NewsletterSubscriber.findOne({ email: normalizeEmail(email) }).lean()
  return doc ? serialize<SubscriberRecord>(doc) : null
}

/**
 * Subscribe (or re-subscribe) an email. Upserts on the unique `email` index so
 * concurrent signups never raise a duplicate-key error and a previously
 * unsubscribed address is reactivated.
 *
 * Returns `{ subscriber, created }` where `created` is true when this call
 * inserted a brand-new subscriber (used by callers to decide whether to send a
 * welcome email).
 *
 * Replaces the Supabase select-then-insert/update branch.
 */
export async function subscribe(
  email: string
): Promise<{ subscriber: SubscriberRecord; created: boolean }> {
  await connectMongo()
  const normalized = normalizeEmail(email)
  const now = new Date()

  const existing = await NewsletterSubscriber.findOne({ email: normalized }).lean()
  const created = !existing

  const doc = await NewsletterSubscriber.findOneAndUpdate(
    { email: normalized },
    {
      // Always (re)activate: clears unsubscribed_at and refreshes subscribed_at.
      $set: {
        email: normalized,
        unsubscribed_at: null,
        subscribed_at: now,
        confirmed: true,
        confirmed_at: now,
      },
      // Only set preferences on first insert; don't clobber existing prefs.
      $setOnInsert: {
        preferences: { daily_kin: true },
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean()

  return { subscriber: serialize<SubscriberRecord>(doc), created }
}

/** Mark a subscriber confirmed (double opt-in path). Null if not found. */
export async function confirm(email: string): Promise<SubscriberRecord | null> {
  await connectMongo()
  const doc = await NewsletterSubscriber.findOneAndUpdate(
    { email: normalizeEmail(email) },
    { $set: { confirmed: true, confirmed_at: new Date() } },
    { new: true }
  ).lean()
  return doc ? serialize<SubscriberRecord>(doc) : null
}

/**
 * Unsubscribe an email. Idempotent — matches the old Supabase semantics where
 * updating a non-existent email simply affected zero rows without erroring.
 * Returns true if a subscriber row was matched.
 */
export async function unsubscribe(email: string): Promise<boolean> {
  await connectMongo()
  const res = await NewsletterSubscriber.updateOne(
    { email: normalizeEmail(email) },
    { $set: { unsubscribed_at: new Date() } }
  )
  return res.matchedCount > 0
}

/** Hard-delete a subscriber by email. Returns true if one was removed. */
export async function deleteByEmail(email: string): Promise<boolean> {
  await connectMongo()
  const res = await NewsletterSubscriber.deleteOne({ email: normalizeEmail(email) })
  return res.deletedCount > 0
}

/**
 * All active subscribers opted in to daily kin: confirmed, not unsubscribed,
 * and `preferences.daily_kin === true`. Replaces the Supabase
 * `.eq('confirmed', true).is('unsubscribed_at', null).contains('preferences', { daily_kin: true })`.
 */
export async function listActiveSubscribers(): Promise<SubscriberRecord[]> {
  await connectMongo()
  const docs = await NewsletterSubscriber.find({
    confirmed: true,
    unsubscribed_at: null,
    'preferences.daily_kin': true,
  }).lean()
  return serializeMany<SubscriberRecord>(docs)
}

/**
 * Subscribers eligible for the daily-kin cron: confirmed and not unsubscribed.
 * Returns only `{ id, email }`. Mirrors the cron's old
 * `.select('id, email').eq('confirmed', true).is('unsubscribed_at', null)`.
 */
export async function listSubscribersForCron(): Promise<SubscriberRef[]> {
  await connectMongo()
  const docs = await NewsletterSubscriber.find({
    confirmed: true,
    unsubscribed_at: null,
  })
    .select({ _id: 1, email: 1 })
    .lean()
  return docs.map((d) => ({ id: String(d._id), email: d.email }))
}

/** Append a row to email_send_log. Best-effort dedup audit trail. */
export async function logEmailSend(input: EmailSendLogInput): Promise<void> {
  await connectMongo()
  await EmailSendLog.create({
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
 * double-sending if it is (re)triggered the same day. There is no equivalent
 * in the old Supabase code — the log was write-only — so this is a new
 * idempotency check enabled by querying the same log.
 */
export async function wasEmailSentToday(
  subscriberId: string,
  emailType: string,
  now: Date = new Date()
): Promise<boolean> {
  await connectMongo()
  const startOfDay = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  )
  const startOfNextDay = new Date(startOfDay)
  startOfNextDay.setUTCDate(startOfNextDay.getUTCDate() + 1)

  const existing = await EmailSendLog.exists({
    subscriber_id: subscriberId,
    email_type: emailType,
    status: 'sent',
    sent_at: { $gte: startOfDay, $lt: startOfNextDay },
  })
  return existing !== null
}
