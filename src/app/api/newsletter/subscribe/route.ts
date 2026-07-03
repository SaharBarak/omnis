import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'
import { rateLimiters, rateLimitResponse, addRateLimitHeaders } from '@/lib/rate-limit'
import { findByEmail, subscribe } from '@/lib/db/repositories/newsletter-repo'

export const dynamic = 'force-dynamic'

// Zod schema for request validation
const subscribeSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .transform((val) => val.toLowerCase().trim()),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const rateLimitResult = await rateLimiters.newsletter.check(request, 'subscribe')
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult)
    }

    const body = await request.json()

    // Validate with Zod
    const parseResult = subscribeSchema.safeParse(body)
    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((e) => e.message).join(', ')
      return NextResponse.json({ error: errors }, { status: 400 })
    }

    const { email: normalizedEmail } = parseResult.data

    // Determine prior state so we can preserve the original response messages
    // (Welcome back! / Already subscribed / Subscribed successfully).
    const existing = await findByEmail(normalizedEmail)
    const wasUnsubscribed = Boolean(existing?.unsubscribed_at)

    if (existing && !wasUnsubscribed) {
      // Already an active subscriber — no write, no welcome email.
      const response = NextResponse.json({ success: true, message: 'Already subscribed' })
      return addRateLimitHeaders(response, rateLimitResult)
    }

    // Upsert on the unique email index: inserts a new subscriber or reactivates
    // a previously unsubscribed one. `created` is true only on first insert.
    const { created } = await subscribe(normalizedEmail)

    // Send welcome email only for genuinely new subscribers (not re-subscribes),
    // and only if Resend is configured.
    if (created && process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: 'OmnisX <noreply@omnis.app>',
          to: normalizedEmail,
          subject: 'Welcome to OmnisX - Your Cosmic Journey Begins',
          html: getWelcomeEmailHtml(),
        })
      } catch (emailError) {
        // Log but don't fail the subscription
        console.error('Error sending welcome email:', emailError)
      }
    }

    const message = wasUnsubscribed ? 'Welcome back!' : 'Subscribed successfully'
    const response = NextResponse.json({ success: true, message })
    return addRateLimitHeaders(response, rateLimitResult)
  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getWelcomeEmailHtml(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 40px;">
      <span style="color: #c9a55c; font-size: 32px;">*</span>
      <h1 style="color: #ffffff; font-size: 28px; margin: 10px 0;">Welcome to OmnisX</h1>
    </div>
    <div style="background: linear-gradient(180deg, rgba(201, 165, 92, 0.1) 0%, rgba(201, 165, 92, 0.05) 100%); border: 1px solid rgba(201, 165, 92, 0.3); border-radius: 12px; padding: 30px; margin-bottom: 30px;">
      <h2 style="color: #c9a55c; font-size: 20px; margin: 0 0 15px;">Your Cosmic Journey Begins</h2>
      <p style="color: #a0a0a0; line-height: 1.6; margin: 0 0 20px;">
        Thank you for joining OmnisX! You'll now receive daily cosmic guidance featuring Today's Kin from the Dreamspell calendar.
      </p>
      <ul style="color: #a0a0a0; line-height: 1.8; margin: 0 0 20px; padding-left: 20px;">
        <li>The day's galactic signature (Kin)</li>
        <li>Solar Seal and Galactic Tone meanings</li>
        <li>Your daily affirmation (mantra)</li>
        <li>Oracle relationships for deeper insight</li>
      </ul>
    </div>
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="https://omnis.app/today" style="display: inline-block; background: linear-gradient(90deg, #c9a55c 0%, #e8d5a3 50%, #c9a55c 100%); color: #0a0a0f; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600;">
        View Today's Kin
      </a>
    </div>
    <div style="text-align: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
      <p style="color: #666; font-size: 12px;">
        <a href="https://omnis.app/unsubscribe" style="color: #888;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>
`
}
