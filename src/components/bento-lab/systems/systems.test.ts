import { describe, expect, it } from 'vitest'
import { dateToKin } from '@pleiad/engine/calculations/dreamspell'
import { monthGrid, monthOf, shiftMonth } from './calendar-grid'
import { BAZI_SPEC } from './bazi-view'
import { CALENDAR_SPEC } from './calendar-view'
import { GENE_KEYS_SPEC } from './gene-keys-view'
import { SYSTEM_ART } from './art'
import { ageOn, defaultPersonId, listAnd, requiredParts, roman, undash, undashProse } from './model'
import { MOON_SPEC } from './moon-view'
import { NUMEROLOGY_SPEC } from './numerology-view'
import { ORACLES_SPEC } from './oracles-view'
import { TREE_SPEC } from './tree-view'
import { docStructure } from '@/lib/docs/content'
import { routesIn, findRoute, routeTitle, siteHref, sitePageForLive  } from '@/lib/site/routes'
import { ARTICLE_BY_SLUG } from '@/lib/library/articles'
import { PLANS } from '@/lib/services/billing'
import { planThatOpens } from '@/lib/site/plans'
import { DEFAULT_SYSTEM_PREFERENCES, SYSTEM_KEYS } from '@/lib/system-preferences'
import type { TodayAcrossSystems } from '@/lib/today-board'
import { TODAY_ROWS, todayRows } from '@/lib/today-rows'

describe('undash', () => {
  it('sets dash-joined clauses as sentences', () => {
    expect(undash('The initiator — independence, drive, beginnings')).toBe('The initiator. Independence, drive, beginnings')
    expect(undash('Pure force — sublime success.')).toBe('Pure force. Sublime success.')
    expect(undash('Already ended. — next')).toBe('Already ended. Next')
  })
  it('leaves text without a dash alone', () => {
    expect(undash('Rest, surrender, closure')).toBe('Rest, surrender, closure')
  })
  it('keeps prose flowing with a comma', () => {
    expect(undashProse('the sefirot — each a vessel — pour down')).toBe('the sefirot, each a vessel, pour down')
  })
})

describe('person choice', () => {
  it("defaults to the account's own person, else the first", () => {
    expect(defaultPersonId([{ id: 'a', is_self: false }, { id: 'b', is_self: true }])).toBe('b')
    expect(defaultPersonId([{ id: 'a', is_self: false }])).toBe('a')
    expect(defaultPersonId([])).toBeNull()
  })
  it('reads requirements from the catalog flags', () => {
    expect(requiredParts({ requiresTime: true, requiresLocation: true })).toEqual(['time', 'place'])
    expect(requiredParts({ requiresTime: true })).toEqual(['time'])
    expect(requiredParts({})).toEqual([])
  })
  it('counts whole years to a day', () => {
    expect(ageOn('1990-06-15', '2026-06-14')).toBe(35)
    expect(ageOn('1990-06-15', '2026-06-15')).toBe(36)
  })
})

describe('plan gate', () => {
  it('names the cheapest plan that includes a system', () => {
    const opens = planThatOpens('numerology')
    expect(opens).not.toBeNull()
    const cheaper = Object.values(PLANS).filter((p) => p.price < PLANS[opens ?? 'free'].price)
    expect(cheaper.every((p) => !(p.limits.systems as readonly string[]).includes('numerology'))).toBe(true)
  })
  it('returns null for a system no plan lists', () => {
    expect(planThatOpens('no-such-system')).toBeNull()
  })
})

