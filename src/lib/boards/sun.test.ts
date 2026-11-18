/**
 * The tropical Sun's board on 2026-11-08, the Sun at 16° Scorpio, and on
 * days that hold its edges: the December solstice (21 December 2026, 20:50
 * UTC), the March equinox (20 March 2027, 20:25 UTC, the Sun entering
 * Aries), the June solstice (21 June 2026, 08:24 UTC) and a cross-quarter
 * (4 February 2027). Published: the Sun entered Scorpio on 23 October 2026
 * at 09:37 UTC and enters Sagittarius on 22 November at 07:23 UTC
 * (`sky-events.test.ts`); Scorpio's lords as the tradition tabulates them
 * (Lilly, Ptolemy, Dorotheus: `zodiac-signs.test.ts`, `terms.test.ts`).
 */
import { describe, expect, it } from 'vitest'
import { shiftDay } from '@pleiad/engine/calculations/day-search'
import { expectBoardRules } from './board-rules'
import { skyOf } from './sky'
import { sunBoard } from './sun'
import type { CalendarView, DayBoard } from './types'

const board = (day: string): DayBoard => sunBoard(day, skyOf(day))
const view = (b: DayBoard, id: string): CalendarView | undefined => b.views?.find((v) => v.id === id)
const cells = (b: DayBoard, id: string) => view(b, id)?.sections.flatMap((s) => s.cells) ?? []
const cell = (b: DayBoard, id: string, key: string) => cells(b, id).find((c) => c.key === key)
const facts = (b: DayBoard) => Object.fromEntries(b.facts.map((f) => [f.label, f.value]))

const DAY = '2026-11-08'
const EDGES = ['2026-06-21', '2026-12-21', '2026-12-22', '2027-02-04', '2027-03-20', '2027-03-21']

describe('sunBoard', () => {
  it.each([DAY, ...EDGES])('holds the board rules on %s', (day) => {
    expectBoardRules(board(day), `sun ${day}`, shiftDay, day)
  })

  it("gives Scorpio's lords: Mars, Venus in detriment, the Moon in fall, the water triplicity, the second face and Mercury's term", () => {
    const b = board(DAY)
    expect([b.value, b.mast?.title, b.mast?.words.map((w) => w.text)]).toEqual(['16° Scorpio', 'Scorpio', ['Water', 'Fixed', 'Feminine', 'ruled by Mars']])
    expect(facts(b)).toEqual({
      Element: 'Water',
      Modality: 'Fixed',
      Polarity: 'Feminine',
      Ruler: 'Mars; Pluto in modern astrology',
      Exaltation: 'No planet',
      Detriment: 'Venus',
      Fall: 'Moon',
      Triplicity: 'Venus by day, Mars by night, the Moon with both',
      Decan: 'II, ruled by the Sun',
      Term: 'Mercury, 11° to 19°',
      Entered: 'Fri 23 Oct 09:38 UTC, 16 days ago',
    })
  })

  it('lays the season a degree a day, each under its term, banded by the faces, the ingress and the cross-quarter on their days', () => {
    const b = board(DAY)
    expect(cells(b, 'season').map((c) => c.keys?.[0])).toEqual([
      ...Array(7).fill('term-1'),
      ...Array(4).fill('term-2'),
      ...Array(8).fill('term-3'),
      ...Array(5).fill('term-4'),
      ...Array(6).fill('term-5'),
    ])
    expect(cell(b, 'season', '2026-10-23')?.events?.map((e) => e.name)).toEqual(['Sun enters Scorpio, 09:38 UTC'])
    expect(cell(b, 'season', '2026-11-07')?.events?.map((e) => e.name)).toEqual(['Cross-quarter, 15° Scorpio, 09:53 UTC'])
    expect(cell(b, 'season', DAY)?.said).toBe('Sun 8 Nov · Sun at 16° Scorpio · second decan, ruled by the Sun · term of Mercury, 11° to 19°')
  })

  it('rings the year by element, the equinoxes and solstices said as the ingresses they are', () => {
    const b = board(DAY)
    expect(view(b, 'year')?.sections[0]?.cells.map((c) => c.tint)).toEqual(['red', 'green', 'yellow', 'blue', 'red', 'green', 'yellow', 'blue', 'red', 'green', 'yellow', 'blue'])
    expect(cell(b, 'year', 'capricorn')?.said).toBe(
      'Capricorn · the Sun enters it at the December solstice, Mon 21 Dec 20:50 UTC, in 43 days · earth, cardinal, feminine · ruled by Saturn · exalts Mars at 28°',
    )
    expect(cell(b, 'year', 'scorpio')?.events?.map((e) => e.key)).toEqual(['turning'])
  })

  it('ladders the five terms with the days the Sun holds each', () => {
    expect(cells(board(DAY), 'terms').map((c) => [c.title, c.label?.text, c.state, c.note])).toEqual([
      ['Mars', '0°–7°', 'past', '23 Oct to 29 Oct'],
      ['Venus', '7°–11°', 'past', '30 Oct to 2 Nov'],
      ['Mercury', '11°–19°', 'today', '3 Nov to 10 Nov'],
      ['Jupiter', '19°–24°', 'ahead', '11 Nov to 15 Nov'],
      ['Saturn', '24°–30°', 'ahead', '16 Nov to 21 Nov'],
    ])
  })

  it('names what comes next: the term, the face, the ingresses (the solstice as one) and the cross-quarter after, each on its cell', () => {
    expect(board(DAY).next.map((e) => [e.name, e.date, e.inDays, e.at?.view, e.at?.cell])).toEqual([
      ['Term of Jupiter, 19°', '2026-11-11', 3, 'season', '2026-11-11'],
      ['Decan III, Venus', '2026-11-12', 4, 'season', '2026-11-12'],
      ['Enters Sagittarius, 07:24 UTC', '2026-11-22', 14, 'year', 'sagittarius'],
      ['Enters Capricorn at the December solstice, 20:50 UTC', '2026-12-21', 43, 'year', 'capricorn'],
      ['Cross-quarter, 15° Aquarius, 01:46 UTC', '2027-02-04', 88, 'year', 'aquarius'],
    ])
  })

  it('opens Aries at the March equinox, named once on the first day whose noon finds the Sun past it', () => {
    const b = board('2027-03-21')
    expect(b.value).toBe('0° Aries')
    expect(cell(b, 'season', '2027-03-21')?.events?.map((e) => e.name)).toEqual(['March equinox, the Sun enters Aries, Sat 20 Mar 20:25 UTC'])
    expect(facts(b)).toMatchObject({ Exaltation: 'The Sun at 19°', Fall: 'Saturn', Detriment: 'Venus', Triplicity: 'The Sun by day, Jupiter by night, Saturn with both' })
  })
})
