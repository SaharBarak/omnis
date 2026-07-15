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
    signInWithPassword,
    signUp,
    resetPassword,
    signOut,
    updateProfile,
    isAuthenticated: !!user,
    needsOnboarding: !!user && !profile?.onboarding_completed,
  }
}
