import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { gateRedirect } from '@/lib/auth/gates'

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

  // getClaims() verifies the token locally against cached JWKS — no per-request
  // network hop. Gating here is optimistic anyway; routes enforce the real check
  // via requireUserId(). The createServerClient cookie plumbing above still
  // refreshes an expiring token and writes the rolling cookie.
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims?.sub ? data.claims : null

  const target = gateRedirect(request.nextUrl.pathname, request.nextUrl.search, user !== null)
  if (!target) return response

  const redirect = NextResponse.redirect(new URL(target, request.url))
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
  return redirect
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
