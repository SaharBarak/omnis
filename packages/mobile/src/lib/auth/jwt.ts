/**
 * Minimal JWT claim reader.
 *
 * We only ever read the `sub` of OUR OWN access token — the one the server
 * already verifies on every request (AUTH-M1). It is never used to make a trust
 * decision on-device, so no signature check is needed or implied here: it just
 * tells us which user id to hand RevenueCat as the `appUserID`, so a purchase
 * lands on the same account the web app gates on.
 */

/** Decode a base64url segment. Hermes provides atob; pad it back to base64. */
function decodeSegment(segment: string): string | null {
  try {
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      '='
    )
    return atob(padded)
  } catch {
    return null
  }
}

/** The `sub` claim of a JWT, or null if it cannot be read. */
export function readJwtSub(token: string): string | null {
  const payload = token.split('.')[1]
  if (payload === undefined) return null

  const json = decodeSegment(payload)
  if (json === null) return null

  try {
    const claims = JSON.parse(json) as { sub?: unknown }
    return typeof claims.sub === 'string' && claims.sub.length > 0
      ? claims.sub
      : null
  } catch {
    return null
  }
}
