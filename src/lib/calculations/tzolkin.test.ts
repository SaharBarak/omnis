import { describe, it, expect } from 'vitest'
import { dateToTzolkin, getTzolkinSealNumber, getTzolkinTone } from './tzolkin'

describe('Tzolkin Calculations', () => {
  describe('dateToTzolkin', () => {
    // Validation dates from TZOLKIN_SPEC.md
    it('2012-12-21 = 4 Ajaw (sign 20, tone 4)', () => {
      const result = dateToTzolkin('2012-12-21')
      expect(result.daySign.number).toBe(20) // Ajaw
      expect(result.tone).toBe(4)
    })

    it('2000-01-01 = 11 Ik\' (sign 2, tone 11)', () => {
      const result = dateToTzolkin('2000-01-01')
      expect(result.daySign.number).toBe(2) // Ik'
      expect(result.tone).toBe(11)
    })

    it('1987-08-16 = 1 Imix (sign 1, tone 1)', () => {
      const result = dateToTzolkin('1987-08-16')
      expect(result.daySign.number).toBe(1) // Imix
      expect(result.tone).toBe(1)
    })
  })

  describe('getTzolkinSealNumber', () => {
    it('2012-12-21 should return seal 20 (Ajaw)', () => {
      expect(getTzolkinSealNumber('2012-12-21')).toBe(20)
    })

    it('2000-01-01 should return seal 2 (Ik\')', () => {
      expect(getTzolkinSealNumber('2000-01-01')).toBe(2)
    })

    it('1987-08-16 should return seal 1 (Imix)', () => {
      expect(getTzolkinSealNumber('1987-08-16')).toBe(1)
    })
  })

  describe('getTzolkinTone', () => {
    it('2012-12-21 should return tone 4', () => {
      expect(getTzolkinTone('2012-12-21')).toBe(4)
    })

    it('2000-01-01 should return tone 11', () => {
      expect(getTzolkinTone('2000-01-01')).toBe(11)
    })

    it('1987-08-16 should return tone 1', () => {
      expect(getTzolkinTone('1987-08-16')).toBe(1)
    })
  })

  describe('Tzolkin day sign names', () => {
    it('should return correct Yucatec names', () => {
      const result2012 = dateToTzolkin('2012-12-21')
      expect(result2012.daySign.yucatec).toBe('Ajaw')

      const result2000 = dateToTzolkin('2000-01-01')
      expect(result2000.daySign.yucatec).toBe("Ik'")

      const result1987 = dateToTzolkin('1987-08-16')
      expect(result1987.daySign.yucatec).toBe('Imix')
    })
  })

  describe('Tzolkin cycle continuity', () => {
    it('consecutive days should advance by 1 in both seal and tone', () => {
      const day1 = dateToTzolkin('2000-01-01')
      const day2 = dateToTzolkin('2000-01-02')

      // Seal advances by 1 (mod 20)
      const expectedSeal = day1.daySign.number === 20 ? 1 : day1.daySign.number + 1
      expect(day2.daySign.number).toBe(expectedSeal)

      // Tone advances by 1 (mod 13)
      const expectedTone = day1.tone === 13 ? 1 : day1.tone + 1
      expect(day2.tone).toBe(expectedTone)
    })
  })
})
