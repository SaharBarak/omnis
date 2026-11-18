import { needsAsking } from '@/lib/analytics/consent'

/** Depends on this caller's address, so it is never something a CDN holds. */
export const dynamic = 'force-dynamic'

/**
 * Whether this visitor has to be asked before non-essential trackers load.
 *
 * The country comes from the edge's own header (Cloudflare stamps
 * `cf-ipcountry` on every request). Only the yes or no that follows from it is
 * returned; the country is not, and nothing is stored. A missing header
 * answers yes, so a misconfigured edge asks everybody.
 */
export function GET(request: Request): Response {
  return Response.json(
    { ask: needsAsking(request.headers.get('cf-ipcountry')) },
    { headers: { 'cache-control': 'private, no-store' } }
  )
}
