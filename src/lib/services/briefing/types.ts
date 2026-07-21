/**
 * Daily briefing — shared shapes.
 *
 * Every collector returns a discriminated result so the email can render a
 * clean "not connected" block for any source whose credentials are absent,
 * instead of the whole briefing failing. `connected: false` means the source
 * has no key wired yet; `error` means it was tried and threw (surfaced in logs
 * + a muted line, never a crash).
 */

/** Wrapper every section shares: either connected data, an unconnected seam, or a soft error. */
export type Section<T> =
  | ({ connected: true; error?: string } & T)
  | { connected: false; reason: string }

export interface TrafficData {
  /** Real browsers — Cloudflare Web Analytics (JS beacon; bots don't run it). */
  humans: { visits: number; pageViews: number; uniques: number }
  /** All edge traffic Cloudflare saw for the zone (humans + bots + automation). */
  totalEdgeRequests: number
  /** Derived non-human/automated traffic = edge requests − human page loads (floored at 0). */
  botOrAutomated: number
  /** Share of edge traffic that was NOT a human page load, 0–100. */
  botSharePct: number
  topPaths: Array<{ label: string; count: number }>
  topCountries: Array<{ label: string; count: number }>
  topReferrers: Array<{ label: string; count: number }>
}

export interface UsersData {
  total: number
  new24h: number
  prev24h: number
  new7d: number
  /** People added to maps across all users (excludes soft-deleted). */
  peopleTotal: number
  /** Registered users who have added at least one person to their map. */
  activeUsers: number
  /** Registered users who have pulled at least one reading (computed signs). */
  usersWithReadings: number
}

export interface RevenueData {
  /** Paid subscriptions created in the window (plan != free, status active/trialing). */
  newPaid24h: number
  /** Currently-active paid subscribers, split by plan. */
  activePaidByPlan: Array<{ plan: string; count: number }>
  activePaidTotal: number
  /** Active paid subs flagged to cancel at period end. */
  canceling: number
}

export interface OnPageSeoData {
  grade: string // A+ … F
  score: number // 0–100
  pagesChecked: number
  robotsOk: boolean
  sitemapOk: boolean
  /** Human-readable issues, worst first. */
  issues: string[]
}

export interface GscData {
  clicks: number
  impressions: number
  ctrPct: number
  avgPosition: number
  /** The single day this reflects (GSC lags ~2–3 days). */
  day: string
  topQueries: Array<{ query: string; clicks: number; impressions: number; position: number }>
}

export interface BacklinksData {
  totalBacklinks: number
  referringDomains: number
  domainRating: number | null
}

export interface Briefing {
  generatedAt: string
  windowLabel: string
  siteUrl: string
  traffic: Section<TrafficData>
  users: Section<UsersData>
  revenue: Section<RevenueData>
  seoOnPage: Section<OnPageSeoData>
  gsc: Section<GscData>
  backlinks: Section<BacklinksData>
}
