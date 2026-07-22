import { fetchWithTimeout } from './http'
import type { Section, TrafficData } from './types'

/**
 * Traffic + bot split from Cloudflare.
 *
 * "Humans" = Cloudflare Web Analytics (RUM) page loads — these fire from a JS
 * beacon that automated clients don't execute, so they are the real-browser
 * signal. "Total edge requests" = every request Cloudflare served for the zone
 * (humans + crawlers + scripts + scanners). The difference is the automated /
 * bot share. This is a heuristic, not Bot Management scoring (that's an
 * Enterprise add-on), but it cleanly answers "how much of my traffic is real."
 *
 * Needs CLOUDFLARE_API_TOKEN (Analytics:Read) + a zone. Zone is taken from
 * CLOUDFLARE_ZONE_ID if set, else resolved by the site's hostname.
 */

const GQL = 'https://api.cloudflare.com/client/v4/graphql'
const REST = 'https://api.cloudflare.com/client/v4'

function hostFrom(siteUrl: string): string {
  try {
    return new URL(siteUrl).hostname.replace(/^www\./, '')
  } catch {
    return 'pleiad.io'
  }
}

async function resolveZoneId(token: string, host: string): Promise<string | null> {
  if (process.env.CLOUDFLARE_ZONE_ID) return process.env.CLOUDFLARE_ZONE_ID
  const res = await fetchWithTimeout(`${REST}/zones?name=${encodeURIComponent(host)}&status=active`, {
    headers: { authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  const json = (await res.json()) as { result?: Array<{ id: string }> }
  return json.result?.[0]?.id ?? null
}

const QUERY = `
query Briefing($zone: String!, $since: Time!, $until: Time!) {
  viewer {
    zones(filter: { zoneTag: $zone }) {
      totals: rumPageloadEventsAdaptiveGroups(filter: { datetime_geq: $since, datetime_lt: $until }, limit: 1) {
        count
        sum { visits }
        uniq { uniques }
      }
      paths: rumPageloadEventsAdaptiveGroups(filter: { datetime_geq: $since, datetime_lt: $until }, limit: 5, orderBy: [count_DESC]) {
        count
        dimensions { requestPath }
      }
      countries: rumPageloadEventsAdaptiveGroups(filter: { datetime_geq: $since, datetime_lt: $until }, limit: 5, orderBy: [count_DESC]) {
        count
        dimensions { countryName }
      }
      referers: rumPageloadEventsAdaptiveGroups(filter: { datetime_geq: $since, datetime_lt: $until }, limit: 6, orderBy: [count_DESC]) {
        count
        dimensions { refererHost }
      }
      edge: httpRequestsAdaptiveGroups(filter: { datetime_geq: $since, datetime_lt: $until }, limit: 1) {
        count
      }
    }
  }
}`

type Group = { count?: number; sum?: { visits?: number }; uniq?: { uniques?: number }; dimensions?: Record<string, string> }

export async function collectTraffic(siteUrl: string, since: Date, until: Date): Promise<Section<TrafficData>> {
  const token = process.env.CLOUDFLARE_API_TOKEN
  if (!token) {
    return { connected: false, reason: 'Cloudflare not connected — set CLOUDFLARE_API_TOKEN (Analytics:Read).' }
  }

  try {
    const zone = await resolveZoneId(token, hostFrom(siteUrl))
    if (!zone) return { connected: false, reason: 'Cloudflare zone not found for this site.' }

    const res = await fetchWithTimeout(GQL, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        query: QUERY,
        variables: { zone, since: since.toISOString(), until: until.toISOString() },
      }),
    })
    const json = (await res.json()) as {
      data?: { viewer?: { zones?: Array<Record<string, Group[]>> } }
      errors?: Array<{ message: string }>
    }
    if (json.errors?.length) {
      return { connected: false, reason: `Cloudflare API error: ${json.errors[0].message}` }
    }

    const z = json.data?.viewer?.zones?.[0]
    if (!z) return { connected: false, reason: 'Cloudflare returned no zone data.' }

    const t = z.totals?.[0] ?? {}
    const pageViews = t.count ?? 0
    const visits = t.sum?.visits ?? 0
    const uniques = t.uniq?.uniques ?? 0
    const totalEdgeRequests = z.edge?.[0]?.count ?? 0
    const botOrAutomated = Math.max(0, totalEdgeRequests - pageViews)
    const botSharePct = totalEdgeRequests > 0 ? Math.round((botOrAutomated / totalEdgeRequests) * 100) : 0

    const top = (groups: Group[] | undefined, key: string) =>
      (groups ?? [])
        .map((g) => ({ label: g.dimensions?.[key] || '(none)', count: g.count ?? 0 }))
        .filter((r) => r.count > 0)

    return {
      connected: true,
      humans: { visits, pageViews, uniques },
      totalEdgeRequests,
      botOrAutomated,
      botSharePct,
      topPaths: top(z.paths, 'requestPath'),
      topCountries: top(z.countries, 'countryName'),
      topReferrers: top(z.referers, 'refererHost'),
    }
  } catch (err) {
    return { connected: false, reason: `Cloudflare fetch failed: ${(err as Error).message}` }
  }
}
