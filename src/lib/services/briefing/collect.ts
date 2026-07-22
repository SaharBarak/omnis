
import { collectTraffic } from './traffic'
import { collectOnPageSeo } from './seo-onpage'
import { collectGsc } from './seo-gsc'
import { collectBacklinks } from './backlinks'
import { withTimeout, COLLECTOR_TIMEOUT_MS } from './http'
import type { Briefing, Section, UsersData, RevenueData } from './types'
import { systemUserStats, systemRevenueStats } from '@/lib/db/repositories/briefing-repo'

/** Hard ceiling per external collector — yields a "timed out" section, never hangs. */
function bounded<T>(name: string, p: Promise<Section<T>>): Promise<Section<T>> {
  return withTimeout(p, COLLECTOR_TIMEOUT_MS, {
    connected: false,
    reason: `${name} timed out after ${COLLECTOR_TIMEOUT_MS / 1000}s.`,
  })
}

/**
 * Gather every briefing section concurrently. Each source is independently
 * fault-isolated: a source that lacks credentials or throws becomes a
 * "not connected" section, never a failed briefing. The email always sends.
 */
export async function collectBriefing(siteUrl: string, now: Date = new Date()): Promise<Briefing> {
  const until = now
  const since = new Date(now.getTime() - 24 * 3600_000)
  const prevSince = new Date(now.getTime() - 48 * 3600_000)
  const weekAgo = new Date(now.getTime() - 7 * 86400_000)

  const usersP: Promise<Section<UsersData>> = systemUserStats(
    since.toISOString(),
    prevSince.toISOString(),
    weekAgo.toISOString(),
  )
    .then((d) => ({ connected: true as const, ...d }))
    .catch((e: Error) => ({ connected: false as const, reason: `Users query failed: ${e.message}` }))

  const revenueP: Promise<Section<RevenueData>> = systemRevenueStats(since.toISOString())
    .then((d) => ({ connected: true as const, ...d }))
    .catch((e: Error) => ({ connected: false as const, reason: `Revenue query failed: ${e.message}` }))

  const [users, revenue, traffic, seoOnPage, gsc, backlinks] = await Promise.all([
    usersP,
    revenueP,
    bounded('Traffic', collectTraffic(siteUrl, since, until)),
    bounded('On-page SEO', collectOnPageSeo(siteUrl)),
    bounded('Search Console', collectGsc()),
    bounded('Backlinks', collectBacklinks()),
  ])

  return {
    generatedAt: now.toISOString(),
    windowLabel: 'last 24 hours',
    siteUrl,
    traffic,
    users,
    revenue,
    seoOnPage,
    gsc,
    backlinks,
  }
}
