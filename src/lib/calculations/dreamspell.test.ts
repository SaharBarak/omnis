import { describe, it, expect } from 'vitest'
import { dateToKin, kinToSeal, kinToTone } from './dreamspell'
import { asKin } from '../../core/types'

describe('Dreamspell Calculations', () => {
  describe('dateToKin', () => {
    // Validation dates from DREAMSPELL_SPEC.md
    it('1987-07-26 (epoch) should be Kin 34', () => {
      expect(dateToKin('1987-07-26')).toBe(34)
    })

    it('2000-01-01 should be Kin 153', () => {
      // Verified by hand calculation: 4542 days - 3 leap days = 4539 adjusted days
      // Kin = ((34 - 1 + 4539) % 260) + 1 = 153
      expect(dateToKin('2000-01-01')).toBe(153)
    })

    it('2012-12-21 (end of Long Count) should be Kin 207', () => {
      expect(dateToKin('2012-12-21')).toBe(207)
    })

    // Leap year handling - Feb 29 should use Feb 28's Kin
    it('should skip Feb 29 (leap day uses Feb 28 Kin)', () => {
      const feb28Kin = dateToKin('2000-02-28')
      const feb29Kin = dateToKin('2000-02-29')
      expect(feb29Kin).toBe(feb28Kin)
    })

    it('March 1 after Feb 29 should be consecutive to Feb 28', () => {
      const feb28Kin = dateToKin('2000-02-28')
      const mar1Kin = dateToKin('2000-03-01')
      // Mar 1 should be feb28 + 1 (since Feb 29 is skipped)
      const expected = ((feb28Kin - 1 + 1) % 260) + 1
      expect(mar1Kin).toBe(expected)
    })

    // Pre-epoch dates (backward calculation)
    it('should handle pre-epoch dates correctly', () => {
      // One day before epoch
      const dayBefore = dateToKin('1987-07-25')
      // Should be Kin 33 (34 - 1)
      expect(dayBefore).toBe(33)
    })
  })

  describe('kinToSeal', () => {
    it('Kin 1 should be Seal 1 (Dragon)', () => {
      expect(kinToSeal(asKin(1))).toBe(1)
    })

    it('Kin 20 should be Seal 20 (Sun)', () => {
      expect(kinToSeal(asKin(20))).toBe(20)
    })

    it('Kin 21 should be Seal 1 (Dragon) - cycle restarts', () => {
      expect(kinToSeal(asKin(21))).toBe(1)
    })

    it('Kin 34 (epoch) should be Seal 14 (Wizard)', () => {
      expect(kinToSeal(asKin(34))).toBe(14)
    })

    it('Kin 153 should be Seal 13 (Skywalker)', () => {
      // (153 - 1) % 20 + 1 = 152 % 20 + 1 = 12 + 1 = 13
      expect(kinToSeal(asKin(153))).toBe(13)
    })

    it('Kin 207 should be Seal 7 (Hand)', () => {
      // (207 - 1) % 20 + 1 = 206 % 20 + 1 = 6 + 1 = 7
      expect(kinToSeal(asKin(207))).toBe(7)
    })
  })

  describe('kinToTone', () => {
    it('Kin 1 should be Tone 1 (Magnetic)', () => {
      expect(kinToTone(asKin(1))).toBe(1)
    })

    it('Kin 13 should be Tone 13 (Cosmic)', () => {
      expect(kinToTone(asKin(13))).toBe(13)
    })

    it('Kin 14 should be Tone 1 (Magnetic) - cycle restarts', () => {
      expect(kinToTone(asKin(14))).toBe(1)
    })

    it('Kin 34 (epoch) should be Tone 8 (Galactic)', () => {
      // (34 - 1) % 13 + 1 = 33 % 13 + 1 = 7 + 1 = 8
      expect(kinToTone(asKin(34))).toBe(8)
    })

    it('Kin 153 should be Tone 10 (Planetary)', () => {
      // (153 - 1) % 13 + 1 = 152 % 13 + 1 = 9 + 1 = 10
      expect(kinToTone(asKin(153))).toBe(10)
    })

    it('Kin 207 should be Tone 12 (Crystal)', () => {
      // (207 - 1) % 13 + 1 = 206 % 13 + 1 = 11 + 1 = 12
      expect(kinToTone(asKin(207))).toBe(12)
    })
  })

  describe('Full validation: date -> kin -> seal/tone', () => {
    it('1987-07-26 = White Galactic Wizard (Seal 14, Tone 8)', () => {
      const kin = dateToKin('1987-07-26')
      expect(kin).toBe(34)
      expect(kinToSeal(kin)).toBe(14) // Wizard
      expect(kinToTone(kin)).toBe(8)  // Galactic
    })

    it('2000-01-01 = Red Planetary Skywalker (Seal 13, Tone 10)', () => {
      const kin = dateToKin('2000-01-01')
      expect(kin).toBe(153)
      // (153 - 1) % 20 + 1 = 13 (Skywalker)
      expect(kinToSeal(kin)).toBe(13) // Skywalker
      // (153 - 1) % 13 + 1 = 10 (Planetary)
      expect(kinToTone(kin)).toBe(10) // Planetary
    })

    it('2012-12-21 = Blue Crystal Hand (Seal 7, Tone 12)', () => {
      const kin = dateToKin('2012-12-21')
      expect(kin).toBe(207)
      expect(kinToSeal(kin)).toBe(7)  // Hand
      expect(kinToTone(kin)).toBe(12) // Crystal
    })
  })
})
