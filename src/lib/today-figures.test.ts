import { describe, expect, it } from 'vitest'
import { getTodayAcrossSystems } from './today-board'
import { hebrewMonthLength, inUnit, todayFigures } from './today-figures'

const DAY = '2026-11-08'

describe('inUnit', () => {
  it('counts today to the middle of its unit', () => {
    expect(inUnit(1, 6, 'line 1 of 6')).toEqual({ at: 0.5, of: 6, said: 'line 1 of 6' })
    expect(inUnit(30, 30, 'day 30 of 30')).toEqual({ at: 29.5, of: 30, said: 'day 30 of 30' })
  })
})

describe('hebrewMonthLength', () => {
  it('gives the months whose length never changes their length', () => {
    expect(hebrewMonthLength('2026-10-01')).toBe(30)
    expect(hebrewMonthLength('2027-01-01')).toBe(29)
    expect(hebrewMonthLength('2026-04-01')).toBe(30)
    expect(hebrewMonthLength('2026-05-01')).toBe(29)
  })

  it('tells the two Adars of a leap year apart', () => {
    expect(hebrewMonthLength('2024-02-15')).toBe(30)
    expect(hebrewMonthLength('2024-03-15')).toBe(29)
  })

  it('reads Heshvan from its year: 30 days in the complete year 5787', () => {
    expect(hebrewMonthLength(DAY)).toBe(30)
  })
})

/**
 * 2026-11-08 at noon UTC, read off sources outside the code: the Sun at 16°
 * Scorpio, in gate 1 line 4; 28 Heshvan 5787; Long Count 13.0.14.1.10; the
 * Fire Horse, 43rd of the sixty; the Moon a day before the new Moon.
 */
describe('day cycles', () => {
  const figures = todayFigures(DAY, getTodayAcrossSystems(new Date(`${DAY}T12:00:00Z`)))

  it('places each value in its cycle, inside it', () => {
    for (const [field, face] of Object.entries(figures)) {
      if (!face.cycle) continue
      expect(face.cycle.at, field).toBeGreaterThanOrEqual(0)
      expect(face.cycle.at, field).toBeLessThan(face.cycle.of)
    }
  })

  it('counts each calendar in its own unit, and says where today stands in it', () => {
    expect(figures.sun?.cycle).toEqual({ at: 16.5, of: 30, said: '16 of 30 degrees' })
    expect(figures.gate?.cycle).toEqual({ at: 3.5, of: 6, said: 'line 4 of 6' })
    expect(figures.hebrewDate?.cycle).toEqual({ at: 27.5, of: 30, said: 'day 28 of 30' })
    expect(figures.longCount?.cycle).toEqual({ at: 10.5, of: 20, said: "day 11 of the winal's 20" })
    expect(figures.chineseYear?.cycle).toEqual({ at: 42.5, of: 60, said: 'year 43 of 60' })
    expect(figures.moon?.cycle).toMatchObject({ of: 360, said: 'day 29 of the lunation' })
    expect(figures.moon?.cycle?.at).toBeGreaterThan(345)
  })
})
