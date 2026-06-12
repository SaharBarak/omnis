'use client'

import { useEffect, useState, useCallback } from 'react'
import { signIn, signOut as authSignOut, useSession } from '@/lib/auth-client'
import type { IProfile } from '@/lib/db/models/profiles'

export type Profile = IProfile & { _id?: string }

function originCallback(redirectTo?: string): string {
  const base =
    typeof window !== 'undefined' ? window.location.origin : ''
  return `${base}${redirectTo || '/app'}`
}

export function useAuth() {
  const { data: sessionData, isPending } = useSession()
  const user = sessionData?.user ?? null
  const session = sessionData?.session ?? null

  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  // Load the app profile from the server (browser cannot query Mongo directly).
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
    const { error } = await signIn.social({
      provider: 'google',
      callbackURL: originCallback(redirectTo),
    })
    if (error) throw new Error(error.message || 'Google sign-in failed')
  }, [])

  const signInWithApple = useCallback(async (redirectTo?: string) => {
    const { error } = await signIn.social({
      provider: 'apple',
      callbackURL: originCallback(redirectTo),
    })
    if (error) throw new Error(error.message || 'Apple sign-in failed')
  }, [])

  const signInWithEmail = useCallback(
    async (email: string, redirectTo?: string) => {
      const { error } = await signIn.magicLink({
        email,
        callbackURL: originCallback(redirectTo),
      })
      if (error) throw new Error(error.message || 'Failed to send login link')
    },
    []
  )

  const signOut = useCallback(async () => {
    await authSignOut()
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
    session,
    profile,
    loading: isPending || profileLoading,
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    signOut,
    updateProfile,
    isAuthenticated: !!user,
    needsOnboarding: !!user && !profile?.onboarding_completed,
  }
}
