'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { User } from '@supabase/supabase-js'
import { identifyUser, resetIdentity } from '@/lib/analytics/posthog'
import { QUERY_CACHE_STORAGE_KEY } from '@/lib/query-provider'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { profiles } from '@/lib/db/schema'

export type Profile = typeof profiles.$inferSelect

/**
 * App-facing auth hook. Identity comes from the Supabase session; the app
 * profile still loads from /api/profile.
 *
 * Email + password only — no OAuth. signIn/signUp resolve in place (no
 * redirect); resetPassword sends a link that returns through /auth/callback.
 */

/** Same-origin relative paths only — an absolute URL here is an open redirect. */
function safeRedirect(redirectTo?: string): string {
  if (!redirectTo?.startsWith('/') || redirectTo.startsWith('//')) return '/app'
  return redirectTo
}

function callbackUrl(redirectTo?: string): string {
  const params = new URLSearchParams({ redirectTo: safeRedirect(redirectTo) })
  return `${window.location.origin}/auth/callback?${params.toString()}`
}

export function useAuth() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return
      setSupabaseUser(data.user ?? null)
      setSessionLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseUser(session?.user ?? null)
      setSessionLoading(false)
    })

    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [supabase])

  const user = useMemo(() => {
    if (!supabaseUser) return null
    const meta = supabaseUser.user_metadata ?? {}
    const pick = (...keys: string[]): string | null => {
      for (const key of keys) {
        const value = meta[key]
        if (typeof value === 'string' && value.length > 0) return value
      }
      return null
    }
    return {
      id: supabaseUser.id,
      email: supabaseUser.email ?? '',
      name: pick('name', 'full_name', 'preferred_username'),
      image: pick('avatar_url', 'picture'),
    }
  }, [supabaseUser])

  const queryClient = useQueryClient()

  // Product analytics: tie the anonymous device to the signed-in user.
  // No-op when PostHog is off; identifyUser dedupes repeat calls itself.
  useEffect(() => {
    if (user) identifyUser(user.id, user.email || undefined)
  }, [user])

  // Load the app profile from the server (browser cannot query the DB
  // directly). Cached + persisted per user id, so a returning session renders
  // the shell from the last-known profile while a background refetch runs.
  // Failures resolve to null rather than throwing, matching the previous
  // hand-rolled behavior.
  const profileQuery = useQuery({
    queryKey: ['profile', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const res = await fetch('/api/profile', { credentials: 'include' })
      if (!res.ok) return null
      const data = await res.json().catch(() => ({ profile: null }))
      return (data.profile ?? null) as Profile | null
    },
  })
  const profile = user ? (profileQuery.data ?? null) : null
  const profileLoading = !!user && profileQuery.isPending

  const signInWithGoogle = useCallback(
    async (redirectTo?: string) => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callbackUrl(redirectTo) },
      })
      if (error) throw new Error(error.message)
    },
    [supabase]
  )

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error(error.message)
    },
    [supabase]
  )

  /**
   * Creates the account and, when confirmations are off, signs in immediately.
   * `needsConfirmation` is true when Supabase requires an email click before the
   * session is live, so the caller can show "check your inbox" instead of
   * assuming it's logged in.
   */
  const signUp = useCallback(
    async (email: string, password: string, redirectTo?: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: callbackUrl(redirectTo) },
      })
      if (error) throw new Error(error.message)
      return { needsConfirmation: !data.session }
    },
    [supabase]
  )

  /** Sends a reset link that returns through /auth/callback with a live session. */
  const resetPassword = useCallback(
    async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: callbackUrl('/app'),
      })
      if (error) throw new Error(error.message)
    },
    [supabase]
  )

  const signOut = useCallback(async () => {
    resetIdentity()
    // Drop the persisted query cache synchronously — the redirect below kills
    // the page before the persister's throttled write could flush a cleared
    // cache, and the next account must not restore this user's data.
    try {
      window.localStorage.removeItem(QUERY_CACHE_STORAGE_KEY)
    } catch {
      // Storage can be unavailable (private mode); never block sign-out.
    }
    await supabase.auth.signOut()
    window.location.href = '/'
  }, [supabase])

  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update profile')
      }
      const data = await res.json()
      queryClient.setQueryData(['profile', user?.id], data.profile ?? null)
      return data.profile as Profile
    },
    [queryClient, user?.id]
  )

  return {
    user,
    session: supabaseUser,
    profile,
    loading: sessionLoading || profileLoading,
    signInWithGoogle,
    signInWithPassword,
    signUp,
    resetPassword,
    signOut,
    updateProfile,
    isAuthenticated: !!user,
    needsOnboarding: !!user && !profile?.onboarding_completed,
  }
}
