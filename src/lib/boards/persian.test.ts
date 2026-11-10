/**
 * The Persian date's board on 2026-11-08, 17 Aban 1405, and on days that
 * hold its edges, read off Iran's calendar: Azar from 22 November; Yalda on
 * the night of 21 December; Chaharshanbe Suri on the evening of Tuesday 16
 * March 2027; Oil Nationalization Day on 20 March, the Tahvil that evening
 * at 20:25 UTC (USNO; 20:24:43 by the ephemeris, 23:54 in Tehran), and
 * Nowruz 1406 on 21 March; the 31st of Khordad, 21 June 2026.
 */
import { describe, expect, it } from 'vitest'
import { shiftDay } from '@pleiad/engine/calculations/day-search'
import { expectBoardRules } from './board-rules'
import { persianBoard } from './persian'
import type { CalendarView, DayBoard } from './types'

const board = (day: string): DayBoard => {
  const built = persianBoard(day)
  if (!built) throw new Error(`no Persian board for ${day}`)
  return built
}
const view = (b: DayBoard, id: string): CalendarView | undefined => b.views?.find((v) => v.id === id)
const cells = (b: DayBoard, id: string) => view(b, id)?.sections.flatMap((s) => s.cells) ?? []
const cell = (b: DayBoard, id: string, key: string) => cells(b, id).find((c) => c.key === key)

const DAY = '2026-11-08'
const EDGES = ['2026-06-21', '2026-12-21', '2027-03-16', '2027-03-20', '2027-03-21']

describe('persianBoard', () => {
  it.each([DAY, ...EDGES])('holds the board rules on %s', (day) => {
    expectBoardRules(board(day), `persian ${day}`, shiftDay, day)
  })

  it('sets its grids right to left, as its own pages do, Saturday at the right', () => {
    const views = board(DAY).views ?? []
    expect(views.filter((v) => v.dir === 'rtl').map((v) => v.id)).toEqual(['month', 'year'])
  })

  it('reads 17 Aban 1405, Sorush day, and lists Next nearest-first', () => {
    const b = board(DAY)
    expect([b.value, b.mast?.numeral.text, b.mast?.script?.text]).toEqual(['17 Aban 1405', '۱۷', 'آبان ۱۴۰۵'])
    expect(Object.fromEntries(b.facts.map((f) => [f.label, f.value]))).toMatchObject({
      'Day name': 'Sorush, سروش: Sraosha, hearkening',
      Dari: 'Aqrab, عقرب',
      Tahvil: '20 Mar 2027, 23:54 Tehran time',
    })
    expect(b.next.map((e) => [e.name, e.date, e.inDays, e.at?.view, e.at?.cell])).toEqual([
      ['Azar begins', '2026-11-22', 14, 'year', '2026-11-22'],
      ['Azargan', '2026-11-30', 22, 'year', '2026-11-22'],
      ['Yalda, from sunset', '2026-12-21', 43, 'year', '2026-11-22'],
      ['Deygan, Ohrmazd day', '2026-12-22', 44, 'year', '2026-12-22'],
      ['Deygan, Dey-be-Azar day', '2026-12-29', 51, 'year', '2026-12-22'],
    ])
  })

  it('lays the month from Saturday, its Fridays red under their day names', () => {
    const b = board(DAY)
    expect(view(b, 'month')?.sections[0]?.heads?.[0]?.said).toBe('Saturday')
    expect(cells(b, 'month').filter((c) => c.tint === 'red').map((c) => c.title)).toEqual(['Ohrmazd', 'Dey-be-Azar', 'Dey-be-Mehr', 'Bad', 'Mahraspand'])
    expect(cell(b, 'month', '2026-11-01')?.events?.map((e) => [e.name, e.key])).toEqual([['Abangan', 'jashn']])
  })

  it('marks the year’s last evenings, its last holiday and the Tahvil', () => {
    const b = board('2027-03-20')
    expect(cell(b, 'month', '2027-03-16')?.events?.map((e) => e.name)).toEqual(['Chaharshanbe Suri, from sunset'])
    const last = cell(b, 'month', '2027-03-20')
    expect([last?.tint, last?.events?.map((e) => e.name)]).toEqual(['red', ['Oil Nationalization Day', 'Tahvil, 23:54 Tehran time']])
  })

  it('opens 1406 at Nowruz, a holiday', () => {
    const b = board('2027-03-21')
    expect(b.value).toBe('1 Farvardin 1406')
    expect([cell(b, 'month', '2027-03-21')?.tint, cell(b, 'month', '2027-03-21')?.events?.map((e) => e.name)]).toEqual(['red', ['Nowruz, day 1']])
  })

  it('rings the thirty names in four weeks, a 31st unnamed', () => {
    const names = view(board('2026-06-21'), 'names')
    const ring = names?.sections.flatMap((s) => s.cells) ?? []
    expect([names?.layout, ring.length, names?.caption]).toEqual(['ring', 31, 'Read onto the civil days 1 to 30; the 31st has none'])
    expect([ring[30]?.title, ring[30]?.band, ring[30]?.state]).toEqual([undefined, undefined, 'today'])
    expect(new Set(ring.slice(0, 30).map((c) => c.band))).toEqual(new Set(['week-1', 'week-2', 'week-3', 'week-4']))
    expect(cells(board(DAY), 'names').filter((c) => c.keys?.includes('jashn')).map((c) => c.title)).toEqual(['Aban'])
  })

  it('sets the year’s months under their signs, by season', () => {
    const year = cells(board(DAY), 'year')
    expect(year.map((c) => c.band)).toEqual(['spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter', 'winter', 'winter'])
    expect(year.every((c) => c.mark?.kind === 'glyph')).toBe(true)
  })
})
