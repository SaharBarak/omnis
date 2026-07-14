'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import type { User } from '@supabase/supabase-js'
import { identifyUser, resetIdentity } from '@/lib/analytics/posthog'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { profiles } from '@/lib/db/schema'

export type Profile = typeof profiles.$inferSelect

/**
 * App-facing auth hook. Identity comes from the Supabase session; the app
 * profile still loads from /api/profile.
 *
 * OAuth is redirect-based (navigates away). Email is a magic link: it resolves
 * without navigating, so callers must surface a "check your inbox" state.
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

  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  // Product analytics: tie the anonymous device to the signed-in user.
  // No-op when PostHog is off; identifyUser dedupes repeat calls itself.
  useEffect(() => {
    if (user) identifyUser(user.id, user.email || undefined)
  }, [user])

  // Load the app profile from the server (browser cannot query the DB directly).
  useEffect(() => {
    let cancelled = false
    if (!user) {
      setProfile(null)
      return
    }
    setProfileLoading(true)
    fetch('/api/profile', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : { profile: null }))
      .then((data) => {
        if (!cancelled) setProfile(data.profile ?? null)
      })
      .catch(() => {
        if (!cancelled) setProfile(null)
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  const signInWithOAuth = useCallback(
    async (provider: 'google' | 'apple', redirectTo?: string) => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: callbackUrl(redirectTo) },
      })
      if (error) throw new Error(error.message)
    },
    [supabase]
  )

  const signInWithGoogle = useCallback(
    (redirectTo?: string) => signInWithOAuth('google', redirectTo),
    [signInWithOAuth]
  )

  const signInWithApple = useCallback(
    (redirectTo?: string) => signInWithOAuth('apple', redirectTo),
    [signInWithOAuth]
  )

  /** Sends a magic link. Resolves without navigating — show a "check inbox" state. */
  const signInWithEmail = useCallback(
    async (email: string, redirectTo?: string) => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: callbackUrl(redirectTo) },
      })
      if (error) throw new Error(error.message)
    },
    [supabase]
  )

  const signOut = useCallback(async () => {
    resetIdentity()
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
      setProfile(data.profile)
      return data.profile as Profile
    },
    []
  )

  return {
    user,
    session: supabaseUser,
    profile,
    loading: sessionLoading || profileLoading,
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    signOut,
    updateProfile,
    isAuthenticated: !!user,
    needsOnboarding: !!user && !profile?.onboarding_completed,
  }
}
