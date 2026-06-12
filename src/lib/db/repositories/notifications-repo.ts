import { connectMongo } from '@/lib/db/connection'
import { NotificationSettings, Profile, EmailSendLog } from '@/lib/db/models'
import type { INotificationSettings } from '@/lib/db/models/notification_settings'
import { serialize, serializeMany } from '@/lib/db/serialize'
import { mongoDb } from '@/lib/db/mongo-client'

/**
 * Notifications domain repository. Replaces the Supabase queries that used to
 * read `notification_settings`, `profiles`, and `email_send_log`.
 *
 * Tenant scoping lives here now that Postgres RLS is gone:
 *  - Owner-scoped functions take `userId` (from requireUserId()) as their first
 *    arg and filter `notification_settings`/`profiles` by `user_id === userId`.
 *    A user can only read/write their OWN settings — never trust an id from the
 *    request body or query string.
 *  - System-scoped functions are clearly named (`listAll...`) and read across
 *    every user. They are ONLY for the CRON_SECRET-authorized cron route.
 */

// ---------------------------------------------------------------------------
// Settings persistence shape (snake_case, mirrors the Mongo document / old row)
// ---------------------------------------------------------------------------

export interface NotificationSettingsData {
  enabled: boolean
  channels: string[]
  daily_digest: boolean
  daily_digest_time: string | null
  weekly_digest: boolean
  weekly_digest_day: number | null
  advance_notice: number
  systems: string[]
  min_intensity: INotificationSettings['min_intensity']
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
 * Filters by `user_id === userId` — the user can only read their own settings.
 */
export async function getSettings(
  userId: string
): Promise<SerializedNotificationSettings | null> {
  await connectMongo()
  const doc = await NotificationSettings.findOne({ user_id: userId }).lean()
  if (!doc) return null
  return serialize<SerializedNotificationSettings>(doc)
}

/**
 * Create or update the notification settings owned by `userId`.
 *
 * Replaces the Supabase `.from('notification_settings').upsert(...)` keyed on
 * `user_id`. The upsert filter is the owner id, so a user can only mutate their
 * own row. Returns the persisted, serialized settings.
 */
export async function upsertSettings(
  userId: string,
  data: NotificationSettingsData
): Promise<SerializedNotificationSettings> {
  await connectMongo()
  const doc = await NotificationSettings.findOneAndUpdate(
    { user_id: userId },
    { $set: { ...data, user_id: userId } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean()
  return serialize<SerializedNotificationSettings>(doc)
}

/**
 * Read the profile owned by `userId`, or null if none exists. Filters by
 * `user_id === userId`. Email is NOT stored on the profile — it lives on the
 * Better Auth user record — so callers that need an address combine this with
 * the session user's email.
 */
export async function getProfile(userId: string) {
  await connectMongo()
  const doc = await Profile.findOne({ user_id: userId }).lean()
  if (!doc) return null
  return serialize(doc)
}

// ---------------------------------------------------------------------------
// System-scoped operations (CRON context only — read across ALL users)
// ---------------------------------------------------------------------------

export interface DigestRecipient {
  userId: string
  email: string
  name: string
  birthDate: string | null
}

/**
 * SYSTEM-SCOPED. List every user who has email daily-digest notifications
 * enabled, joined to the data needed to send them (email + name from the Better
 * Auth `user` collection, birth date from `profiles`).
 *
 * Replaces the Supabase cross-user query in `getUsersForDailyDigest`. There is
 * NO owner filter by design — this is the legitimate all-tenant read used only
 * by the CRON_SECRET-authorized cron route. Do NOT call from a user route.
 */
export async function listAllEnabledDigestRecipients(): Promise<DigestRecipient[]> {
  await connectMongo()

  const settings = await NotificationSettings.find({
    enabled: true,
    daily_digest: true,
    channels: 'email',
  })
    .select('user_id')
    .lean()

  const userIds = settings.map((s) => s.user_id)
  if (userIds.length === 0) return []

  // Email + display name come from the Better Auth `user` collection; birth
  // date comes from the app `profiles` collection. Fetch both, keyed by user id.
  const [users, profiles] = await Promise.all([
    mongoDb
      .collection('user')
      .find({ id: { $in: userIds } })
      .project<{ id: string; email?: string; name?: string }>({
        id: 1,
        email: 1,
        name: 1,
      })
      .toArray(),
    Profile.find({ user_id: { $in: userIds } })
      .select('user_id display_name birth_date')
      .lean(),
  ])

  const emailById = new Map<string, { email?: string; name?: string }>()
  for (const u of users) {
    emailById.set(u.id, { email: u.email, name: u.name })
  }
  const profileById = new Map<string, { display_name?: string; birth_date?: string | null }>()
  for (const p of profiles) {
    profileById.set(p.user_id, {
      display_name: p.display_name,
      birth_date: p.birth_date ?? null,
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
    })
  }

  return recipients
}

/**
 * SYSTEM-SCOPED. List every enabled notification_settings row whose digest hour
 * matches `hourPrefix` (e.g. '07'), used by the cron to decide whether there is
 * any work this hour. Replaces the `.gte/.lt` daily_digest_time window query.
 */
export async function listAllEnabledSettingsForHour(hourPrefix: string) {
  await connectMongo()
  const next = String(Number(hourPrefix) + 1).padStart(2, '0')
  const settings = await NotificationSettings.find({
    enabled: true,
    daily_digest: true,
    channels: 'email',
    daily_digest_time: { $gte: `${hourPrefix}:00`, $lt: `${next}:00` },
  })
    .select('user_id')
    .lean()
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
    await connectMongo()
    await EmailSendLog.create({
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
