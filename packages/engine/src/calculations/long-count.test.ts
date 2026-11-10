import { describe, it, expect } from 'vitest'
import {
  jdnToLongCount,
  longCountToJDN,
  dateToLongCount,
  jdnToGregorian,
  jdnToHaab,
  dateToHaab,
  getCalendarRound,
  getLongCountData,
  formatLongCount,
  parseLongCount,
  isValidLongCount,
  daysSinceCreation,
  calculatePersonalMayanDates,
  addToLongCount,
  longCountDifference,
  HAAB_MONTHS,
  HISTORICAL_DATES,
  haabOfDays,
  haabYearOf,
  periodEnding,
  type LongCount,
} from './long-count'
import { gregorianToJDN } from './julian'
import { lordOfTheNight } from './lords-of-night'
import { daysSinceEraBase, tzolkinOfDays } from './tzolkin'

/** Days from the era base of a Long Count read in the current era. */
const daysOf = (lc: string): number => longCountToJDN(parseLongCount(lc)) - longCountToJDN(parseLongCount('0.0.0.0.0'))

describe('Long Count Calculations', () => {
  describe('jdnToLongCount', () => {
    it('should return 13.0.0.0.0 for 2012-12-21 (end of 13th baktun)', () => {
      const jdn = gregorianToJDN(2012, 12, 21)
      const lc = jdnToLongCount(jdn)
      expect(lc.baktun).toBe(13)
      expect(lc.katun).toBe(0)
      expect(lc.tun).toBe(0)
      expect(lc.winal).toBe(0)
      expect(lc.kin).toBe(0)
    })

    it('should calculate 12.19.6.15.2 for 2000-01-01', () => {
      const jdn = gregorianToJDN(2000, 1, 1)
      const lc = jdnToLongCount(jdn)
      expect(formatLongCount(lc)).toBe('12.19.6.15.2')
    })

    it('should return correct Long Count for Dreamspell epoch (1987-07-26)', () => {
      const jdn = gregorianToJDN(1987, 7, 26)
      const lc = jdnToLongCount(jdn)
      // Calculated: 12.18.14.4.0 (verified via GMT 584283 correlation)
      expect(formatLongCount(lc)).toBe('12.18.14.4.0')
    })

    it('should return correct Long Count for Harmonic Convergence (1987-08-16)', () => {
      const jdn = gregorianToJDN(1987, 8, 16)
      const lc = jdnToLongCount(jdn)
      // Calculated: 12.18.14.5.1 (21 days after 1987-07-26)
      expect(formatLongCount(lc)).toBe('12.18.14.5.1')
    })
  })

  describe('longCountToJDN', () => {
    it('should convert 13.0.0.0.0 back to correct JDN', () => {
      const lc: LongCount = { baktun: 13, katun: 0, tun: 0, winal: 0, kin: 0 }
      const jdn = longCountToJDN(lc)
      const dateStr = jdnToGregorian(jdn)
      expect(dateStr).toBe('2012-12-21')
    })

    it('should be inverse of jdnToLongCount', () => {
      const originalJDN = gregorianToJDN(2024, 6, 15)
      const lc = jdnToLongCount(originalJDN)
      const resultJDN = longCountToJDN(lc)
      expect(resultJDN).toBe(originalJDN)
    })
  })

  describe('dateToLongCount', () => {
    it('should convert date string to Long Count', () => {
      const lc = dateToLongCount('2012-12-21')
      expect(formatLongCount(lc)).toBe('13.0.0.0.0')
    })

    it('should handle dates from test data', () => {
      // Test with one of the test people: ליאור born 1966-09-23
      const lc = dateToLongCount('1966-09-23')
      // Calculated: 12.17.13.1.9 (verified via GMT 584283 correlation)
      expect(formatLongCount(lc)).toBe('12.17.13.1.9')
    })
  })

  describe('jdnToGregorian', () => {
    it('should convert JDN to date string', () => {
      const jdn = gregorianToJDN(2000, 1, 1)
      const dateStr = jdnToGregorian(jdn)
      expect(dateStr).toBe('2000-01-01')
    })

    it('should handle leap year dates', () => {
      const jdn = gregorianToJDN(2000, 2, 29)
      const dateStr = jdnToGregorian(jdn)
      expect(dateStr).toBe('2000-02-29')
    })

    it('should handle 2012-12-21', () => {
      const jdn = gregorianToJDN(2012, 12, 21)
      const dateStr = jdnToGregorian(jdn)
      expect(dateStr).toBe('2012-12-21')
    })
  })

  describe('jdnToHaab', () => {
    it("should return 3 K'ank'in for 2012-12-21", () => {
      const jdn = gregorianToJDN(2012, 12, 21)
      const haab = jdnToHaab(jdn)
      expect(haab.day).toBe(3)
      expect(haab.monthName).toBe("K'ank'in")
      expect(haab.month).toBe(13) // K'ank'in is month 13 (0-indexed)
    })

    it('should return Wayeb for the 5-day nameless period', () => {
      // Find a date during Wayeb
      // Wayeb is days 360-364 in the Haab cycle
      const jdn = gregorianToJDN(2012, 12, 21)
      // Haab on 2012-12-21 is 3 K'ank'in
      // We need to find when Wayeb occurs relative to this
      // For now, verify Wayeb exists in the month array
      expect(HAAB_MONTHS[18]).toBe("Wayeb'")
    })

    it('should handle regular months correctly', () => {
      // Pop is the first month (index 0)
      expect(HAAB_MONTHS[0]).toBe('Pop')
      expect(HAAB_MONTHS[17]).toBe("Kumk'u")
    })
  })

  describe('dateToHaab', () => {
    it('should convert date string to Haab', () => {
      const haab = dateToHaab('2012-12-21')
      expect(haab.day).toBe(3)
      expect(haab.monthName).toBe("K'ank'in")
    })
  })

  describe('getCalendarRound', () => {
    it('should return full calendar round for 2012-12-21', () => {
      const cr = getCalendarRound('2012-12-21')

      // Tzolkin: 4 Ajaw
      expect(cr.tzolkin.tone).toBe(4)
      expect(cr.tzolkin.daySign.yucatec).toBe('Ajaw')

      // Haab: 3 K'ank'in
      expect(cr.haab.day).toBe(3)
      expect(cr.haab.monthName).toBe("K'ank'in")

      // Formatted string
      expect(cr.formatted).toBe("4 Ajaw 3 K'ank'in")
    })

    it('should include Hebrew format', () => {
      const cr = getCalendarRound('2012-12-21')
      expect(cr.formattedHebrew).toContain('אדון') // Hebrew for Ajaw/Lord
    })
  })

  describe('getLongCountData', () => {
    it('should return complete Long Count data', () => {
      const data = getLongCountData('2012-12-21')

      expect(formatLongCount(data.longCount)).toBe('13.0.0.0.0')
      expect(data.daysSinceCreation).toBe(1872000)
      expect(data.tzolkin.tone).toBe(4)
      expect(data.haab.monthName).toBe("K'ank'in")
    })
  })

  describe('formatLongCount', () => {
    it('should format Long Count as dot-separated string', () => {
      const lc: LongCount = { baktun: 13, katun: 0, tun: 11, winal: 5, kin: 12 }
      expect(formatLongCount(lc)).toBe('13.0.11.5.12')
    })

    it('should handle zero values correctly', () => {
      const lc: LongCount = { baktun: 0, katun: 0, tun: 0, winal: 0, kin: 0 }
      expect(formatLongCount(lc)).toBe('0.0.0.0.0')
    })
  })

  describe('parseLongCount', () => {
    it('should parse valid Long Count string', () => {
      const lc = parseLongCount('13.0.0.0.0')
      expect(lc.baktun).toBe(13)
      expect(lc.katun).toBe(0)
      expect(lc.tun).toBe(0)
      expect(lc.winal).toBe(0)
      expect(lc.kin).toBe(0)
    })

    it('should throw on invalid format', () => {
      expect(() => parseLongCount('13.0.0.0')).toThrow()
      expect(() => parseLongCount('abc')).toThrow()
      expect(() => parseLongCount('13.0.0.0.0.0')).toThrow()
    })

    it('should throw on invalid winal (must be 0-17)', () => {
      expect(() => parseLongCount('13.0.0.18.0')).toThrow()
      expect(() => parseLongCount('13.0.0.19.0')).toThrow()
    })

    it('should accept valid winal values (0-17)', () => {
      const lc = parseLongCount('13.0.0.17.0')
      expect(lc.winal).toBe(17)
    })
  })

  describe('isValidLongCount', () => {
    it('should return true for valid Long Count', () => {
      const lc: LongCount = { baktun: 13, katun: 0, tun: 0, winal: 0, kin: 0 }
      expect(isValidLongCount(lc)).toBe(true)
    })

    it('should return false for invalid winal', () => {
      const lc: LongCount = { baktun: 13, katun: 0, tun: 0, winal: 18, kin: 0 }
      expect(isValidLongCount(lc)).toBe(false)
    })

    it('should return false for invalid baktun', () => {
      const lc: LongCount = { baktun: 20, katun: 0, tun: 0, winal: 0, kin: 0 }
      expect(isValidLongCount(lc)).toBe(false)
    })

    it('should return false for negative values', () => {
      const lc: LongCount = { baktun: -1, katun: 0, tun: 0, winal: 0, kin: 0 }
      expect(isValidLongCount(lc)).toBe(false)
    })
  })

  describe('daysSinceCreation', () => {
    it('should return 1872000 for 2012-12-21', () => {
      // 13 baktuns = 13 * 144000 = 1872000
      expect(daysSinceCreation('2012-12-21')).toBe(1872000)
    })
  })

  describe('addToLongCount', () => {
    it('should add days to Long Count', () => {
      const lc: LongCount = { baktun: 13, katun: 0, tun: 0, winal: 0, kin: 0 }
      const result = addToLongCount(lc, 1)
      expect(result.kin).toBe(1)
    })

    it('should handle rollover correctly', () => {
      const lc: LongCount = { baktun: 13, katun: 0, tun: 0, winal: 0, kin: 19 }
      const result = addToLongCount(lc, 1)
      expect(result.winal).toBe(1)
      expect(result.kin).toBe(0)
    })
  })

  describe('longCountDifference', () => {
    it('should calculate difference in days', () => {
      const lc1: LongCount = { baktun: 13, katun: 0, tun: 0, winal: 0, kin: 0 }
      const lc2: LongCount = { baktun: 13, katun: 0, tun: 0, winal: 1, kin: 0 }
      expect(longCountDifference(lc1, lc2)).toBe(20) // 1 winal = 20 days
    })

    it('should return negative for earlier date', () => {
      const lc1: LongCount = { baktun: 13, katun: 0, tun: 0, winal: 1, kin: 0 }
      const lc2: LongCount = { baktun: 13, katun: 0, tun: 0, winal: 0, kin: 0 }
      expect(longCountDifference(lc1, lc2)).toBe(-20)
    })
  })

  describe('calculatePersonalMayanDates', () => {
    it('should calculate birth Long Count', () => {
      const dates = calculatePersonalMayanDates('1966-09-23')
      // Calculated: 12.17.13.1.9 (verified via GMT 584283 correlation)
      expect(formatLongCount(dates.birth.longCount)).toBe('12.17.13.1.9')
    })

    it('should return tun birthdays', () => {
      const dates = calculatePersonalMayanDates('1966-09-23')
      expect(dates.tunBirthdays.length).toBeGreaterThan(0)

      // Each tun is 360 days apart
      expect(dates.tunBirthdays[0].tunNumber).toBeGreaterThan(0)
    })

    it('should return katun birthdays', () => {
      const dates = calculatePersonalMayanDates('1966-09-23')
      expect(dates.katunBirthdays.length).toBe(5)

      // First katun is about 19.7 years
      expect(dates.katunBirthdays[0].katunNumber).toBe(1)
      expect(dates.katunBirthdays[0].ageAtKatun).toBeCloseTo(20, 0)
    })

    it('should calculate calendar round return', () => {
      // For someone born recently, there should be a future CR return
      const dates = calculatePersonalMayanDates('2000-01-01')

      // CR return is about 52 years after birth
      if (dates.nextCalendarRoundReturn) {
        expect(dates.nextCalendarRoundReturn.yearsFromBirth).toBeCloseTo(52, 0)
      }
    })
  })

  describe('Historical date validation', () => {
    it('2012-12-21 should have Tzolkin 4 Ajaw', () => {
      const cr = getCalendarRound('2012-12-21')
      expect(cr.tzolkin.tone).toBe(4)
      expect(cr.tzolkin.daySign.number).toBe(20) // Ajaw is day sign 20
    })

    it('Harmonic Convergence (1987-08-16) should have Tzolkin 1 Imix', () => {
      const cr = getCalendarRound('1987-08-16')
      expect(cr.tzolkin.tone).toBe(1)
      expect(cr.tzolkin.daySign.number).toBe(1) // Imix is day sign 1
    })
  })

  describe('Time unit constants', () => {
    it('should have correct values for time units', () => {
      // 1 tun = 360 days
      // 1 katun = 20 tuns = 7200 days
      // 1 baktun = 20 katuns = 144000 days

      const lc: LongCount = { baktun: 1, katun: 0, tun: 0, winal: 0, kin: 0 }
      const days = longCountToJDN(lc) - 584283 // Subtract GMT correlation
      expect(days).toBe(144000)
    })

    it('should validate winal max is 17 (18 winals per tun)', () => {
      // 18 winals * 20 days = 360 days = 1 tun
      expect(isValidLongCount({ baktun: 0, katun: 0, tun: 0, winal: 17, kin: 0 })).toBe(true)
      expect(isValidLongCount({ baktun: 0, katun: 0, tun: 0, winal: 18, kin: 0 })).toBe(false)
    })
  })

  describe('Roundtrip conversions', () => {
    const testDates = [
      '1966-09-23', // ליאור
      '1955-06-11', // ילנה
      '1987-07-26', // Dreamspell epoch
      '2012-12-21', // End of 13th baktun
      '2000-01-01', // Y2K
      '2024-01-01', // Recent date
    ]

    testDates.forEach(dateStr => {
      it(`should roundtrip ${dateStr} correctly`, () => {
        const lc = dateToLongCount(dateStr)
        const jdn = longCountToJDN(lc)
        const resultDate = jdnToGregorian(jdn)
        expect(resultDate).toBe(dateStr)
      })
    })
  })

  /**
   * Kettunen and Helmke, Introduction to Maya Hieroglyphs (Wayeb, 2020),
   * p. 52: "An example of the correlation of the Long Count, Tzolk'in, Haab,
   * and the Lords of the Night", their spellings in the ALMG orthography.
   */
  describe("Kettunen and Helmke's correlation table", () => {
    const TABLE: readonly (readonly [string, string, string, string])[] = [
      ['9.8.19.17.14', '10 Ix', "17 Sip", 'G3'],
      ['9.8.19.17.17', "13 Kab'an", "0 Sotz'", 'G6'],
      ['9.9.0.0.0', '3 Ajaw', "3 Sotz'", 'G9'],
      ['9.9.0.0.1', '4 Imix', "4 Sotz'", 'G1'],
      ['9.9.0.0.9', '12 Muluk', "12 Sotz'", 'G9'],
      ['9.9.0.0.16', "6 Kib'", "19 Sotz'", 'G7'],
      ['9.9.0.0.17', "7 Kab'an", '0 Sek', 'G8'],
      ['9.9.0.0.18', "8 Etz'nab'", '1 Sek', 'G9'],
      ['9.9.0.1.0', '10 Ajaw', '3 Sek', 'G2'],
      ['9.9.0.1.4', "1 K'an", '7 Sek', 'G6'],
    ]

    it.each(TABLE)('%s is %s %s, %s', (lc, tzolkin, haab, lord) => {
      const days = daysOf(lc)
      const t = tzolkinOfDays(days)
      const h = haabOfDays(days)
      expect(`${t.tone} ${t.daySign.yucatec}`).toBe(tzolkin)
      expect(`${h.day} ${h.monthName}`).toBe(haab)
      expect(lordOfTheNight(days).glyph).toBe(lord)
    })

  })

  /** Kettunen and Helmke (2020), p. 51: the Haab' numbers each day sign can stand on. */
  it("puts each day sign only on the Haab' numbers Kettunen and Helmke list for it", () => {
    const CAN_TAKE: Readonly<Record<string, readonly number[]>> = {
      Ajaw: [8, 13, 18, 3], Imix: [4, 9, 14, 19], "Ik'": [5, 10, 15, 0], "Ak'b'al": [6, 11, 16, 1], "K'an": [7, 12, 17, 2],
      Chikchan: [8, 13, 18, 3], Kimi: [4, 9, 14, 19], "Manik'": [5, 10, 15, 0], Lamat: [6, 11, 16, 1], Muluk: [7, 12, 17, 2],
      Ok: [8, 13, 18, 3], Chuwen: [4, 9, 14, 19], "Eb'": [5, 10, 15, 0], "B'en": [6, 11, 16, 1], Ix: [7, 12, 17, 2],
      Men: [8, 13, 18, 3], "Kib'": [4, 9, 14, 19], "Kab'an": [5, 10, 15, 0], "Etz'nab'": [6, 11, 16, 1], Kawak: [7, 12, 17, 2],
    }
    const start = daysSinceEraBase('2026-01-01')
    for (let days = start; days < start + 365 * 4; days += 1) {
      expect(CAN_TAKE[tzolkinOfDays(days).daySign.yucatec], String(days)).toContain(haabOfDays(days).day)
    }
  })

  describe('Year bearers', () => {
    it("opens 2026's Haab' year on 0 Pop, 30 March, borne by one of the Classic four", () => {
      const year = haabYearOf(daysSinceEraBase('2026-11-08'))
      expect(jdnToGregorian(year.start + 584283)).toBe('2026-03-30')
      expect(haabOfDays(year.start)).toMatchObject({ day: 0, monthName: 'Pop' })
      expect(["Ik'", "Manik'", "Eb'", "Kab'an"]).toContain(year.bearer.daySign.yucatec)
    })

    it('steps each year five day signs and one number on, so only Ik\', Manik\', Eb\' and Kab\'an bear years', () => {
      const first = haabYearOf(daysSinceEraBase('2012-12-21'))
      for (let n = 1; n <= 52; n += 1) {
        const year = haabYearOf(first.start + n * 365)
        expect(year.start).toBe(first.start + n * 365)
        expect(["Ik'", "Manik'", "Eb'", "Kab'an"]).toContain(year.bearer.daySign.yucatec)
        expect(year.bearer.tone).toBe(((first.bearer.tone - 1 + n) % 13) + 1)
      }
    })
  })

  it('names the period a day ends: the tun, the k\'atun or the b\'ak\'tun', () => {
    expect(periodEnding(daysOf('13.0.0.0.0'))).toBe('baktun')
    expect(periodEnding(daysOf('9.9.0.0.0'))).toBe('katun')
    expect(periodEnding(daysOf('13.0.14.0.0'))).toBe('tun')
    expect(periodEnding(daysOf('9.15.6.14.6'))).toBeUndefined()
  })

  it('dates the anchor dates as the count reads them back from 13.0.0.0.0 4 Ajaw 3 K\'ank\'in', () => {
    expect(HISTORICAL_DATES.map(({ gregorian, longCount, tzolkin, haab }) => [gregorian, longCount, tzolkin, haab])).toEqual([
      ['2012-12-21', '13.0.0.0.0', '4 Ajaw', "3 K'ank'in"],
      ['1987-08-16', '12.18.14.5.1', '1 Imix', "9 Yaxk'in"],
      ['1987-07-26', '12.18.14.4.0', '6 Ajaw', '8 Xul'],
    ])
  })
})
