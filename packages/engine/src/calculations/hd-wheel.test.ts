import { describe, expect, it } from 'vitest'
import { nextQuarter, raveNewYear, sunEntersGate } from './hd-wheel'
import { memoSky } from './sky-dates'

/**
 * Read off the Swiss Ephemeris (pyswisseph 2.10, Moshier), which shares no
 * code with the engine, with the published wheel anchor (gate 41 at 2°
 * Aquarius, 302°): the Sun returns to gate 41 on 21 January 2025 19:10 UTC,
 * 22 January 2026 00:54, 22 January 2027 06:40 and 22 January 2028 12:31;
 * it reaches the Sphinx gates at 13°15′ of the fixed signs on 3 May 2026
 * 16:28 UTC (gate 2, Civilization), 5 August 2026 15:52 (gate 7, Duality),
 * 5 November 2026 16:00 (gate 1, Mutation) and 2 February 2027 08:23
 * (gate 13, Initiation).
 */
const sky = memoSky()

describe('raveNewYear', () => {
  it("dates the Sun's next return to gate 41, the start of the mandala", () => {
    expect(raveNewYear('2026-11-08', sky)).toEqual({ gate: 41, date: '2027-01-22', inDays: 75, noon: '2027-01-22' })
  })

  it('dates a return that falls after noon UTC on its own date, and marks it on the next noon', () => {
    expect(raveNewYear('2025-01-01', sky)).toEqual({ gate: 41, date: '2025-01-21', inDays: 20, noon: '2025-01-22' })
    expect(raveNewYear('2027-12-01', sky)).toMatchObject({ date: '2028-01-22', noon: '2028-01-23' })
  })

  it('dates a return later today, after the noon it is read at, today', () => {
    expect(raveNewYear('2025-01-21', sky)).toMatchObject({ date: '2025-01-21', inDays: 0 })
  })

  it('looks a year on from the day of a return the noon already holds', () => {
    expect(raveNewYear('2026-01-01', sky)).toMatchObject({ date: '2026-01-22', noon: '2026-01-22' })
    expect(raveNewYear('2026-01-22', sky)).toMatchObject({ date: '2027-01-22' })
  })
})

describe('nextQuarter', () => {
  it('names the quarter after the Sun\'s and dates its Sphinx gate, across the turn of the wheel', () => {
    const found = nextQuarter('2026-11-08', sky)
    expect(found?.quarter.id).toBe('initiation')
    expect(found).toMatchObject({ date: '2027-02-02', noon: '2027-02-02' })
  })

  it('dates each quarter the Sun reaches through the year', () => {
    expect(nextQuarter('2026-03-20', sky)).toMatchObject({ quarter: { id: 'civilization' }, date: '2026-05-03', noon: '2026-05-04' })
    expect(nextQuarter('2026-06-21', sky)).toMatchObject({ quarter: { id: 'duality' }, date: '2026-08-05', noon: '2026-08-06' })
  })

  it('dates a quarter that opens later today, after the noon it is read at, today', () => {
    expect(nextQuarter('2026-11-05', sky)).toMatchObject({ quarter: { id: 'mutation' }, date: '2026-11-05', inDays: 0, noon: '2026-11-06' })
  })
})

describe('sunEntersGate', () => {
  it('follows the Sun round the wheel to a gate behind it', () => {
    expect(sunEntersGate('2026-11-08', 13, sky)).toMatchObject({ gate: 13, date: '2027-02-02' })
  })

  it('finds no day for a gate the wheel does not hold', () => {
    expect(sunEntersGate('2026-11-08', 65, sky)).toBeNull()
  })
})
