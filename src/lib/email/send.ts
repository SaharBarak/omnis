import { Resend } from 'resend'

import { EMAIL_FROM, EMAIL_FROM_MARKETING } from './from'
import { renderEmail } from './layout'

/**
 * Central send layer. Every Pleiad email goes through here so the sender
 * identity, the branded shell, deliverability headers, and error handling live
 * in one place instead of being copy-pasted per route.
 *
 * - transactional (EMAIL_FROM): contact acks, notification digests, test mail.
 * - marketing (EMAIL_FROM_MARKETING): newsletter welcome + daily-kin blast —
 *   these additionally carry RFC 8058 `List-Unsubscribe` + one-click POST
 *   headers, which Gmail/Yahoo bulk-sender rules require for inbox placement.
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
  /** HMAC-signed unsubscribe URL (see buildUnsubscribeUrl). */
  unsubscribeUrl: string
  /**
   * Advertise RFC 8058 one-click unsubscribe (`List-Unsubscribe-Post`). Only
   * true when the URL's endpoint handles POST — our /api/newsletter/unsubscribe
   * does. Default true.
   */
  oneClick?: boolean
}

interface TransactionalArgs extends BaseArgs {
  footerLink?: { url: string; label: string }
  replyTo?: string
}

/** Bulk / marketing mail: marketing sender + List-Unsubscribe headers. */
export async function sendMarketingEmail(args: MarketingArgs): Promise<SendResult> {
  const resend = getResend()
  if (!resend) {
    console.warn('email: RESEND_API_KEY not set — marketing send skipped')
    return { ok: false }
  }

  const headers: Record<string, string> = { 'List-Unsubscribe': `<${args.unsubscribeUrl}>` }
  if (args.oneClick !== false) headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click'

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM_MARKETING,
      to: args.to,
      subject: args.subject,
      html: renderEmail({
        preheader: args.preheader,
        title: args.title,
        bodyHtml: args.bodyHtml,
        footerText: args.footerText,
        footerLink: { url: args.unsubscribeUrl, label: 'Unsubscribe' },
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
      from: EMAIL_FROM,
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
