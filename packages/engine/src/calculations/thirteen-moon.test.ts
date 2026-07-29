import { describe, it, expect } from 'vitest'

import {
  thirteenMoonDate,
  thirteenMoonYear,
  MOON_NAMES,
} from './thirteen-moon'

describe('thirteenMoonDate', () => {
  it('July 26 opens the Magnetic Moon on Dali', () => {
    expect(thirteenMoonDate('2026-07-26')).toMatchObject({
      kind: 'day', moon: 1, dayOfMoon: 1, moonName: 'Magnetic', totem: 'Bat',
      plasma: 'Dali', week: 1, yearStart: 2026,
    })
  })

  it('29 July 2026 is Magnetic 4 (Kali)', () => {
    expect(thirteenMoonDate('2026-07-29')).toMatchObject({
      moon: 1, dayOfMoon: 4, plasma: 'Kali',
    })
  })

  it('July 25 is the Day Out of Time', () => {
    expect(thirteenMoonDate('2026-07-25')).toMatchObject({
      kind: 'dayOutOfTime', yearStart: 2025, formatted: 'Day Out of Time',
    })
  })

  it('Feb 29 is 0.0 Hunab Ku, outside the count', () => {
    expect(thirteenMoonDate('2028-02-29')).toMatchObject({
      kind: 'hunabKu', yearStart: 2027,
    })
  })

  it('July 24 closes the Cosmic Moon at day 28 in a common year', () => {
    expect(thirteenMoonDate('2026-07-24')).toMatchObject({
      moon: 13, dayOfMoon: 28, moonName: 'Cosmic', plasma: 'Silio', yearStart: 2025,
    })
  })

  it('the leap day does not shift the count: Feb 28 and Mar 1 are consecutive', () => {
    const before = thirteenMoonDate('2028-02-28')
    const after = thirteenMoonDate('2028-03-01')
    expect(before.moon).toBe(after.moon)
    expect((before.dayOfMoon ?? 0) + 1).toBe(after.dayOfMoon)
  })

  it('a leap year still lands July 24 on Cosmic 28', () => {
    // 2028 is a leap year inside the 2027-28 ring.
    expect(thirteenMoonDate('2028-07-24')).toMatchObject({
      moon: 13, dayOfMoon: 28, yearStart: 2027,
    })
  })
})

describe('thirteenMoonYear', () => {
  it('lays out 13 moons of 28 days in moon order', () => {
    const year = thirteenMoonYear(2026)
    expect(year.length).toBe(13)
    expect(year.every((m) => m.days.length === 28)).toBe(true)
    expect(year.map((m) => m.moonName)).toEqual([...MOON_NAMES])
    expect(year[0].days[0].iso).toBe('2026-07-26')
    expect(year[12].days[27].iso).toBe('2027-07-24')
  })

  it('skips Feb 29 so the ring still ends July 24', () => {
    const year = thirteenMoonYear(2027)
    const isos = year.flatMap((m) => m.days.map((d) => d.iso))
    expect(isos).not.toContain('2028-02-29')
    expect(year[12].days[27].iso).toBe('2028-07-24')
  })

  it('every cell agrees with thirteenMoonDate', () => {
    const year = thirteenMoonYear(2026)
    for (const m of year) {
      for (const d of m.days) {
        expect(thirteenMoonDate(d.iso)).toMatchObject({
          kind: 'day', moon: m.moon, dayOfMoon: d.dayOfMoon,
        })
      }
    }
  })
})
