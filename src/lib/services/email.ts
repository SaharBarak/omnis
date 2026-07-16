import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/client'

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY)

// Email sender identity
const FROM_EMAIL = 'Omnis <noreply@omnis.app>'

// Platform owner inbox for admin notifications (new signups, alerts, etc.)
const ADMIN_NOTIFICATION_EMAIL =
  process.env.ADMIN_NOTIFICATION_EMAIL || 'hi@saharbarak.dev'

export interface EmailSubscriber {
  id: string
  email: string
  subscribed_at: string
  confirmed: boolean
  confirmed_at: string | null
  unsubscribed_at: string | null
  preferences: {
    daily_kin: boolean
  }
}

export interface DailyKinData {
  date: string
  kin: number
  seal: {
    number: number
    name: string
    nameHebrew: string
    color: string
  }
  tone: {
    number: number
    name: string
    nameHebrew: string
  }
  mantra: string
  oracle: {
    guide: { name: string; color: string }
    analog: { name: string; color: string }
    antipode: { name: string; color: string }
    occult: { name: string; color: string }
  }
}

/**
 * Subscribe an email to the newsletter
 */
export async function subscribeEmail(email: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  // Check if already subscribed
  const { data: existing } = await supabase
    .from('newsletter_subscribers')
    .select('id, unsubscribed_at')
    .eq('email', email.toLowerCase())
    .single()

  if (existing) {
    if (existing.unsubscribed_at) {
      // Re-subscribe
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({
          unsubscribed_at: null,
          subscribed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)

      if (error) {
        return { success: false, error: 'Failed to re-subscribe' }
      }
      return { success: true }
    }
    return { success: true } // Already subscribed
  }

  // New subscriber
  const { error } = await supabase
    .from('newsletter_subscribers')
    .insert({
      email: email.toLowerCase(),
      confirmed: true, // Auto-confirm for now (no double opt-in)
      confirmed_at: new Date().toISOString(),
      preferences: { daily_kin: true }
    })

  if (error) {
    if (error.code === '23505') {
      return { success: true } // Already exists
    }
    return { success: false, error: 'Failed to subscribe' }
  }

  // Send welcome email
  await sendWelcomeEmail(email)

  return { success: true }
}

/**
 * Unsubscribe an email from the newsletter
 */
export async function unsubscribeEmail(email: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('newsletter_subscribers')
    .update({
      unsubscribed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('email', email.toLowerCase())

  if (error) {
    return { success: false, error: 'Failed to unsubscribe' }
  }

  return { success: true }
}

/**
 * Get all active subscribers for daily kin emails
 */
export async function getActiveSubscribers(): Promise<EmailSubscriber[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .eq('confirmed', true)
    .is('unsubscribed_at', null)
    .contains('preferences', { daily_kin: true })

  if (error) {
    console.error('Error fetching subscribers:', error)
    return []
  }

  return data || []
}

export interface NewUserNotificationData {
  email: string
  displayName: string
  provider?: string
  userId: string
  signedUpAt?: string
}

/**
 * Notify the platform owner that a new user just signed up.
 * Sent to ADMIN_NOTIFICATION_EMAIL (defaults to hi@saharbarak.dev).
 * Best-effort: never throws, so it can't block the signup flow.
 */
export async function sendNewUserAdminNotification(
  user: NewUserNotificationData
): Promise<{ success: boolean; id?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping new-user admin notification')
    return { success: false }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_NOTIFICATION_EMAIL,
      replyTo: user.email,
      subject: `New Omnis signup: ${user.displayName}`,
      html: getNewUserAdminEmailHtml(user),
    })

    if (error) {
      console.error('Error sending new-user admin notification:', error)
      return { success: false }
    }

    return { success: true, id: data?.id }
  } catch (err) {
    console.error('Exception sending new-user admin notification:', err)
    return { success: false }
  }
}

export interface PlatformDigestMetric {
  label: string
  /** Count within the reporting window (last 24h). null if the query failed. */
  today: number | null
  /** All-time total. null if the query failed. */
  total: number | null
}

export interface PlatformDigestData {
  /** Human-readable report date, e.g. "Thursday, July 16, 2026". */
  date: string
  metrics: PlatformDigestMetric[]
}

