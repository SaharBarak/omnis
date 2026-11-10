import { readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'
import { findRoute, siteHref } from './routes'
import { V2_BASE, V2_GATE, V2_PATHS, v2Href, v2Owns } from './v2-routes'
import { loginHref } from '@/lib/auth/gates'

const TREE = join(process.cwd(), 'src/app', V2_BASE)

const walk = (dir: string): readonly string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })

const pages = (): readonly string[] =>
  walk(TREE)
    .filter((file) => file.endsWith(`${sep}page.tsx`))
    .map((file) => relative(TREE, file).split(sep).slice(0, -1))
    .filter((segments) => !segments.some((s) => s.startsWith('_')))
    .map((segments) => `/${segments.filter((s) => !/^\(.+\)$/.test(s)).join('/')}`)

describe('the v2 overlay', () => {
  it('has a row for every page and a page for every row', () => {
    expect([...pages()].sort()).toEqual([...V2_PATHS].sort())
  })

  it('names only paths the route table has', () => {
    expect(V2_PATHS.filter((path) => findRoute(path) === undefined)).toEqual([])
  })

  it('serves what it owns and hands the rest to the bento site', () => {
    expect(v2Href('/')).toBe(V2_BASE)
    expect(v2Href('/app')).toBe(`${V2_BASE}/app`)
    expect(v2Href('/pricing')).toBe(siteHref('/pricing'))
  })

  it('serves every signed-in page, patterns filled one segment each, and no public page it has not built', () => {
    expect(v2Owns('/app/people')).toBe(true)
    expect(v2Href('/app/pair/a1/b2')).toBe(`${V2_BASE}/app/pair/a1/b2`)
    expect(v2Owns('/app/pair/a1')).toBe(false)
    expect(v2Owns('/learn')).toBe(false)
    expect(v2Href('/learn/dreamspell')).toBe(siteHref('/learn/dreamspell'))
  })

  it('keeps query and hash', () => {
    expect(v2Href('/#pair')).toBe(`${V2_BASE}#pair`)
    expect(v2Href('/app?add=1')).toBe(`${V2_BASE}/app?add=1`)
    expect(v2Href('/map?x=1#y')).toBe(`${V2_BASE}/map?x=1#y`)
    expect(v2Href('/pair?x=1#y')).toBe(siteHref('/pair?x=1#y'))
  })

  it('signs in on the bento login and returns to the v2 page', () => {
    expect(loginHref(V2_GATE.prefix, v2Href('/app'))).toBe(`${siteHref('/login')}?redirectTo=${encodeURIComponent(`${V2_BASE}/app`)}`)
    expect(V2_GATE).toEqual({ prefix: `${V2_BASE}/app`, login: siteHref('/login'), home: `${V2_BASE}/app` })
  })
})
