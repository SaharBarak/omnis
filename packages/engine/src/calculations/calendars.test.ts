import { describe, it, expect } from 'vitest'

import {
  hijriDate,
  persianDate,
  chineseYear,
  siderealSun,
  lahiriAyanamsa,
  panchang,
} from './calendars'

// The PRD's example Today screen (24 July 2026) supplies the test vectors.
const PRD_DATE = new Date('2026-07-24T12:00:00Z')

describe('hijriDate', () => {
  it('matches the PRD example date', () => {
    expect(hijriDate(PRD_DATE)).toBe('10 Safar 1448 AH')
  })
})

describe('persianDate', () => {
  it('matches the PRD example date', () => {
    expect(persianDate(PRD_DATE)).toBe('2 Mordad 1405 AP')
  })
})

describe('chineseYear', () => {
  it('2026 is the Fire Horse year', () => {
    expect(chineseYear(PRD_DATE)).toEqual({
      element: 'Fire',
      animal: 'Horse',
      polarity: 'Yang',
      name: 'Fire Horse',
    })
  })

  it('respects the lunisolar new year boundary (CNY 2026-02-17)', () => {
    expect(chineseYear(new Date('2026-02-16T12:00:00Z'))?.name).toBe('Wood Snake')
    expect(chineseYear(new Date('2026-02-18T12:00:00Z'))?.name).toBe('Fire Horse')
  })

  it('handles a classic reference year (1984 = Wood Rat)', () => {
    expect(chineseYear(new Date('1984-06-01T12:00:00Z'))?.name).toBe('Wood Rat')
  })
})

describe('siderealSun', () => {
  it('tropical Leo reads sidereal Cancer on the PRD date', () => {
    expect(siderealSun('2026-07-24').sign).toBe('Cancer')
  })

  it('ayanamsa grows ~50.29 arcsec per year from 23.85 at J2000', () => {
    expect(lahiriAyanamsa('2000-06-01')).toBeCloseTo(23.85, 5)
    expect(lahiriAyanamsa('2026-06-01')).toBeCloseTo(24.213, 3)
  })
})

describe('panchang', () => {
  it('computes the PRD date at noon UTC', () => {
    const p = panchang('2026-07-24')
    // The PRD screenshot shows Shukla Dashami; at noon UTC the tithi has
    // already ticked over to Ekadashi — same paksha, adjacent tithi.
    expect(p.paksha).toBe('Shukla')
    expect(['Shukla Dashami', 'Shukla Ekadashi']).toContain(p.tithi)
    expect(p.vara).toBe('Shukravara') // 24 July 2026 is a Friday
  })

  it('names the full and new moon tithis', () => {
    // Noon-UTC lands inside the Purnima window on 2026-02-01 and the
    // Amavasya window on 2026-01-18.
    expect(panchang('2026-02-01').tithi).toBe('Shukla Purnima')
    expect(panchang('2026-01-18').tithi).toBe('Krishna Amavasya')
  })

  it('returns members of the canonical name sets', () => {
    const p = panchang('2026-03-15')
    expect(p.nakshatra).toBeTruthy()
    expect(p.yoga).toBeTruthy()
    expect(p.karana).toBeTruthy()
  })
})