/**
 * Send the daily platform-health digest to the platform owner.
 * Sent to ADMIN_NOTIFICATION_EMAIL (defaults to hi@saharbarak.dev).
 */
export async function sendPlatformDigestEmail(
  digest: PlatformDigestData
): Promise<{ success: boolean; id?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping platform digest email')
    return { success: false }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_NOTIFICATION_EMAIL,
      subject: `Omnis daily digest — ${digest.date}`,
      html: getPlatformDigestEmailHtml(digest),
    })

    if (error) {
      console.error('Error sending platform digest email:', error)
      return { success: false }
    }

    return { success: true, id: data?.id }
  } catch (err) {
    console.error('Exception sending platform digest email:', err)
    return { success: false }
  }
}

/**
 * Send welcome email to new subscriber
 */
export async function sendWelcomeEmail(email: string): Promise<{ success: boolean; id?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping welcome email')
    return { success: false }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Welcome to Omnis - Your Cosmic Journey Begins',
      html: getWelcomeEmailHtml()
    })

    if (error) {
      console.error('Error sending welcome email:', error)
      return { success: false }
    }

    return { success: true, id: data?.id }
  } catch (err) {
    console.error('Exception sending welcome email:', err)
    return { success: false }
  }
}

/**
 * Send daily kin email to a subscriber
 */
export async function sendDailyKinEmail(
  email: string,
  kinData: DailyKinData
): Promise<{ success: boolean; id?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping daily kin email')
    return { success: false }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Today's Kin: ${kinData.seal.name} - Kin ${kinData.kin}`,
      html: getDailyKinEmailHtml(kinData)
    })

    if (error) {
      console.error('Error sending daily kin email:', error)
      return { success: false }
    }

    return { success: true, id: data?.id }
  } catch (err) {
    console.error('Exception sending daily kin email:', err)
    return { success: false }
  }
}

/**
 * Send daily kin to all active subscribers
 */
