import { describe, it, expect } from 'vitest'

import {
  calendarMonth,
  calendarYear,
  hijriDate,
  persianDate,
  chineseYear,
  siderealSun,
  lahiriAyanamsa,
  panchang,
  chineseYearOf,
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
      cycle: 43,
      characters: '丙午',
      pinyin: 'Bing Wu',
    })
  })

  it('respects the lunisolar new year boundary (CNY 2026-02-17)', () => {
    expect(chineseYear(new Date('2026-02-16T12:00:00Z'))?.name).toBe('Wood Snake')
    expect(chineseYear(new Date('2026-02-18T12:00:00Z'))?.name).toBe('Fire Horse')
  })

  it('handles a classic reference year (1984 = Wood Rat)', () => {
    expect(chineseYear(new Date('1984-06-01T12:00:00Z'))?.name).toBe('Wood Rat')
  })

  it('opens the sixty-year cycle at Wood Rat and closes it at Water Pig', () => {
    expect(chineseYear(new Date('1984-06-01T12:00:00Z'))?.cycle).toBe(1)
    expect(chineseYear(new Date('2043-06-01T12:00:00Z'))).toMatchObject({ name: 'Water Pig', cycle: 60 })
    expect(chineseYear(new Date('2044-06-01T12:00:00Z'))).toMatchObject({ name: 'Wood Rat', cycle: 1 })
  })

  it('names each year of the sixty by the stem and branch its place in the cycle gives', () => {
    const named = new Set<string>()
    for (let year = 1984; year < 2044; year++) {
      const read = chineseYear(new Date(`${year}-06-01T12:00:00Z`))!
      const again = chineseYear(new Date(`${year + 60}-06-01T12:00:00Z`))!
      expect(again, String(year)).toMatchObject({ name: read.name, cycle: read.cycle })
      expect(read.cycle, String(year)).toBe(year - 1983)
      named.add(read.name)
    }
    expect(named.size).toBe(60)
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

describe('calendarMonth', () => {
  it('places 28 Heshvan 5787 in its 30-day month, which began on a Monday, three days before Kislev', () => {
    expect(calendarMonth('2026-11-08', 'hebrew')).toEqual({ day: 28, month: 'Heshvan', year: 5787, length: 30, firstWeekday: 1, next: { month: 'Kislev', inDays: 3 } })
  })

  it('places 17 Aban 1405 in its 30-day month, begun on Friday 23 October, fourteen days before Azar', () => {
    expect(calendarMonth('2026-11-08', 'persian')).toEqual({ day: 17, month: 'Aban', year: 1405, length: 30, firstWeekday: 5, next: { month: 'Azar', inDays: 14 } })
  })

  it('gives a Hijri month of 29 or 30 days that holds the day', () => {
    const month = calendarMonth('2026-11-08', 'islamic-umalqura')
    expect([29, 30]).toContain(month?.length)
    expect(month!.day).toBeLessThanOrEqual(month!.length)
    expect(month!.next.inDays).toBe(month!.length - month!.day + 1)
  })
})

describe('chineseYearOf', () => {
  it('names the year from the Gregorian year it begins in', () => {
    expect(chineseYearOf(2026)).toEqual({ element: 'Fire', animal: 'Horse', polarity: 'Yang', name: 'Fire Horse', cycle: 43, characters: '丙午', pinyin: 'Bing Wu' })
    expect(chineseYearOf(2027)).toMatchObject({ name: 'Fire Goat', polarity: 'Yin', cycle: 44 })
    expect(chineseYearOf(1984)).toMatchObject({ name: 'Wood Rat', cycle: 1 })
  })
})

describe('chineseYearOf characters', () => {
  it('writes the stem and branch, and says them', () => {
    expect(chineseYearOf(2026)).toMatchObject({ characters: '丙午', pinyin: 'Bing Wu' })
    expect(chineseYearOf(1984)).toMatchObject({ characters: '甲子', pinyin: 'Jia Zi' })
    expect(chineseYearOf(2043)).toMatchObject({ characters: '癸亥', pinyin: 'Gui Hai', cycle: 60 })
  })
})

describe('calendarYear', () => {
  it("lays out the year's months, a leap year's thirteen, from its first", () => {
    const hebrew = calendarYear('2026-11-08', 'hebrew')
    /* 5787 is the eleventh year of its nineteen, a leap year: Adar I and Adar II. */
    expect(hebrew?.map((m) => m.month)).toEqual(['Tishri', 'Heshvan', 'Kislev', 'Tevet', 'Shevat', 'Adar I', 'Adar II', 'Nisan', 'Iyar', 'Sivan', 'Tamuz', 'Av', 'Elul'])
    expect(hebrew?.[0]).toEqual({ month: 'Tishri', first: '2026-09-12', length: 30 })
    expect(hebrew?.[2]).toEqual({ month: 'Kislev', first: '2026-11-11', length: 30 })
    expect(calendarYear('2027-11-08', 'hebrew')).toHaveLength(12)
  })

  it('counts the Persian and Hijri years the same way', () => {
    expect(calendarYear('2026-11-08', 'persian')).toHaveLength(12)
    expect(calendarYear('2026-11-08', 'islamic-umalqura')).toHaveLength(12)
    expect(calendarYear('2026-11-08', 'persian')?.[0]).toMatchObject({ month: 'Farvardin', first: '2026-03-21' })
  })
})
