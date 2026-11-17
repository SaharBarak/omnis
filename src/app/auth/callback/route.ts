import { NextResponse, type NextRequest } from 'next/server'

import { trackServer } from '@/lib/analytics/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

/** Every link this route completes is mailed, so that is the method when Supabase names none. */
const EMAIL_LINK_METHOD = 'email'

/**
 * Email-link return leg — password reset and email confirmation. Supabase
 * redirects here with a one-time code which we exchange for a session; the
 * cookies are set on the response by the server client.
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
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  if (data.user) {
    trackServer('user_logged_in', {
      actor: { userId: data.user.id },
      properties: { method: data.user.app_metadata.provider ?? EMAIL_LINK_METHOD },
      request,
    })
  }

  return NextResponse.redirect(`${origin}${redirectTo}`)
}