describe('links into the tree', () => {
  it('maps static routes and known slugs, drops the rest', () => {
    expect(sitePageForLive('/app/numerology')).toBe(siteHref('/app/numerology'))
    expect(sitePageForLive('/learn/tzolkin', { '/learn/[slug]': ['tzolkin'] })).toBe(siteHref('/learn/tzolkin'))
    expect(sitePageForLive('/learn/unknown', { '/learn/[slug]': ['tzolkin'] })).toBeNull()
    expect(sitePageForLive('/app/calendars/panchang')).toBeNull()
    expect(sitePageForLive('/learn/tzolkin')).toBeNull()
  })
  it('writes Roman numerals for card faces', () => {
    expect([0, 1, 4, 9, 14, 21].map(roman)).toEqual(['0', 'I', 'IV', 'IX', 'XIV', 'XXI'])
  })
  it('lists in prose', () => {
    expect(listAnd(['11', '22', '33'])).toBe('11, 22 and 33')
    expect(listAnd(['a'])).toBe('a')
  })
})

describe('system page specs', () => {
  const specs = [NUMEROLOGY_SPEC, BAZI_SPEC, GENE_KEYS_SPEC, ORACLES_SPEC, TREE_SPEC, MOON_SPEC, CALENDAR_SPEC]
  const guides = new Set(docStructure.sections.map((x) => x.id))
  it.each(specs.map((x) => [x.path, x] as const))('%s binds a route, an article and a guide that exist', (_, spec) => {
    expect(findRoute(spec.path)?.label).toBe(spec.title)
    expect(routeTitle(spec.path)).toBe(spec.title)
    if (spec.article) expect(ARTICLE_BY_SLUG[spec.article]).toBeDefined()
    if (spec.guide) expect(guides.has(spec.guide.slug)).toBe(true)
  })
  it('keeps copy free of em dashes and of the word six', () => {
    for (const spec of specs) {
      for (const text of [spec.lead, spec.reads, spec.eyebrow]) {
        expect(text).not.toMatch(/—|\bsix\b/i)
      }
    }
  })
})

describe('calendar grid', () => {
  it('starts on a Sunday and covers the month', () => {
    const cells = monthGrid(2026, 9)
    expect(new Date(`${cells[0].iso}T00:00:00Z`).getUTCDay()).toBe(0)
    expect(cells.filter((c) => c.inMonth)).toHaveLength(31)
    expect(cells.length % 7).toBe(0)
  })
  it('carries the engine kin', () => {
    const dec2012 = monthGrid(2012, 11).find((c) => c.iso === '2012-12-21')
    expect(dec2012?.kin).toBe(dateToKin('2012-12-21'))
    expect(dec2012?.kin).toBe(207)
  })
  it('steps months across years', () => {
    expect(shiftMonth({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 })
    expect(shiftMonth(monthOf('2026-12-03'), 1)).toEqual({ year: 2027, month: 0 })
  })
})

describe('today rows', () => {
  const board: TodayAcrossSystems = {
    kin: 'Kin 1',
    moon: 'Full Moon',
    sun: 'Libra 18°',
    gate: 'Gate 50.1',
    hebrewDate: '',
    sidereal: 'Virgo 24°',
    hijri: 'x',
    persian: 'x',
    chineseYear: 'x',
    panchang: 'x',
    longCount: '13.0.13.15.6',
  }
  it('maps every row to a preference key', () => {
    expect(TODAY_ROWS.every((r) => SYSTEM_KEYS.includes(r.system))).toBe(true)
  })
  it('skips empty values and rows the user turned off', () => {
    const rows = todayRows(board, { ...DEFAULT_SYSTEM_PREFERENCES, moon: false })
    expect(rows.map((r) => r.label)).not.toContain('Moon')
    expect(rows.map((r) => r.label)).not.toContain('Hebrew date')
  })
  it('shows every filled row when all are off', () => {
    const off = Object.fromEntries(SYSTEM_KEYS.map((k) => [k, false])) as typeof DEFAULT_SYSTEM_PREFERENCES
    expect(todayRows(board, off)).toHaveLength(TODAY_ROWS.length - 1)
  })
})

describe('system art', () => {
  it('has art for every system page and the calendar', () => {
    const paths = [...routesIn('app-systems').map((r) => r.path), '/app/calendar']
    expect(paths.filter((path) => !SYSTEM_ART[path])).toEqual([])
  })
})
