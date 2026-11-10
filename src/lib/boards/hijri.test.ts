/**
 * The Hijri date's board on 2026-11-08, 28 Jumada al-Ula 1448 by Umm
 * al-Qura, and on days that hold its edges: Jumada al-Akhirah from 11
 * November; Rajab from 10 December, the Night Journey on the evening of 4
 * January 2027; Ramadan from 8 February, Laylat al-Qadr on the evening of
 * 5 March, Eid al-Fitr on 9 March; Dhu al-Hijjah from 7 May, Arafah on 15
 * May, Eid al-Adha on 16 May (the Umm al-Qura calendar as ICU carries it).
 */
import { describe, expect, it } from 'vitest'
import { shiftDay } from '@pleiad/engine/calculations/day-search'
import { expectBoardRules } from './board-rules'
import { hijriBoard } from './hijri'
import { skyOf } from './sky'
import type { CalendarView, DayBoard } from './types'

const board = (day: string): DayBoard => {
  const built = hijriBoard(day, skyOf(day))
  if (!built) throw new Error(`no Hijri board for ${day}`)
  return built
}
const view = (b: DayBoard, id: string): CalendarView | undefined => b.views?.find((v) => v.id === id)
const cells = (b: DayBoard, id: string) => view(b, id)?.sections.flatMap((s) => s.cells) ?? []
const cell = (b: DayBoard, id: string, key: string) => cells(b, id).find((c) => c.key === key)

const DAY = '2026-11-08'
const EDGES = ['2026-06-16', '2027-01-04', '2027-02-20', '2027-03-05', '2027-03-09', '2027-05-16']

describe('hijriBoard', () => {
  it.each([DAY, ...EDGES])('holds the board rules on %s', (day) => {
    expectBoardRules(board(day), `hijri ${day}`, shiftDay, day)
  })

  it('sets its grids right to left, as its own pages do, Sunday at the right', () => {
    const views = board(DAY).views ?? []
    expect(views.filter((v) => v.dir === 'rtl').map((v) => v.id)).toEqual(['month', 'year'])
  })

  it('reads 28 Jumada al-Ula 1448 and lists Next nearest-first, a sighted month expected', () => {
    const b = board(DAY)
    expect([b.value, b.mast?.numeral.text, b.mast?.script?.text]).toEqual(['28 Jumada al-Ula 1448', '٢٨', 'جمادى الأولى ١٤٤٨'])
    expect(b.next.map((e) => [e.name, e.date, e.inDays, e.at?.view, e.at?.cell])).toEqual([
      ['Jumada al-Akhirah begins', '2026-11-11', 3, 'year', '2026-11-11'],
      ['The white days begin', '2026-11-23', 15, 'year', '2026-11-11'],
      ['Laylat al-Miʻraj, from sunset', '2027-01-04', 57, 'year', '2026-12-10'],
      ['Mid-Shaban, from sunset', '2027-01-22', 75, 'year', '2027-01-09'],
      ['Ramadan begins (expected)', '2027-02-08', 92, 'year', '2027-02-08'],
    ])
    expect(Object.fromEntries(b.facts.map((f) => [f.label, f.value]))).toMatchObject({ Year: '1448 AH · ١٤٤٨', Sacred: 'No', Day: 'Begins at sunset' })
  })

  it('marks Fridays in the head and the cells, and bands the white days', () => {
    const b = board(DAY)
    expect(view(b, 'month')?.sections[0]?.heads?.find((h) => h.said.startsWith('Friday'))?.said).toBe('Friday, Jumuʻah')
    expect(cells(b, 'month').filter((c) => c.events?.some((e) => e.key === 'jumuah')).map((c) => c.key)).toEqual(['2026-10-16', '2026-10-23', '2026-10-30', '2026-11-06'])
    expect(cells(b, 'month').filter((c) => c.band === 'white-days').map((c) => c.key)).toEqual(['2026-10-24', '2026-10-25', '2026-10-26'])
  })

  it('marks a night on the evening it begins, under the last ten nights', () => {
    const b = board('2027-03-05')
    const qadr = cell(b, 'month', '2027-03-05')
    expect([qadr?.band, qadr?.events?.map((e) => [e.name, e.key])]).toEqual(['last-ten', [['Laylat al-Qadr, from sunset', 'night'], ['Jumuʻah', 'jumuah']]])
    expect(qadr?.said).toContain('expected; set by sighting')
  })

  it('bands the Hajj’s days, Tashriq over the white days', () => {
    const tashriq = cell(board('2027-05-16'), 'month', '2027-05-19')
    expect([tashriq?.band, tashriq?.keys]).toEqual(['tashriq', ['moon', 'white-days']])
  })

  it('bands the sacred months and Ramadan in the year', () => {
    const year = cells(board(DAY), 'year')
    expect(year.filter((c) => c.band === 'sacred').map((c) => c.title)).toEqual(['Muharram', 'Rajab', 'Dhu al-Qadah', 'Dhu al-Hijjah'])
    expect(year.filter((c) => c.band === 'ramadan').map((c) => c.label?.text)).toEqual(['رمضان'])
  })
})
