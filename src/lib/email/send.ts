import { Resend } from 'resend'

import { emailFrom, emailFromMarketing } from './from'
import { renderEmail } from './layout'
import type { UnsubscribeLink } from './links'

/**
 * Central send layer. Every Pleiad email goes through here so the sender
 * identity, the branded shell, deliverability headers, and error handling live
 * in one place instead of being copy-pasted per route.
 *
 * - transactional (EMAIL_FROM): contact acks, notification digests,
 *   confirmation mail, ops briefing, test mail.
 * - marketing (EMAIL_FROM_MARKETING): newsletter welcome + daily-kin blast —
 *   these additionally carry RFC 8058 `List-Unsubscribe` (+ one-click POST when
 *   the link can honour it), which Gmail/Yahoo bulk-sender rules require for
 *   inbox placement, and a CAN-SPAM postal address.
 */

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  return key ? new Resend(key) : null
}

export interface SendResult {
  ok: boolean
  id?: string
}

interface BaseArgs {
  to: string
  subject: string
  preheader?: string
  title?: string
  bodyHtml: string
  footerText: string
}

interface MarketingArgs extends BaseArgs {
  /** Signed link + whether its endpoint implements the RFC 8058 POST contract. */
  unsubscribe: UnsubscribeLink
}

interface TransactionalArgs extends BaseArgs {
  footerLink?: { url: string; label: string }
  replyTo?: string
}

/**
 * Bulk / marketing mail: marketing sender + List-Unsubscribe headers.
 *
 * Refuses to send without EMAIL_POSTAL_ADDRESS. CAN-SPAM §7704(a)(5) requires a
 * physical postal address on commercial mail, and layout.ts renders it only
 * when set — so an unset var would silently ship non-compliant bulk mail from a
 * verified domain. Failing loudly is the safe direction: no mail beats illegal
 * mail, and the daily-kin cron surfaces the failure in its per-recipient log.
 */
export async function sendMarketingEmail(args: MarketingArgs): Promise<SendResult> {
  const resend = getResend()
  if (!resend) {
    console.warn('email: RESEND_API_KEY not set — marketing send skipped')
    return { ok: false }
  }

  if (!process.env.EMAIL_POSTAL_ADDRESS) {
    console.error(
      'email: EMAIL_POSTAL_ADDRESS not set — refusing to send marketing mail without the CAN-SPAM postal address',
    )
    return { ok: false }
  }

  const headers: Record<string, string> = { 'List-Unsubscribe': `<${args.unsubscribe.url}>` }
  // Only advertise one-click when the URL is the API endpoint that implements
  // it; pointing a provider's POST at the manual page yields 405 → the button
  // silently fails → the user reaches for "Report spam" instead.
  if (args.unsubscribe.oneClick) headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click'

  try {
    const { data, error } = await resend.emails.send({
      from: emailFromMarketing(),
      to: args.to,
      subject: args.subject,
      html: renderEmail({
        preheader: args.preheader,
        title: args.title,
        bodyHtml: args.bodyHtml,
        footerText: args.footerText,
        footerLink: { url: args.unsubscribe.url, label: 'Unsubscribe' },
      }),
      headers,
    })
    if (error) {
      console.error('email: marketing send failed', error)
      return { ok: false }
    }
    return { ok: true, id: data?.id }
  } catch (err) {
    console.error('email: marketing send threw', err)
    return { ok: false }
  }
}

/** Transactional mail: root sender, no List-Unsubscribe, optional manage link. */
export async function sendTransactionalEmail(args: TransactionalArgs): Promise<SendResult> {
  const resend = getResend()
  if (!resend) {
    console.warn('email: RESEND_API_KEY not set — transactional send skipped')
    return { ok: false }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: emailFrom(),
      to: args.to,
      subject: args.subject,
      replyTo: args.replyTo,
      html: renderEmail({
        preheader: args.preheader,
        title: args.title,
        bodyHtml: args.bodyHtml,
        footerText: args.footerText,
        footerLink: args.footerLink,
      }),
    })
    if (error) {
      console.error('email: transactional send failed', error)
      return { ok: false }
    }
    return { ok: true, id: data?.id }
  } catch (err) {
    console.error('email: transactional send threw', err)
    return { ok: false }
  }
}
