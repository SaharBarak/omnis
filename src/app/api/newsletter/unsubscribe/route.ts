import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimiters, rateLimitResponse, addRateLimitHeaders } from '@/lib/rate-limit'
import { verifyUnsubscribeToken } from '@/lib/api/email-token'
import { unsubscribe } from '@/lib/db/repositories/newsletter-repo'
import { unsubscribeAudienceContact } from '@/lib/email'

export const dynamic = 'force-dynamic'

/**
 * Unsubscribe — three entry points, two authorization models.
 *
 * 1. POST with `?email=&sig=` — RFC 8058 one-click, called by Gmail/Yahoo when
 *    a user hits the provider's Unsubscribe button. The HMAC *is* the
 *    authorization, so this path takes no body and skips the per-IP limiter.
 * 2. GET with `?email=&sig=` — the link in the email footer, same signature.
 * 3. POST with a JSON `{email}` body — the manual /unsubscribe form, where the
 *    user types their address. No signature: a bare address is accepted here on
 *    purpose. It means anyone can unsubscribe anyone, which is a nuisance, but
 *    over-honouring opt-outs is the safe direction and CAN-SPAM requires the
 *    opt-out to stay simple. The form reveals nothing — every outcome returns
 *    the same response, so it is not a membership oracle.
 */

// Zod schema for request validation
const unsubscribeSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .transform((val) => val.toLowerCase().trim()),
})

/** Remove from the list and mirror the opt-out into the Resend audience. */
async function applyUnsubscribe(email: string): Promise<void> {
  await unsubscribe(email)
  await unsubscribeAudienceContact(email)
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const signedEmail = searchParams.get('email')
  const sig = searchParams.get('sig')

  // --- (1) RFC 8058 one-click ------------------------------------------------
  // Mail providers POST here with `Content-Type: application/x-www-form-urlencoded`
  // and the body `List-Unsubscribe=One-Click`. We must not touch the body: it is
  // not JSON, and parsing it as JSON is what previously made every one-click
  // unsubscribe 500 — leaving "Report spam" as the user's only working button.
  //
  // No rate limit here on purpose. These POSTs arrive from a small pool of
  // provider IPs shared across every recipient, so an IP limiter would 429 real
  // unsubscribes. The signature already proves the request came from a link we
  // minted, and the action is idempotent.
  if (signedEmail && sig) {
    const normalizedEmail = signedEmail.toLowerCase().trim()
    if (!(await verifyUnsubscribeToken(normalizedEmail, sig))) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }
    try {
      await applyUnsubscribe(normalizedEmail)
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('One-click unsubscribe error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  // --- (3) manual form -------------------------------------------------------
  try {
    const rateLimitResult = await rateLimiters.newsletter.check(request, 'unsubscribe')
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult)
    }

    const body = await request.json()

    const parseResult = unsubscribeSchema.safeParse(body)
    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((e) => e.message).join(', ')
      return NextResponse.json({ error: errors }, { status: 400 })
    }

    const { email: normalizedEmail } = parseResult.data

    await applyUnsubscribe(normalizedEmail)

    // Constant response whether or not the address was on the list.
    const response = NextResponse.json({ success: true, message: 'Unsubscribed successfully' })
    return addRateLimitHeaders(response, rateLimitResult)
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// --- (2) footer link ---------------------------------------------------------
// GET handles the unsubscribe link in the email footer. The link must carry a
// valid HMAC signature over the email (`sig`, minted server-side when the email
// is sent) — a bare identifier would let anyone unsubscribe anyone by URL.
// Invalid/missing signatures fall through to the manual /unsubscribe form.
export async function GET(request: NextRequest) {
  // Rate limiting check for GET as well
  const rateLimitResult = await rateLimiters.newsletter.check(request, 'unsubscribe-link')
  if (!rateLimitResult.success) {
    // For GET requests, redirect to error page instead of JSON response
    return NextResponse.redirect(new URL('/unsubscribe?error=rate_limit', request.url))
  }

  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  const sig = searchParams.get('sig')

  if (!email) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const normalizedEmail = email.toLowerCase().trim()

  if (!sig || !(await verifyUnsubscribeToken(normalizedEmail, sig))) {
    return NextResponse.redirect(new URL('/unsubscribe?error=invalid_link', request.url))
  }

  await applyUnsubscribe(normalizedEmail)

  // Redirect to unsubscribe confirmation page
  return NextResponse.redirect(new URL('/unsubscribe?success=true', request.url))
}
