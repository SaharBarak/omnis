import { NextResponse, type NextRequest } from 'next/server'

import { trackServer } from '@/lib/analytics/server'
import { loginHref } from '@/lib/auth/gates'
import { safeRedirect } from '@/lib/auth/safe-redirect'
import { getSupabaseServerClient } from '@/lib/supabase/server'

/** Every link this route completes is mailed, so that is the method when Supabase names none. */
const EMAIL_LINK_METHOD = 'email'

/**
 * Email-link return leg — password reset and email confirmation. Supabase
 * redirects here with a one-time code which we exchange for a session; the
 * cookies are set on the response by the server client.
 *
 * `redirectTo` is attacker-controllable, so it passes through `safeRedirect`,
 * the one same-origin rule every sign-in path shares. A failed exchange goes
 * back to the login of the tree that owns `redirectTo`, still carrying it.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const redirectTo = safeRedirect(searchParams.get('redirectTo'))
  const failed = (error: string) =>
    NextResponse.redirect(`${origin}${loginHref(new URL(redirectTo, origin).pathname, redirectTo, { error })}`)

  if (!code) return failed('missing_code')

  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return failed('auth_failed')

  if (data.user) {
    trackServer('user_logged_in', {
      actor: { userId: data.user.id },
      properties: { method: data.user.app_metadata.provider ?? EMAIL_LINK_METHOD },
      request,
    })
  }

  return NextResponse.redirect(`${origin}${redirectTo}`)
}
