/**
 * The Chinese calendar's board on 2026-11-08, 九月三十 (the 30th of the
 * ninth month) in the solar term Lidong, and on days that hold its edges:
 * the leap sixth month of 2025 from 25 July, the eve and first day of the
 * Goat year (6 February 2027), and a 29-day month (the Hong Kong
 * Observatory's Gregorian-Lunar conversion tables for 2025–2027).
 */
import { describe, expect, it } from 'vitest'
import { shiftDay } from '@pleiad/engine/calculations/day-search'
import { expectBoardRules } from './board-rules'
import { chineseBoard } from './chinese'
import type { CalendarView, DayBoard } from './types'

const board = (day: string): DayBoard => {
  const built = chineseBoard(day)
  if (!built) throw new Error(`no Chinese board for ${day}`)
  return built
}
const view = (b: DayBoard, id: string): CalendarView | undefined => b.views?.find((v) => v.id === id)
const cells = (b: DayBoard, id: string) => view(b, id)?.sections.flatMap((s) => s.cells) ?? []

const DAY = '2026-11-08'
const EDGES = ['2025-07-25', '2025-08-22', '2027-02-05', '2027-02-06', '2026-02-04']

describe('chineseBoard', () => {
  it.each([DAY, ...EDGES])('holds the board rules on %s', (day) => {
    expectBoardRules(board(day), `chinese ${day}`, shiftDay, day)
  })

  it('names a leap month as the almanac writes it, and lays a short month in its tens', () => {
    const leap = view(board('2025-07-25'), 'month')
    expect(leap?.sections.map((s) => [s.name, s.cells.length, s.rowHeads?.length])).toEqual([
      ['闰六月, the leap sixth month, 29 days', 29, 3],
      ['七月, the seventh month, 30 days', 30, 3],
    ])
    expect(board('2025-07-25').mast?.script?.text).toBe('乙巳年闰六月初一')
  })

  it('tints each day by its stem: wood green, fire red, earth yellow, metal white, water black, two days to a phase', () => {
    const tints = cells(board(DAY), 'month').slice(0, 10).map((c) => [c.title, c.tint])
    expect(tints).toEqual([
      ['丁巳', 'red'],
      ['戊午', 'yellow'],
      ['己未', 'yellow'],
      ['庚申', 'white'],
      ['辛酉', 'white'],
      ['壬戌', 'black'],
      ['癸亥', 'black'],
      ['甲子', 'green'],
      ['乙丑', 'green'],
      ['丙寅', 'red'],
    ])
  })

  it('rings the solar year from Lichun, its seasons by phase and its principal terms keyed', () => {
    const ring = board(DAY).views?.find((v) => v.id === 'terms')?.sections[1]?.cells ?? []
    expect(ring.map((c) => c.note).slice(0, 4)).toEqual(['4 Feb', '18 Feb', '5 Mar', '20 Mar'])
    expect(ring.filter((c) => c.keys?.includes('principal')).map((c) => c.title)).toHaveLength(12)
    expect([...new Set(ring.map((c) => c.tint))]).toEqual(['green', 'red', 'white', 'black'])
    expect(cells(board('2026-02-04'), 'terms').find((c) => c.state === 'today')?.title).toBe('Lichun')
  })
})
