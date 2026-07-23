import { NextRequest, NextResponse } from 'next/server'
import { notifyNewSignup } from '@/lib/alerts'
import { rateLimiters } from '@/lib/rate-limit'
import { verifyConfirmToken } from '@/lib/api/email-token'
import { confirmSubscriber } from '@/lib/db/repositories/newsletter-repo'
import { addAudienceContact, sendMarketingEmail } from '@/lib/email'
import { buildUnsubscribeLink } from '@/lib/email/links'

export const dynamic = 'force-dynamic'

/**
 * Double opt-in step 2 — the only place a newsletter subscription is granted.
 *
 * The link is minted in /api/newsletter/subscribe and carries an HMAC over
 * `confirm:<email>:<exp>`, so possession of it proves the clicker reached the
 * inbox. The expiry rides inside the signed payload — editing `exp` in the URL
 * breaks the signature rather than extending the link, which stops an old
 * confirmation mail from silently resurrecting an address that later opted out.
 *
 * Only after a valid signature do we grant consent, mirror into the Resend
 * audience, and send the welcome mail.
 */
export async function GET(request: NextRequest) {
  const rateLimitResult = await rateLimiters.newsletter.check(request, 'confirm')
  if (!rateLimitResult.success) {
    return NextResponse.redirect(new URL('/newsletter/confirmed?error=rate_limit', request.url))
  }

  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  const exp = searchParams.get('exp')
  const sig = searchParams.get('sig')

  if (!email || !exp || !sig) {
    return NextResponse.redirect(new URL('/newsletter/confirmed?error=invalid_link', request.url))
  }

  const normalizedEmail = email.toLowerCase().trim()
  const expiresAt = Number(exp)

  if (!(await verifyConfirmToken(normalizedEmail, expiresAt, sig))) {
    // Covers a forged/tampered signature and an expired link alike; the page
    // offers a fresh signup either way, so we don't distinguish them here.
    return NextResponse.redirect(new URL('/newsletter/confirmed?error=invalid_link', request.url))
  }

  const result = await confirmSubscriber(normalizedEmail)
  if (!result) {
    // Signature was valid but the row is gone (hard-deleted). Nothing to grant.
    return NextResponse.redirect(new URL('/newsletter/confirmed?error=invalid_link', request.url))
  }

  // Only on the transition into active. A re-clicked link still lands on the
  // success page, but must not re-send the welcome or re-ping ops.
  if (result.activated) {
    // Consent now exists — mirror it outward. Best-effort: never fail the
    // confirmation over the audience mirror or the welcome mail.
    await addAudienceContact(normalizedEmail)

    await sendMarketingEmail({
      to: normalizedEmail,
      subject: 'Welcome to Pleiad: your cosmic journey begins',
      preheader: 'Daily cosmic guidance from the Dreamspell calendar.',
      title: 'Welcome to Pleiad',
      bodyHtml: welcomeBody(),
      footerText: 'You confirmed your subscription to the Pleiad newsletter.',
      unsubscribe: await buildUnsubscribeLink(normalizedEmail),
    })

    await notifyNewSignup({ kind: 'newsletter', email: normalizedEmail })
  }

  return NextResponse.redirect(new URL('/newsletter/confirmed?success=true', request.url))
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
