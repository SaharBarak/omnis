import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import type {
  NotificationSettings,
  PredictionEvent,
  DailyPrediction,
} from '@/lib/types/prediction'
import { getDailyPrediction, getPersonalDailyPrediction, COLOR_HEX } from './predictions'

// Lazy initialization of Resend to avoid build-time errors
let resendInstance: Resend | null = null

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null
  }
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY)
  }
  return resendInstance
}

// Email sender identity
const FROM_EMAIL = 'Omnis <noreply@omnis.app>'

// ============================================================================
// Supabase Client
// ============================================================================

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    return createClient(
      url || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    )
  }

  return createClient(url, serviceKey)
}

// ============================================================================
// Notification Settings
// ============================================================================

/**
 * Get notification settings for a user
 */
export async function getNotificationSettings(
  userId: string
): Promise<NotificationSettings | null> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return null
  }

  return {
    userId: data.user_id,
    enabled: data.enabled,
    channels: data.channels,
    dailyDigest: data.daily_digest,
    dailyDigestTime: data.daily_digest_time,
    weeklyDigest: data.weekly_digest,
    weeklyDigestDay: data.weekly_digest_day,
    advanceNotice: data.advance_notice,
    systems: data.systems,
    minIntensity: data.min_intensity,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * Create or update notification settings for a user
 */
export async function upsertNotificationSettings(
  settings: NotificationSettings
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseAdmin()

  const { error } = await supabase
    .from('notification_settings')
    .upsert({
      user_id: settings.userId,
      enabled: settings.enabled,
      channels: settings.channels,
      daily_digest: settings.dailyDigest,
      daily_digest_time: settings.dailyDigestTime,
      weekly_digest: settings.weeklyDigest,
      weekly_digest_day: settings.weeklyDigestDay,
      advance_notice: settings.advanceNotice,
      systems: settings.systems,
      min_intensity: settings.minIntensity,
      updated_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Error upserting notification settings:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// ============================================================================
// Email Notifications
// ============================================================================

/**
 * Send daily digest email to a user
 */
export async function sendDailyDigestEmail(
  email: string,
  userName: string,
  prediction: DailyPrediction,
  events: PredictionEvent[]
): Promise<{ success: boolean; id?: string }> {
  const resend = getResend()
  if (!resend) {
    console.warn('RESEND_API_KEY not configured, skipping email')
    return { success: false }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Daily Forecast: ${prediction.toneName} ${prediction.sealName} - Kin ${prediction.kin}`,
      html: getDailyDigestEmailHtml(userName, prediction, events),
    })

    if (error) {
      console.error('Error sending daily digest:', error)
      return { success: false }
    }

    return { success: true, id: data?.id }
  } catch (err) {
    console.error('Exception sending daily digest:', err)
    return { success: false }
  }
}

/**
 * Send event notification email
 */
export async function sendEventNotificationEmail(
  email: string,
  userName: string,
  event: PredictionEvent
): Promise<{ success: boolean; id?: string }> {
  const resend = getResend()
  if (!resend) {
    console.warn('RESEND_API_KEY not configured, skipping email')
    return { success: false }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Upcoming: ${event.title}`,
      html: getEventNotificationEmailHtml(userName, event),
    })

    if (error) {
      console.error('Error sending event notification:', error)
      return { success: false }
    }

    return { success: true, id: data?.id }
  } catch (err) {
    console.error('Exception sending event notification:', err)
    return { success: false }
  }
}

/**
 * Send test notification email
 */
export async function sendTestNotificationEmail(
  email: string,
  userName: string
): Promise<{ success: boolean; id?: string }> {
  const resend = getResend()
  if (!resend) {
    console.warn('RESEND_API_KEY not configured, skipping email')
    return { success: false }
  }

  const today = new Date().toISOString().split('T')[0]
  const prediction = getDailyPrediction(today)

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Test: Omnis Notification',
      html: getTestEmailHtml(userName, prediction),
    })

    if (error) {
      console.error('Error sending test notification:', error)
      return { success: false }
    }

    return { success: true, id: data?.id }
  } catch (err) {
    console.error('Exception sending test notification:', err)
    return { success: false }
  }
}

