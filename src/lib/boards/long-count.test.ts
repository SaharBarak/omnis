import { describe, expect, it } from 'vitest'
import { shiftDay } from '@pleiad/engine/calculations/day-search'
import { expectBoardRules } from './board-rules'
import { longCountBoard } from './long-count'
import type { CalendarView, DayBoard } from './types'

/**
 * The Long Count's board against published dates: Kettunen and Helmke,
 * *Introduction to Maya Hieroglyphs* (Wayeb, 2020), p. 52, the twenty days
 * from 9.9.0.0.0 3 Ajaw 3 Sotz' (10 May 613 under the GMT correlation, as
 * the proleptic Gregorian calendar dates it) with their Lords of the Night;
 * 13.0.0.0.0 4 Ajaw 3 K'ank'in on 21 December 2012; 13.0.14.1.10 on
 * 8 November 2026. Spellings are the ALMG's (Ak'b'al, Eb', Kab'an).
 */

const view = (board: DayBoard, id: string): CalendarView | undefined => board.views?.find((v) => v.id === id)
const cellsOf = (v: CalendarView | undefined) => (v?.sections ?? []).flatMap((s) => s.cells)
const todayIn = (v: CalendarView | undefined) => cellsOf(v).find((c) => c.state === 'today')
const facts = (board: DayBoard) => Object.fromEntries(board.facts.map((f) => [f.label, f.value]))

const KETTUNEN_HELMKE: readonly (readonly [string, string, string])[] = [
  ['3 Ajaw', "3 Sotz'", 'G9'], ['4 Imix', "4 Sotz'", 'G1'], ["5 Ik'", "5 Sotz'", 'G2'], ["6 Ak'b'al", "6 Sotz'", 'G3'],
  ["7 K'an", "7 Sotz'", 'G4'], ['8 Chikchan', "8 Sotz'", 'G5'], ['9 Kimi', "9 Sotz'", 'G6'], ["10 Manik'", "10 Sotz'", 'G7'],
  ['11 Lamat', "11 Sotz'", 'G8'], ['12 Muluk', "12 Sotz'", 'G9'], ['13 Ok', "13 Sotz'", 'G1'], ['1 Chuwen', "14 Sotz'", 'G2'],
  ["2 Eb'", "15 Sotz'", 'G3'], ["3 B'en", "16 Sotz'", 'G4'], ['4 Ix', "17 Sotz'", 'G5'], ['5 Men', "18 Sotz'", 'G6'],
  ["6 Kib'", "19 Sotz'", 'G7'], ["7 Kab'an", '0 Sek', 'G8'], ["8 Etz'nab'", '1 Sek', 'G9'], ['9 Kawak', '2 Sek', 'G1'],
]

