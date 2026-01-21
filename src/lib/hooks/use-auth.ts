'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '@/lib/supabase/database.types'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
  })

  const supabase = createClient()

  // Fetch user profile from database
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error)
    }

    return data
  }, [supabase])

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        setState({
          user: session.user,
          session,
          profile,
          loading: false,
        })
      } else {
        setState({
          user: null,
          session: null,
          profile: null,
          loading: false,
        })
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id)
          setState({
            user: session.user,
            session,
            profile,
            loading: false,
          })
        } else {
          setState({
            user: null,
            session: null,
            profile: null,
            loading: false,
          })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth, fetchProfile])

  // Sign in with Google OAuth
  const signInWithGoogle = useCallback(async (redirectTo?: string) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    if (error) throw error
  }, [supabase.auth])

  // Sign in with Apple OAuth
  const signInWithApple = useCallback(async (redirectTo?: string) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/auth/callback${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`,
      },
    })
    if (error) throw error
  }, [supabase.auth])

  // Sign in with Email Magic Link
  const signInWithEmail = useCallback(async (email: string, redirectTo?: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`,
      },
    })
    if (error) throw error
  }, [supabase.auth])

  // Sign out
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [supabase.auth])

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!state.user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', state.user.id)
      .select()
      .single()

    if (error) throw error

    setState(prev => ({ ...prev, profile: data }))
    return data
  }, [supabase, state.user])

  return {
    ...state,
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    signOut,
    updateProfile,
    isAuthenticated: !!state.user,
    needsOnboarding: state.user && !state.profile?.onboarding_completed,
  }
}
