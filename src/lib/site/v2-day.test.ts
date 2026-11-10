import { describe, expect, it } from 'vitest'
import { dayRows, kinRow } from './v2-day'
import { SYSTEM_CATALOG } from '@/lib/system-preferences'
import { getTodayAcrossSystems } from '@/lib/today-board'
import { todayBoards } from '@/lib/today-boards'
import { todayFigures } from '@/lib/today-figures'

const DAY = '2026-11-08'
const board = getTodayAcrossSystems(new Date(`${DAY}T12:00:00Z`))
const figures = todayFigures(DAY, board)
const boards = todayBoards(DAY, board)
const line = (key: string) => `${SYSTEM_CATALOG.find((s) => s.key === key)?.description}.`

describe('day rows and their boards (BENTO_V2.md "Rows open their calendar\'s board")', () => {
  const rows = dayRows({ board, figures, boards })
  const row = (field: string) => rows.find((r) => r.field === field)

  it('leaves the kin to its own tile, whose row carries the kin board, and gives every other filled row a board', () => {
    expect(row('kin')).toBeUndefined()
    const kin = kinRow({ board, figures, boards })
    expect(kin).toMatchObject({ field: 'kin', tone: '--sys-dreamspell', board: { label: 'Kin 74' } })
    expect(kin?.board.views?.map((v) => v.id)).toEqual(['wavespell', 'tzolkin', 'oracle', 'moon'])
    expect(rows.length).toBeGreaterThan(0)
    for (const r of rows) {
      expect(r.board.label, r.field).not.toBe('')
      expect(r.board.value, r.field).not.toBe('')
    }
  })

  it("takes the engine's board where it built one, naming the value by what it is where the board does not", () => {
    expect(row('gate')?.board).toMatchObject({ label: 'Gate 1, line 4', value: 'The Creative' })
    expect(row('sun')?.board).toMatchObject({ label: 'Sign', value: '16° Scorpio' })
    expect(row('moon')?.board.next.filter((e) => /^(New|Full) Moon|Quarter/.test(e.name))).toHaveLength(4)
  })

  it("reads a calendar's own line where its board has no meaning of its own", () => {
    expect(row('hebrewDate')?.board.meaning).toBe(line('hebrew'))
    expect(row('chineseYear')?.board.meaning).toBe(line('chinese'))
  })

  it("opens a row the engine built no board for on its own words under its calendar's line", () => {
    const bare = dayRows({ board, figures })
    const sun = bare.find((r) => r.field === 'sun')
    expect(sun?.board).toEqual({ art: sun?.face?.art, label: 'Sign', value: board.sun, meaning: line('astrology'), facts: [], next: [] })
    expect(bare.find((r) => r.field === 'panchang')?.board).toEqual({ label: 'Tithi', value: board.panchang, meaning: line('panchang'), facts: [], next: [] })
  })

  it('keeps the rows to the systems the account follows', () => {
    expect(dayRows({ board, figures, boards }, off('moon', 'humandesign')).map((r) => r.field)).toEqual(['moon', 'gate'])
  })
})

/** Every system off but `on`. */
function off(...on: string[]): Record<string, boolean> {
  return Object.fromEntries(SYSTEM_CATALOG.filter((s) => !on.includes(s.key)).map((s) => [s.key, false]))
}
