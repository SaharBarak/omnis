import { esc } from '@/lib/email/layout'
import { alertRecipient, opsRecipient } from '@/lib/email/ops'
import { sendTransactionalEmail } from '@/lib/email/send'

/**
 * Operational notifications — emails a human when something happens the logs
 * alone would never surface: an unexpected server error (the pager the
 * pre-deploy readiness playbook's gate 8 was missing), or a new signup.
 *
 * Design constraints:
 * - Best-effort and non-blocking. A notification must never delay or fail the
 *   request that triggered it, so callers fire-and-forget and every path here
 *   swallows its own errors.
 * - Errors are throttled per key. A single broken endpoint can throw thousands
 *   of times a minute; without a gate that becomes thousands of emails. We keep
 *   the last send time per key in isolate-local memory and drop repeats inside
 *   the window. (Cloudflare isolates are ephemeral, so this caps the burst
 *   rather than guaranteeing exactly-once — the right trade for an alert.)
 */

const THROTTLE_MS = 10 * 60 * 1000 // one alert per key per 10 minutes

const lastSentByKey = new Map<string, number>()

function shouldSend(key: string, now: number): boolean {
  const last = lastSentByKey.get(key)
  if (last !== undefined && now - last < THROTTLE_MS) return false
  lastSentByKey.set(key, now)
  return true
}

function describe(error: unknown): { message: string; stack: string } {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack ?? '(no stack)' }
  }
  return { message: String(error), stack: '(not an Error)' }
}

/**
 * Email an alert about a server-side failure. Fire-and-forget: callers should
 * NOT await this in a hot path — `void sendCriticalAlert(...)`.
 *
 * `key` defaults to `context` and governs throttling; pass a narrower key to
 * throttle finer, or a coarser one to collapse related failures.
 */
export async function sendCriticalAlert(
  context: string,
  error: unknown,
  key: string = context
): Promise<void> {
  try {
    const now = Date.now()
    if (!shouldSend(key, now)) return

    const { message, stack } = describe(error)
    const site = process.env.NEXT_PUBLIC_SITE_URL || 'pleiad.io'

    await sendTransactionalEmail({
      to: alertRecipient(),
      subject: `⚠️ Pleiad error — ${context}`,
      preheader: message.slice(0, 120),
      title: 'Server error',
      bodyHtml: `
        <p><strong>Context:</strong> ${esc(context)}</p>
        <p><strong>Message:</strong> ${esc(message)}</p>
        <p><strong>When:</strong> ${new Date(now).toISOString()}</p>
        <p><strong>Site:</strong> ${esc(site)}</p>
        <pre style="white-space:pre-wrap;font-size:12px;color:#555;background:#f4f4f5;padding:12px;border-radius:8px;overflow:auto;">${esc(
          stack,
        ).slice(0, 4000)}</pre>
        <p style="color:#888;font-size:12px;">Throttled to one per key per 10 min. Key: ${esc(
          key,
        )}</p>
      `,
      footerText: 'Automated alert from the Pleiad worker.',
    })
  } catch {
    // Alerting is best-effort. If Resend is down or the key is missing, the
    // console.error at the call site is still the record; never throw here.
  }
}

/** What kind of signup happened — the two front doors into Pleiad. */
export type SignupKind = 'app_user' | 'newsletter'

const SIGNUP_LABEL: Record<SignupKind, string> = {
  app_user: 'New app user',
  newsletter: 'New newsletter subscriber',
}

export interface NewSignup {
  kind: SignupKind
  email: string
  /** Display name, when the signup path knows one. */
  name?: string | null
}

/**
 * Ping the ops inbox when someone new signs up. Fire-and-forget: callers should
 * NOT await this in a hot path — `void notifyNewSignup(...)`.
 *
 * Deliberately not throttled, unlike sendCriticalAlert. Both callers already
 * sit behind proof of identity — an authenticated session for an app user, a
 * confirmed double opt-in click for a subscriber — so the volume tracks real
 * humans, not an attacker's request rate. Each caller also fires only on the
 * transition into existence (a profile row that did not exist; a subscriber not
 * previously active), so a refresh or a re-clicked link sends nothing.
 */
export async function notifyNewSignup(signup: NewSignup): Promise<void> {
  try {
    const label = SIGNUP_LABEL[signup.kind]
    const site = process.env.NEXT_PUBLIC_SITE_URL || 'pleiad.io'
    const when = new Date().toISOString()

    await sendTransactionalEmail({
      to: opsRecipient(),
      subject: `🌱 ${label} — ${signup.email}`,
      preheader: signup.name ? `${signup.name} · ${signup.email}` : signup.email,
      title: label,
      bodyHtml: `
        <p style="color:rgba(255,255,255,0.7);line-height:1.6;margin:0 0 18px;">
          <strong style="color:#ffffff;">${esc(signup.email)}</strong>${
            signup.name ? ` &middot; ${esc(signup.name)}` : ''
          }
        </p>
        <p style="color:rgba(255,255,255,0.45);font-size:12px;margin:0;">
          ${esc(when)} &middot; ${esc(site)}
        </p>
      `,
      footerText: 'Automated signup notification from the Pleiad worker.',
    })
  } catch {
    // Best-effort, exactly like sendCriticalAlert: a signup must never fail
    // because we could not tell anyone about it.
  }
}
