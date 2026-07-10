import { describe, it, expect } from 'vitest'
import { isLeapYear, gregorianToJDN, parseDate } from './julian'

describe('Julian Day Number Calculations', () => {
  describe('isLeapYear', () => {
    it('should identify leap years correctly', () => {
      // Divisible by 4 but not 100
      expect(isLeapYear(2004)).toBe(true)
      expect(isLeapYear(2008)).toBe(true)
      expect(isLeapYear(2012)).toBe(true)

      // Not divisible by 4
      expect(isLeapYear(2001)).toBe(false)
      expect(isLeapYear(2019)).toBe(false)

      // Divisible by 100 but not 400 (not leap)
      expect(isLeapYear(1900)).toBe(false)
      expect(isLeapYear(2100)).toBe(false)

      // Divisible by 400 (leap)
      expect(isLeapYear(2000)).toBe(true)
      expect(isLeapYear(1600)).toBe(true)
    })
  })

  describe('gregorianToJDN', () => {
    // Known JDN values for validation
    it('should calculate correct JDN for known dates', () => {
      // January 1, 4713 BC = JDN 0 (but we use Gregorian, so different)
      // November 24, 4713 BC (proleptic Gregorian) = JDN 0

      // More practical reference dates:
      // January 1, 2000 = JDN 2451545
      expect(gregorianToJDN(2000, 1, 1)).toBe(2451545)

      // December 21, 2012 = JDN 2456283
      expect(gregorianToJDN(2012, 12, 21)).toBe(2456283)

      // July 26, 1987 (Dreamspell epoch)
      // JDN 2447003
      expect(gregorianToJDN(1987, 7, 26)).toBe(2447003)
    })

    it('should handle month/day boundaries correctly', () => {
      // Last day of year
      const dec31 = gregorianToJDN(1999, 12, 31)
      const jan1 = gregorianToJDN(2000, 1, 1)
      expect(jan1 - dec31).toBe(1)

      // Feb to March transition (non-leap)
      const feb28 = gregorianToJDN(2001, 2, 28)
      const mar1 = gregorianToJDN(2001, 3, 1)
      expect(mar1 - feb28).toBe(1)

      // Feb to March transition (leap year)
      const feb28Leap = gregorianToJDN(2000, 2, 28)
      const feb29Leap = gregorianToJDN(2000, 2, 29)
      const mar1Leap = gregorianToJDN(2000, 3, 1)
      expect(feb29Leap - feb28Leap).toBe(1)
      expect(mar1Leap - feb29Leap).toBe(1)
    })
  })

  describe('parseDate', () => {
    it('should parse YYYY-MM-DD format correctly', () => {
      expect(parseDate('2000-01-15')).toEqual({ year: 2000, month: 1, day: 15 })
      expect(parseDate('1987-07-26')).toEqual({ year: 1987, month: 7, day: 26 })
      expect(parseDate('2012-12-21')).toEqual({ year: 2012, month: 12, day: 21 })
    })

    it('should handle single digit months and days', () => {
      expect(parseDate('2000-01-01')).toEqual({ year: 2000, month: 1, day: 1 })
      expect(parseDate('2000-09-05')).toEqual({ year: 2000, month: 9, day: 5 })
    })
  })
})
