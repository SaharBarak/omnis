import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

type CookieToSet = { name: string; value: string; options?: CookieOptions }

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const redirectTo = requestUrl.searchParams.get('redirectTo') || '/app'
  const origin = requestUrl.origin

  console.log('[AuthCallback] Request URL:', request.url)
  console.log('[AuthCallback] Code:', code ? 'present' : 'missing')
  console.log('[AuthCallback] Error:', error)
  console.log('[AuthCallback] Error Description:', errorDescription)
  console.log('[AuthCallback] RedirectTo:', redirectTo)

  // Handle OAuth errors
  if (error) {
    console.error('[AuthCallback] OAuth error:', error, errorDescription)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDescription || error)}`)
  }

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: CookieToSet[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing sessions.
            }
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[AuthCallback Route] Exchange error:', error)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }

    // Check if user has completed onboarding
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('user_id', data.user.id)
        .maybeSingle()

      // Create profile if it doesn't exist
      if (!profile) {
        const displayName =
          (data.user.user_metadata?.full_name as string) ||
          (data.user.user_metadata?.name as string) ||
          data.user.email?.split('@')[0] ||
          'User'

        await supabase.from('profiles').insert({
          user_id: data.user.id,
          display_name: displayName,
          avatar_url: data.user.user_metadata?.avatar_url as string | undefined,
          onboarding_completed: false,
        })

        return NextResponse.redirect(`${origin}/onboarding`)
      }

      if (!profile.onboarding_completed) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }
    }

    return NextResponse.redirect(`${origin}${redirectTo}`)
  }

  // No code present, redirect to login
  console.error('[AuthCallback Route] No code in URL')
  return NextResponse.redirect(`${origin}/login?error=No authentication code provided`)
}
