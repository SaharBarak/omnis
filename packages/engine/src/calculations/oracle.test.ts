import { describe, it, expect } from 'vitest'
import { calculateOracle } from './oracle'
import { asKin } from '../core/types'
import { getAnalog, getAntipode, getOccult, getGuide, getOccultTone } from '../data/oracle-tables'

describe('Oracle Calculations', () => {
  describe('calculateOracle', () => {
    it('should return all five oracle positions including occultTone', () => {
      const oracle = calculateOracle(asKin(34))
      expect(oracle).toHaveProperty('guide')
      expect(oracle).toHaveProperty('analog')
      expect(oracle).toHaveProperty('antipode')
      expect(oracle).toHaveProperty('occult')
      expect(oracle).toHaveProperty('occultTone')
    })

    // Kin 34 = Seal 14 (Wizard), Tone 8
    it('Kin 34 (White Galactic Wizard) oracle positions', () => {
      const oracle = calculateOracle(asKin(34))
      // Guide: Tone 8 -> offset 4 -> (14-1+4)%20+1 = 18 (Mirror)
      expect(oracle.guide).toBe(18)
      // Analog: Wizard (14) <-> Moon (9)
      expect(oracle.analog).toBe(9)
      // Antipode: (14-1+10)%20+1 = 4 (Seed)
      expect(oracle.antipode).toBe(4)
      // Occult: 21-14 = 7 (Hand)
      expect(oracle.occult).toBe(7)
      // Occult Tone: 14-8 = 6
      expect(oracle.occultTone).toBe(6)
    })
  })

  describe('getAnalog (from DREAMSPELL_SPEC.md analog pairs)', () => {
    const analogPairs: [number, number][] = [
      [1, 17],   // Dragon <-> Earth
      [2, 19],   // Wind <-> Storm
      [3, 18],   // Night <-> Mirror
      [4, 8],    // Seed <-> Star
      [5, 10],   // Serpent <-> Dog
      [6, 7],    // World-Bridger <-> Hand
      [9, 14],   // Moon <-> Wizard
      [11, 12],  // Monkey <-> Human
      [13, 20],  // Skywalker <-> Sun
      [15, 16],  // Eagle <-> Warrior
    ]

    analogPairs.forEach(([a, b]) => {
      it(`Seal ${a} analog should be Seal ${b}`, () => {
        expect(getAnalog(a as any)).toBe(b)
      })
      it(`Seal ${b} analog should be Seal ${a}`, () => {
        expect(getAnalog(b as any)).toBe(a)
      })
    })
  })

  describe('getAntipode', () => {
    it('should calculate antipode as (seal + 10) mod 20', () => {
      // Seal 1 -> (1-1+10)%20+1 = 11
      expect(getAntipode(1 as any)).toBe(11)
      // Seal 10 -> (10-1+10)%20+1 = 20
      expect(getAntipode(10 as any)).toBe(20)
      // Seal 11 -> (11-1+10)%20+1 = 1
      expect(getAntipode(11 as any)).toBe(1)
      // Seal 20 -> (20-1+10)%20+1 = 10
      expect(getAntipode(20 as any)).toBe(10)
    })
  })

  describe('getOccult', () => {
    it('should calculate occult as 21 - seal', () => {
      expect(getOccult(1 as any)).toBe(20)  // 21-1 = 20
      expect(getOccult(10 as any)).toBe(11) // 21-10 = 11
      expect(getOccult(11 as any)).toBe(10) // 21-11 = 10
      expect(getOccult(20 as any)).toBe(1)  // 21-20 = 1
    })
  })

  describe('getOccultTone', () => {
    it('should calculate occult tone as 14 - tone', () => {
      expect(getOccultTone(1)).toBe(13)   // 14-1 = 13
      expect(getOccultTone(2)).toBe(12)   // 14-2 = 12
      expect(getOccultTone(7)).toBe(7)    // 14-7 = 7
      expect(getOccultTone(8)).toBe(6)    // 14-8 = 6
      expect(getOccultTone(13)).toBe(1)   // 14-13 = 1
    })

    it('should return 13 when result would be 0 (tone 14 case)', () => {
      // This tests the edge case: 14-14=0 should be 13
      // Although valid tones are 1-13, the formula handles the edge case
      expect(getOccultTone(14)).toBe(13)
    })

    it('should be complementary: tone + occultTone = 14 (or 27 when one is 13)', () => {
      for (let tone = 1; tone <= 13; tone++) {
        const occultTone = getOccultTone(tone)
        // Either sums to 14, or when tone=1, occultTone=13 (special case)
        expect(tone + occultTone).toBe(14)
      }
    })
  })

  describe('getGuide', () => {
    // Tones 1, 6, 11 -> offset 0 (same seal)
    it('Tones 1, 6, 11 should return same seal (offset 0)', () => {
      expect(getGuide(5 as any, 1)).toBe(5)
      expect(getGuide(5 as any, 6)).toBe(5)
      expect(getGuide(5 as any, 11)).toBe(5)
    })

    // Tones 2, 7, 12 -> offset 12
    it('Tones 2, 7, 12 should use offset 12', () => {
      // Seal 1 + 12 = 13
      expect(getGuide(1 as any, 2)).toBe(13)
      expect(getGuide(1 as any, 7)).toBe(13)
      expect(getGuide(1 as any, 12)).toBe(13)
    })

    // Tones 3, 8, 13 -> offset 4
    it('Tones 3, 8, 13 should use offset 4', () => {
      // Seal 1 + 4 = 5
      expect(getGuide(1 as any, 3)).toBe(5)
      expect(getGuide(1 as any, 8)).toBe(5)
      expect(getGuide(1 as any, 13)).toBe(5)
    })

    // Tones 4, 9 -> offset 16
    it('Tones 4, 9 should use offset 16', () => {
      // Seal 1 + 16 = 17
      expect(getGuide(1 as any, 4)).toBe(17)
      expect(getGuide(1 as any, 9)).toBe(17)
    })

    // Tones 5, 10 -> offset 8
    it('Tones 5, 10 should use offset 8', () => {
      // Seal 1 + 8 = 9
      expect(getGuide(1 as any, 5)).toBe(9)
      expect(getGuide(1 as any, 10)).toBe(9)
    })
  })
})
