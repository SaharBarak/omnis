import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectTo = searchParams.get('redirectTo') || '/app'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Check if user has a profile
      const profileResult = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('user_id', data.user.id)
        .maybeSingle()

      const profile = profileResult.data as { onboarding_completed: boolean } | null
      const profileError = profileResult.error

      // If no profile or onboarding not completed, redirect to onboarding
      const needsOnboarding = profileError || !profile || !profile.onboarding_completed

      if (needsOnboarding) {
        // Create profile if it doesn't exist
        if (!profile) {
          const displayName = data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            data.user.email?.split('@')[0] ||
            'User'

          await supabase.from('profiles').insert({
            user_id: data.user.id,
            display_name: displayName,
            avatar_url: data.user.user_metadata?.avatar_url,
            onboarding_completed: false,
          })
        }

        return NextResponse.redirect(`${origin}/onboarding`)
      }

      // Onboarding completed, redirect to intended destination
      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  }

  // Something went wrong, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
