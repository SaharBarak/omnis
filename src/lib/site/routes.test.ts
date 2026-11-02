import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SITE_BASE, SITE_ROUTES, findRoute, primaryNav, siteHref, siteHrefForLive, signInHref } from './routes'

/**
 * The route table is the site's contract (BENTO_SITE.md): every page under the
 * tree is a row, every row has a page, and every internal link a component
 * spells through `siteHref` or `signInHref` lands on a row.
 */

const TREE = join(process.cwd(), 'src/app', SITE_BASE)
const SOURCES = [TREE, join(process.cwd(), 'src/components/bento-lab')]
/** Lab tooling inside the tree that the site itself never links to. */
const LAB_ONLY = new Set(['/wireframes'])

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
    walk(TREE)
      .filter((f) => f.endsWith(`${sep}page.tsx`))
      .map(routeOf)
      .filter((r): r is string => r !== null && !LAB_ONLY.has(r)),
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
