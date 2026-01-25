'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient()
      const redirectTo = searchParams.get('redirectTo') || '/app'

      // Check if there's a code in the URL (PKCE flow)
      const code = searchParams.get('code')

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          console.error('Error exchanging code:', error)
          setError(error.message)
          return
        }
      }

      // Get the current session (handles both code exchange and hash fragment)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('Error getting session:', sessionError)
        setError(sessionError.message)
        return
      }

      if (!session) {
        // Try to get session from URL hash (implicit flow)
        const { data: { session: hashSession }, error: hashError } = await supabase.auth.getSession()

        if (hashError || !hashSession) {
          console.error('No session found')
          setError('Authentication failed. Please try again.')
          setTimeout(() => router.push('/login'), 2000)
          return
        }
      }

      const user = session?.user
      if (!user) {
        setError('No user found')
        setTimeout(() => router.push('/login'), 2000)
        return
      }

      // Check if user has a profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .maybeSingle()

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError)
      }

      // If no profile, create one
      if (!profile) {
        const displayName = user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          'User'

        const { error: insertError } = await supabase.from('profiles').insert({
          user_id: user.id,
          display_name: displayName,
          avatar_url: user.user_metadata?.avatar_url,
          onboarding_completed: false,
        })

        if (insertError) {
          console.error('Error creating profile:', insertError)
        }

        router.push('/onboarding')
        return
      }

      // Check if onboarding is completed
      if (!profile.onboarding_completed) {
        router.push('/onboarding')
        return
      }

      // All good, redirect to app
      router.push(redirectTo)
    }

    handleCallback()
  }, [router, searchParams])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-2">{error}</p>
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p>Completing sign in...</p>
      </div>
    </div>
  )
}

function AuthCallbackFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p>Loading...</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackFallback />}>
      <AuthCallbackContent />
    </Suspense>
  )
}
