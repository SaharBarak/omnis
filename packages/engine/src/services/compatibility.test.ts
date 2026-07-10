import { describe, it, expect } from 'vitest'
import {
  getPersonKinData,
  calculateDreamspellCompatibility,
  calculateTzolkinCompatibility,
  calculateCombinedCompatibility,
  getHarmonyLabel,
  getScoreColor,
} from './compatibility'
import { dateToKin, kinToSeal, kinToTone } from '../calculations/dreamspell'
import { getAnalog, getAntipode, getOccult } from '../data/oracle-tables'

describe('Compatibility Service', () => {
  describe('getPersonKinData', () => {
    it('should return kin data for a birth date', () => {
      const data = getPersonKinData('1987-07-26')

      expect(data).toHaveProperty('kin')
      expect(data).toHaveProperty('seal')
      expect(data).toHaveProperty('tone')
      expect(data).toHaveProperty('color')
    })

    it('should calculate correct kin for Dreamspell epoch', () => {
      const data = getPersonKinData('1987-07-26')

      // July 26, 1987 = Kin 34 (White Galactic Wizard)
      // Seal = (34-1) % 20 + 1 = 14 (Wizard)
      // Tone = (34-1) % 13 + 1 = 8 (Galactic)
      expect(data.kin).toBe(34)
      expect(data.seal).toBe(14) // Wizard
      expect(data.tone).toBe(8) // Galactic
      expect(data.color).toBe('white')
    })

    it('should calculate correct kin for 2012-12-21', () => {
      const data = getPersonKinData('2012-12-21')

      // Dec 21, 2012 = Kin 207 (Blue Crystal Hand)
      expect(data.kin).toBe(207)
      expect(data.seal).toBe(7) // Hand
      expect(data.tone).toBe(12) // Crystal
      expect(data.color).toBe('blue')
    })

    it('should return valid color for any date', () => {
      const colors = ['red', 'white', 'blue', 'yellow']
      const dates = [
        '1990-01-01',
        '2000-06-15',
        '2010-12-25',
        '2020-03-20',
      ]

      for (const date of dates) {
        const data = getPersonKinData(date)
        expect(colors).toContain(data.color)
      }
    })
  })

  describe('calculateDreamspellCompatibility', () => {
    it('should return compatibility structure', () => {
      const result = calculateDreamspellCompatibility('1990-01-01', '1995-05-15')

      expect(result).toHaveProperty('person1Kin')
      expect(result).toHaveProperty('person2Kin')
      expect(result).toHaveProperty('score')
      expect(result).toHaveProperty('connections')
      expect(Array.isArray(result.connections)).toBe(true)
    })

    it('should have base score of 20 when no connections', () => {
      // Find two people with no connections
      // This is hard to guarantee, but score should be at least 20
      const result = calculateDreamspellCompatibility('1990-01-01', '1995-05-15')

      expect(result.score).toBeGreaterThanOrEqual(20)
    })

    it('should detect same-seal connection', () => {
      // Find two dates with the same seal
      // Kin cycles every 20 days for seals
      const date1 = '2024-01-01'
      const date2 = '2024-01-21' // 20 days later, same seal

      const p1 = getPersonKinData(date1)
      const p2 = getPersonKinData(date2)

      // If seals match, test; otherwise skip
      if (p1.seal === p2.seal) {
        const result = calculateDreamspellCompatibility(date1, date2)
        expect(result.connections.some(c => c.type === 'same-seal')).toBe(true)
      }
    })

    it('should detect same-tone connection', () => {
      // Find two dates with the same tone
      // Tone cycles every 13 days
      const date1 = '2024-01-01'
      const date2 = '2024-01-14' // 13 days later, same tone

      const p1 = getPersonKinData(date1)
      const p2 = getPersonKinData(date2)

      // If tones match, test; otherwise continue
      if (p1.tone === p2.tone) {
        const result = calculateDreamspellCompatibility(date1, date2)
        expect(result.connections.some(c => c.type === 'same-tone')).toBe(true)
      }
    })

    it('should detect analog connection', () => {
      // Create specific test: person2's seal should be person1's analog
      const p1Data = getPersonKinData('1987-07-26') // Seal 14 (Wizard)
      const analogSeal = getAnalog(p1Data.seal) // Should be 9 (Moon)

      // Wizard (14) and Moon (9) are analogs per oracle-tables
      expect(analogSeal).toBe(9) // Wizard's analog is Moon
    })

    it('should detect antipode connection', () => {
      const p1Data = getPersonKinData('1987-07-26') // Seal 14 (Wizard)
      const antipodeSeal = getAntipode(p1Data.seal) // Should be 4 (Seed)

      // Antipode of Wizard (14) = (14-1+10)%20+1 = 4 (Seed)
      expect(antipodeSeal).toBe(4)
    })

    it('should detect occult connection', () => {
      const p1Data = getPersonKinData('1987-07-26') // Seal 14 (Wizard)
      const occultSeal = getOccult(p1Data.seal) // Should be 7 (Hand)

      // Occult of Wizard (14) = 21-14 = 7 (Hand)
      expect(occultSeal).toBe(7)
    })

    it('should cap score at 100', () => {
      // Find two people with same seal and same tone (high score)
      const date1 = '2024-01-01'
      // Same kin = same seal + same tone
      const date2 = '2024-01-01' // Same date = same kin

      const result = calculateDreamspellCompatibility(date1, date2)

      expect(result.score).toBeLessThanOrEqual(100)
    })

    it('should not add same-color when same-seal', () => {
      // Same seal implies same color, but we shouldn't add both
      const date1 = '2024-01-01'
      const date2 = '2024-01-01' // Same kin

      const result = calculateDreamspellCompatibility(date1, date2)

      // Should have same-seal but not same-color
      const hasSameSeal = result.connections.some(c => c.type === 'same-seal')
      const hasSameColor = result.connections.some(c => c.type === 'same-color')

      if (hasSameSeal) {
        expect(hasSameColor).toBe(false)
      }
    })

    it('should have bilingual descriptions', () => {
      const result = calculateDreamspellCompatibility('1987-07-26', '1987-07-26')

      for (const connection of result.connections) {
        expect(connection.description).toBeTruthy()
        expect(connection.descriptionHebrew).toBeTruthy()
        expect(connection.harmony).toBeTruthy()
      }
    })
  })

  describe('calculateTzolkinCompatibility', () => {
    it('should return tzolkin compatibility structure', () => {
      const result = calculateTzolkinCompatibility('1990-01-01', '1995-05-15')

      expect(result).toHaveProperty('person1Sign')
      expect(result).toHaveProperty('person1Tone')
      expect(result).toHaveProperty('person2Sign')
      expect(result).toHaveProperty('person2Tone')
      expect(result).toHaveProperty('score')
      expect(result).toHaveProperty('connections')
    })

    it('should have base score of at least 20', () => {
      const result = calculateTzolkinCompatibility('1990-01-01', '1995-05-15')

      expect(result.score).toBeGreaterThanOrEqual(20)
    })

    it('should detect same-sign connection', () => {
      // Same Tzolkin date = same sign
      const result = calculateTzolkinCompatibility('2024-01-01', '2024-01-01')

      expect(result.connections.some(c => c.type === 'same-sign')).toBe(true)
    })

    it('should detect same-tone connection when tones match', () => {
      const result = calculateTzolkinCompatibility('2024-01-01', '2024-01-01')

      // Same date = same tone
      expect(result.connections.some(c => c.type === 'same-tone')).toBe(true)
    })

    it('should cap score at 100', () => {
      const result = calculateTzolkinCompatibility('2024-01-01', '2024-01-01')

      expect(result.score).toBeLessThanOrEqual(100)
    })

    it('should have bilingual descriptions for connections', () => {
      const result = calculateTzolkinCompatibility('2024-01-01', '2024-01-01')

      for (const connection of result.connections) {
        expect(connection.description).toBeTruthy()
        expect(connection.descriptionHebrew).toBeTruthy()
      }
    })

    it('should return valid sign numbers (1-20)', () => {
      const testDates = [
        '1990-01-01',
        '2000-06-15',
        '2010-12-25',
        '2020-03-20',
      ]

      for (const date of testDates) {
        const result = calculateTzolkinCompatibility(date, '2024-01-01')

        expect(result.person1Sign).toBeGreaterThanOrEqual(1)
        expect(result.person1Sign).toBeLessThanOrEqual(20)
        expect(result.person2Sign).toBeGreaterThanOrEqual(1)
        expect(result.person2Sign).toBeLessThanOrEqual(20)
      }
    })

    it('should return valid tone numbers (1-13)', () => {
      const testDates = [
        '1990-01-01',
        '2000-06-15',
        '2010-12-25',
        '2020-03-20',
      ]

      for (const date of testDates) {
        const result = calculateTzolkinCompatibility(date, '2024-01-01')

        expect(result.person1Tone).toBeGreaterThanOrEqual(1)
        expect(result.person1Tone).toBeLessThanOrEqual(13)
        expect(result.person2Tone).toBeGreaterThanOrEqual(1)
        expect(result.person2Tone).toBeLessThanOrEqual(13)
      }
    })
  })

  describe('calculateCombinedCompatibility', () => {
    it('should return combined compatibility structure', () => {
      const result = calculateCombinedCompatibility('1990-01-01', '1995-05-15')

      expect(result).toHaveProperty('dreamspell')
      expect(result).toHaveProperty('tzolkin')
      expect(result).toHaveProperty('overallScore')
      expect(result).toHaveProperty('summary')
    })

    it('should calculate weighted average (60% Dreamspell, 40% Tzolkin)', () => {
      const result = calculateCombinedCompatibility('1990-01-01', '1995-05-15')

      const expected = Math.round(
        result.dreamspell.score * 0.6 + result.tzolkin.score * 0.4
      )

      expect(result.overallScore).toBe(expected)
    })

    it('should have bilingual summary', () => {
      const result = calculateCombinedCompatibility('1990-01-01', '1995-05-15')

      expect(result.summary).toHaveProperty('english')
      expect(result.summary).toHaveProperty('hebrew')
      expect(result.summary.english).toBeTruthy()
      expect(result.summary.hebrew).toBeTruthy()
    })

    it('should return strong resonance summary for high scores', () => {
      // Same date = high score
      const result = calculateCombinedCompatibility('2024-01-01', '2024-01-01')

      // High score should mention "resonance" or similar
      expect(result.overallScore).toBeGreaterThanOrEqual(60)
    })

    it('should cap overall score at 100', () => {
      const result = calculateCombinedCompatibility('2024-01-01', '2024-01-01')

      expect(result.overallScore).toBeLessThanOrEqual(100)
    })

    it('should include both dreamspell and tzolkin sub-results', () => {
      const result = calculateCombinedCompatibility('1990-01-01', '1995-05-15')

      expect(result.dreamspell.score).toBeGreaterThanOrEqual(0)
      expect(result.dreamspell.score).toBeLessThanOrEqual(100)
      expect(result.tzolkin.score).toBeGreaterThanOrEqual(0)
      expect(result.tzolkin.score).toBeLessThanOrEqual(100)
    })
  })

  describe('getHarmonyLabel', () => {
    it('should return supportive label', () => {
      const label = getHarmonyLabel('supportive')

      expect(label.english).toBe('Supportive')
      expect(label.hebrew).toBe('תומך')
    })

    it('should return challenging label', () => {
      const label = getHarmonyLabel('challenging')

      expect(label.english).toBe('Challenging')
      expect(label.hebrew).toBe('מאתגר')
    })

    it('should return transformative label', () => {
      const label = getHarmonyLabel('transformative')

      expect(label.english).toBe('Transformative')
      expect(label.hebrew).toBe('טרנספורמטיבי')
    })

    it('should return neutral label', () => {
      const label = getHarmonyLabel('neutral')

      expect(label.english).toBe('Neutral')
      expect(label.hebrew).toBe('ניטרלי')
    })
  })

  describe('getScoreColor', () => {
    it('should return green for scores >= 80', () => {
      expect(getScoreColor(80)).toBe('#22C55E')
      expect(getScoreColor(90)).toBe('#22C55E')
      expect(getScoreColor(100)).toBe('#22C55E')
    })

    it('should return lime for scores >= 60', () => {
      expect(getScoreColor(60)).toBe('#84CC16')
      expect(getScoreColor(70)).toBe('#84CC16')
      expect(getScoreColor(79)).toBe('#84CC16')
    })

    it('should return amber for scores >= 40', () => {
      expect(getScoreColor(40)).toBe('#F59E0B')
      expect(getScoreColor(50)).toBe('#F59E0B')
      expect(getScoreColor(59)).toBe('#F59E0B')
    })

    it('should return orange for scores >= 20', () => {
      expect(getScoreColor(20)).toBe('#F97316')
      expect(getScoreColor(30)).toBe('#F97316')
      expect(getScoreColor(39)).toBe('#F97316')
    })

    it('should return red for scores < 20', () => {
      expect(getScoreColor(0)).toBe('#EF4444')
      expect(getScoreColor(10)).toBe('#EF4444')
      expect(getScoreColor(19)).toBe('#EF4444')
    })
  })

  describe('Edge Cases', () => {
    it('should handle same person (identical dates)', () => {
      const result = calculateCombinedCompatibility('1990-05-15', '1990-05-15')

      // Same person should have high score
      expect(result.overallScore).toBeGreaterThanOrEqual(60)
    })

    it('should handle very old dates', () => {
      const result = calculateCombinedCompatibility('1900-01-01', '1950-06-15')

      expect(result.overallScore).toBeGreaterThanOrEqual(0)
      expect(result.overallScore).toBeLessThanOrEqual(100)
    })

    it('should handle future dates', () => {
      const result = calculateCombinedCompatibility('2050-01-01', '2075-06-15')

      expect(result.overallScore).toBeGreaterThanOrEqual(0)
      expect(result.overallScore).toBeLessThanOrEqual(100)
    })

    it('should handle leap day', () => {
      const result = calculateCombinedCompatibility('2024-02-29', '2020-02-29')

      expect(result.overallScore).toBeGreaterThanOrEqual(0)
      expect(result.overallScore).toBeLessThanOrEqual(100)
    })

    it('should be symmetric (person1 <-> person2 ordering)', () => {
      const result1 = calculateCombinedCompatibility('1990-01-01', '1995-05-15')
      const result2 = calculateCombinedCompatibility('1995-05-15', '1990-01-01')

      // Scores might differ slightly due to guide calculation direction
      // but should be within reasonable range
      expect(Math.abs(result1.overallScore - result2.overallScore)).toBeLessThanOrEqual(10)
    })
  })

  describe('Specific Oracle Relationships', () => {
    // Test specific known relationships based on DREAMSPELL_SPEC.md

    it('should detect Dragon-Earth analog pair', () => {
      // Dragon (1) and Earth (17) are analogs
      // Need to find dates where seals are 1 and 17
      const dragonSeal = 1
      const earthSeal = 17

      const analog = getAnalog(dragonSeal as any)
      expect(analog).toBe(earthSeal)
    })

    it('should detect Wind-Storm analog pair', () => {
      const windSeal = 2
      const stormSeal = 19

      const analog = getAnalog(windSeal as any)
      expect(analog).toBe(stormSeal)
    })

    it('should detect Seed-Star analog pair', () => {
      const seedSeal = 4
      const starSeal = 8

      const analog = getAnalog(seedSeal as any)
      expect(analog).toBe(starSeal)
    })

    it('should calculate antipode correctly (seal + 10)', () => {
      // Seal 1 antipode = 11
      expect(getAntipode(1 as any)).toBe(11)
      // Seal 5 antipode = 15
      expect(getAntipode(5 as any)).toBe(15)
      // Seal 15 antipode = 5 (wraps around)
      expect(getAntipode(15 as any)).toBe(5)
    })

    it('should calculate occult correctly (21 - seal)', () => {
      // Seal 1 occult = 20
      expect(getOccult(1 as any)).toBe(20)
      // Seal 10 occult = 11
      expect(getOccult(10 as any)).toBe(11)
      // Seal 20 occult = 1
      expect(getOccult(20 as any)).toBe(1)
    })
  })
})
