'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useUser } from '@auth0/nextjs-auth0'
import type { profiles } from '@/lib/db/schema'

export type Profile = typeof profiles.$inferSelect

function loginUrl(params: Record<string, string>): string {
  const qs = new URLSearchParams(params)
  return `/auth/login?${qs.toString()}`
}

/**
 * App-facing auth hook — same API as the Better Auth era. Identity comes
 * from the Auth0 session (via /auth/profile); the app profile still loads
 * from /api/profile. Sign-in is redirect-based (Auth0 Universal Login), so
 * the signIn* helpers navigate instead of resolving.
 */
export function useAuth() {
  const { user: auth0User, isLoading: sessionLoading } = useUser()

  const user = useMemo(() => {
    if (!auth0User?.sub) return null
    return {
      id: auth0User.sub,
      email: auth0User.email ?? '',
      name: auth0User.name ?? null,
      image: auth0User.picture ?? null,
    }
  }, [auth0User])

  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

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

  const signInWithGoogle = useCallback(async (redirectTo?: string) => {
    window.location.href = loginUrl({
      connection: 'google-oauth2',
      returnTo: redirectTo || '/app',
    })
  }, [])

  const signInWithApple = useCallback(async (redirectTo?: string) => {
    window.location.href = loginUrl({
      connection: 'apple',
      returnTo: redirectTo || '/app',
    })
  }, [])

  const signInWithEmail = useCallback(
    async (email: string, redirectTo?: string) => {
      window.location.href = loginUrl({
        connection: 'Username-Password-Authentication',
        login_hint: email,
        returnTo: redirectTo || '/app',
      })
    },
    []
  )

  const signOut = useCallback(async () => {
    window.location.href = '/auth/logout'
  }, [])

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
    session: auth0User ?? null,
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
