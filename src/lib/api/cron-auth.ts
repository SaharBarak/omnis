/**
 * Cron authorization — fail closed, unconditionally.
 *
 * These endpoints send bulk email and generate cross-tenant data, so auth must
 * never depend on NODE_ENV and must reject when the secret is unset (otherwise
 * the expected header collapses to the literal "Bearer undefined", which an
 * attacker can send). Comparison is constant-time to avoid leaking the secret.
 */

/** Constant-time string equality (length-safe). */
export function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

/**
 * Returns true only when CRON_SECRET is configured and the request carries the
 * matching `Authorization: Bearer <secret>` header. Fails closed in all other
 * cases (missing secret, missing/wrong header) regardless of environment.
 */
export function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = request.headers.get('authorization') ?? ''
  return timingSafeEqualStr(header, `Bearer ${secret}`)
}
