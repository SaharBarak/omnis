/**
 * Cloudflare Turnstile server-side verification.
 *
 * Env-gated like the analytics scaffold: when `TURNSTILE_SECRET_KEY` is unset
 * the verifier is a no-op that reports `{ ok: true, skipped: true }`, so
 * local/dev and unconfigured environments are never blocked. Set
 * `TURNSTILE_SECRET_KEY` (Worker secret) and `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
 * (build var) to activate. Once the secret IS set, verification fails closed:
 * missing/invalid tokens and siteverify outages all reject.
 *
 * The secret is read at call time (not module scope) because on Cloudflare
 * Workers `process.env` is populated per-request by @opennextjs/cloudflare;
 * module-scope reads can run before the env exists.
 *
 * Docs: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export interface TurnstileVerification {
  /** Whether the request may proceed. */
  ok: boolean
  /** True when verification was skipped because no secret is configured. */
  skipped: boolean
}

export function isTurnstileEnabled(): boolean {
  return !!process.env.TURNSTILE_SECRET_KEY
}

/**
 * Verify a Turnstile token from the client. `remoteip` is the caller's IP
 * when available (from CF-Connecting-IP) — optional but recommended.
 */
export async function verifyTurnstileToken(
  token: string | undefined | null,
  remoteip?: string | null,
): Promise<TurnstileVerification> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return { ok: true, skipped: true } // disabled → allow
  if (!token) return { ok: false, skipped: false } // fail closed

  try {
    const body = new URLSearchParams({ secret, response: token })
    if (remoteip) body.set('remoteip', remoteip)

    const res = await fetch(VERIFY_URL, { method: 'POST', body })
    if (!res.ok) return { ok: false, skipped: false }
    const data = (await res.json()) as { success?: boolean }
    return { ok: data.success === true, skipped: false }
  } catch {
    return { ok: false, skipped: false } // network failure → fail closed
  }
}
