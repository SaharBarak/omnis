import { SITE_GATE } from '@/lib/site/routes'

/**
 * Which paths need a session, where a signed-out visitor goes, and where a
 * signed-in visitor on a login page goes instead. Middleware reads this
 * table; each site tree guards its own app and sends visitors to its own
 * login.
 */

export interface Gate {
  readonly prefixes: readonly string[]
  readonly login: string
  readonly home: string
  readonly authPaths: readonly string[]
}

/** The live site's gate; its login is the fallback for any path no gate owns. */
const LIVE_GATE: Gate = {
  prefixes: ['/app', '/dashboard', '/people', '/profile', '/onboarding'],
  login: '/login',
  home: '/app',
  authPaths: ['/login', '/signup'],
}

export const GATES: readonly Gate[] = [
  LIVE_GATE,
  {
    prefixes: [SITE_GATE.prefix],
    login: SITE_GATE.login,
    home: SITE_GATE.home,
    authPaths: [SITE_GATE.login],
  },
]

/**
 * The path a router would serve: percent-decoded, lower-cased, without a
 * trailing slash. Gating the normalised form means an encoded or re-cased
 * spelling of a gated path is still gated; over-gating a path that would 404
 * anyway costs nothing.
 */
export const normalisePath = (pathname: string): string => {
  let path = pathname
  try {
    path = decodeURIComponent(pathname)
  } catch {
    // A malformed escape is gated by its raw spelling.
  }
  path = path.toLowerCase().replace(/\/+$/, '')
  return path === '' ? '/' : path
}

/** `/app` covers `/app` and `/app/…`, never `/apple`. */
export const underPrefix = (pathname: string, prefix: string): boolean => {
  const path = normalisePath(pathname)
  return path === prefix || path.startsWith(`${prefix}/`)
}

/** The gate guarding this path, if any. */
export const gateFor = (pathname: string): Gate | undefined =>
  GATES.find((g) => g.prefixes.some((prefix) => underPrefix(pathname, prefix)))

/** The gate whose login page this is, so a signed-in visitor can be sent home. */
export const signedInGate = (pathname: string): Gate | undefined => {
  const path = normalisePath(pathname)
  return GATES.find((g) => g.authPaths.includes(path))
}

/** The login page of the gate that owns this path, or the live login when no gate does. */
export const loginFor = (pathname: string): string => (gateFor(pathname) ?? LIVE_GATE).login

/**
 * The login that owns `pathname`, sending the visitor back to `returnTo`
 * (path and query) once signed in. The login page re-checks `returnTo` with
 * `safeRedirect`.
 */
export const loginHref = (pathname: string, returnTo: string, extra: Readonly<Record<string, string>> = {}): string =>
  `${loginFor(pathname)}?${new URLSearchParams({ ...extra, redirectTo: returnTo })}`

/**
 * Where middleware sends a request, as a path with its query, or null to let
 * it through: a signed-out visitor on a gated path goes to that gate's login
 * and keeps the full path and query to come back to; a signed-in visitor on a
 * login page goes to that tree's home.
 */
export function gateRedirect(pathname: string, search: string, signedIn: boolean): string | null {
  if (!signedIn) return gateFor(pathname) ? loginHref(pathname, `${pathname}${search}`) : null
  return signedInGate(pathname)?.home ?? null
}
