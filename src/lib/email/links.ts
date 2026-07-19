import { signConfirmToken, signUnsubscribeToken } from '@/lib/api/email-token'

/**
 * Signed links that appear inside emails. Single source of truth: the
 * confirmation mail, the welcome mail and the daily-kin blast all build their
 * links here so they can never drift from what the routes actually verify.
 */

/** Public base URL for links that appear inside emails. */
export function emailBaseUrl(): string {
  return process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://pleiad.io'
}

export interface UnsubscribeLink {
  url: string
  /**
   * True only when `url` is the signed API endpoint that actually implements
   * the RFC 8058 POST contract. Advertising `List-Unsubscribe-Post` for a URL
   * that can't honour it (the manual page) makes the provider's one-click
   * button fail, which pushes users to "Report spam" instead — so this flag,
   * not a default, decides whether the header goes out.
   */
  oneClick: boolean
}

/**
 * One-click unsubscribe link carrying an HMAC signature over the address, so
 * `/api/newsletter/unsubscribe` can prove the link came from us (a bare email
 * would let anyone unsubscribe anyone). Degrades to the identifier-free manual
 * form — with one-click off — when UNSUBSCRIBE_SECRET is unset, rather than
 * emitting a forgeable link or a header the endpoint can't satisfy.
 */
export async function buildUnsubscribeLink(email: string): Promise<UnsubscribeLink> {
  const base = emailBaseUrl()
  const sig = await signUnsubscribeToken(email)
  if (!sig) return { url: `${base}/unsubscribe`, oneClick: false }
  return {
    url: `${base}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}&sig=${sig}`,
    oneClick: true,
  }
}

/**
 * Double opt-in confirmation link. Returns null when UNSUBSCRIBE_SECRET is
 * unset: without a signature there is no way to prove the recipient controls
 * the address, so the caller must abort the signup rather than fall back to an
 * unsigned link that would confirm anyone.
 */
export async function buildConfirmUrl(email: string): Promise<string | null> {
  const token = await signConfirmToken(email)
  if (!token) return null
  const params = new URLSearchParams({
    email,
    exp: String(token.expiresAt),
    sig: token.sig,
  })
  return `${emailBaseUrl()}/api/newsletter/confirm?${params.toString()}`
}
