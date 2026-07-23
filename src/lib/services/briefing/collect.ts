
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
 * Drizzle wraps driver failures in DrizzleQueryError whose message is only the
 * SQL text; the actual Postgres error lives in `cause`. Prefer the cause so the
 * briefing shows "permission denied for table users", not 6 lines of SQL.
 */
function dbErrorMessage(e: unknown): string {
  const err = e as Error & { cause?: { message?: string } }
  return err.cause?.message || err.message
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
    .catch((e: unknown) => ({ connected: false as const, reason: `Users query failed: ${dbErrorMessage(e)}` }))

  const revenueP: Promise<Section<RevenueData>> = systemRevenueStats(since.toISOString())
    .then((d) => ({ connected: true as const, ...d }))
    .catch((e: unknown) => ({ connected: false as const, reason: `Revenue query failed: ${dbErrorMessage(e)}` }))

  // DB queries run alone, BEFORE the fetch-heavy collectors. Workers caps a
  // request at 6 simultaneous open connections and closes the least-recently
  // used socket past that; the on-page crawl alone opens 7+, which can kill
  // the Postgres socket mid-query. The DB round-trips are fast — let them
  // finish before the crawlers claim every slot.
  const [users, revenue] = await Promise.all([usersP, revenueP])

  const [traffic, seoOnPage, gsc, backlinks] = await Promise.all([
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
