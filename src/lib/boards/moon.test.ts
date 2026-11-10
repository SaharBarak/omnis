/**
 * The Moon's board on 2026-11-08, a day before the New Moon, and on days
 * that hold its edges: the supermoon of 24 November 2026, the New Moon and
 * annular eclipse of 6 February 2027, the total solar eclipse of 2 August
 * 2027. Published: the quarters of November 2026 (USNO), the apogee of
 * 13 November and perigee of 25 November (lunaf.com), the full supermoons
 * of 24 November and 24 December 2026 (Espenak), the eclipses of 2027
 * (NASA), the Moon entering Sagittarius on 10 November
 * (`sky-events.test.ts` holds each to its source).
 */
import { describe, expect, it } from 'vitest'
import { shiftDay } from '@pleiad/engine/calculations/day-search'
import { expectBoardRules } from './board-rules'
import { moonBoard } from './moon'
import { skyOf } from './sky'
import type { CalendarView, DayBoard } from './types'

const board = (day: string): DayBoard => moonBoard(day, skyOf(day))
const view = (b: DayBoard, id: string): CalendarView | undefined => b.views?.find((v) => v.id === id)
const cells = (b: DayBoard, id: string) => view(b, id)?.sections.flatMap((s) => s.cells) ?? []
const cell = (b: DayBoard, id: string, key: string) => cells(b, id).find((c) => c.key === key)
const eventKeys = (b: DayBoard, id: string, key: string) => cell(b, id, key)?.events?.map((e) => e.key)

const DAY = '2026-11-08'
const EDGES = ['2026-11-09', '2026-11-24', '2026-11-25', '2027-02-06', '2027-02-07', '2027-08-02']

describe('moonBoard', () => {
  it.each([DAY, ...EDGES])('holds the board rules on %s', (day) => {
    expectBoardRules(board(day), `moon ${day}`, shiftDay, day)
  })

  it('names what comes next to the minute: the quarters, the Moon’s next sign, its apogee and the next eclipse', () => {
    expect(board(DAY).next.map((e) => [e.name, e.date, e.inDays, e.at?.view, e.at?.cell])).toEqual([
      ['New Moon, 07:03 UTC', '2026-11-09', 1, 'months', '2026-11-09'],
      ['Moon enters Sagittarius, 08:36 UTC', '2026-11-10', 2, 'months', '2026-11-10'],
      ['Apogee, 405,608 km, 17:51 UTC', '2026-11-13', 5, 'months', '2026-11-14'],
      ['First Quarter, 11:48 UTC', '2026-11-17', 9, 'months', '2026-11-17'],
      ['Full Moon, 14:54 UTC', '2026-11-24', 16, 'months', '2026-11-25'],
      ['Last Quarter, 06:09 UTC', '2026-12-01', 23, 'months', '2026-12-01'],
      ['Annular solar eclipse, 16:00 UTC', '2027-02-06', 90, 'year', 'lunation-2027-02-06'],
    ])
  })

  it('marks the supermoon and the perigee on the days whose noon holds them', () => {
    const b = board(DAY)
    expect(eventKeys(b, 'months', '2026-11-25')).toEqual(['quarter', 'supermoon'])
    expect(cell(b, 'months', '2026-11-25')?.said).toBe('Wed 25 Nov · Full Moon, 99% lit · Moon in Gemini · Full Moon, Tue 24 Nov 14:54 UTC · A supermoon, 360,754 km')
    expect(eventKeys(b, 'months', '2026-11-26')).toEqual(['apsis', 'sign'])
  })

  it('lays the lunar year by the sign each New Moon falls in, its eclipses and supermoons with it', () => {
    const b = board(DAY)
    expect(cells(b, 'year').map((c) => [c.title, c.note]).slice(0, 5)).toEqual([
      ['Libra', '10 Oct'],
      ['Scorpio', '9 Nov'],
      ['Sagittarius', '9 Dec'],
      ['Capricorn', '7 Jan'],
      ['Aquarius', '6 Feb'],
    ])
    expect(cells(b, 'year')).toHaveLength(12)
    expect(eventKeys(b, 'year', 'lunation-2026-12-09')).toEqual(['supermoon'])
    expect(eventKeys(b, 'year', 'lunation-2027-02-06')?.filter((k) => k?.startsWith('eclipse'))).toEqual(['eclipse-solar', 'eclipse-lunar'])
  })

  it('reads the day: its distance, and the New Moon that began the lunation', () => {
    expect(Object.fromEntries(board(DAY).facts.map((f) => [f.label, f.value]))).toMatchObject({
      Lit: '1%',
      Age: '28 days',
      'Moon in': 'Scorpio',
      Began: 'New Moon in Libra, Sat 10 Oct 15:51 UTC',
    })
  })

  it('marks the annular eclipse on the day of its New Moon', () => {
    const b = board('2027-02-06')
    expect(cells(b, 'lunation').concat(cells(b, 'months')).flatMap((c) => (c.events ?? []).filter((e) => e.key === 'eclipse-solar').map((e) => [c.key, e.name]))).toContainEqual([
      '2027-02-07',
      'Annular solar eclipse, Sat 6 Feb 16:00 UTC',
    ])
  })
})
