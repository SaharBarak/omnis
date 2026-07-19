/**
 * Signed, single-purpose email action links (unsubscribe, confirm).
 *
 * A link that trusts a bare email address lets anyone act on anyone else's
 * address (and enumerate the list). Every emailed action link therefore carries
 * an HMAC-SHA256 signature over the normalized address, keyed by
 * UNSUBSCRIBE_SECRET (`wrangler secret put UNSUBSCRIBE_SECRET`).
 *
 * The two purposes are domain-separated by their signing payload: a signature
 * minted to unsubscribe an address must never also confirm a subscription for
 * it, or an unsubscribe link becomes a consent token. Unsubscribe keeps the
 * historical bare-email payload so links already sitting in inboxes keep
 * verifying.
 *
 * They also differ deliberately on expiry:
 * - unsubscribe never expires — CAN-SPAM requires opt-out to keep working for
 *   at least 30 days after a send, and a stale link that fails is worse than a
 *   long-lived one (the user reaches for "Report spam" instead).
 * - confirm expires, and the expiry is inside the signed payload so it can't be
 *   extended by editing the URL. Without it, a confirmation link kept in an
 *   inbox could silently resurrect an address that later opted out.
 *
 * Fail-closed, mirroring cron-auth: signing returns null and verification
 * returns false when the secret is unset, so a misconfigured deploy can never
 * degrade into accepting unsigned links. Verification is constant-time.
 * Web Crypto only, so it runs on both Cloudflare Workers and Node.
 */

import { timingSafeEqualStr } from './cron-auth'

const encoder = new TextEncoder()

/** How long a double opt-in confirmation link stays valid. */
export const CONFIRM_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

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

function secret(): string | undefined {
  return process.env.UNSUBSCRIBE_SECRET
}

// --- unsubscribe -----------------------------------------------------------

/**
 * Signs an email address for use in an unsubscribe link
 * (`?email=...&sig=...`). Returns null when UNSUBSCRIBE_SECRET is unset so
 * callers can fall back to an identifier-free link instead of emitting a
 * forgeable one.
 */
export async function signUnsubscribeToken(email: string): Promise<string | null> {
  const key = secret()
  if (!key) return null
  return hmacSha256Hex(key, normalizeEmail(email))
}

/**
 * Verifies an unsubscribe link signature. Fails closed (false) when the secret
 * is unset or the signature does not match. Constant-time comparison.
 */
export async function verifyUnsubscribeToken(
  email: string,
  signature: string
): Promise<boolean> {
  const key = secret()
  if (!key || !signature) return false
  const expected = await hmacSha256Hex(key, normalizeEmail(email))
  return timingSafeEqualStr(expected, signature.toLowerCase())
}

// --- confirm (double opt-in) ----------------------------------------------

/** `confirm:` prefix domain-separates this from the bare-email unsubscribe payload. */
function confirmPayload(email: string, expiresAt: number): string {
  return `confirm:${normalizeEmail(email)}:${expiresAt}`
}

export interface ConfirmToken {
  sig: string
  /** Epoch ms; travels in the URL and is covered by the signature. */
  expiresAt: number
}

/**
 * Signs a double opt-in confirmation for `email`, valid for
 * CONFIRM_TOKEN_TTL_MS. Returns null when UNSUBSCRIBE_SECRET is unset — an
 * unsigned confirmation link would prove nothing about address ownership,
 * which is the entire point of the step, so callers must abort rather than
 * degrade.
 */
export async function signConfirmToken(
  email: string,
  now: number = Date.now()
): Promise<ConfirmToken | null> {
  const key = secret()
  if (!key) return null
  const expiresAt = now + CONFIRM_TOKEN_TTL_MS
  const sig = await hmacSha256Hex(key, confirmPayload(email, expiresAt))
  return { sig, expiresAt }
}

/**
 * Verifies a confirmation link. Fails closed on: unset secret, missing
 * signature, non-numeric or elapsed expiry, or signature mismatch. Because
 * `expiresAt` is part of the signed payload, editing `exp` in the URL
 * invalidates the signature rather than extending the link.
 */
export async function verifyConfirmToken(
  email: string,
  expiresAt: number,
  signature: string,
  now: number = Date.now()
): Promise<boolean> {
  const key = secret()
  if (!key || !signature) return false
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return false
  const expected = await hmacSha256Hex(key, confirmPayload(email, expiresAt))
  return timingSafeEqualStr(expected, signature.toLowerCase())
}
