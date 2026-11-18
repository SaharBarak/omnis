import { mustAskFrom } from '@/lib/analytics/consent'

/** Depends on this caller's address, so it is never something a CDN holds. */
export const dynamic = 'force-dynamic'

/**
 * Whether this visitor has to be asked before non-essential trackers load.
 *
 * The country comes from the edge's own header (Cloudflare stamps
 * `cf-ipcountry` on every request), read by the same rule the server applies
 * to its own events. Only the yes or no that follows from it is returned; the
 * country is not, and nothing is stored. A missing header answers yes, so a
 * misconfigured edge asks everybody.
 */
export function GET(request: Request): Response {
  return Response.json(
    { ask: mustAskFrom(request.headers) },
    { headers: { 'cache-control': 'private, no-store' } }
  )
}
