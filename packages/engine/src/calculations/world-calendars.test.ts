import { describe, it, expect } from 'vitest'

import {
  hijriDateParts,
  persianDateParts,
  chineseDateParts,
  upcomingHijriHolidays,
  upcomingPersianHolidays,
  upcomingChineseFestivals,
  HIJRI_HOLIDAYS,
  PERSIAN_HOLIDAYS,
  CHINESE_FESTIVALS,
} from './world-calendars'

describe('date parts', () => {
  const d = new Date('2026-07-29T12:00:00Z')

  it('hijri: 29 July 2026 = 15 Safar 1448 AH', () => {
    expect(hijriDateParts(d)).toEqual({
      day: 15, month: 'Safar', year: 1448, formatted: '15 Safar 1448 AH',
    })
  })

  it('persian: 29 July 2026 = 7 Mordad 1405 AP', () => {
    expect(persianDateParts(d)).toEqual({
      day: 7, month: 'Mordad', year: 1405, formatted: '7 Mordad 1405 AP',
    })
  })

  it('chinese: 29 July 2026 = 16 Sixth Month, related year 2026', () => {
    expect(chineseDateParts(d)).toEqual({
      day: 16, month: 'Sixth Month', year: 2026, formatted: '16 Sixth Month 2026',
    })
  })
})

describe('holiday anchors (real-world dates)', () => {
  it('Chinese New Year 2026 falls on 17 February', () => {
    const cny = upcomingChineseFestivals(new Date('2026-02-01T12:00:00Z'), 1)[0]
    expect(cny.holiday.name).toBe('Chinese New Year')
    expect(cny.date).toBe('2026-02-17')
  })

  it('Nowruz 1406 falls on 21 March 2027', () => {
    const list = upcomingPersianHolidays(new Date('2027-03-01T12:00:00Z'), 1)
    expect(list[0].holiday.name).toBe('Nowruz')
    expect(list[0].date).toBe('2027-03-21')
  })

  it('Eid al-Fitr 1447 falls on 20 March 2026 (umm al-Qura)', () => {
    const list = upcomingHijriHolidays(new Date('2026-03-10T12:00:00Z'), 2)
    expect(list[0].holiday.name).toBe('Laylat al-Qadr')
    expect(list[1].holiday.name).toBe('Eid al-Fitr')
    expect(list[1].date).toBe('2026-03-20')
  })
})

describe('scan invariants', () => {
  const from = new Date('2026-01-01T12:00:00Z')

  it.each([
    ['hijri', () => upcomingHijriHolidays(from, HIJRI_HOLIDAYS.length), HIJRI_HOLIDAYS.length],
    ['persian', () => upcomingPersianHolidays(from, PERSIAN_HOLIDAYS.length), PERSIAN_HOLIDAYS.length],
    ['chinese', () => upcomingChineseFestivals(from, CHINESE_FESTIVALS.length), CHINESE_FESTIVALS.length],
  ] as const)('%s: a full year covers every holiday, in order', (_name, run, total) => {
    const list = run()
    expect(list.length).toBe(total)
    const days = list.map((h) => h.inDays)
    expect([...days].sort((a, b) => a - b)).toEqual(days)
    expect(new Set(list.map((h) => h.holiday.name)).size).toBe(total)
  })

  it('day 0 counts as today', () => {
    const next = upcomingChineseFestivals(from, 1)[0]
    const onTheDay = upcomingChineseFestivals(new Date(`${next.date}T12:00:00Z`), 1)[0]
    expect(onTheDay.holiday.name).toBe(next.holiday.name)
    expect(onTheDay.inDays).toBe(0)
  })

  it('leap months never match festival tables (month names carry the bis suffix)', () => {
    // 2025 had a leap Sixth Month; scanning across it must not duplicate
    // any Sixth/Seventh Month festival.
    const list = upcomingChineseFestivals(new Date('2025-02-01T12:00:00Z'), CHINESE_FESTIVALS.length)
    const names = list.map((h) => h.holiday.name)
    expect(new Set(names).size).toBe(names.length)
  })
})
