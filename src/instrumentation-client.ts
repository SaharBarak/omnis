/**
 * Runs once in the browser before the app hydrates (Next.js 15.3+). The only
 * place the analytics SDK is initialised; see src/lib/analytics/posthog.ts.
 */
import { initAnalytics } from '@/lib/analytics/posthog'

initAnalytics()
