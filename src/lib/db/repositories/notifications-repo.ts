import { and, eq, gte, inArray, lt, sql } from 'drizzle-orm'

import { getDb } from '@/lib/db/client'
import {
  email_send_log,
  notification_settings,
  profiles,
  users,
} from '@/lib/db/schema'
import { serialize, serializeMany } from '@/lib/db/serialize'

/**
 * Notifications domain repository. Replaces the Supabase queries that used to
 * read `notification_settings`, `profiles`, and `email_send_log`.
 *
 * Tenant scoping lives here now that Postgres RLS is gone:
 *  - Owner-scoped functions take `userId` (from requireUserId()) as their first
 *    arg and filter `notification_settings`/`profiles` by `user_id = userId`.
 *    A user can only read/write their OWN settings — never trust an id from the
 *    request body or query string.
 *  - System-scoped functions are clearly named (`listAll...`) and read across
 *    every user. They are ONLY for the CRON_SECRET-authorized cron route.
 */

// ---------------------------------------------------------------------------
// Settings persistence shape (snake_case, mirrors the Postgres row)
// ---------------------------------------------------------------------------

export type MinIntensity = 'low' | 'medium' | 'high' | 'peak'

export interface NotificationSettingsData {
  enabled: boolean
  channels: string[]
  daily_digest: boolean
  daily_digest_time: string | null
  weekly_digest: boolean
  weekly_digest_day: number | null
  advance_notice: number
  systems: string[]
  min_intensity: MinIntensity
}

export type SerializedNotificationSettings = NotificationSettingsData & {
  id: string
  user_id: string
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Owner-scoped operations (USER context)
// ---------------------------------------------------------------------------

/**
 * Read the notification settings owned by `userId`, or null if none exist yet.
 * Filters by `user_id = userId` — the user can only read their own settings.
 */
export async function getSettings(
  userId: string
): Promise<SerializedNotificationSettings | null> {
  const db = getDb()
  const rows = await db
    .select()
    .from(notification_settings)
    .where(eq(notification_settings.user_id, userId))
    .limit(1)
  if (!rows[0]) return null
  return serialize<SerializedNotificationSettings>(rows[0])
}

/**
 * Create or update the notification settings owned by `userId`.
 *
 * Replaces the Mongo `findOneAndUpdate(..., { upsert: true })` keyed on
 * `user_id` with `insert().onConflictDoUpdate` on the `user_id` unique index.
 * The upsert key is the owner id, so a user can only mutate their own row.
 * Returns the persisted, serialized settings.
 */
export async function upsertSettings(
  userId: string,
  data: NotificationSettingsData
): Promise<SerializedNotificationSettings> {
  const db = getDb()

  // Nullable inputs fall back to the column defaults (the columns are NOT
  // NULL), mirroring the old schema defaults applied on insert.
  const values = {
    user_id: userId,
    enabled: data.enabled,
    channels: data.channels,
    daily_digest: data.daily_digest,
    daily_digest_time: data.daily_digest_time ?? '08:00',
    weekly_digest: data.weekly_digest,
    weekly_digest_day: data.weekly_digest_day ?? 0,
    advance_notice: data.advance_notice,
    systems: data.systems,
    min_intensity: data.min_intensity,
  }

  const rows = await db
    .insert(notification_settings)
    .values(values)
    .onConflictDoUpdate({
      target: notification_settings.user_id,
      set: { ...values, updated_at: new Date().toISOString() },
    })
    .returning()

  return serialize<SerializedNotificationSettings>(rows[0])
}

/**
 * Read the profile owned by `userId`, or null if none exists. Filters by
 * `user_id = userId`. Email is NOT stored on the profile — it lives on the
 * auth `users` table — so callers that need an address combine this with
 * the session user's email.
 */
export async function getProfile(userId: string) {
  const db = getDb()
  const rows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.user_id, userId))
    .limit(1)
  if (!rows[0]) return null
  return serialize(rows[0])
}

// ---------------------------------------------------------------------------
// System-scoped operations (CRON context only — read across ALL users)
// ---------------------------------------------------------------------------

export interface DigestRecipient {
  userId: string
  email: string
  name: string
  birthDate: string | null
  /** The user's chosen channels — the caller sends email only if it includes 'email'. */
  channels: string[]
  /** 'HH:mm' the user picked, read in their own timezone (#65). */
  digestTime: string
  /** IANA timezone from the profile; 'UTC' when unset. */
  timezone: string
}

/**
 * SYSTEM-SCOPED. List every user who has email daily-digest notifications
 * enabled, joined to the data needed to send them (email + name from the auth
 * `users` table, birth date from `profiles`).
 *
 * Replaces the Supabase cross-user query in `getUsersForDailyDigest`. There is
 * NO owner filter by design — this is the legitimate all-tenant read used only
 * by the CRON_SECRET-authorized cron route. Do NOT call from a user route.
 */