describe('longCountBoard', () => {
  it("draws 9.9.0.0.0's winal as Kettunen and Helmke's table: each day's number, sign, Haab' day and Lord of the Night", () => {
    const board = longCountBoard('0613-05-10')
    expect(board.value).toBe('9.9.0.0.0')
    expect(board.mast?.title).toBe("3 Ajaw 3 Sotz'")
    const winal = cellsOf(view(board, 'winal'))
    expect(winal.map((c) => [`${c.label?.text} ${c.title}`, c.note, /Lord of the Night (G\d)/.exec(c.said)?.[1]])).toEqual(KETTUNEN_HELMKE)
    expect(winal[0]?.events?.map((e) => e.name)).toEqual(["A k'atun ending"])
    expect(cellsOf(view(board, 'count')).map((c) => [c.key, c.label?.text])).toEqual([["B'ak'tun", '9'], ["K'atun", '9'], ['Tun', '0'], ['Winal', '0'], ["K'in", '0']])
  })

  it("reads 13.0.0.0.0 as 4 Ajaw 3 K'ank'in, a b'ak'tun ending under G9", () => {
    const board = longCountBoard('2012-12-21')
    expect(board.mast?.title).toBe("4 Ajaw 3 K'ank'in")
    expect(facts(board)['Lord of the Night']).toBe('G9, of G1 to G9')
    expect(todayIn(view(board, 'tzolkin'))?.events?.map((e) => e.name)).toEqual(["A b'ak'tun ending"])
    expect(facts(board).Correlation).toBe('GMT 584283: 13.0.0.0.0 on Fri 21 Dec 2012')
  })

  it("lays the Tzolk'in in thirteen columns of twenty from 1 Imix, a row per day sign, today's trecena banded", () => {
    const tzolkin = view(longCountBoard('2026-11-08'), 'tzolkin')
    const section = tzolkin?.sections[0]
    expect(section?.rowHeads?.map((h) => h.text)).toHaveLength(20)
    expect(section?.rowHeads?.[0]?.text).toBe('Imix')
    expect(section?.rowHeads?.filter((h) => h.said.endsWith('a year bearer')).map((h) => h.text)).toEqual(["Ik'", "Manik'", "Eb'", "Kab'an"])
    const cells = cellsOf(tzolkin)
    expect(cells).toHaveLength(260)
    expect(cells.every((c) => !c.mark && !c.title && !c.note)).toBe(true)
    expect(section?.places?.[cells[0]?.key ?? '']).toEqual([0, 0])
    expect(section?.places?.[cells[259]?.key ?? '']).toEqual([19, 12])
    expect(cells.filter((c) => c.band === 'trecena').map((c) => c.label?.text)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'])
    expect(tzolkin?.caption).toBe("Day 30 of 260, in the trecena of 1 Manik'")
  })

  it("lays the Haab' year in eighteen months of twenty and Wayeb''s five, from 0 Pop", () => {
    const haab = view(longCountBoard('2026-11-08'), 'haab')
    const cells = cellsOf(haab)
    expect(cells).toHaveLength(365)
    expect(haab?.sections[0]?.rowHeads?.map((h) => h.text)).toEqual([
      'Pop', "Wo'", 'Sip', "Sotz'", 'Sek', 'Xul', "Yaxk'in", 'Mol', "Ch'en", 'Yax', "Sak'", 'Keh', 'Mak', "K'ank'in", 'Muwan', 'Pax', "K'ayab'", "Kumk'u", "Wayeb'",
    ])
    expect(cells[0]).toMatchObject({ key: '2026-03-30', label: { text: '0' }, events: [{ name: "The Haab' new year, borne by 2 Manik'", key: 'newyear' }] })
    expect(cells.filter((c) => c.band === 'wayeb').map((c) => c.key)).toEqual(['2027-03-25', '2027-03-26', '2027-03-27', '2027-03-28', '2027-03-29'])
    expect(haab?.name).toBe("The Haab' year borne by 2 Manik'")
  })

  it("dates what comes next: the winal and trecena, the 819-day station, Wayeb', the new year and its bearer, the places", () => {
    expect(longCountBoard('2026-11-08').next.map((e) => [e.name, e.date, e.at?.view])).toEqual([
      ['A new winal', '2026-11-18', 'count'],
      ['The trecena of 1 Ajaw begins', '2026-11-18', 'tzolkin'],
      ['An 819-day station, 1 Chikchan', '2027-01-22', 'tzolkin'],
      ["Wayeb' begins", '2027-03-25', 'haab'],
      ["The Haab' new year, borne by 3 Eb'", '2027-03-30', 'tzolkin'],
      ['A new tun', '2027-10-04', 'count'],
      ["A new k'atun", '2032-09-07', 'count'],
      ["A new b'ak'tun", '2407-03-26', 'count'],
    ])
  })

  it('holds the board rules on ordinary days, period endings, Wayeb\', 0 Pop, a station and a leap day', () => {
    for (const day of ['2026-11-08', '2012-12-21', '0613-05-10', '2027-03-25', '2027-03-29', '2027-03-30', '2027-01-22', '2000-02-29', '1987-07-26']) {
      expectBoardRules(longCountBoard(day), day, shiftDay, day)
    }
  })
})
