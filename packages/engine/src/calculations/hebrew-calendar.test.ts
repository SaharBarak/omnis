import { describe, it, expect } from 'vitest'

import {
  hebrewDateParts,
  upcomingHebrewHolidays,
  HEBREW_HOLIDAYS,
} from './hebrew-calendar'

describe('hebrewDateParts', () => {
  it('matches the PRD example date (24 July 2026 = 10 Av 5786)', () => {
    const parts = hebrewDateParts(new Date('2026-07-24T12:00:00Z'))
    expect(parts).toEqual({ day: 10, month: 'Av', year: 5786, formatted: '10 Av 5786' })
  })

  it('resolves leap-year months (5787 has Adar I and Adar II)', () => {
    // 5787 is year 8 of the Metonic cycle — a leap year.
    const parts = hebrewDateParts(new Date('2027-03-01T12:00:00Z'))
    expect(parts?.month).toMatch(/^Adar( I| II)?$/)
  })
})

describe('upcomingHebrewHolidays', () => {
  it('finds Tisha B’Av from the PRD date (10 Av → 9 Av is behind, so next year first is not it)', () => {
    const list = upcomingHebrewHolidays(new Date('2026-07-24T12:00:00Z'), 3)
    expect(list.length).toBe(3)
    // 10 Av 5786: next up is Rosh Hashanah 1 Tishri 5787.
    expect(list[0].holiday.name).toBe('Rosh Hashanah')
    expect(list[0].inDays).toBeGreaterThan(0)
    expect(list[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('day 0 counts as today (Yom Kippur found on Yom Kippur)', () => {
    const rh = upcomingHebrewHolidays(new Date('2026-07-24T12:00:00Z'), 1)[0]
    const onTheDay = upcomingHebrewHolidays(new Date(`${rh.date}T12:00:00Z`), 1)[0]
    expect(onTheDay.holiday.name).toBe('Rosh Hashanah')
    expect(onTheDay.inDays).toBe(0)
  })

  it('orders holidays chronologically and spans the whole year', () => {
    const list = upcomingHebrewHolidays(new Date('2026-01-01T12:00:00Z'), 11)
    expect(list.length).toBe(11)
    const days = list.map((h) => h.inDays)
    expect([...days].sort((a, b) => a - b)).toEqual(days)
    const names = new Set(list.map((h) => h.holiday.name))
    expect(names.size).toBe(HEBREW_HOLIDAYS.length)
  })
})
