import { safeRedirect } from './safe-redirect'
import { AUTH_RETURN_PARAM } from '@/lib/site/routes'
import { V2_GATE } from '@/lib/site/v2-routes'

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

/**
 * The one app gate after promotion (docs/redesign/V2_PROMOTION.md): `/app`
 * needs a session, `/login` is where a signed-out visitor goes and the
 * fallback for any path no gate owns, and a signed-in visitor on a login page
 * is sent to `/app`. Derived from `V2_GATE` so the base is the single source.
 */
const APP_GATE: Gate = {
  prefixes: [V2_GATE.prefix],
  login: V2_GATE.login,
  home: V2_GATE.home,
  authPaths: ['/login', '/signup'],
}

export const GATES: readonly Gate[] = [APP_GATE]

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

/** The login page of the gate that owns this path, or the app gate's login when no gate does. */
export const loginFor = (pathname: string): string => (gateFor(pathname) ?? APP_GATE).login

/**
 * The login that owns `pathname`, sending the visitor back to `returnTo`
 * (path and query) once signed in. The login page re-checks `returnTo` with
 * `safeRedirect`.
 */
export const loginHref = (pathname: string, returnTo: string, extra: Readonly<Record<string, string>> = {}): string =>
  `${loginFor(pathname)}?${new URLSearchParams({ ...extra, [AUTH_RETURN_PARAM]: returnTo })}`

/** Where a signed-in visitor on a login page was headed: a safe same-origin `redirectTo` that is not itself a login page, else the tree's home. */
const headedTo = (search: string, home: string): string => {
  const to = safeRedirect(new URLSearchParams(search).get(AUTH_RETURN_PARAM), home)
  return signedInGate(to.split(/[?#]/)[0]) ? home : to
}

/**
 * Where middleware sends a request, as a path with its query, or null to let
 * it through: a signed-out visitor on a gated path goes to that gate's login
 * and keeps the full path and query to come back to; a signed-in visitor on a
 * login page goes where the page would have sent them after signing in (a
 * safe `redirectTo`), or to that tree's home.
 */
export function gateRedirect(pathname: string, search: string, signedIn: boolean): string | null {
  if (!signedIn) return gateFor(pathname) ? loginHref(pathname, `${pathname}${search}`) : null
  const gate = signedInGate(pathname)
  return gate ? headedTo(search, gate.home) : null
}
