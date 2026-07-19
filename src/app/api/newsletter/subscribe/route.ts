import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimiters, rateLimitResponse, addRateLimitHeaders } from '@/lib/rate-limit'
import { findByEmail, upsertPendingSubscriber } from '@/lib/db/repositories/newsletter-repo'
import { sendTransactionalEmail } from '@/lib/email'
import { buildConfirmUrl } from '@/lib/email/links'
import { esc } from '@/lib/email/layout'
import { verifyTurnstileToken } from '@/lib/security/turnstile'

export const dynamic = 'force-dynamic'

/**
 * Newsletter signup — double opt-in.
 *
 * This endpoint is public and unauthenticated: anyone can POST anyone's
 * address. So a signup grants no consent by itself. It records a *pending*
 * subscriber and emails a signed confirmation link; only clicking that link
 * (which requires access to the inbox) puts the address into the daily-kin
 * blast or the Resend audience. Without this, one request would sign a
 * non-consenting third party up to recurring mail from a verified domain —
 * Turnstile proves a browser solved a challenge, not that the sender owns the
 * address.
 */

// Zod schema for request validation
const subscribeSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .transform((val) => val.toLowerCase().trim()),
})

/**
 * The one response every success branch returns. Distinct messages per branch
 * ("Already subscribed" / "Welcome back!" / "Subscribed successfully") were a
 * membership oracle: they let anyone probe whether an address is on the list.
 * It is also honest for each branch — a pending or resubscribing address does
 * get mail to confirm, and an already-active one has nothing to do.
 */
const CONFIRM_MESSAGE = 'Check your inbox — confirm your email to finish subscribing.'

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

    const existing = await findByEmail(normalizedEmail)
    const alreadyActive = Boolean(existing?.confirmed && !existing.unsubscribed_at)

    // An already-active subscriber needs no second confirmation mail; every
    // other state (new, pending, previously unsubscribed) gets one.
    if (!alreadyActive) {
      // Mint the link first: no secret → no way to prove address ownership →
      // abort rather than degrade into confirming anyone.
      const confirmUrl = await buildConfirmUrl(normalizedEmail)
      if (!confirmUrl) {
        console.error(
          'newsletter: UNSUBSCRIBE_SECRET not set — cannot mint a confirmation link; refusing signup',
        )
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
      }

      await upsertPendingSubscriber(normalizedEmail)

      // Transactional, not marketing: one requested message, no promotional
      // content, and it must not carry List-Unsubscribe for a list the
      // recipient has not joined yet.
      await sendTransactionalEmail({
        to: normalizedEmail,
        subject: 'Confirm your Pleiad subscription',
        preheader: 'One click to start receiving the Daily Kin.',
        title: 'Confirm your subscription',
        bodyHtml: confirmBody(confirmUrl),
        footerText:
          'Someone entered this address on pleiad.io. If it wasn’t you, ignore this email — nothing will be sent.',
      })
    }

    const response = NextResponse.json({ success: true, message: CONFIRM_MESSAGE })
    return addRateLimitHeaders(response, rateLimitResult)
  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** Inner content of the confirmation email; the branded shell is renderEmail(). */
function confirmBody(confirmUrl: string): string {
  return `
    <h2 style="color:#A78FDF;font-size:20px;margin:0 0 14px;">One more step</h2>
    <p style="color:rgba(255,255,255,0.7);line-height:1.6;margin:0 0 18px;">
      Confirm this address to start receiving daily cosmic guidance featuring Today's Kin from the Dreamspell calendar.
    </p>
    <div style="text-align:center;margin:0 0 20px;">
      <a href="${esc(confirmUrl)}" style="display:inline-block;background:#7D5BC9;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;">
        Confirm subscription
      </a>
    </div>
    <p style="color:rgba(255,255,255,0.45);font-size:12px;line-height:1.6;margin:0;">
      This link expires in 7 days. If you didn't sign up, ignore this email — you won't hear from us again.
    </p>
  `
}
