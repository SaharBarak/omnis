/**
 * Deadlines for calls that leave the app (docs/perf/APP_PERFORMANCE_PROMPT.md,
 * practice 12). A Worker's `fetch` has no default timeout, so one stalled
 * upstream holds a request, or a cron's wall-time budget, open until the
 * platform kills it. Every upstream's deadline lives in this one table: room
 * for a healthy answer, and short where a person is waiting on it.
 */
export const UPSTREAM_TIMEOUT_MS = Object.freeze({
  /** Bot check on sign-in and contact; a person is waiting. */
  turnstile: 5_000,
  /** Entitlement lookups behind billing screens and webhooks. */
  revenuecat: 8_000,
  /** One briefing collector request (SEO, Search Console, Cloudflare). */
  briefing: 8_000,
  /** One batch of up to 100 Expo push messages, from cron. */
  expoPush: 10_000,
  /** One model completion, per attempt. */
  llm: 30_000,
})

export type Upstream = keyof typeof UPSTREAM_TIMEOUT_MS

/** An abort signal that fires when `upstream`'s deadline passes; pass it as `signal`. */
export const deadline = (upstream: Upstream): AbortSignal => AbortSignal.timeout(UPSTREAM_TIMEOUT_MS[upstream])
