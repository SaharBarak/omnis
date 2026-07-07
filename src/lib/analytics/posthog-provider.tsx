'use client'

import { useEffect } from 'react'
import { initPostHog } from './posthog'

/**
 * Client boundary that lazily initializes PostHog after hydration.
 * Renders nothing; mounted once in the root layout. When
 * NEXT_PUBLIC_POSTHOG_KEY is unset this is a pure no-op.
 */
export function PostHogAnalytics(): null {
  useEffect(() => {
    initPostHog()
  }, [])
  return null
}