export async function listAllEnabledDigestRecipients(): Promise<DigestRecipient[]> {
  const db = getDb()

  // Every enabled daily-digest user, regardless of channel. The caller sends
  // email only to those whose channels include 'email'; push is gated instead
  // on having a registered device token — so a push-only mobile user (channels
  // ['in-app']) still gets their daily notification.
  const settings = await db
    .select({
      user_id: notification_settings.user_id,
      channels: notification_settings.channels,
      daily_digest_time: notification_settings.daily_digest_time,
    })
    .from(notification_settings)
    .where(
      and(
        eq(notification_settings.enabled, true),
        eq(notification_settings.daily_digest, true)
      )
    )

  const userIds = settings.map((s) => s.user_id)
  if (userIds.length === 0) return []

  const channelsById = new Map<string, string[]>()
  const digestTimeById = new Map<string, string>()
  for (const s of settings) {
    channelsById.set(s.user_id, (s.channels as string[]) ?? [])
    digestTimeById.set(s.user_id, s.daily_digest_time ?? '08:00')
  }

  // Email + display name come from the auth `users` table; birth date comes
  // from the app `profiles` table. Fetch both, keyed by user id.
  const [userRows, profileRows] = await Promise.all([
    db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(inArray(users.id, userIds)),
    db
      .select({
        user_id: profiles.user_id,
        display_name: profiles.display_name,
        birth_date: profiles.birth_date,
        timezone: profiles.timezone,
      })
      .from(profiles)
      .where(inArray(profiles.user_id, userIds)),
  ])

  const emailById = new Map<string, { email?: string; name?: string }>()
  for (const u of userRows) {
    emailById.set(u.id, { email: u.email, name: u.name ?? undefined })
  }
  const profileById = new Map<
    string,
    { display_name?: string; birth_date?: string | null; timezone?: string | null }
  >()
  for (const p of profileRows) {
    profileById.set(p.user_id, {
      display_name: p.display_name,
      birth_date: p.birth_date ?? null,
      timezone: p.timezone ?? null,
    })
  }

  const recipients: DigestRecipient[] = []
  for (const userId of userIds) {
    const authUser = emailById.get(userId)
    const email = authUser?.email
    if (!email) continue // can't send without an address
    const profile = profileById.get(userId)
    recipients.push({
      userId,
      email,
      name: profile?.display_name || authUser?.name || 'Friend',
      birthDate: profile?.birth_date ?? null,
      channels: channelsById.get(userId) ?? [],
      digestTime: digestTimeById.get(userId) ?? '08:00',
      timezone: profile?.timezone || 'UTC',
    })
  }

  return recipients
}

/**
 * SYSTEM-SCOPED. List every enabled notification_settings row whose digest hour
 * matches `hourPrefix` (e.g. '07'), used by the cron to decide whether there is
 * any work this hour. Plain text comparison on the 'HH:mm' string, same window
 * semantics as the `.gte/.lt` daily_digest_time query.
 */
export async function listAllEnabledSettingsForHour(hourPrefix: string) {
  const db = getDb()
  const next = String(Number(hourPrefix) + 1).padStart(2, '0')
  const settings = await db
    .select({ id: notification_settings.id, user_id: notification_settings.user_id })
    .from(notification_settings)
    .where(
      and(
        eq(notification_settings.enabled, true),
        eq(notification_settings.daily_digest, true),
        // Any channel: the hour-gate decides whether to run the cron at all;
        // per-recipient email vs push is resolved downstream.
        gte(notification_settings.daily_digest_time, `${hourPrefix}:00`),
        lt(notification_settings.daily_digest_time, `${next}:00`)
      )
    )
  return serializeMany(settings)
}

// ---------------------------------------------------------------------------
// Email send log (dedup / audit)
// ---------------------------------------------------------------------------

export interface EmailSendLogInput {
  email_type: string
  subject?: string | null
  status?: string
  resend_id?: string | null
  error_message?: string | null
}

/**
 * Append a row to `email_send_log`. Replaces the Supabase
 * `.from('email_send_log').insert(...)`. Best-effort: logging must never break
 * the send flow, so failures are swallowed and reported via the return flag.
 */
export async function logEmailSend(
  entry: EmailSendLogInput
): Promise<{ logged: boolean }> {
  try {
    const db = getDb()
    await db.insert(email_send_log).values({
      email_type: entry.email_type,
      subject: entry.subject ?? null,
      status: entry.status ?? 'sent',
      resend_id: entry.resend_id ?? null,
      error_message: entry.error_message ?? null,
    })
    return { logged: true }
  } catch (error) {
    console.error('Failed to write email_send_log:', error)
    return { logged: false }
  }
}
