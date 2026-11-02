import { NextResponse, type NextRequest } from 'next/server'

import { loginHref } from '@/lib/auth/gates'
import { safeRedirect } from '@/lib/auth/safe-redirect'
import { getSupabaseServerClient } from '@/lib/supabase/server'

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
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return failed('auth_failed')

  return NextResponse.redirect(`${origin}${redirectTo}`)
}
