import { signUnsubscribeToken } from '@/lib/api/unsubscribe-token'

/** Public base URL for links that appear inside emails. */
export function emailBaseUrl(): string {
  return process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://pleiad.io'
}

/**
 * One-click unsubscribe URL carrying an HMAC signature over the email, so the
 * `/api/newsletter/unsubscribe` endpoint can prove the link came from us (a
 * bare email would let anyone unsubscribe anyone). Falls back to the
 * identifier-free manual form when UNSUBSCRIBE_SECRET is unset — never emit a
 * forgeable link. Single source of truth: both the daily-kin blast and the
 * welcome mail build the link here so they can never drift.
 */
export async function buildUnsubscribeUrl(email: string): Promise<string> {
  const base = emailBaseUrl()
  const sig = await signUnsubscribeToken(email)
  if (!sig) return `${base}/unsubscribe`
  return `${base}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}&sig=${sig}`
}
