import { createPleiadClient, type Profile, type Subscription } from '@pleiad/api-client'
import { useQuery } from '@tanstack/react-query'

import { useAuthStore } from '@/lib/auth/store'
import { ENV } from '@/lib/env'

/**
 * The one API client instance. Tokens come from the auth store (which
 * silently refreshes near expiry); a 401 that survives refresh signs out.
 */
export const api = createPleiadClient({
  baseUrl: ENV.apiUrl,
  getAccessToken: () => useAuthStore.getState().getAccessToken(),
  onUnauthorized: () => useAuthStore.getState().signOut(),
})

/** GET /api/profile — bootstraps users+profiles rows on first call. */
export function useProfile(enabled = true) {
  return useQuery<Profile>({
    queryKey: ['profile'],
    queryFn: () => api.profile.get(),
    enabled,
  })
}

/** GET /api/billing/subscription — plan, usage meters, features (§6). */
export function useSubscription(enabled = true) {
  return useQuery<Subscription>({
    queryKey: ['subscription'],
    queryFn: () => api.billing.getSubscription(),
    staleTime: 5 * 60_000,
    enabled,
  })
}
