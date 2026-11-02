/**
 * The bento site map as data (docs/redesign/BENTO_SITE.md). Navigation,
 * footer, wireframe index and the sitemap read this table; components never
 * spell an internal URL themselves. `SITE_BASE` is the lab prefix today and
 * becomes '' when the tree is promoted to the root.
 */

export const SITE_BASE = '/lab/bento'

export type TemplateId =
  | 'home'
  | 'tool'
  | 'board'
  | 'pricing'
  | 'library'
  | 'article'
  | 'document'
  | 'auth'
  | 'app-list'
  | 'app-person'
  | 'app-relation'
  | 'app-system'

export type NavGroup = 'product' | 'tools' | 'learn' | 'company' | 'legal' | 'app' | 'app-systems' | 'app-account'

/** The signed-in groups: the app's own pages, its system pages and the account's pages. */
export const APP_GROUPS: readonly NavGroup[] = ['app', 'app-systems', 'app-account']

export interface SiteRoute {
  readonly path: string
  readonly label: string
  readonly template: TemplateId
  readonly group: NavGroup
  readonly auth: boolean
  /** The live route this page replaces, for promotion and for links back to features not yet rebuilt. */
  readonly live: string
  /** Indexed after promotion. The lab tree itself is never indexed. */
  readonly indexed: boolean
  /** A dynamic route (`[param]` segments): reached by link, never listed in navigation. */
  readonly pattern: boolean
}

/** Query parameter the auth flow reads to return a user to where they started (matches middleware). */
export const AUTH_RETURN_PARAM = 'redirectTo'

const route = (
  path: string,
  label: string,
  template: TemplateId,
  group: NavGroup,
  live: string = path,
  auth = APP_GROUPS.includes(group),
): SiteRoute => ({
  path,
  label,
  template,
  group,
  auth,
  live,
  indexed: !auth && group !== 'legal',
  pattern: path.includes('['),
})

export const SITE_ROUTES: readonly SiteRoute[] = [
  route('/', 'Home', 'home', 'product'),
  route('/map', 'Make a map', 'tool', 'tools', '/calculate'),
  route('/pair', 'Two people', 'tool', 'tools', '/compatibility'),
  route('/circle', 'A circle', 'tool', 'tools', '/compatibility'),
  route('/today', 'Today', 'board', 'tools'),
  route('/pricing', 'Pricing', 'pricing', 'product'),
  route('/learn', 'Library', 'library', 'learn'),
  route('/learn/[slug]', 'Article', 'article', 'learn'),
  route('/about', 'About', 'document', 'company'),
  route('/contact', 'Contact', 'document', 'company'),
  route('/terms', 'Terms', 'document', 'legal'),
  route('/privacy', 'Privacy', 'document', 'legal'),
  route('/refund', 'Refunds', 'document', 'legal'),
  route('/login', 'Sign in', 'auth', 'company'),
  route('/app', 'Today', 'board', 'app'),
  route('/app/people', 'People', 'app-list', 'app'),
  route('/app/people/[id]', 'Person', 'app-person', 'app'),
  route('/app/pair/[a]/[b]', 'Two people', 'app-relation', 'app'),
  route('/app/groups', 'Circles', 'app-list', 'app'),
  route('/app/groups/[id]', 'Circle', 'app-relation', 'app'),
  route('/app/calendar', 'Calendar', 'app-system', 'app'),
  route('/app/library', 'Library', 'library', 'app'),
  route('/app/library/[slug]', 'Article', 'article', 'app'),
  route('/app/settings', 'Settings', 'app-system', 'app-account'),
  route('/app/numerology', 'Numerology', 'app-system', 'app-systems'),
  route('/app/bazi', 'BaZi', 'app-system', 'app-systems'),
  route('/app/gene-keys', 'Gene Keys', 'app-system', 'app-systems'),
  route('/app/oracles', 'Oracles', 'app-system', 'app-systems'),
  route('/app/tree-of-life', 'Tree of Life', 'app-system', 'app-systems'),
  route('/app/moon', 'Moon', 'app-system', 'app-systems'),
]

