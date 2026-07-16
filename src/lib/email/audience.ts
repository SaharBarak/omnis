import { Resend } from 'resend'

/**
 * Resend Audience sync. The newsletter's source of truth stays the local
 * `newsletter_subscribers` table; this mirrors each subscribe/unsubscribe into
 * a Resend Audience (`RESEND_AUDIENCE_ID`) so the list is managed in Resend and
 * can drive Broadcasts. Every call is best-effort — a Resend hiccup must never
 * break a signup or an unsubscribe, so failures are logged, not thrown, and the
 * whole thing no-ops when the audience/key isn't configured.
 */

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  return key ? new Resend(key) : null
}

function audienceId(): string | null {
  return process.env.RESEND_AUDIENCE_ID || null
}

/** Add (or reactivate) a subscriber in the Resend audience. */
export async function addAudienceContact(email: string): Promise<void> {
  const resend = getResend()
  const id = audienceId()
  if (!resend || !id) return
  try {
    const { error } = await resend.contacts.create({
      audienceId: id,
      email,
      unsubscribed: false,
    })
    // Already a contact (re-subscribe) → flip them back to subscribed.
    if (error) {
      await resend.contacts.update({ audienceId: id, email, unsubscribed: false })
    }
  } catch (err) {
    console.error('audience: add failed', err)
  }
}

/** Mark a contact unsubscribed in the Resend audience (keeps the suppression). */
export async function unsubscribeAudienceContact(email: string): Promise<void> {
  const resend = getResend()
  const id = audienceId()
  if (!resend || !id) return
  try {
    await resend.contacts.update({ audienceId: id, email, unsubscribed: true })
  } catch (err) {
    console.error('audience: unsubscribe failed', err)
  }
}
