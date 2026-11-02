/**
 * Per-request + per-collector deadlines for the daily briefing.
 *
 * The Worker `fetch` has no default timeout, so a single unresponsive upstream
 * (a slow SEO/GSC/Cloudflare call) can stall the whole briefing and burn the
 * cron wall-time budget. Every collector fetches through `fetchWithTimeout`,
 * and `collect.ts` wraps each external collector in `withTimeout` as a hard
 * ceiling that can never reject.
 */

import { UPSTREAM_TIMEOUT_MS } from '@/lib/http/deadline'

/** Default per-request deadline (the briefing row of the upstream table). */
export const REQUEST_TIMEOUT_MS = UPSTREAM_TIMEOUT_MS.briefing
/** Default whole-collector deadline (a few requests fanned out concurrently). */
export const COLLECTOR_TIMEOUT_MS = 20_000

/**
 * `fetch` with a hard deadline. On timeout the request is aborted and the
 * promise rejects with an `AbortError`, which each collector's try/catch turns
 * into a muted "not connected" line — never a crash, never a hang.
 */
export async function fetchWithTimeout(
  input: string | URL,
  init: RequestInit = {},
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  return fetch(input, { ...init, signal: AbortSignal.timeout(timeoutMs) })
}

/**
 * Resolve `promise`, or resolve to `fallback` after `ms`. Never rejects: a
 * collector that hangs (or throws) past the deadline yields the fallback
 * section so the briefing always assembles.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise<T>((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      () => {
        clearTimeout(timer)
        resolve(fallback)
      },
    )
  })
}
