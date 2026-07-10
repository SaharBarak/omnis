/**
 * Cloudflare Turnstile server-side verification.
 *
 * Env-gated like the analytics scaffold: when `TURNSTILE_SECRET` is unset the
 * verifier is a no-op that returns `true`, so local/dev and unconfigured
 * environments are never blocked. Set `TURNSTILE_SECRET` (Worker secret) and
 * `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (build var) to activate.
 *
 * Docs: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

const SECRET = process.env.TURNSTILE_SECRET
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export function isTurnstileEnabled(): boolean {
  return !!SECRET
}

/**
 * Verify a Turnstile token from the client. Returns true when disabled (no
 * secret configured) or when Cloudflare confirms the token. `remoteip` is the
 * caller's IP when available (from CF-Connecting-IP) — optional but recommended.
 */
export async function verifyTurnstile(
  token: string | undefined | null,
  remoteip?: string | null,
): Promise<boolean> {
  if (!SECRET) return true // disabled → allow
  if (!token) return false

  try {
    const body = new URLSearchParams({ secret: SECRET, response: token })
    if (remoteip) body.set('remoteip', remoteip)

    const res = await fetch(VERIFY_URL, { method: 'POST', body })
    if (!res.ok) return false
    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch {
    return false
  }
}