export async function sendDailyKinToAllSubscribers(kinData: DailyKinData): Promise<{
  sent: number
  failed: number
}> {
  const subscribers = await getActiveSubscribers()
  let sent = 0
  let failed = 0

  for (const subscriber of subscribers) {
    const result = await sendDailyKinEmail(subscriber.email, kinData)
    if (result.success) {
      sent++
    } else {
      failed++
    }
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return { sent, failed }
}

// Email HTML templates

function getPlatformDigestEmailHtml(digest: PlatformDigestData): string {
  const fmt = (n: number | null) =>
    n === null ? '<span style="color:#555;">—</span>' : n.toLocaleString('en-US')

  const metricRows = digest.metrics
    .map((m, i) => {
      const bg = i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'
      const todayBadge =
        m.today && m.today > 0
          ? `<span style="color:#7bd88f;font-weight:600;">+${m.today.toLocaleString('en-US')}</span>`
          : fmt(m.today)
      return `
      <tr style="background:${bg};">
        <td style="color:#e8e8e8;font-size:14px;padding:12px 16px;">${m.label}</td>
        <td style="font-size:14px;padding:12px 16px;text-align:right;">${todayBadge}</td>
        <td style="color:#c9a55c;font-size:14px;padding:12px 16px;text-align:right;font-weight:600;">${fmt(m.total)}</td>
      </tr>`
    })
    .join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Omnis daily digest</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
      <span style="color: #c9a55c; font-size: 28px;">*</span>
      <h1 style="color: #ffffff; font-size: 24px; margin: 12px 0 4px;">Omnis Daily Digest</h1>
      <p style="color: #666; font-size: 13px; margin: 0;">${digest.date}</p>
    </div>

    <!-- Metrics table -->
    <div style="background: linear-gradient(180deg, rgba(201, 165, 92, 0.1) 0%, rgba(201, 165, 92, 0.03) 100%); border: 1px solid rgba(201, 165, 92, 0.25); border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 1px solid rgba(201, 165, 92, 0.2);">
            <th style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;text-align:left;padding:12px 16px;">Metric</th>
            <th style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;text-align:right;padding:12px 16px;">Last 24h</th>
            <th style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;text-align:right;padding:12px 16px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${metricRows}
        </tbody>
      </table>
    </div>

    <!-- Footer -->
    <div style="text-align: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 18px;">
      <p style="color: #555; font-size: 12px; margin: 0 0 6px;">
        Automated platform health digest from Omnis.
      </p>
      <p style="color: #555; font-size: 12px; margin: 0;">
        <a href="https://omnis.app/app" style="color: #888;">Open dashboard</a>
      </p>
    </div>
  </div>
</body>
</html>
`
}

function getNewUserAdminEmailHtml(user: NewUserNotificationData): string {
  const signedUpAt = user.signedUpAt ? new Date(user.signedUpAt) : new Date()
  const signedUpLabel = signedUpAt.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
  const provider = user.provider
    ? user.provider.charAt(0).toUpperCase() + user.provider.slice(1)
    : 'Email'

  const row = (label: string, value: string) => `
    <tr>
      <td style="color: #666; font-size: 13px; padding: 8px 0; width: 120px; vertical-align: top;">${label}</td>
      <td style="color: #e8e8e8; font-size: 14px; padding: 8px 0; word-break: break-word;">${value}</td>
    </tr>`

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>New Omnis signup</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
      <span style="color: #c9a55c; font-size: 28px;">*</span>
      <h1 style="color: #ffffff; font-size: 22px; margin: 12px 0 4px;">New user signed up</h1>
      <p style="color: #666; font-size: 13px; margin: 0;">A new soul joined Omnis</p>
    </div>

    <!-- Detail card -->
    <div style="background: linear-gradient(180deg, rgba(201, 165, 92, 0.12) 0%, rgba(201, 165, 92, 0.04) 100%); border: 1px solid rgba(201, 165, 92, 0.3); border-radius: 12px; padding: 24px 28px; margin-bottom: 24px;">
      <table style="width: 100%; border-collapse: collapse;">
        ${row('Name', user.displayName)}
        ${row('Email', user.email)}
        ${row('Method', provider)}
        ${row('Signed up', signedUpLabel)}
        ${row('User ID', `<span style="font-family: monospace; font-size: 12px; color: #888;">${user.userId}</span>`)}
      </table>
    </div>

    <!-- Footer -->
    <div style="text-align: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 18px;">
      <p style="color: #555; font-size: 12px; margin: 0;">
        Automated notification from Omnis · sent because a new user completed signup.
      </p>
    </div>
  </div>
</body>
</html>
`
}

function getWelcomeEmailHtml(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Welcome to Omnis</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <span style="color: #c9a55c; font-size: 32px;">*</span>
      <h1 style="color: #ffffff; font-family: 'Cinzel', serif; font-size: 28px; margin: 10px 0;">
        Welcome to Omnis
      </h1>
    </div>

    <!-- Content -->
    <div style="background: linear-gradient(180deg, rgba(201, 165, 92, 0.1) 0%, rgba(201, 165, 92, 0.05) 100%); border: 1px solid rgba(201, 165, 92, 0.3); border-radius: 12px; padding: 30px; margin-bottom: 30px;">
      <h2 style="color: #c9a55c; font-size: 20px; margin: 0 0 15px;">Your Cosmic Journey Begins</h2>
      <p style="color: #a0a0a0; line-height: 1.6; margin: 0 0 20px;">
        Thank you for joining Omnis! You'll now receive daily cosmic guidance featuring Today's Kin from the Dreamspell calendar.
      </p>
      <p style="color: #a0a0a0; line-height: 1.6; margin: 0 0 20px;">
        Each morning, you'll discover:
      </p>
      <ul style="color: #a0a0a0; line-height: 1.8; margin: 0 0 20px; padding-left: 20px;">
        <li>The day's galactic signature (Kin)</li>
        <li>Solar Seal and Galactic Tone meanings</li>
        <li>Your daily affirmation (mantra)</li>
        <li>Oracle relationships for deeper insight</li>
      </ul>
    </div>

    <!-- CTA -->
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="https://omnis.app/today" style="display: inline-block; background: linear-gradient(90deg, #c9a55c 0%, #e8d5a3 50%, #c9a55c 100%); color: #0a0a0f; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        View Today's Kin
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
      <p style="color: #666; font-size: 12px; margin: 0 0 10px;">
        You're receiving this because you subscribed to Omnis Daily Kin.
      </p>
      <p style="color: #666; font-size: 12px; margin: 0;">
        <a href="https://omnis.app/unsubscribe" style="color: #888;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>
`
}

function getDailyKinEmailHtml(kinData: DailyKinData): string {
  const sealColors: Record<string, string> = {
    red: '#ef4444',
    white: '#f5f5f5',
    blue: '#3b82f6',
    yellow: '#eab308'
  }

  const sealColor = sealColors[kinData.seal.color] || '#c9a55c'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Today's Kin: ${kinData.seal.name}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
      <span style="color: #c9a55c; font-size: 24px;">*</span>
      <p style="color: #666; font-size: 14px; margin: 10px 0 0;">
        ${new Date(kinData.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
      </p>
    </div>

    <!-- Kin Card -->
    <div style="background: linear-gradient(180deg, rgba(201, 165, 92, 0.15) 0%, rgba(201, 165, 92, 0.05) 100%); border: 1px solid rgba(201, 165, 92, 0.3); border-radius: 16px; padding: 30px; margin-bottom: 30px; text-align: center;">
      <!-- Kin Number -->
      <div style="background: ${sealColor}; color: ${kinData.seal.color === 'white' ? '#000' : '#fff'}; display: inline-block; padding: 8px 20px; border-radius: 20px; font-weight: 600; margin-bottom: 20px;">
        Kin ${kinData.kin}
      </div>

      <!-- Seal & Tone -->
      <h1 style="color: #ffffff; font-family: 'Cinzel', serif; font-size: 28px; margin: 0 0 5px;">
        ${kinData.tone.name} ${kinData.seal.name}
      </h1>
      <p style="color: #888; font-size: 14px; margin: 0 0 20px;">
        ${kinData.tone.nameHebrew} ${kinData.seal.nameHebrew}
      </p>

      <!-- Mantra -->
      <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 20px; margin-top: 20px;">
        <p style="color: #c9a55c; font-style: italic; line-height: 1.6; margin: 0; white-space: pre-line;">
          ${kinData.mantra}
        </p>
      </div>
    </div>

    <!-- Oracle -->
    <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 25px; margin-bottom: 30px;">
      <h3 style="color: #c9a55c; font-size: 16px; margin: 0 0 15px; text-align: center;">Today's Oracle</h3>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
        <div style="text-align: center; padding: 10px;">
          <span style="color: ${sealColors[kinData.oracle.guide.color] || '#888'}; font-size: 12px; text-transform: uppercase;">Guide</span>
          <p style="color: #fff; margin: 5px 0 0; font-size: 14px;">${kinData.oracle.guide.name}</p>
        </div>
        <div style="text-align: center; padding: 10px;">
          <span style="color: ${sealColors[kinData.oracle.analog.color] || '#888'}; font-size: 12px; text-transform: uppercase;">Analog</span>
          <p style="color: #fff; margin: 5px 0 0; font-size: 14px;">${kinData.oracle.analog.name}</p>
        </div>
        <div style="text-align: center; padding: 10px;">
          <span style="color: ${sealColors[kinData.oracle.antipode.color] || '#888'}; font-size: 12px; text-transform: uppercase;">Antipode</span>
          <p style="color: #fff; margin: 5px 0 0; font-size: 14px;">${kinData.oracle.antipode.name}</p>
        </div>
        <div style="text-align: center; padding: 10px;">
          <span style="color: ${sealColors[kinData.oracle.occult.color] || '#888'}; font-size: 12px; text-transform: uppercase;">Occult</span>
          <p style="color: #fff; margin: 5px 0 0; font-size: 14px;">${kinData.oracle.occult.name}</p>
        </div>
      </div>
    </div>

    <!-- CTA -->
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="https://omnis.app/today" style="display: inline-block; background: linear-gradient(90deg, #c9a55c 0%, #e8d5a3 50%, #c9a55c 100%); color: #0a0a0f; text-decoration: none; padding: 12px 25px; border-radius: 8px; font-weight: 600; font-size: 14px;">
        Explore Full Reading
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
      <p style="color: #666; font-size: 12px; margin: 0 0 10px;">
        Daily Kin from Omnis - Your cosmic guidance, every day.
      </p>
      <p style="color: #666; font-size: 12px; margin: 0;">
        <a href="https://omnis.app/unsubscribe" style="color: #888;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>
`
}
