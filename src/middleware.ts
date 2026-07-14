import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PROTECTED_PATHS = ['/app', '/dashboard', '/people', '/profile', '/onboarding']
const AUTH_PATHS = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  // The response carries Supabase's refreshed auth cookies. Every branch below
  // must copy them onto whatever it returns, or the rolling session never
  // refreshes on gated paths and active users get logged out mid-session.
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    }
  )

  // getUser() revalidates against Supabase; getSession() would trust the cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const redirectWithSession = (pathnameTo: string, withRedirectParam = false) => {
    const url = request.nextUrl.clone()
    url.pathname = pathnameTo
    url.search = ''
    if (withRedirectParam) url.searchParams.set('redirectTo', pathname)
    const redirect = NextResponse.redirect(url)
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
    return redirect
  }

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p))
  if (isProtected && !user) {
    return redirectWithSession('/login', true)
  }

  const isAuthPath = AUTH_PATHS.some((p) => pathname === p)
  if (isAuthPath && user) {
    return redirectWithSession('/app')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image, favicon.ico, icons (static)
     * - api (routes handle their own auth)
     */
    '/((?!_next/static|_next/image|favicon.ico|icons|api).*)',
  ],
}
