import { NextResponse, type NextRequest } from 'next/server'

import { getSupabaseServerClient } from '@/lib/supabase/server'

/**
 * OAuth / email-link return leg. Supabase redirects here with a one-time code
 * which we exchange for a session; the cookies are set on the response by the
 * server client.
 *
 * `redirectTo` is attacker-controllable, so only same-origin relative paths are
 * honoured — an absolute URL here would be an open redirect.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const requested = searchParams.get('redirectTo') ?? '/app'
  const redirectTo = requested.startsWith('/') && !requested.startsWith('//') ? requested : '/app'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await getSupabaseServerClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  return NextResponse.redirect(`${origin}${redirectTo}`)
}
