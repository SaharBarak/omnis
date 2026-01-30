import { describe, it, expect, beforeAll, vi } from 'vitest'
import {
  getDailyPrediction,
  getWeeklyPrediction,
  getMonthlyPrediction,
  getRangePredictions,
  getPersonalDailyPrediction,
  getPersonalTimeline,
  formatDateStr,
  addDays,
  daysBetween,
  getWeekStart,
  COLOR_HEX,
} from './predictions'
import { dateToKin, kinToSeal, kinToTone } from '../calculations'
import { getSeal } from '../data/seals'
import { getTone } from '../data/tones'

describe('Prediction Service', () => {
  describe('Date Utilities', () => {
    describe('formatDateStr', () => {
      it('should format date to YYYY-MM-DD', () => {
        const date = new Date('2024-03-15T10:30:00Z')
        expect(formatDateStr(date)).toBe('2024-03-15')
      })
    })

    describe('addDays', () => {
      it('should add positive days', () => {
        expect(addDays('2024-01-15', 5)).toBe('2024-01-20')
      })

      it('should handle month boundary', () => {
        expect(addDays('2024-01-30', 5)).toBe('2024-02-04')
      })

      it('should handle year boundary', () => {
        expect(addDays('2024-12-30', 5)).toBe('2025-01-04')
      })

      it('should subtract days with negative values', () => {
        expect(addDays('2024-01-15', -5)).toBe('2024-01-10')
      })
    })

    describe('daysBetween', () => {
      it('should calculate days between two dates', () => {
        expect(daysBetween('2024-01-01', '2024-01-10')).toBe(9)
      })

      it('should return 0 for same day', () => {
        expect(daysBetween('2024-01-15', '2024-01-15')).toBe(0)
      })

      it('should handle year boundary', () => {
        expect(daysBetween('2023-12-30', '2024-01-02')).toBe(3)
      })
    })

    describe('getWeekStart', () => {
      it('should return Sunday of the week', () => {
        // January 15, 2024 is a Monday
        expect(getWeekStart('2024-01-15')).toBe('2024-01-14')
      })

      it('should return same day if already Sunday', () => {
        // January 14, 2024 is a Sunday
        expect(getWeekStart('2024-01-14')).toBe('2024-01-14')
      })
    })
  })

  describe('COLOR_HEX', () => {
    it('should have all four color families', () => {
      expect(COLOR_HEX.red).toBe('#EF4444')
      expect(COLOR_HEX.white).toBe('#F5F5F5')
      expect(COLOR_HEX.blue).toBe('#3B82F6')
      expect(COLOR_HEX.yellow).toBe('#EAB308')
    })
  })

  describe('getDailyPrediction', () => {
    it('should return correct structure for a given date', () => {
      const prediction = getDailyPrediction('2024-01-15')

      expect(prediction).toHaveProperty('date', '2024-01-15')
      expect(prediction).toHaveProperty('kin')
      expect(prediction).toHaveProperty('seal')
      expect(prediction).toHaveProperty('tone')
      expect(prediction).toHaveProperty('sealName')
      expect(prediction).toHaveProperty('toneName')
      expect(prediction).toHaveProperty('color')
      expect(prediction).toHaveProperty('colorHex')
      expect(prediction).toHaveProperty('wavespell')
      expect(prediction).toHaveProperty('castle')
      expect(prediction).toHaveProperty('events')
      expect(prediction).toHaveProperty('intensity')
    })

    it('should have correct kin calculation', () => {
      const date = '2024-01-15'
      const prediction = getDailyPrediction(date)
      const expectedKin = dateToKin(date)

      expect(prediction.kin).toBe(expectedKin)
      expect(prediction.seal).toBe(kinToSeal(expectedKin))
      expect(prediction.tone).toBe(kinToTone(expectedKin))
    })

    it('should have valid seal and tone names', () => {
      const prediction = getDailyPrediction('2024-06-21')

      expect(prediction.sealName).toBeTruthy()
      expect(prediction.toneName).toBeTruthy()
      expect(['red', 'white', 'blue', 'yellow']).toContain(prediction.color)
    })

    it('should have valid wavespell data', () => {
      const prediction = getDailyPrediction('2024-03-20')

      expect(prediction.wavespell.number).toBeGreaterThanOrEqual(1)
      expect(prediction.wavespell.number).toBeLessThanOrEqual(20)
      expect(prediction.wavespell.day).toBeGreaterThanOrEqual(1)
      expect(prediction.wavespell.day).toBeLessThanOrEqual(13)
      expect(prediction.wavespell.name).toBeTruthy()
      expect(prediction.wavespell.role).toBeTruthy()
    })

    it('should have valid castle data', () => {
      const prediction = getDailyPrediction('2024-07-04')

      expect(prediction.castle.number).toBeGreaterThanOrEqual(1)
      expect(prediction.castle.number).toBeLessThanOrEqual(5)
      expect(prediction.castle.day).toBeGreaterThanOrEqual(1)
      expect(prediction.castle.day).toBeLessThanOrEqual(52)
      expect(prediction.castle.name).toBeTruthy()
      expect(prediction.castle.theme).toBeTruthy()
    })

    it('should return wavespell event on wavespell start (day 1)', () => {
      // Find a date that is day 1 of a wavespell
      // We'll check multiple dates to find one
      let foundWavespellStart = false
      for (let i = 0; i < 20; i++) {
        const date = addDays('2024-01-01', i)
        const prediction = getDailyPrediction(date)
        if (prediction.wavespell.day === 1) {
          foundWavespellStart = true
          expect(prediction.events.some(e => e.type === 'wavespell')).toBe(true)
          break
        }
      }
      expect(foundWavespellStart).toBe(true)
    })

    it('should return low intensity when no events', () => {
      // Find a day without transitions
      for (let i = 0; i < 20; i++) {
        const date = addDays('2024-01-05', i)
        const prediction = getDailyPrediction(date)
        if (prediction.events.length === 0) {
          expect(prediction.intensity).toBe('low')
          break
        }
      }
    })

    // Test known dates
    it('should calculate correctly for Harmonic Convergence (Aug 16-17, 1987)', () => {
      const prediction = getDailyPrediction('1987-08-16')
      // Kin 55 = Seal 15 (Eagle), Tone 3
      expect(prediction.kin).toBe(55)
      expect(prediction.seal).toBe(15)
      expect(prediction.tone).toBe(3)
    })

    it('should calculate correctly for 2012-12-21 (end of 13th Baktun)', () => {
      const prediction = getDailyPrediction('2012-12-21')
      // Kin 207 = Seal 7 (Hand), Tone 12
      expect(prediction.kin).toBe(207)
    })
  })

  describe('getWeeklyPrediction', () => {
    it('should return 7 days of predictions', () => {
      const weekly = getWeeklyPrediction('2024-01-15')

      expect(weekly.days).toHaveLength(7)
    })

    it('should have correct date range', () => {
      const weekly = getWeeklyPrediction('2024-01-15')
      const weekStart = getWeekStart('2024-01-15')

      expect(weekly.startDate).toBe(weekStart)
      expect(weekly.endDate).toBe(addDays(weekStart, 6))
    })

    it('should aggregate events from all days', () => {
      const weekly = getWeeklyPrediction('2024-01-15')

      let totalEvents = 0
      for (const day of weekly.days) {
        totalEvents += day.events.length
      }

      expect(weekly.events).toHaveLength(totalEvents)
    })

    it('should count wavespell and castle transitions', () => {
      const weekly = getWeeklyPrediction('2024-01-15')

      expect(typeof weekly.wavespellTransitions).toBe('number')
      expect(typeof weekly.castleTransitions).toBe('number')
      expect(weekly.wavespellTransitions).toBeGreaterThanOrEqual(0)
      expect(weekly.castleTransitions).toBeGreaterThanOrEqual(0)
    })

    it('should have valid intensity', () => {
      const weekly = getWeeklyPrediction('2024-01-15')

      expect(['low', 'medium', 'high', 'peak']).toContain(weekly.intensity)
    })
  })

  describe('getMonthlyPrediction', () => {
    it('should return correct number of days for January', () => {
      const monthly = getMonthlyPrediction(2024, 0) // 0 = January (internal)

      expect(monthly.days).toHaveLength(31)
      expect(monthly.year).toBe(2024)
      expect(monthly.month).toBe(0)
    })

    it('should return correct number of days for February (leap year)', () => {
      const monthly = getMonthlyPrediction(2024, 1) // 2024 is leap year

      expect(monthly.days).toHaveLength(29)
    })

    it('should return correct number of days for February (non-leap year)', () => {
      const monthly = getMonthlyPrediction(2023, 1)

      expect(monthly.days).toHaveLength(28)
    })

    it('should return correct number of days for April', () => {
      const monthly = getMonthlyPrediction(2024, 3) // April

      expect(monthly.days).toHaveLength(30)
    })

    it('should aggregate all events', () => {
      const monthly = getMonthlyPrediction(2024, 0)

      let totalEvents = 0
      for (const day of monthly.days) {
        totalEvents += day.events.length
      }

      expect(monthly.events).toHaveLength(totalEvents)
    })

    it('should collect high/peak events in highlights', () => {
      const monthly = getMonthlyPrediction(2024, 0)

      for (const highlight of monthly.highlights) {
        expect(['high', 'peak']).toContain(highlight.intensity)
      }
    })
  })

  describe('getRangePredictions', () => {
    it('should return predictions for date range', () => {
      const predictions = getRangePredictions('2024-01-01', '2024-01-10')

      expect(predictions).toHaveLength(10)
    })

    it('should return single day for same start and end', () => {
      const predictions = getRangePredictions('2024-01-15', '2024-01-15')

      expect(predictions).toHaveLength(1)
      expect(predictions[0].date).toBe('2024-01-15')
    })

    it('should return predictions in order', () => {
      const predictions = getRangePredictions('2024-03-01', '2024-03-05')

      expect(predictions[0].date).toBe('2024-03-01')
      expect(predictions[1].date).toBe('2024-03-02')
      expect(predictions[4].date).toBe('2024-03-05')
    })

    it('should handle month boundary', () => {
      const predictions = getRangePredictions('2024-01-30', '2024-02-02')

      expect(predictions).toHaveLength(4)
      expect(predictions[0].date).toBe('2024-01-30')
      expect(predictions[3].date).toBe('2024-02-02')
    })

    it('should handle year boundary', () => {
      const predictions = getRangePredictions('2023-12-30', '2024-01-02')

      expect(predictions).toHaveLength(4)
      expect(predictions[0].date).toBe('2023-12-30')
      expect(predictions[3].date).toBe('2024-01-02')
    })
  })

  describe('getPersonalDailyPrediction', () => {
    it('should return daily prediction with personalization', () => {
      const prediction = getPersonalDailyPrediction('2024-05-15', '1990-03-20')

      expect(prediction).toHaveProperty('date', '2024-05-15')
      expect(prediction).toHaveProperty('kin')
      expect(prediction).toHaveProperty('events')
    })

    it('should add galactic birthday event on birthday', () => {
      // Test with a specific birthday
      const birthDate = '1990-03-20'
      const birthdayThisYear = '2024-03-20'

      const prediction = getPersonalDailyPrediction(birthdayThisYear, birthDate)

      const hasGalacticEvent = prediction.events.some(
        e => e.type === 'yearly-kin' || e.type === 'return'
      )
      expect(hasGalacticEvent).toBe(true)
    })

    it('should not add galactic birthday event on non-birthday', () => {
      const birthDate = '1990-03-20'
      const notBirthday = '2024-03-21'

      const prediction = getPersonalDailyPrediction(notBirthday, birthDate)

      const hasGalacticBirthday = prediction.events.some(
        e => (e.type === 'yearly-kin' || e.type === 'return') &&
             e.title.includes('Galactic')
      )
      // Should either have no galactic birthday event or only have regular day events
      expect(
        !hasGalacticBirthday ||
        prediction.events.every(e => e.type !== 'return' && !e.title.includes('Galactic Birthday'))
      ).toBe(true)
    })

    it('should calculate intensity including personal events', () => {
      const birthDate = '1990-07-26'
      const birthdayThisYear = '2024-07-26'

      const prediction = getPersonalDailyPrediction(birthdayThisYear, birthDate)

      expect(['low', 'medium', 'high', 'peak']).toContain(prediction.intensity)
    })
  })

  describe('getPersonalTimeline', () => {
    const testPersonId = 'test-person-123'
    const testPersonName = 'Test Person'
    const testBirthDate = '1987-07-26' // Dreamspell epoch

    it('should return timeline with required properties', () => {
      const timeline = getPersonalTimeline(testPersonId, testPersonName, testBirthDate)

      expect(timeline).toHaveProperty('personId', testPersonId)
      expect(timeline).toHaveProperty('personName', testPersonName)
      expect(timeline).toHaveProperty('birthDate', testBirthDate)
      expect(timeline).toHaveProperty('birthKin')
      expect(timeline).toHaveProperty('currentPersonalYear')
      expect(timeline).toHaveProperty('milestones')
      expect(timeline).toHaveProperty('galacticReturns')
      expect(timeline).toHaveProperty('tunBirthdays')
      expect(timeline).toHaveProperty('katunBirthdays')
    })

    it('should have correct birth kin', () => {
      const timeline = getPersonalTimeline(testPersonId, testPersonName, testBirthDate)
      const expectedKin = dateToKin(testBirthDate)

      expect(timeline.birthKin).toBe(expectedKin)
    })

    it('should have current personal year data', () => {
      const timeline = getPersonalTimeline(testPersonId, testPersonName, testBirthDate)

      expect(timeline.currentPersonalYear).toHaveProperty('kin')
      expect(timeline.currentPersonalYear).toHaveProperty('seal')
      expect(timeline.currentPersonalYear).toHaveProperty('tone')
      expect(timeline.currentPersonalYear).toHaveProperty('startDate')
      expect(timeline.currentPersonalYear).toHaveProperty('endDate')
      expect(timeline.currentPersonalYear).toHaveProperty('age')
    })

    it('should have milestones array with valid structure', () => {
      const timeline = getPersonalTimeline(testPersonId, testPersonName, testBirthDate)

      expect(Array.isArray(timeline.milestones)).toBe(true)

      for (const milestone of timeline.milestones) {
        expect(milestone).toHaveProperty('type')
        expect(milestone).toHaveProperty('date')
        expect(milestone).toHaveProperty('title')
        expect(milestone).toHaveProperty('description')
        expect(milestone).toHaveProperty('intensity')
        expect(milestone).toHaveProperty('isFuture')
      }
    })

    it('should have galactic returns array', () => {
      const timeline = getPersonalTimeline(testPersonId, testPersonName, testBirthDate)

      expect(Array.isArray(timeline.galacticReturns)).toBe(true)

      for (const gr of timeline.galacticReturns) {
        expect(gr.type).toBe('return')
        expect(gr).toHaveProperty('kin')
        expect(gr).toHaveProperty('returnNumber')
        expect(gr).toHaveProperty('age')
      }
    })

    it('should have tun birthdays array', () => {
      const timeline = getPersonalTimeline(testPersonId, testPersonName, testBirthDate)

      expect(Array.isArray(timeline.tunBirthdays)).toBe(true)

      for (const tun of timeline.tunBirthdays) {
        expect(tun.type).toBe('tun-birthday')
        expect(tun).toHaveProperty('tunNumber')
        expect(tun).toHaveProperty('longCount')
      }
    })

    it('should have katun birthdays array', () => {
      const timeline = getPersonalTimeline(testPersonId, testPersonName, testBirthDate)

      expect(Array.isArray(timeline.katunBirthdays)).toBe(true)

      for (const katun of timeline.katunBirthdays) {
        expect(katun.type).toBe('katun-birthday')
        expect(katun).toHaveProperty('katunNumber')
        expect(katun).toHaveProperty('longCount')
        expect(katun).toHaveProperty('ageAtKatun')
      }
    })

    it('should sort milestones by date', () => {
      const timeline = getPersonalTimeline(testPersonId, testPersonName, testBirthDate)

      for (let i = 1; i < timeline.milestones.length; i++) {
        expect(timeline.milestones[i].date >= timeline.milestones[i - 1].date).toBe(true)
      }
    })

    it('should mark future milestones correctly', () => {
      const timeline = getPersonalTimeline(testPersonId, testPersonName, testBirthDate)
      const today = new Date().toISOString().split('T')[0]

      for (const milestone of timeline.milestones) {
        if (milestone.date > today) {
          expect(milestone.isFuture).toBe(true)
        }
      }
    })

    it('should include daysUntil for future milestones', () => {
      const timeline = getPersonalTimeline(testPersonId, testPersonName, testBirthDate)

      for (const milestone of timeline.milestones) {
        if (milestone.isFuture) {
          expect(typeof milestone.daysUntil).toBe('number')
          expect(milestone.daysUntil).toBeGreaterThan(0)
        }
      }
    })

    // Test with different birth dates
    it('should work with recent birth date', () => {
      const recentBirth = '2010-05-15'
      const timeline = getPersonalTimeline('recent-123', 'Recent Person', recentBirth)

      expect(timeline.birthKin).toBe(dateToKin(recentBirth))
      expect(timeline.currentPersonalYear.age).toBeGreaterThan(10)
    })

    it('should work with older birth date', () => {
      const olderBirth = '1950-01-01'
      const timeline = getPersonalTimeline('older-123', 'Older Person', olderBirth)

      expect(timeline.birthKin).toBe(dateToKin(olderBirth))
      expect(timeline.currentPersonalYear.age).toBeGreaterThan(70)
    })
  })

  describe('Edge Cases', () => {
    it('should handle leap day Feb 29', () => {
      const prediction = getDailyPrediction('2024-02-29')

      expect(prediction.date).toBe('2024-02-29')
      expect(prediction.kin).toBeGreaterThanOrEqual(1)
      expect(prediction.kin).toBeLessThanOrEqual(260)
    })

    it('should handle very old dates', () => {
      const prediction = getDailyPrediction('1900-01-01')

      expect(prediction.kin).toBeGreaterThanOrEqual(1)
      expect(prediction.kin).toBeLessThanOrEqual(260)
    })

    it('should handle far future dates', () => {
      const prediction = getDailyPrediction('2100-12-31')

      expect(prediction.kin).toBeGreaterThanOrEqual(1)
      expect(prediction.kin).toBeLessThanOrEqual(260)
    })
  })
})
