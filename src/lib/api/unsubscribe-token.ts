/**
 * Signed unsubscribe links.
 *
 * An unsubscribe link that trusts a bare email address lets anyone
 * unsubscribe anyone else (and enumerate the list). Every emailed link
 * therefore carries an HMAC-SHA256 signature over the normalized address,
 * keyed by UNSUBSCRIBE_SECRET (`wrangler secret put UNSUBSCRIBE_SECRET`).
 *
 * Fail-closed, mirroring cron-auth: signing returns null and verification
 * returns false when the secret is unset, so a misconfigured deploy can never
 * degrade into accepting unsigned links. Verification is constant-time.
 * Web Crypto only, so it runs on both Cloudflare Workers and Node.
 */

import { timingSafeEqualStr } from './cron-auth'

const encoder = new TextEncoder()

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Signs an email address for use in an unsubscribe link
 * (`?email=...&sig=...`). Returns null when UNSUBSCRIBE_SECRET is unset so
 * callers can fall back to an identifier-free link instead of emitting a
 * forgeable one.
 */
export async function signUnsubscribeToken(email: string): Promise<string | null> {
  const secret = process.env.UNSUBSCRIBE_SECRET
  if (!secret) return null
  return hmacSha256Hex(secret, normalizeEmail(email))
}

/**
 * Verifies an unsubscribe link signature. Fails closed (false) when the
 * secret is unset or the signature does not match. Constant-time comparison.
 */
export async function verifyUnsubscribeToken(
  email: string,
  signature: string
): Promise<boolean> {
  const secret = process.env.UNSUBSCRIBE_SECRET
  if (!secret || !signature) return false
  const expected = await hmacSha256Hex(secret, normalizeEmail(email))
  return timingSafeEqualStr(expected, signature.toLowerCase())
}
