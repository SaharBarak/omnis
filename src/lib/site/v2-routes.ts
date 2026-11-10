import { V2_BASE, createSiteHref, servedPaths, siteHref, treeServes } from './routes'

/**
 * Bento v2's links (docs/redesign/BENTO_V2.md "Routes", "The app in v2"):
 * the route table's resolver bound to v2. v2 serves its own pages and the
 * signed-in app; every other path resolves to the bento site, so a v2 link
 * never lands on a page v2 has not built.
 */

export { V2_BASE }

/** The table's paths v2 serves, patterns as written. */
export const V2_PATHS: readonly string[] = servedPaths('v2')

/** Whether v2 serves the page at this path. */
export const v2Owns = (path: string): boolean => treeServes('v2', path)

/** A link from a v2 page: the v2 page when v2 serves the path, the bento site's otherwise. Query and hash are kept. */
export const v2Href = createSiteHref('v2')

/** What the middleware guards for v2: its app, sent to the bento site's login, landing on the v2 dashboard. */
export const V2_GATE = Object.freeze({
  prefix: v2Href('/app'),
  login: siteHref('/login'),
  home: v2Href('/app'),
})
