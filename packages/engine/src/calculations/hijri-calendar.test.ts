/**
 * Published values: the Umm al-Qura calendar of Saudi Arabia (as carried by
 * ICU's islamic-umalqura), which set 1 Ramadan 1447 on 18 February 2026,
 * Eid al-Fitr on 20 March 2026 and 1 Muharram 1448 on 16 June 2026.
 */
import { describe, it, expect } from 'vitest'

import { HIJRI_MONTHS, hijriDateOf, hijriDaysIn, hijriStretchesIn, hijriYearOf, upcomingHijriDays, type HijriYear } from './hijri-calendar'

const year = (day: string): HijriYear => {
  const found = hijriYearOf(day)
  if (!found) throw new Error(`no Hijri year for ${day}`)
  return found
}

describe('the Hijri year', () => {
  it('reads the day under test as 28 Jumada al-Ula 1448, by the month number', () => {
    const day = hijriDateOf('2026-11-08')
    expect([day?.day, day?.month.month.number, day?.month.month.name, day?.year.year]).toEqual([28, 5, 'Jumada al-Ula', 1448])
  })

  it('opens 1448 on 16 June 2026 with twelve months matched to the table', () => {
    const y = year('2026-11-08')
    expect([y.first, y.length]).toEqual(['2026-06-16', 355])
    expect(y.months.map((m) => m.month.number)).toEqual(HIJRI_MONTHS.map((m) => m.number))
  })

  it('keeps the four sacred months', () => {
    expect(HIJRI_MONTHS.filter((m) => m.sacred).map((m) => m.number)).toEqual([1, 7, 11, 12])
  })
})

describe('hijriDaysIn', () => {
  it('dates the days of 1447 by Umm al-Qura, a night from the evening before', () => {
    const days = new Map(hijriDaysIn(year('2026-03-01')).map((o) => [o.holiday.id, [o.date, o.evening ?? null]]))
    expect(Object.fromEntries(days)).toEqual({
      'new-year': ['2025-06-26', null], ashura: ['2025-07-05', null], mawlid: ['2025-09-04', null], 'isra-miraj': ['2026-01-16', '2026-01-15'],
      'mid-shaban': ['2026-02-03', '2026-02-02'], ramadan: ['2026-02-18', null], qadr: ['2026-03-16', '2026-03-15'], 'eid-al-fitr': ['2026-03-20', null],
      arafah: ['2026-05-26', null], 'eid-al-adha': ['2026-05-27', null],
    })
  })

  it('lists the coming days nearest-first from the day under test', () => {
    expect(upcomingHijriDays('2026-11-08', 3).map((o) => [o.holiday.id, o.date, o.inDays])).toEqual([
      ['isra-miraj', '2027-01-05', 58],
      ['mid-shaban', '2027-01-23', 76],
      ['ramadan', '2027-02-08', 92],
    ])
  })
})

describe('hijriStretchesIn', () => {
  it('holds the white days in every month and the stretches of Ramadan and the Hajj', () => {
    const stretches = hijriStretchesIn(year('2026-11-08'))
    expect(stretches.filter((s) => s.span.id === 'white-days')).toHaveLength(12)
    expect(stretches.filter((s) => s.span.id !== 'white-days').map((s) => [s.span.id, s.first, s.last])).toEqual([
      ['last-ten', '2027-02-28', '2027-03-08'],
      ['first-ten', '2027-05-07', '2027-05-16'],
      ['tashriq', '2027-05-17', '2027-05-19'],
    ])
  })
})
