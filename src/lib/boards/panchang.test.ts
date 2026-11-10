/**
 * The Panchang's board at sunrise in Ujjain on 2026-11-08 (Krishna
 * Chaturdashi, Swati, Ayushman, Shakuni, Ravivara, in Ashvin), and on days
 * that hold its edges: 25 May 2026 in Adhika Jyeshtha, 20 November with an
 * Ekadashi no sunrise falls in, and the first sunrise of Kartika (Drik
 * Panchang for Ujjain).
 */
import { describe, expect, it } from 'vitest'
import { shiftDay } from '@pleiad/engine/calculations/day-search'
import { expectBoardRules } from './board-rules'
import { panchangBoard } from './panchang'
import type { CalendarView, DayBoard } from './types'

const view = (b: DayBoard, id: string): CalendarView | undefined => b.views?.find((v) => v.id === id)
const cells = (b: DayBoard, id: string) => view(b, id)?.sections.flatMap((s) => s.cells) ?? []

const DAY = '2026-11-08'
const EDGES = ['2026-05-25', '2026-11-20', '2026-11-10']

describe('panchangBoard', () => {
  it.each([DAY, ...EDGES])('holds the board rules on %s', (day) => {
    expectBoardRules(panchangBoard(day), `panchang ${day}`, shiftDay, day)
  })

  it('names an adhika month in its tithis and its facts', () => {
    const b = panchangBoard('2026-05-25')
    expect(view(b, 'tithis')?.name).toBe('The tithis of Adhika Jyeshtha')
    expect(b.facts.find((f) => f.label === 'Month')?.value).toBe('Adhika Jyeshtha amanta, Adhika Jyeshtha purnimanta')
  })

  it('keys the Ekadashi no sunrise falls in as lost, and keeps the day on its sunrise', () => {
    const b = panchangBoard('2026-11-20')
    expect(b.value).toBe('Shukla Dashami')
    const ekadashi = cells(b, 'tithis').find((c) => c.key === '11')
    expect(ekadashi).toMatchObject({ note: 'no sunrise', keys: ['kshaya'] })
    expect(cells(b, 'months').find((c) => c.key === '2026-11-20')?.events?.[0]?.name).toMatch(/^Shukla Ekadashi, 07:1\d to 06:3\d IST$/)
  })

  it('opens Kartika on its first sunrise', () => {
    const b = panchangBoard('2026-11-10')
    expect(b.value).toBe('Shukla Pratipada')
    expect(view(b, 'tithis')?.name).toBe('The tithis of Kartika')
    expect(cells(b, 'tithis').find((c) => c.state === 'today')?.key).toBe('1')
  })
})
