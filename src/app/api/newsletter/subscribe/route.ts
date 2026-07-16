import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimiters, rateLimitResponse, addRateLimitHeaders } from '@/lib/rate-limit'
import { findByEmail, subscribe } from '@/lib/db/repositories/newsletter-repo'
import { sendMarketingEmail, addAudienceContact } from '@/lib/email'
import { buildUnsubscribeUrl } from '@/lib/email/unsubscribe'
import { verifyTurnstileToken } from '@/lib/security/turnstile'

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

    // Bot protection — no-op unless TURNSTILE_SECRET_KEY is configured.
    const turnstile = await verifyTurnstileToken(
      body?.turnstileToken,
      request.headers.get('CF-Connecting-IP'),
    )
    if (!turnstile.ok) {
      return NextResponse.json(
        { error: 'Verification failed. Please try again.' },
        { status: 403 },
      )
    }

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

    // Mirror into the Resend audience (best-effort; never blocks the signup).
    await addAudienceContact(normalizedEmail)

    // Send welcome email only for genuinely new subscribers (not re-subscribes).
    // Marketing send: carries a signed one-click unsubscribe. Never fails the
    // subscription — sendMarketingEmail returns {ok:false} rather than throwing.
    if (created) {
      await sendMarketingEmail({
        to: normalizedEmail,
        subject: 'Welcome to Pleiad — your cosmic journey begins',
        preheader: 'Daily cosmic guidance from the Dreamspell calendar.',
        title: 'Welcome to Pleiad',
        bodyHtml: welcomeBody(),
        footerText: 'You joined the Pleiad newsletter.',
        unsubscribeUrl: await buildUnsubscribeUrl(normalizedEmail),
      })
    }

    const message = wasUnsubscribed ? 'Welcome back!' : 'Subscribed successfully'
    const response = NextResponse.json({ success: true, message })
    return addRateLimitHeaders(response, rateLimitResult)
  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** Inner content of the welcome email; the branded shell is renderEmail(). */
function welcomeBody(): string {
  return `
    <h2 style="color:#A78FDF;font-size:20px;margin:0 0 14px;">Your cosmic journey begins</h2>
    <p style="color:rgba(255,255,255,0.7);line-height:1.6;margin:0 0 18px;">
      Thanks for joining Pleiad. You'll now receive daily cosmic guidance featuring Today's Kin from the Dreamspell calendar.
    </p>
    <ul style="color:rgba(255,255,255,0.7);line-height:1.8;margin:0 0 24px;padding-left:20px;">
      <li>The day's galactic signature (Kin)</li>
      <li>Solar Seal and Galactic Tone meanings</li>
      <li>Your daily affirmation (mantra)</li>
      <li>Oracle relationships for deeper insight</li>
    </ul>
    <div style="text-align:center;">
      <a href="https://pleiad.io/today" style="display:inline-block;background:#7D5BC9;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;">
        View Today's Kin
      </a>
    </div>
  `
}