// ============================================================================
// Process Notifications Queue
// ============================================================================

/**
 * Get users who need notifications for today
 */
export async function getUsersForDailyDigest(): Promise<
  Array<{ userId: string; email: string; name: string; birthDate: string | null }>
> {
  const supabase = getSupabaseAdmin()

  // Get users with daily digest enabled
  const { data: settings, error: settingsError } = await supabase
    .from('notification_settings')
    .select('user_id')
    .eq('enabled', true)
    .eq('daily_digest', true)
    .contains('channels', ['email'])

  if (settingsError || !settings) {
    console.error('Error fetching notification settings:', settingsError)
    return []
  }

  const userIds = settings.map((s) => s.user_id)

  if (userIds.length === 0) {
    return []
  }

  // Get user profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, first_name, birth_date')
    .in('id', userIds)

  if (profilesError || !profiles) {
    console.error('Error fetching profiles:', profilesError)
    return []
  }

  return profiles.map((p) => ({
    userId: p.id,
    email: p.email,
    name: p.first_name || 'Friend',
    birthDate: p.birth_date,
  }))
}

/**
 * Process and send daily digest notifications
 */
export async function processDailyDigestNotifications(): Promise<{
  sent: number
  failed: number
}> {
  const users = await getUsersForDailyDigest()
  const today = new Date().toISOString().split('T')[0]

  let sent = 0
  let failed = 0

  for (const user of users) {
    try {
      let prediction: DailyPrediction

      if (user.birthDate) {
        prediction = getPersonalDailyPrediction(today, user.birthDate, user.userId)
      } else {
        prediction = getDailyPrediction(today)
      }

      const result = await sendDailyDigestEmail(
        user.email,
        user.name,
        prediction,
        prediction.events
      )

      if (result.success) {
        sent++
      } else {
        failed++
      }

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100))
    } catch (err) {
      console.error(`Error processing notification for user ${user.userId}:`, err)
      failed++
    }
  }

  return { sent, failed }
}

// ============================================================================
// Email Templates
// ============================================================================

