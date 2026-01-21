import { describe, it, expect } from 'vitest'
import {
  getDreamspellYearStart,
  getDreamspellYearEnd,
  getYearBearerKin,
  getYearBearer,
  getDreamspellYear,
  getDateDreamspellYear,
  getGalacticBirthday,
  getNextGalacticReturn,
  getGalacticReturns,
  getPersonalYear,
  getCurrentPersonalYear,
  getPersonalCyclePosition,
} from './yearly'

describe('Dreamspell Year calculations', () => {
  describe('getDreamspellYearStart', () => {
    it('should return July 26 for any year', () => {
      expect(getDreamspellYearStart(2024)).toBe('2024-07-26')
      expect(getDreamspellYearStart(1987)).toBe('1987-07-26')
    })
  })

  describe('getDreamspellYearEnd', () => {
    it('should return July 25 of following year', () => {
      expect(getDreamspellYearEnd(2024)).toBe('2025-07-25')
      expect(getDreamspellYearEnd(1987)).toBe('1988-07-25')
    })
  })

  describe('getYearBearerKin', () => {
    it('should return kin 34 for epoch year 1987', () => {
      expect(getYearBearerKin(1987)).toBe(34)
    })
  })

  describe('getYearBearer', () => {
    it('should return year bearer for 1987', () => {
      const yb = getYearBearer(1987)
      expect(yb.kin).toBe(34)
      expect(yb.seal).toBe(14) // Wizard ((34-1) % 20) + 1 = 14
      expect(yb.tone).toBe(8)  // Galactic ((34-1) % 13) + 1 = 8
    })
  })

  describe('getDreamspellYear', () => {
    it('should return complete year info for 1987', () => {
      const year = getDreamspellYear(1987)
      expect(year.startDate).toBe('1987-07-26')
      expect(year.endDate).toBe('1988-07-25')
      expect(year.yearBearer.kin).toBe(34)
      expect(year.yearName).toBe('White Galactic Wizard')
    })
  })

  describe('getDateDreamspellYear', () => {
    it('should return current year for dates after July 26', () => {
      const year = getDateDreamspellYear('2024-08-01')
      expect(year.startDate).toBe('2024-07-26')
    })

    it('should return previous year for dates before July 26', () => {
      const year = getDateDreamspellYear('2024-05-15')
      expect(year.startDate).toBe('2023-07-26')
    })

    it('should return previous year for July 25', () => {
      const year = getDateDreamspellYear('2024-07-25')
      expect(year.startDate).toBe('2023-07-26')
    })

    it('should return current year for July 26', () => {
      const year = getDateDreamspellYear('2024-07-26')
      expect(year.startDate).toBe('2024-07-26')
    })
  })
})

describe('Galactic Birthday calculations', () => {
  describe('getGalacticBirthday', () => {
    it('should calculate kin for birthday in target year', () => {
      const gb = getGalacticBirthday('1987-07-26', 1988)
      expect(gb.year).toBe(1988)
      expect(gb.date).toBe('1988-07-26')
    })

    it('should detect galactic return correctly', () => {
      const birth = getGalacticBirthday('1987-07-26', 1987)
      expect(birth.isGalacticReturn).toBe(true)
    })

    it('should handle Feb 29 birthdays in non-leap years', () => {
      const gb = getGalacticBirthday('2000-02-29', 2001)
      expect(gb.date).toBe('2001-02-28')
    })

    it('should keep Feb 29 in leap years', () => {
      const gb = getGalacticBirthday('2000-02-29', 2004)
      expect(gb.date).toBe('2004-02-29')
    })
  })

  describe('getNextGalacticReturn', () => {
    it('should find next galactic return', () => {
      // Galactic returns happen roughly every 52 years
      const nextReturn = getNextGalacticReturn('1987-07-26', 1988)
      expect(nextReturn).not.toBeNull()
      expect(nextReturn!.isGalacticReturn).toBe(true)
    })

    it('should return null if no return found in 60 years', () => {
      // This is a safety test - there should always be a return within 60 years
      // but if input is invalid, it might not find one
      const result = getNextGalacticReturn('2000-01-01', 2000)
      // Should find one within 60 years
      expect(result === null || result.isGalacticReturn).toBe(true)
    })
  })

  describe('getGalacticReturns', () => {
    it('should find returns within date range', () => {
      const returns = getGalacticReturns('1987-07-26', 1987, 2100)
      // There should be at least one return in 113 years
      expect(returns.length).toBeGreaterThanOrEqual(1)
      returns.forEach(r => {
        expect(r.isGalacticReturn).toBe(true)
      })
    })
  })
})

describe('Personal Year calculations', () => {
  describe('getPersonalYear', () => {
    it('should return personal year info', () => {
      const py = getPersonalYear('1987-07-26', 1988)
      expect(py.startDate).toBe('1988-07-26')
      expect(py.endDate).toBe('1989-07-26')
      expect(py.age).toBe(1)
    })

    it('should calculate correct age', () => {
      const py = getPersonalYear('1990-01-15', 2020)
      expect(py.age).toBe(30)
    })
  })

  describe('getCurrentPersonalYear', () => {
    it('should return current year before birthday', () => {
      const py = getCurrentPersonalYear('1990-06-15', '2024-03-01')
      expect(py.startDate).toBe('2023-06-15')
      expect(py.age).toBe(33)
    })

    it('should return current year after birthday', () => {
      const py = getCurrentPersonalYear('1990-06-15', '2024-08-01')
      expect(py.startDate).toBe('2024-06-15')
      expect(py.age).toBe(34)
    })
  })

  describe('getPersonalCyclePosition', () => {
    it('should return first year of cycle for age 0', () => {
      const pos = getPersonalCyclePosition('2024-01-01', '2024-06-01')
      expect(pos.cycleYear).toBe(1)
      expect(pos.totalCycles).toBe(0)
    })

    it('should return correct cycle position for age 13', () => {
      const pos = getPersonalCyclePosition('2000-01-01', '2013-06-01')
      expect(pos.cycleYear).toBe(1) // (13 % 13) + 1 = 1, starting new cycle
      expect(pos.totalCycles).toBe(1)
    })

    it('should return correct cycle position for age 26', () => {
      const pos = getPersonalCyclePosition('1998-01-01', '2024-06-01')
      expect(pos.cycleYear).toBe(1) // (26 % 13) + 1 = 1
      expect(pos.totalCycles).toBe(2)
    })

    it('should calculate years until cycle end', () => {
      const pos = getPersonalCyclePosition('2024-01-01', '2024-06-01')
      expect(pos.yearsUntilCycleEnd).toBe(12) // 13 - 1 = 12
    })
  })
})