/** Internal link inside the bento tree. Accepts a path with optional query or hash. */
export const siteHref = (path: string): string => {
  if (!path.startsWith('/')) throw new RangeError(`siteHref needs an absolute path, got "${path}"`)
  return path === '/' ? SITE_BASE || '/' : `${SITE_BASE}${path}`
}

/** Values a dynamic row can take, by its pattern: `{ '/learn/[slug]': ['dreamspell', …] }`. */
export type PatternValues = Readonly<Record<string, readonly string[]>>

const SEGMENT = /^[a-z0-9-]+$/

const fillsPattern = (pattern: string, path: string, allowed: readonly string[]): boolean => {
  const head = pattern.slice(0, pattern.indexOf('['))
  if (!path.startsWith(head)) return false
  const value = path.slice(head.length)
  return SEGMENT.test(value) && allowed.includes(value)
}

/**
 * The page in this tree that replaces a live href (with any query or hash),
 * or null when there is none. Static rows match on the table's `live`
 * column; a dynamic row matches when its parameter is one of the values
 * given for its pattern.
 */
export function sitePageForLive(href: string, values: PatternValues = {}): string | null {
  const cut = href.search(/[?#]/)
  const path = cut < 0 ? href : href.slice(0, cut)
  const rest = cut < 0 ? '' : href.slice(cut)
  const row = SITE_ROUTES.find((r) => !r.pattern && r.live === path)
  if (row) return siteHref(`${row.path}${rest}`)
  const dynamic = SITE_ROUTES.some((r) => r.pattern && fillsPattern(r.path, path, values[r.path] ?? []))
  return dynamic ? siteHref(`${path}${rest}`) : null
}

/** Content written against live paths: the page here when there is one, the live path otherwise. */
export const siteHrefForLive = (href: string): string => sitePageForLive(href) ?? href

export const findRoute = (path: string): SiteRoute | undefined => SITE_ROUTES.find((r) => r.path === path)

/** A page's title is its row's label, so nav, footer and the page head agree. */
export function routeTitle(path: string): string {
  const route = findRoute(path)
  if (!route) throw new Error(`No site route for ${path}`)
  return route.label
}

/**
 * Whether a nav link to `href` is the page at `pathname`: an exact match, or,
 * unless `exact`, a page under it on a segment boundary (`/app/people/x` is
 * under `/app/people`; `/apple` is not under `/app`).
 */
export const isCurrentLink = (pathname: string, href: string, exact = false): boolean =>
  pathname === href || (!exact && pathname.startsWith(`${href}/`))

/** Listed routes in the given groups, in table order. Dynamic routes are never listed. */
export const routesIn = (...groups: readonly NavGroup[]): readonly SiteRoute[] =>
  SITE_ROUTES.filter((r) => !r.pattern && groups.includes(r.group))

/** The marketing bar: every public tool, then the library and pricing. */
export const PRIMARY_NAV: readonly string[] = ['/map', '/pair', '/circle', '/today', '/learn', '/pricing']

export const primaryNav = (): readonly SiteRoute[] =>
  PRIMARY_NAV.map((path) => {
    const found = findRoute(path)
    if (!found) throw new Error(`PRIMARY_NAV names an unknown route: ${path}`)
    return found
  })

/** Login link that returns the user to `path` inside the site afterwards. */
export const signInHref = (path: string): string =>
  `${siteHref('/login')}?${AUTH_RETURN_PARAM}=${encodeURIComponent(siteHref(path))}`

/** What the middleware guards for this tree: the signed-in app, its login and where a signed-in visitor lands. */
export const SITE_GATE = Object.freeze({
  prefix: siteHref('/app'),
  login: siteHref('/login'),
  home: siteHref('/app'),
})
