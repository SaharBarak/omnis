import type {
  NotificationSettings,
  NotificationChannel,
  PredictionSystem,
  PredictionIntensity,
  PredictionEvent,
  DailyPrediction,
} from '@pleiad/engine/types/prediction'
import { getDailyPrediction, getPersonalDailyPrediction, COLOR_HEX } from '@pleiad/engine/services/predictions'
import {
  getDailyAstroPhenomena,
  type AstroPhenomena,
} from '@pleiad/engine/services/astro-phenomena'
import { getTodayAcrossSystems, type TodayAcrossSystems } from '@/lib/today-board'
import {
  resolveSystemPreferences,
  type SystemKey,
} from '@/lib/system-preferences'
import {
  getSettings,
  upsertSettings,
  listAllEnabledDigestRecipients,
  type NotificationSettingsData,
  type SerializedNotificationSettings,
} from '@/lib/db/repositories/notifications-repo'
import { sendTransactionalEmail, esc } from '@/lib/email'
import {
  deletePushTokens,
  listPushTokensForUsers,
} from '@/lib/db/repositories/push-tokens-repo'
import { sendExpoPush, type PushMessage } from '@/lib/services/push'

/** Where recipients opt out of these notification emails. */
const MANAGE_NOTIFICATIONS_URL = 'https://pleiad.io/app/settings/notifications'
const MANAGE_LINK = { url: MANAGE_NOTIFICATIONS_URL, label: 'Manage notifications' }

// ============================================================================
// Notification Settings (data layer: notifications-repo / MongoDB)
// ============================================================================

