import { NextResponse, type NextRequest } from 'next/server'
import { auth0 } from '@/lib/auth0'

const PROTECTED_PATHS = ['/app', '/dashboard', '/people', '/profile']
const AUTH_PATHS = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  // Auth0 v4 mounts /auth/login, /auth/logout, /auth/callback, /auth/profile
  // here and keeps the session cookie rolling on every request.
  const authResponse = await auth0.middleware(request)

  const { pathname } = request.nextUrl
  if (pathname.startsWith('/auth')) {
    return authResponse
  }

  // Optimistic session check (cookie decrypt, no network). Routes still
  // enforce the real session via requireUserId().
  const session = await auth0.getSession(request)
  const hasSession = Boolean(session?.user)

  // Redirects must carry authResponse's Set-Cookie headers, or Auth0's rolling
  // session cookie never refreshes on gated paths and active users get logged
  // out mid-session.
  const redirectWithSession = (pathnameTo: string, withRedirectParam = false) => {
    const url = request.nextUrl.clone()
    url.pathname = pathnameTo
    url.search = ''
    if (withRedirectParam) url.searchParams.set('redirectTo', pathname)
    const res = NextResponse.redirect(url)
    authResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') res.headers.append(key, value)
    })
    return res
  }

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p))
  if (isProtected && !hasSession) {
    return redirectWithSession('/login', true)
  }

  const isAuthPath = AUTH_PATHS.some((p) => pathname === p)
  if (isAuthPath && hasSession) {
    return redirectWithSession('/app')
  }

  return authResponse
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
