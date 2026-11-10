/**
 * Published values: Iran's calendar (Nowruz 1405 on 21 March 2026, Yalda on
 * 21 December 2026, Revolution Day on 11 February 2027, Chaharshanbe Suri on
 * the evening of Tuesday 16 March 2027), and the March equinox of 2027 at
 * 20:25 UTC (USNO, Earth's Seasons 2027).
 */
import { describe, it, expect } from 'vitest'

import { ZOROASTRIAN_DAYS, jashnDays, persianDateOf, persianFeastsIn, persianYearOf, tahvilOf, upcomingPersianFeasts, zoroastrianDay, PERSIAN_MONTHS, type PersianYear } from './persian-calendar'

const year = (day: string): PersianYear => {
  const found = persianYearOf(day)
  if (!found) throw new Error(`no Persian year for ${day}`)
  return found
}

describe('the Persian year', () => {
  it('reads the day under test as 17 Aban 1405', () => {
    const day = persianDateOf('2026-11-08')
    expect([day?.day, day?.month.month.number, day?.month.month.name, day?.year.year]).toEqual([17, 8, 'Aban', 1405])
  })

  it('opens 1405 at Nowruz with six months of 31, five of 30 and Esfand of 29', () => {
    const y = year('2026-11-08')
    expect([y.first, y.length]).toEqual(['2026-03-21', 365])
    expect(y.months.map((m) => m.length)).toEqual([31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29])
  })
})

describe('the day names', () => {
  it('names the thirty days, Ahura Mazda opening each of the four weeks', () => {
    expect(ZOROASTRIAN_DAYS).toHaveLength(30)
    expect(ZOROASTRIAN_DAYS.filter((d) => d.yazata === 'Ahura Mazda').map((d) => d.day)).toEqual([1, 8, 15, 23])
    expect([zoroastrianDay(17)?.name, zoroastrianDay(31)]).toEqual(['Sorush', undefined])
  })

  it('finds each month its jashn: Mehregan on 16 Mehr, Tirgan on 13 Tir, four in Dey', () => {
    const jashn = (n: number) => jashnDays(PERSIAN_MONTHS[n - 1] ?? PERSIAN_MONTHS[0]).map((d) => d.day)
    expect([jashn(7), jashn(4), jashn(10)]).toEqual([[16], [13], [1, 8, 15, 23]])
  })
})

describe('persianFeastsIn', () => {
  it('dates the feasts of 1405', () => {
    const feasts = new Map(persianFeastsIn(year('2026-11-08')).filter((o) => o.day === 1).map((o) => [o.id, o.date]))
    expect(['nowruz', 'sizdah-bedar', 'yalda', 'sadeh', 'revolution-day', 'chaharshanbe-suri', 'oil-day', 'jashn-7-16'].map((id) => feasts.get(id))).toEqual([
      '2026-03-21', '2026-04-02', '2026-12-21', '2027-01-30', '2027-02-11', '2027-03-16', '2027-03-20', '2026-10-08',
    ])
  })

  it('keeps Nowruz four days', () => {
    expect(persianFeastsIn(year('2026-11-08')).filter((o) => o.id === 'nowruz').map((o) => o.date)).toEqual(['2026-03-21', '2026-03-22', '2026-03-23', '2026-03-24'])
  })

  it('lists the coming feasts nearest-first from the day under test', () => {
    expect(upcomingPersianFeasts('2026-11-08', 3).map((o) => [o.id, o.date, o.inDays])).toEqual([
      ['jashn-9-9', '2026-11-30', 22],
      ['yalda', '2026-12-21', 43],
      ['jashn-10-1', '2026-12-22', 44],
    ])
  })
})

describe('tahvilOf', () => {
  const minutes = (instant: Date) => instant.getTime() / 60_000

  it('turns 1406 at the March equinox of 2027, within a minute of the published 20:25 UTC', () => {
    const tahvil = tahvilOf(1406)
    expect(Math.abs(minutes(tahvil.instant) - minutes(new Date('2027-03-20T20:25:00Z')))).toBeLessThanOrEqual(1)
    expect([tahvil.date, tahvil.time.slice(0, 5)]).toEqual(['2027-03-20', '23:54'])
  })

  it('falls after noon in Tehran, so Nowruz 1406 is the next day', () => {
    expect(year('2027-03-21').first).toBe('2027-03-21')
  })
})