/** Map the persisted snake_case settings document to the camelCase API shape. */
function toNotificationSettings(
  row: SerializedNotificationSettings
): NotificationSettings {
  return {
    userId: row.user_id,
    enabled: row.enabled,
    channels: row.channels as NotificationChannel[],
    dailyDigest: row.daily_digest,
    dailyDigestTime: row.daily_digest_time ?? '08:00',
    weeklyDigest: row.weekly_digest,
    weeklyDigestDay: row.weekly_digest_day ?? 0,
    advanceNotice: row.advance_notice,
    systems: row.systems as PredictionSystem[],
    minIntensity: row.min_intensity as PredictionIntensity,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** Map the camelCase API shape to the snake_case persistence shape. */
function toSettingsData(settings: NotificationSettings): NotificationSettingsData {
  return {
    enabled: settings.enabled,
    channels: settings.channels,
    daily_digest: settings.dailyDigest,
    daily_digest_time: settings.dailyDigestTime,
    weekly_digest: settings.weeklyDigest,
    weekly_digest_day: settings.weeklyDigestDay,
    advance_notice: settings.advanceNotice,
    systems: settings.systems,
    min_intensity: settings.minIntensity,
  }
}

/**
 * Get notification settings for a user.
 *
 * Owner-scoped: the repository filters `notification_settings` by `user_id`, so
 * callers MUST pass the id from requireUserId(), never client input.
 */
export async function getNotificationSettings(
  userId: string
): Promise<NotificationSettings | null> {
  try {
    const row = await getSettings(userId)
    if (!row) return null
    return toNotificationSettings(row)
  } catch (error) {
    console.error('Error fetching notification settings:', error)
    return null
  }
}

/**
 * Create or update notification settings for a user.
 *
 * Owner-scoped: the upsert is keyed on `settings.userId`, which the route
 * derives from requireUserId().
 */
export async function upsertNotificationSettings(
  settings: NotificationSettings
): Promise<{ success: boolean; error?: string }> {
  try {
    await upsertSettings(settings.userId, toSettingsData(settings))
    return { success: true }
  } catch (error) {
    console.error('Error upserting notification settings:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================================
// Email Notifications
// ============================================================================

/**
 * Send daily digest email to a user. `board` is today across every system
 * (computed once per cron run); `systems` is the recipient's preferred-systems
 * map — board lines they've turned off stay out of their brief.
 */
export async function sendDailyDigestEmail(
  email: string,
  userName: string,
  prediction: DailyPrediction,
  events: PredictionEvent[],
  astro: AstroPhenomena,
  board: TodayAcrossSystems,
  systems: Record<SystemKey, boolean>
): Promise<{ success: boolean; id?: string }> {
  const result = await sendTransactionalEmail({
    to: email,
    subject: `Daily Forecast: ${prediction.toneName} ${prediction.sealName} (Kin ${prediction.kin})`,
    preheader: `${prediction.toneName} ${prediction.sealName} · ${astro.summary}`,
    bodyHtml: dailyDigestBody(userName, prediction, events, astro, board, systems),
    footerText: 'Daily Forecast from Pleiad',
    footerLink: MANAGE_LINK,
  })
  return { success: result.ok, id: result.id }
}

/**
 * Send event notification email
 */
export async function sendEventNotificationEmail(
  email: string,
  userName: string,
  event: PredictionEvent
): Promise<{ success: boolean; id?: string }> {
  const result = await sendTransactionalEmail({
    to: email,
    subject: `Upcoming: ${event.title}`,
    preheader: event.description,
    bodyHtml: eventBody(userName, event),
    footerText: 'Event notification from Pleiad',
    footerLink: MANAGE_LINK,
  })
  return { success: result.ok, id: result.id }
}

/**
 * Send test notification email
 */
export async function sendTestNotificationEmail(
  email: string,
  userName: string
): Promise<{ success: boolean; id?: string }> {
  const today = new Date().toISOString().split('T')[0]
  const prediction = getDailyPrediction(today)

  const result = await sendTransactionalEmail({
    to: email,
    subject: 'Test: Pleiad Notification',
    preheader: 'Your Pleiad notifications are working.',
    title: 'Test notification',
    bodyHtml: testBody(userName, prediction),
    footerText: 'This is a test notification from Pleiad.',
  })
  return { success: result.ok, id: result.id }
}

// ============================================================================
// Process Notifications Queue
// ============================================================================

/**
 * Get users who need notifications for today.
 *
 * SYSTEM-SCOPED: reads `notification_settings` and the Better Auth `user`
 * collection across ALL users. Used only by the CRON_SECRET-authorized cron
 * route. The cross-tenant read lives behind a clearly-named repo function.
 */
export async function getUsersForDailyDigest(): Promise<
  Array<{
    userId: string
    email: string
    name: string
    birthDate: string | null
    channels: string[]
    digestTime: string
    timezone: string
    preferences: unknown
  }>
> {
  try {
    return await listAllEnabledDigestRecipients()
  } catch (error) {
    console.error('Error fetching daily digest recipients:', error)
    return []
  }
}

/** The hour (0-23) it currently is in `timezone`; UTC when the zone is bad. */
function localHour(now: Date, timezone: string): number {
  try {
    const hour = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: 'numeric',
      hourCycle: 'h23',
    }).format(now)
    const parsed = Number(hour)
    return Number.isFinite(parsed) ? parsed : now.getUTCHours()
  } catch {
    return now.getUTCHours()
  }
}

/**
 * Process and send daily digest notifications.
 *
 * Runs hourly (#65): each run serves only the recipients whose chosen
 * digest hour, read in THEIR OWN timezone, is the current hour — so an
 * "08:00" in Tel Aviv fires at 08:00 Tel Aviv time, not 08:00 UTC.
 */
export async function processDailyDigestNotifications(now: Date = new Date()): Promise<{
  sent: number
  failed: number
}> {
  const allUsers = await getUsersForDailyDigest()
  const users = allUsers.filter(
    (u) => localHour(now, u.timezone) === Number(u.digestTime.slice(0, 2))
  )
  const today = now.toISOString().split('T')[0]
  // Today's sky + the cross-system board, computed once for the whole run
  // (identical for every recipient; only the section filter is personal).
  const astro = getDailyAstroPhenomena(today)
  const board = getTodayAcrossSystems(now)

  let sent = 0
  let failed = 0
  const pushDrafts: Array<{ userId: string; title: string; body: string }> = []

  for (const user of users) {
    try {
      let prediction: DailyPrediction

      if (user.birthDate) {
        prediction = getPersonalDailyPrediction(today, user.birthDate, user.userId)
      } else {
        prediction = getDailyPrediction(today)
      }

      // Email only for users who chose the email channel; push (below) reaches
      // anyone with a device token, so mobile-only users still get notified.
      if (user.channels.includes('email')) {
        const result = await sendDailyDigestEmail(
          user.email,
          user.name,
          prediction,
          prediction.events,
          astro,
          board,
          resolveSystemPreferences(user.preferences)
        )
        if (result.success) sent++
        else failed++
      }

      pushDrafts.push({
        userId: user.userId,
        title: `Kin ${prediction.kin} · ${prediction.sealName ?? 'Today'}`,
        body: `${prediction.toneName} ${prediction.sealName} · ${astro.moon.phase}`,
      })

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100))
    } catch (err) {
      console.error(`Error processing notification for user ${user.userId}:`, err)
      failed++
    }
  }

  // PUSH-M1: fan the same digest out to registered devices. Best-effort —
  // push failures never fail the cron run; dead tokens are pruned.
  try {
    const tokens = await listPushTokensForUsers(pushDrafts.map((d) => d.userId))
    if (tokens.length > 0) {
      const byUser = new Map(pushDrafts.map((d) => [d.userId, d]))
      const messages: PushMessage[] = tokens.flatMap((t) => {
        const draft = byUser.get(t.user_id)
        if (!draft) return []
        return [
          {
            to: t.expo_push_token,
            title: draft.title,
            body: draft.body,
            data: { url: '/' },
          },
        ]
      })
      const pushResult = await sendExpoPush(messages)
      await deletePushTokens(pushResult.deadTokens)
    }
  } catch (err) {
    console.error('Push fan-out failed:', err)
  }

  return { sent, failed }
}

// ============================================================================
// Email Templates
// ============================================================================

/**
 * "Today, across the systems" — the email mirror of the dashboard's
 * split-flap board. Kin leads as the hero (always shown); every other
 * line honours the recipient's preferred-systems map.
 */
function boardLinesHtml(
  board: TodayAcrossSystems,
  systems: Record<SystemKey, boolean>
): string {
  const lines: { system: SystemKey; label: string; value: string }[] = [
    { system: 'moon', label: 'Moon', value: board.moon },
    { system: 'astrology', label: 'Sun', value: board.sun },
    { system: 'sidereal', label: 'Sidereal', value: board.sidereal },
    { system: 'humandesign', label: 'Gate', value: board.gate },
    { system: 'hebrew', label: 'Hebrew', value: board.hebrewDate },
    { system: 'hijri', label: 'Hijri', value: board.hijri },
    { system: 'persian', label: 'Persian', value: board.persian },
    { system: 'chinese', label: 'Chinese', value: board.chineseYear },
    { system: 'panchang', label: 'Panchang', value: board.panchang },
    { system: 'longcount', label: 'Long Count', value: board.longCount },
  ]
  const visible = lines.filter((l) => (systems[l.system] ?? true) && l.value)
  if (visible.length === 0) return ''
  const rows = visible
    .map(
      (l) => `
      <tr>
        <td style="padding:7px 0;color:rgba(255,255,255,0.45);font-size:12px;letter-spacing:0.14em;text-transform:uppercase;">${esc(l.label)}</td>
        <td style="padding:7px 0;color:rgba(255,255,255,0.85);font-size:14px;text-align:right;">${esc(l.value)}</td>
      </tr>`
    )
    .join('')
  return `
    <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:20px;margin-bottom:24px;">
      <h3 style="color:#A78FDF;font-size:15px;margin:0 0 8px;">Today, across the systems</h3>
      <table role="presentation" width="100%" style="border-collapse:collapse;">${rows}</table>
    </div>
  `
}

function dailyDigestBody(
  userName: string,
  prediction: DailyPrediction,
  events: PredictionEvent[],
  astro: AstroPhenomena,
  board: TodayAcrossSystems,
  systems: Record<SystemKey, boolean>
): string {
  const dateFormatted = new Date(prediction.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const eventsHtml = events.length > 0
    ? events.map((e) => `
      <div style="background:rgba(167,143,223,0.1);border-radius:8px;padding:14px;margin:10px 0;">
        <p style="color:#A78FDF;font-weight:600;margin:0 0 4px;">${esc(e.title)}</p>
        <p style="color:rgba(255,255,255,0.5);font-size:14px;margin:0;">${esc(e.description)}</p>
      </div>
    `).join('')
    : ''

  return `
    <div style="text-align:center;margin-bottom:20px;">
      <p style="color:rgba(255,255,255,0.5);font-size:14px;margin:0 0 8px;">${dateFormatted}</p>
      <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0;">Good morning, ${esc(userName)}</p>
    </div>
    <div style="text-align:center;margin-bottom:24px;">
      <div style="background:${prediction.colorHex};color:${prediction.color === 'white' ? '#000' : '#fff'};display:inline-block;padding:8px 20px;border-radius:20px;font-weight:600;margin-bottom:16px;">
        Kin ${prediction.kin}
      </div>
      <h1 style="color:#ffffff;font-size:26px;margin:0 0 12px;">
        ${prediction.toneName} ${prediction.sealName}
      </h1>
      <div style="padding:14px;background:rgba(0,0,0,0.2);border-radius:8px;">
        <p style="color:rgba(255,255,255,0.5);font-size:14px;margin:0;">
          Day ${prediction.wavespell.day} of ${prediction.wavespell.name} Wavespell<br/>
          Theme: ${prediction.wavespell.role}
        </p>
      </div>
    </div>
    ${boardLinesHtml(board, systems)}
    ${eventsHtml ? `
    <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:20px;margin-bottom:24px;">
      <h3 style="color:#A78FDF;font-size:15px;margin:0 0 12px;">Today's Events</h3>
      ${eventsHtml}
    </div>
    ` : ''}
    ${(systems.astrology ?? true) ? `
    <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:20px;margin-bottom:24px;text-align:center;">
      <h3 style="color:#A78FDF;font-size:15px;margin:0 0 8px;">Sky today</h3>
      <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0;">${astro.summary}</p>
    </div>
    ` : ''}
    <div style="text-align:center;">
      <a href="https://pleiad.io/app/predictions" style="display:inline-block;background:#7D5BC9;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-weight:600;font-size:14px;">
        View Full Forecast
      </a>
    </div>
  `
}

function eventBody(userName: string, event: PredictionEvent): string {
  const startDate = new Date(event.startDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const intensityColors: Record<string, string> = {
    low: '#22C55E',
    medium: '#3B82F6',
    high: '#EAB308',
    peak: '#EF4444',
  }

  return `
    <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0 0 12px;">Hi ${esc(userName)},</p>
    <div style="display:inline-block;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:600;margin-bottom:14px;background:${intensityColors[event.intensity]};color:#fff;">
      ${event.intensity.toUpperCase()} INTENSITY
    </div>
    <h1 style="color:#ffffff;font-size:22px;margin:0 0 8px;">
      ${esc(event.title)}
    </h1>
    <p style="color:#A78FDF;font-size:14px;margin:0 0 16px;">
      ${startDate}
    </p>
    <p style="color:rgba(255,255,255,0.7);line-height:1.6;margin:0;">
      ${esc(event.description)}
    </p>
    ${event.themes.length > 0 ? `
    <div style="margin-top:16px;">
      ${event.themes.map((t) => `<span style="display:inline-block;background:rgba(167,143,223,0.18);color:#A78FDF;padding:4px 10px;border-radius:12px;font-size:12px;margin:2px;">${esc(t)}</span>`).join('')}
    </div>
    ` : ''}
    <div style="text-align:center;margin-top:24px;">
      <a href="https://pleiad.io/app/predictions" style="display:inline-block;background:#7D5BC9;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-weight:600;font-size:14px;">
        View Details
      </a>
    </div>
  `
}

function testBody(userName: string, prediction: DailyPrediction): string {
  return `
    <div style="text-align:center;">
      <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0 0 18px;">Hi ${esc(userName)}, your Pleiad notifications are working.</p>
      <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0;">
        Today's Kin: <strong style="color:#fff;">Kin ${prediction.kin}: ${prediction.toneName} ${prediction.sealName}</strong>
      </p>
    </div>
  `
}
