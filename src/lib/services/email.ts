import { Resend } from 'resend'
import {
  subscribe as repoSubscribe,
  unsubscribe as repoUnsubscribe,
  listActiveSubscribers,
} from '@/lib/db/repositories/newsletter-repo'

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY)

// Email sender identity
const FROM_EMAIL = 'Omnis <noreply@omnis.app>'

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
  try {
    // Upsert on the unique email index: re-subscribes a previously
    // unsubscribed address and is safe against concurrent duplicate signups.
    const { created } = await repoSubscribe(email)

    // Only send the welcome email for a brand-new subscriber.
    if (created) {
      await sendWelcomeEmail(email)
    }

    return { success: true }
  } catch (err) {
    console.error('Error subscribing email:', err)
    return { success: false, error: 'Failed to subscribe' }
  }
}

/**
 * Unsubscribe an email from the newsletter
 */
export async function unsubscribeEmail(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    await repoUnsubscribe(email)
    return { success: true }
  } catch (err) {
    console.error('Error unsubscribing email:', err)
    return { success: false, error: 'Failed to unsubscribe' }
  }
}

/**
 * Get all active subscribers for daily kin emails
 */
export async function getActiveSubscribers(): Promise<EmailSubscriber[]> {
  try {
    const subscribers = await listActiveSubscribers()
    return subscribers.map((s) => ({
      id: s.id,
      email: s.email,
      subscribed_at: s.subscribed_at ?? '',
      confirmed: s.confirmed,
      confirmed_at: s.confirmed_at,
      unsubscribed_at: s.unsubscribed_at,
      preferences: {
        daily_kin: Boolean((s.preferences as { daily_kin?: unknown })?.daily_kin),
      },
    }))
  } catch (err) {
    console.error('Error fetching subscribers:', err)
    return []
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
