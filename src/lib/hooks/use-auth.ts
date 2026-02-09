'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
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

  const supabase = useMemo(() => createClient(), [])

  // Fetch user profile from database
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error)
        }
        return null
      }

      return data
    } catch (err) {
      console.error('Exception fetching profile:', err)
      return null
    }
  }, [supabase])

  useEffect(() => {
    let cancelled = false

    // Safety timeout — force loading: false if auth hangs
    const safetyTimeout = setTimeout(() => {
      setState(prev => {
        if (prev.loading) {
          console.warn('[Auth] Safety timeout: forcing loading=false after 10s')
          return { ...prev, loading: false }
        }
        return prev
      })
    }, 10_000)

    // Get the initial session explicitly
    const initSession = async () => {
      try {
        console.log('[Auth] initSession: calling getSession')
        const { data: { session } } = await supabase.auth.getSession()
        console.log('[Auth] initSession: getSession returned', session ? 'session' : 'null')
        if (cancelled) return

        if (session?.user) {
          console.log('[Auth] initSession: fetching profile for', session.user.id)
          const profile = await fetchProfile(session.user.id)
          console.log('[Auth] initSession: fetchProfile returned', profile ? 'profile' : 'null')
          if (cancelled) return
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
      } catch (err) {
        console.error('[Auth] Error getting initial session:', err)
        if (!cancelled) {
          setState(prev => ({ ...prev, loading: false }))
        }
      }
    }

    // Set up auth state listener for subsequent changes (token refresh, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Skip INITIAL_SESSION since we handle it above
        if (event === 'INITIAL_SESSION') return

        if (session?.user) {
          const profile = await fetchProfile(session.user.id)
          if (cancelled) return
          setState({
            user: session.user,
            session,
            profile,
            loading: false,
          })
        } else {
          if (cancelled) return
          setState({
            user: null,
            session: null,
            profile: null,
            loading: false,
          })
        }
      }
    )

    initSession()

    return () => {
      cancelled = true
      clearTimeout(safetyTimeout)
      subscription.unsubscribe()
    }
  }, [supabase.auth, fetchProfile])

  // Sign in with Google OAuth
  const signInWithGoogle = useCallback(async (redirectTo?: string) => {
    const callbackUrl = `${window.location.origin}/auth/callback${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`
    console.log('[Auth] signInWithGoogle called')
    console.log('[Auth] Redirect URL:', callbackUrl)
    console.log('[Auth] Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
      },
    })

    console.log('[Auth] signInWithOAuth response:', { data, error })

    if (error) {
      console.error('[Auth] Google sign-in error:', error)
      throw error
    }
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
