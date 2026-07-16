import { sendTransactionalEmail } from '@/lib/email/send'

/**
 * Operational alerting — emails a human when the server hits something it did
 * not expect. This is the pager the pre-deploy readiness playbook's gate 8 was
 * missing: logs alone tell no one.
 *
 * Design constraints:
 * - Best-effort and non-blocking. An alert must never delay or fail the request
 *   that triggered it, so callers fire-and-forget and every path here swallows
 *   its own errors.
 * - Throttled per key. A single broken endpoint can throw thousands of times a
 *   minute; without a gate that becomes thousands of emails. We keep the last
 *   send time per key in isolate-local memory and drop repeats inside the
 *   window. (Cloudflare isolates are ephemeral, so this caps the burst rather
 *   than guaranteeing exactly-once — which is the right trade for an alert.)
 */

const ALERT_EMAIL = process.env.ALERT_EMAIL || 'hi@saharbarak.dev'
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

const escapeHtml = (s: string) =>
  s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] as string)

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
      to: ALERT_EMAIL,
      subject: `⚠️ Pleiad error — ${context}`,
      preheader: message.slice(0, 120),
      title: 'Server error',
      bodyHtml: `
        <p><strong>Context:</strong> ${escapeHtml(context)}</p>
        <p><strong>Message:</strong> ${escapeHtml(message)}</p>
        <p><strong>When:</strong> ${new Date(now).toISOString()}</p>
        <p><strong>Site:</strong> ${escapeHtml(site)}</p>
        <pre style="white-space:pre-wrap;font-size:12px;color:#555;background:#f4f4f5;padding:12px;border-radius:8px;overflow:auto;">${escapeHtml(
          stack,
        ).slice(0, 4000)}</pre>
        <p style="color:#888;font-size:12px;">Throttled to one per key per 10 min. Key: ${escapeHtml(
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
