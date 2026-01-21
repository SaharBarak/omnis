import { asKin, type Kin, type SealNumber, type ToneNumber } from '../../core/types'
import { dateToKin, kinToSeal, kinToTone } from './dreamspell'
import { parseDate } from './julian'

// Dreamspell Year runs from July 26 to July 25 of the following year
// Each year is governed by a "Year Bearer" - the seal of July 26 of that year

export interface DreamspellYear {
  startDate: string       // July 26 of start year (YYYY-MM-DD)
  endDate: string         // July 25 of following year
  yearBearer: {
    kin: Kin
    seal: SealNumber
    tone: ToneNumber
  }
  yearName: string        // e.g., "White Magnetic Wizard"
}

// Year bearer seals follow a 4-year cycle: Seed, Moon, Wizard, Storm
// These are the 4 seals that can be year bearers in the Dreamspell
const YEAR_BEARER_SEALS: readonly SealNumber[] = Object.freeze([4, 9, 14, 19] as SealNumber[])

export function getDreamspellYearStart(gregorianYear: number): string {
  return `${gregorianYear}-07-26`
}

export function getDreamspellYearEnd(gregorianYear: number): string {
  return `${gregorianYear + 1}-07-25`
}

export function getYearBearerKin(gregorianYear: number): Kin {
  // The year bearer is the kin of July 26 of that year
  return dateToKin(getDreamspellYearStart(gregorianYear))
}

export function getYearBearer(gregorianYear: number): {
  kin: Kin
  seal: SealNumber
  tone: ToneNumber
} {
  const kin = getYearBearerKin(gregorianYear)
  return {
    kin,
    seal: kinToSeal(kin),
    tone: kinToTone(kin),
  }
}

export function getDreamspellYear(gregorianYear: number): DreamspellYear {
  const yearBearer = getYearBearer(gregorianYear)
  const sealNames = ['Dragon', 'Wind', 'Night', 'Seed', 'Serpent', 'World-Bridger',
    'Hand', 'Star', 'Moon', 'Dog', 'Monkey', 'Human', 'Skywalker', 'Wizard',
    'Eagle', 'Warrior', 'Earth', 'Mirror', 'Storm', 'Sun']
  const toneNames = ['Magnetic', 'Lunar', 'Electric', 'Self-Existing', 'Overtone',
    'Rhythmic', 'Resonant', 'Galactic', 'Solar', 'Planetary', 'Spectral',
    'Crystal', 'Cosmic']
  const colors = ['Red', 'White', 'Blue', 'Yellow']

  const sealName = sealNames[yearBearer.seal - 1]
  const toneName = toneNames[yearBearer.tone - 1]
  const colorName = colors[(yearBearer.seal - 1) % 4]

  return {
    startDate: getDreamspellYearStart(gregorianYear),
    endDate: getDreamspellYearEnd(gregorianYear),
    yearBearer,
    yearName: `${colorName} ${toneName} ${sealName}`,
  }
}

// Get which Dreamspell year a date falls in
export function getDateDreamspellYear(dateStr: string): DreamspellYear {
  const { year, month, day } = parseDate(dateStr)
  // If before July 26, it's the previous Dreamspell year
  const dreamspellYear = (month < 7 || (month === 7 && day < 26)) ? year - 1 : year
  return getDreamspellYear(dreamspellYear)
}

// Galactic Birthday - your kin on your birthday each year
export interface GalacticBirthday {
  year: number
  date: string
  kin: Kin
  seal: SealNumber
  tone: ToneNumber
  isGalacticReturn: boolean // True if same kin as birth kin
}

