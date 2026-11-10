import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'
import { APP_GROUPS, SITE_BASE, SITE_ROUTES, V2_BASE, V2_PAGES, findRoute, matchRoute, primaryNav, resolveSiteHref, siteHref, siteHrefForLive, signInHref, sitePageForLive } from './routes'

/**
 * The route table is the site's contract (BENTO_SITE.md): every page under the
 * tree is a row, every row has a page, and every internal link a component
 * spells through `siteHref` or `signInHref` lands on a row.
 */

const TREE = join(process.cwd(), 'src/app')
const SOURCES = [TREE, join(process.cwd(), 'src/components/bento-lab')]
/**
 * The route groups the table owns since promotion (docs/redesign/V2_PROMOTION.md):
 * the home, the marketing pages and the app. Standalone flows at the root
 * (newsletter, offline, share, unsubscribe, auth) and the experiments under
 * `/lab` are outside the table by design and are not scanned.
 */
const CONTRACT_DIRS = ['(home)', '(marketing)', 'app'].map((dir) => join(TREE, dir))

const walk = (dir: string): readonly string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })

/** `(site)/learn/[slug]/page.tsx` → `/learn/[slug]`. Route groups vanish, private folders never route. */
const routeOf = (file: string): string | null => {
  const segments = relative(TREE, file).split(sep).slice(0, -1)
  if (segments.some((s) => s.startsWith('_'))) return null
  const path = segments.filter((s) => !/^\(.+\)$/.test(s)).join('/')
  return `/${path}`
}

const pageRoutes = (): ReadonlySet<string> =>
  new Set(
    CONTRACT_DIRS.flatMap(walk)
      .filter((f) => f.endsWith(`${sep}page.tsx`))
      .map(routeOf)
      .filter((r): r is string => r !== null),
  )

const PATTERN_SEGMENT = /^\[.+\]$/

/** Does a concrete path (no query or hash) land on a table row, static or dynamic? */
const resolves = (path: string): boolean => {
  if (findRoute(path)) return true
  const parts = path.split('/')
  return SITE_ROUTES.some((r) => {
    if (!r.pattern) return false
    const want = r.path.split('/')
    return want.length === parts.length && want.every((seg, i) => PATTERN_SEGMENT.test(seg) || seg === parts[i])
  })
}

const LINK = /\b(?:siteHref|signInHref)\(\s*(['"`])(\/[^'"`]*)\1/g

const spelledLinks = (): readonly { readonly file: string; readonly path: string }[] =>
  SOURCES.flatMap(walk)
    .filter((f) => /\.tsx?$/.test(f) && !f.includes('.test.'))
    .flatMap((file) =>
      [...readFileSync(file, 'utf8').matchAll(LINK)].map((m) => ({
        file: relative(process.cwd(), file),
        path: m[2].split(/[?#]/)[0].replace(/\$\{[^}]+\}/g, 'x'),
      })),
    )

describe('site route contract', () => {
  it('has a page for every row and a row for every page', () => {
    const pages = pageRoutes()
    const rows = new Set(SITE_ROUTES.map((r) => r.path))
    expect([...rows].filter((r) => !pages.has(r)), 'rows without a page').toEqual([])
    expect([...pages].filter((p) => !rows.has(p)), 'pages without a row').toEqual([])
  })

  it('resolves every link a component spells', () => {
    const broken = spelledLinks().filter((l) => !resolves(l.path))
    expect(broken).toEqual([])
  })

  it('builds hrefs inside the tree', () => {
    expect(siteHref('/')).toBe(SITE_BASE || '/')
    expect(siteHref('/map?p=x')).toBe(`${SITE_BASE}/map?p=x`)
    expect(signInHref('/app')).toBe(`${SITE_BASE}/login?redirectTo=${encodeURIComponent(`${SITE_BASE}/app`)}`)
    expect(() => siteHref('map')).toThrow(RangeError)
    expect(primaryNav().every((r) => !r.pattern && !r.auth)).toBe(true)
  })
})

describe('siteHrefForLive', () => {
  it('maps a live path to its page in this tree and keeps the hash', () => {
    expect(siteHrefForLive('/refund')).toBe(`${SITE_BASE}/refund`)
    expect(siteHrefForLive('/terms#section-4')).toBe(`${SITE_BASE}/terms#section-4`)
    expect(siteHrefForLive('/calculate')).toBe(`${SITE_BASE}/map`)
  })

  it('leaves a path with no bento page as it is', () => {
    expect(siteHrefForLive('/blog')).toBe('/blog')
  })
})

/** A concrete path for a row: each `[param]` filled with a word of its own. */
const filled = (path: string): string => path.replace(/\[(\w+)\]/g, (_, name: string) => `x-${name}`)

describe('the trees (BENTO_V2.md "The app in v2", "Links")', () => {
  it('links every signed-in row into v2 and every other row into the bento site, but for the pages v2 has built', () => {
    for (const route of SITE_ROUTES) {
      const path = filled(route.path)
      const inV2 = APP_GROUPS.includes(route.group) || V2_PAGES.includes(route.path)
      const v2Path = path === '/' ? V2_BASE || '/' : `${V2_BASE}${path}`
      expect(resolveSiteHref('v2', path), route.path).toBe(inV2 ? v2Path : siteHref(path))
      expect(resolveSiteHref('v1', path), route.path).toBe(siteHref(path))
    }
  })

  it('matches a dynamic row segment by segment and never a path one segment short or long', () => {
    expect(matchRoute('/app/pair/a1/b2')?.path).toBe('/app/pair/[a]/[b]')
    expect(matchRoute('/app/people/a1')?.path).toBe('/app/people/[id]')
    expect(matchRoute('/app/people')?.path).toBe('/app/people')
    expect(matchRoute('/app/pair/a1')).toBeUndefined()
    expect(matchRoute('/app/people/a1/more')).toBeUndefined()
  })

  it('keeps query and hash, and refuses what is not a site path', () => {
    expect(resolveSiteHref('v2', '/app/people?add=1')).toBe(`${V2_BASE}/app/people?add=1`)
    expect(resolveSiteHref('v2', '/app/settings#plan')).toBe(`${V2_BASE}/app/settings#plan`)
    expect(() => resolveSiteHref('v2', '//evil.example/app')).toThrow(RangeError)
    expect(() => resolveSiteHref('v2', 'https://example.com')).toThrow(RangeError)
  })

  it('places live content in the tree that renders it', () => {
    const library = SITE_ROUTES.find((r) => r.path === '/app/library')!
    expect(sitePageForLive(library.live, {}, 'v2')).toBe(`${V2_BASE}/app/library`)
    expect(sitePageForLive(library.live)).toBe(siteHref('/app/library'))
  })
})
