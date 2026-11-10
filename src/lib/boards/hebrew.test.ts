/**
 * The Hebrew date's board on 2026-11-08, 28 Heshvan 5787, and on days that
 * hold its edges, read off Hebcal (hebcal.com, CC BY 4.0): Sigd on 9
 * November; the molad of Kislev on Monday 9 November at 22:27 and 3
 * chalakim; Rosh Chodesh Kislev on 10 and 11 November; Toldot on 14
 * November; Hanukkah from the evening of 4 December; Pesach from 22 April
 * 2027, the Omer from its second night, the diaspora's eighth day on 29
 * April; Shavuot on 11 June, Nasso read in Israel the next day and in the
 * diaspora a week later.
 */
import { describe, expect, it } from 'vitest'
import { shiftDay } from '@pleiad/engine/calculations/day-search'
import { expectBoardRules } from './board-rules'
import { hebrewBoard } from './hebrew'
import { skyOf } from './sky'
import type { CalendarView, DayBoard } from './types'

const board = (day: string): DayBoard => {
  const built = hebrewBoard(day, skyOf(day))
  if (!built) throw new Error(`no Hebrew board for ${day}`)
  return built
}
const view = (b: DayBoard, id: string): CalendarView | undefined => b.views?.find((v) => v.id === id)
const cell = (b: DayBoard, id: string, key: string) => view(b, id)?.sections.flatMap((s) => s.cells).find((c) => c.key === key)

const DAY = '2026-11-08'
const EDGES = ['2026-09-12', '2026-09-21', '2026-12-05', '2027-03-23', '2027-04-24', '2027-05-25', '2027-06-11', '2027-08-12', '2027-09-30']

describe('hebrewBoard', () => {
  it.each([DAY, ...EDGES])('holds the board rules on %s', (day) => {
    expectBoardRules(board(day), `hebrew ${day}`, shiftDay, day)
  })

  it('sets its grids right to left, as its own pages do, Sunday at the right', () => {
    const views = board(DAY).views ?? []
    expect(views.filter((v) => v.dir === 'rtl').map((v) => v.id)).toEqual(['month', 'year', 'parasha'])
  })

  it('reads 28 Heshvan 5787 with its year, cycles, molad and portion', () => {
    const b = board(DAY)
    expect([b.value, b.mast?.numeral.text, b.mast?.script?.text]).toEqual(['28 Heshvan 5787', 'כ״ח', 'חשוון תשפ״ז'])
    expect(Object.fromEntries(b.facts.map((f) => [f.label, f.value]))).toMatchObject({
      Year: '5787 · תשפ״ז',
      Keviah: 'זשה: a complete leap year of 385 days',
      Cycle: 'Year 11 of 19, a leap year',
      Shmita: 'Year 5 of 7',
      Molad: 'Kislev: Monday 9 Nov, 22:27 and 3 chalakim',
      Parasha: 'Toldot, Sat 14 Nov',
      'Sefer Yetzirah': 'נ Nun · smell · Scorpio',
    })
  })

  it('lists Next nearest-first, each on its cell', () => {
    expect(board(DAY).next.map((e) => [e.name, e.date, e.inDays, e.at?.view, e.at?.cell])).toEqual([
      ['Sigd', '2026-11-09', 1, 'month', '2026-11-09'],
      ['Molad Kislev, 22:27', '2026-11-09', 1, 'month', '2026-11-09'],
      ['Rosh Chodesh Kislev', '2026-11-10', 2, 'month', '2026-11-10'],
      ['Parashat Toldot', '2026-11-14', 6, 'parasha', '6'],
      ['Erev Hanukkah', '2026-12-04', 26, 'year', '2026-11-11'],
      ['Hanukkah', '2026-12-05', 27, 'year', '2026-11-11'],
    ])
  })

  it('reds Shabbat under its portion, and marks the new month, its molad and its blessing', () => {
    const b = board(DAY)
    expect(view(b, 'month')?.sections[0]?.heads?.[0]?.said).toBe('Sunday')
    const shabbat = cell(b, 'month', '2026-11-07')
    expect([shabbat?.title, shabbat?.tint, shabbat?.events?.map((e) => e.name)]).toEqual(['Chayei Sara', 'red', ['Shabbat Mevarchim Kislev']])
    expect(cell(b, 'month', '2026-11-10')?.events?.map((e) => e.key)).toEqual(['rosh-chodesh'])
    expect(cell(b, 'month', '2026-11-09')?.events?.map((e) => e.key)).toEqual(['modern', 'molad'])
  })

  it('reds Yom Tov, bands the Omer behind the tint, and names the diaspora’s second days', () => {
    const b = board('2027-04-24')
    const pesach = cell(b, 'month', '2027-04-28')
    expect([pesach?.tint, pesach?.band, pesach?.keys]).toEqual(['red', undefined, ['moon', 'rest', 'omer']])
    expect(cell(b, 'month', '2027-04-27')?.band).toBe('omer')
    expect(cell(b, 'month', '2027-04-29')?.events?.map((e) => e.name)).toEqual(['Diaspora: Pesach, day 8'])
    expect(cell(b, 'month', '2027-04-21')?.events?.map((e) => e.key)).toEqual(['fast', 'erev'])
    expect(Object.fromEntries(b.facts.map((f) => [f.label, f.value])).Omer).toBe('Day 2: Gevurah of Chesed')
  })

  it('reads Nasso in Israel the Shabbat after Shavuot, and in the diaspora a week later', () => {
    const b = board('2027-06-11')
    expect(cell(b, 'month', '2027-06-12')?.events?.map((e) => e.name)).toEqual(['Diaspora: Shavuot, day 2'])
    expect(cell(b, 'month', '2027-06-12')?.title).toBe('Nasso')
    expect(cell(b, 'parasha', '35')?.keys).toEqual(['diaspora'])
  })

  it('gives the year its keviah and the portions their books, the week’s ringed', () => {
    const b = board(DAY)
    expect(view(b, 'year')?.caption).toBe('זשה: Rosh Hashanah on Saturday, Pesach on Thursday; a complete leap year of 385 days')
    expect(view(b, 'year')?.sections[0]?.cells).toHaveLength(13)
    const parasha = view(b, 'parasha')
    expect(parasha?.sections.map((s) => s.cells.length)).toEqual([12, 11, 10, 10, 11])
    expect(parasha?.sections.flatMap((s) => s.cells).find((c) => c.state === 'today')?.title).toBe('Toldot')
    expect(cell(b, 'parasha', '42')?.keys).toEqual(['joined'])
  })
})