function getDailyDigestEmailHtml(
  userName: string,
  prediction: DailyPrediction,
  events: PredictionEvent[]
): string {
  const dateFormatted = new Date(prediction.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const eventsHtml = events.length > 0
    ? events.map((e) => `
      <div style="background: rgba(201, 165, 92, 0.1); border-radius: 8px; padding: 15px; margin: 10px 0;">
        <p style="color: #c9a55c; font-weight: 600; margin: 0 0 5px;">${e.title}</p>
        <p style="color: #888; font-size: 14px; margin: 0;">${e.description}</p>
      </div>
    `).join('')
    : ''

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <span style="color: #c9a55c; font-size: 24px;">*</span>
      <p style="color: #888; font-size: 14px; margin: 10px 0 0;">${dateFormatted}</p>
    </div>

    <div style="background: linear-gradient(180deg, rgba(201, 165, 92, 0.15) 0%, rgba(201, 165, 92, 0.05) 100%); border: 1px solid rgba(201, 165, 92, 0.3); border-radius: 16px; padding: 30px; margin-bottom: 30px; text-align: center;">
      <p style="color: #888; font-size: 14px; margin: 0 0 10px;">Good morning, ${userName}</p>

      <div style="background: ${prediction.colorHex}; color: ${prediction.color === 'white' ? '#000' : '#fff'}; display: inline-block; padding: 8px 20px; border-radius: 20px; font-weight: 600; margin-bottom: 20px;">
        Kin ${prediction.kin}
      </div>

      <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 5px;">
        ${prediction.toneName} ${prediction.sealName}
      </h1>

      <div style="margin-top: 20px; padding: 15px; background: rgba(0,0,0,0.2); border-radius: 8px;">
        <p style="color: #888; font-size: 14px; margin: 0;">
          Day ${prediction.wavespell.day} of ${prediction.wavespell.name} Wavespell<br/>
          Theme: ${prediction.wavespell.role}
        </p>
      </div>
    </div>

    ${eventsHtml ? `
    <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 25px; margin-bottom: 30px;">
      <h3 style="color: #c9a55c; font-size: 16px; margin: 0 0 15px;">Today's Events</h3>
      ${eventsHtml}
    </div>
    ` : ''}

    <div style="text-align: center; margin-bottom: 30px;">
      <a href="https://omnis.app/app/predictions" style="display: inline-block; background: linear-gradient(90deg, #c9a55c 0%, #e8d5a3 50%, #c9a55c 100%); color: #0a0a0f; text-decoration: none; padding: 12px 25px; border-radius: 8px; font-weight: 600; font-size: 14px;">
        View Full Forecast
      </a>
    </div>

    <div style="text-align: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
      <p style="color: #666; font-size: 12px; margin: 0 0 10px;">Daily Forecast from Omnis</p>
      <p style="color: #666; font-size: 12px; margin: 0;">
        <a href="https://omnis.app/app/settings/notifications" style="color: #888;">Manage notifications</a>
      </p>
    </div>
  </div>
</body>
</html>
`
}

function getEventNotificationEmailHtml(userName: string, event: PredictionEvent): string {
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
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <span style="color: #c9a55c; font-size: 24px;">*</span>
    </div>

    <div style="background: linear-gradient(180deg, rgba(201, 165, 92, 0.15) 0%, rgba(201, 165, 92, 0.05) 100%); border: 1px solid rgba(201, 165, 92, 0.3); border-radius: 16px; padding: 30px; margin-bottom: 30px;">
      <p style="color: #888; font-size: 14px; margin: 0 0 10px;">Hi ${userName},</p>

      <div style="display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; margin-bottom: 15px; background: ${intensityColors[event.intensity]}; color: #fff;">
        ${event.intensity.toUpperCase()} INTENSITY
      </div>

      <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 10px;">
        ${event.title}
      </h1>

      <p style="color: #c9a55c; font-size: 14px; margin: 0 0 20px;">
        ${startDate}
      </p>

      <p style="color: #a0a0a0; line-height: 1.6; margin: 0;">
        ${event.description}
      </p>

      ${event.themes.length > 0 ? `
      <div style="margin-top: 20px;">
        ${event.themes.map((t) => `<span style="display: inline-block; background: rgba(201, 165, 92, 0.2); color: #c9a55c; padding: 4px 10px; border-radius: 12px; font-size: 12px; margin: 2px;">${t}</span>`).join('')}
      </div>
      ` : ''}
    </div>

    <div style="text-align: center; margin-bottom: 30px;">
      <a href="https://omnis.app/app/predictions" style="display: inline-block; background: linear-gradient(90deg, #c9a55c 0%, #e8d5a3 50%, #c9a55c 100%); color: #0a0a0f; text-decoration: none; padding: 12px 25px; border-radius: 8px; font-weight: 600; font-size: 14px;">
        View Details
      </a>
    </div>

    <div style="text-align: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
      <p style="color: #666; font-size: 12px; margin: 0 0 10px;">Event notification from Omnis</p>
      <p style="color: #666; font-size: 12px; margin: 0;">
        <a href="https://omnis.app/app/settings/notifications" style="color: #888;">Manage notifications</a>
      </p>
    </div>
  </div>
</body>
</html>
`
}

function getTestEmailHtml(userName: string, prediction: DailyPrediction): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <span style="color: #c9a55c; font-size: 24px;">*</span>
      <h1 style="color: #ffffff; font-size: 24px; margin: 10px 0;">Test Notification</h1>
    </div>

    <div style="background: linear-gradient(180deg, rgba(201, 165, 92, 0.15) 0%, rgba(201, 165, 92, 0.05) 100%); border: 1px solid rgba(201, 165, 92, 0.3); border-radius: 16px; padding: 30px; margin-bottom: 30px; text-align: center;">
      <p style="color: #888; font-size: 14px; margin: 0 0 20px;">Hi ${userName}, your Omnis notifications are working!</p>

      <p style="color: #a0a0a0; font-size: 14px; margin: 0;">
        Today's Kin: <strong style="color: #fff;">Kin ${prediction.kin} - ${prediction.toneName} ${prediction.sealName}</strong>
      </p>
    </div>

    <div style="text-align: center;">
      <p style="color: #666; font-size: 12px; margin: 0;">
        This is a test notification from Omnis.
      </p>
    </div>
  </div>
</body>
</html>
`
}