export function getGalacticBirthday(birthDateStr: string, targetYear: number): GalacticBirthday {
  const { month, day } = parseDate(birthDateStr)
  const birthKin = dateToKin(birthDateStr)

  // Handle Feb 29 birthdays - use Feb 28 in non-leap years
  let targetMonth = month
  let targetDay = day
  if (month === 2 && day === 29) {
    // Check if target year is a leap year
    const isLeap = (targetYear % 4 === 0 && targetYear % 100 !== 0) || (targetYear % 400 === 0)
    if (!isLeap) {
      targetDay = 28
    }
  }

  const targetDateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`
  const targetKin = dateToKin(targetDateStr)

  return {
    year: targetYear,
    date: targetDateStr,
    kin: targetKin,
    seal: kinToSeal(targetKin),
    tone: kinToTone(targetKin),
    isGalacticReturn: targetKin === birthKin,
  }
}

// Get the next Galactic Return (when your birthday has the same kin as your birth)
// Galactic Returns happen approximately every 52 years (but not exactly due to leap year skipping)
export function getNextGalacticReturn(birthDateStr: string, fromYear?: number): GalacticBirthday | null {
  const birthKin = dateToKin(birthDateStr)
  const { year: birthYear } = parseDate(birthDateStr)
  const startYear = fromYear ?? birthYear + 1

  // Search up to 60 years (galactic returns are roughly every 52 years)
  for (let year = startYear; year < startYear + 60; year++) {
    const galacticBirthday = getGalacticBirthday(birthDateStr, year)
    if (galacticBirthday.kin === birthKin) {
      return galacticBirthday
    }
  }

  return null
}

// Get all Galactic Returns between two years
export function getGalacticReturns(
  birthDateStr: string,
  startYear: number,
  endYear: number
): readonly GalacticBirthday[] {
  const birthKin = dateToKin(birthDateStr)
  const returns: GalacticBirthday[] = []

  for (let year = startYear; year <= endYear; year++) {
    const galacticBirthday = getGalacticBirthday(birthDateStr, year)
    if (galacticBirthday.kin === birthKin) {
      returns.push(galacticBirthday)
    }
  }

  return Object.freeze(returns)
}

// Personal Year - what kin governs your personal year
// Runs from birthday to birthday
export interface PersonalYear {
  startDate: string
  endDate: string
  kin: Kin
  seal: SealNumber
  tone: ToneNumber
  age: number
}

export function getPersonalYear(birthDateStr: string, targetYear: number): PersonalYear {
  const { year: birthYear, month, day } = parseDate(birthDateStr)
  const age = targetYear - birthYear

  const galacticBirthday = getGalacticBirthday(birthDateStr, targetYear)
  const nextBirthday = getGalacticBirthday(birthDateStr, targetYear + 1)

  return {
    startDate: galacticBirthday.date,
    endDate: nextBirthday.date,
    kin: galacticBirthday.kin,
    seal: galacticBirthday.seal,
    tone: galacticBirthday.tone,
    age,
  }
}

// Get personal year for current date
export function getCurrentPersonalYear(birthDateStr: string, currentDateStr: string): PersonalYear {
  const { year: currentYear, month: currentMonth, day: currentDay } = parseDate(currentDateStr)
  const { month: birthMonth, day: birthDay } = parseDate(birthDateStr)

  // Determine if we're before or after birthday this year
  const isBeforeBirthday = currentMonth < birthMonth ||
    (currentMonth === birthMonth && currentDay < birthDay)

  const personalYearStart = isBeforeBirthday ? currentYear - 1 : currentYear

  return getPersonalYear(birthDateStr, personalYearStart)
}

// 13-year cycle - each person goes through 13-year cycles of their seal
// Year 1 = Magnetic, Year 13 = Cosmic
export function getPersonalCyclePosition(birthDateStr: string, currentDateStr: string): {
  cycleYear: ToneNumber   // 1-13
  totalCycles: number     // How many 13-year cycles completed
  yearsUntilCycleEnd: number
} {
  const personalYear = getCurrentPersonalYear(birthDateStr, currentDateStr)
  const age = personalYear.age

  const totalCycles = Math.floor(age / 13)
  const cycleYear = (age % 13) + 1 // 1-13

  return {
    cycleYear: cycleYear as ToneNumber,
    totalCycles,
    yearsUntilCycleEnd: 13 - cycleYear,
  }
}
