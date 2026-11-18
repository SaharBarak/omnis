/**
 * Runs once in the browser before the app hydrates (Next.js 15.3+). The only
 * place the analytics SDK is initialised; see src/lib/analytics/posthog.ts.
 *
 * The consent cookie is written here too, from what the browser knows without
 * the network, so the first request any component makes already carries the
 * visitor's answer to the server (docs/analytics/north-star.md, "Server
 * events and consent").
 */
import { readChoice, syncConsentCookie } from '@/lib/analytics/consent'
import { initAnalytics } from '@/lib/analytics/posthog'

syncConsentCookie(readChoice())
initAnalytics()
