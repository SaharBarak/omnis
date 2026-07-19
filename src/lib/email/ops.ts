/**
 * Where operational mail goes. One place, so the briefing, the error pager and
 * the signup ping can't drift apart or each invent their own fallback.
 *
 * Read at call time: on Cloudflare Workers `process.env` is populated
 * per-request by @opennextjs/cloudflare, so a module-scope read can capture the
 * fallback before the env exists and freeze it for the life of the isolate.
 */

const DEFAULT_OPS_EMAIL = 'hi@saharbarak.dev'

/**
 * Ops inbox: the daily briefing and new-signup pings — things a human reads
 * over coffee.
 */
export function opsRecipient(): string {
  return process.env.BRIEFING_EMAIL || process.env.ALERT_EMAIL || DEFAULT_OPS_EMAIL
}

/**
 * The pager: server errors. Kept separate from opsRecipient() on purpose —
 * ALERT_EMAIL can point somewhere noisier (or somewhere that wakes someone up)
 * without dragging the daily briefing along with it.
 */
export function alertRecipient(): string {
  return process.env.ALERT_EMAIL || DEFAULT_OPS_EMAIL
}
