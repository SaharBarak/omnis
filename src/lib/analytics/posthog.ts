'use client'

/**
 * PostHog product analytics — fully env-gated scaffold.
 *
 * SETUP (nothing is captured until you do this):
 *   1. Create a PostHog project at https://us.posthog.com (or https://eu.posthog.com
 *      for EU data residency) and copy the project API key (starts with `phc_`).
 *   2. Set in .env.local / Cloudflare Workers vars:
 *        NEXT_PUBLIC_POSTHOG_KEY=phc_...
 *        NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com   (EU: https://eu.i.posthog.com)
 *      Optional, dev only: NEXT_PUBLIC_POSTHOG_DEV=1 to capture from `next dev`.
 *   3. In the PostHog UI, build the activation funnel (Insights → Funnel) from
 *      the typed events below, in order:
 *        landing_cta_clicked → calculate_completed → signup_started
 *        → onboarding_completed → person_created → share_created
 *
 * Behavior when NEXT_PUBLIC_POSTHOG_KEY is unset: every export is a silent
 * no-op — zero network requests, zero console noise, zero runtime effect.
 * Pageviews (including SPA navigations) are captured automatically via
 * `capture_pageview: 'history_change'`; browser Do Not Track is respected.
 */

import posthog from 'posthog-js'

/** The activation-funnel events. Add new events here to keep call sites typed. */
export type FunnelEvent =
  | 'landing_cta_clicked'
  | 'calculate_completed'
  | 'signup_started'
  | 'onboarding_completed'
  | 'person_created'
  | 'group_created'
  | 'share_created'

export type EventProperties = Record<string, string | number | boolean | null>

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'

let initialized = false

/** True only in the browser, with a key, and not in dev (unless forced). */
export function isAnalyticsEnabled(): boolean {
  if (typeof window === 'undefined' || !KEY) return false
  const forcedInDev = process.env.NEXT_PUBLIC_POSTHOG_DEV === '1'
  return process.env.NODE_ENV === 'production' || forcedInDev
}

/** Idempotent lazy init — called once from <PostHogAnalytics /> after mount. */
export function initPostHog(): void {
  if (initialized || !isAnalyticsEnabled()) return
  posthog.init(KEY as string, {
    api_host: HOST,
    defaults: '2026-05-30',
    // SPA-aware pageviews: initial load + every history push/replace.
    capture_pageview: 'history_change',
    capture_pageleave: true,
    respect_dnt: true,
  })
  initialized = true
}

/** Capture a funnel event. Silent no-op when PostHog is off. */
export function track(event: FunnelEvent, properties?: EventProperties): void {
  if (!initialized) return
  posthog.capture(event, properties)
}

/**
 * Tie the anonymous device id to the authenticated user. Email is recorded
 * with $set_once so the first observed value sticks. Safe to call on every
 * render — re-identifying the same id is skipped.
 */
export function identifyUser(userId: string, email?: string): void {
  if (!initialized || posthog.get_distinct_id() === userId) return
  posthog.identify(userId, undefined, email ? { email } : undefined)
}

/** Clear identity on sign-out so the next visitor starts anonymous. */
export function resetIdentity(): void {
  if (!initialized) return
  posthog.reset()
}
