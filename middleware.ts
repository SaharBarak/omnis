import { NextResponse, type NextRequest } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

const PROTECTED_PATHS = ['/app', '/dashboard', '/people', '/profile']
const AUTH_PATHS = ['/login', '/signup']

export function middleware(request: NextRequest) {
  // Optimistic cookie check only (no DB call — Workers/edge friendly).
  // Routes still enforce the real session via requireUserId().
  const hasSession = Boolean(getSessionCookie(request))
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p))
  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  const isAuthPath = AUTH_PATHS.some((p) => pathname === p)
  if (isAuthPath && hasSession) {
    const url = request.nextUrl.clone()
    url.pathname = '/app'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
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
