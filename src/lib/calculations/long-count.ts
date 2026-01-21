import { asJulianDay, type JulianDay } from '../../core/types'
import { gregorianToJDN, parseDate } from './julian'
import { dateToTzolkin } from './tzolkin'
import type { TzolkinDay } from '../types/tzolkin'

// GMT correlation constant (same as used in tzolkin.ts)
const GMT_CORRELATION = 584283

// Long Count unit values in days
const DAYS_PER_KIN = 1
const DAYS_PER_WINAL = 20
const DAYS_PER_TUN = 360
const DAYS_PER_KATUN = 7200
const DAYS_PER_BAKTUN = 144000

// Calendar Round cycle length (52 Haab years = 18,980 days)
const CALENDAR_ROUND_DAYS = 18980

// Haab epoch offset: on 0.0.0.0.0, the Haab was 8 Kumku
// 8 Kumku = month 17 (Kumku is index 17), day 8
// Position in Haab cycle: 17 * 20 + 8 = 348
const HAAB_EPOCH_OFFSET = 348

// Haab month names in order (0-17 regular months, 18 = Wayeb)
export const HAAB_MONTHS: readonly string[] = Object.freeze([
  'Pop', 'Wo', 'Sip', 'Sotz\'', 'Sek',
  'Xul', 'Yaxkin', 'Mol', 'Chen', 'Yax',
  'Sak', 'Keh', 'Mak', 'Kankin', 'Muwan',
  'Pax', 'Kayab', 'Kumku', 'Wayeb\''
])

// Hebrew translations for Haab months
export const HAAB_MONTHS_HEBREW: readonly string[] = Object.freeze([
  'פופ', 'וו', 'סיפ', 'סוץ', 'סק',
  'שול', 'יאשקין', 'מול', 'צ\'ן', 'יאש',
  'סאק', 'קה', 'מאק', 'קנקין', 'מואן',
  'פאש', 'קאיב', 'קומקו', 'ואייב'
])

// Long Count interface
export interface LongCount {
  readonly baktun: number   // 0-19 (typically 0-13 for current era)
  readonly katun: number    // 0-19
  readonly tun: number      // 0-19
  readonly winal: number    // 0-17 (note: not 0-19)
  readonly kin: number      // 0-19
}

// Haab (365-day solar year) interface
export interface Haab {
  readonly month: number    // 0-18 (0-17 regular, 18 = Wayeb)
  readonly day: number      // 0-19 (or 0-4 for Wayeb)
  readonly monthName: string
  readonly monthNameHebrew: string
}

// Calendar Round combines Tzolkin and Haab
export interface CalendarRound {
  readonly tzolkin: TzolkinDay
  readonly haab: Haab
  readonly formatted: string
  readonly formattedHebrew: string
}

// Full Long Count data for a date
export interface LongCountData {
  readonly longCount: LongCount
  readonly jdn: JulianDay
  readonly daysSinceCreation: number
  readonly tzolkin: TzolkinDay
  readonly haab: Haab
  readonly calendarRound: CalendarRound
}

// Personal Mayan dates for a person
export interface PersonalMayanDates {
  readonly birth: LongCountData
  readonly tunBirthdays: readonly TunBirthday[]      // Every 360 days
  readonly katunBirthdays: readonly KatunBirthday[]  // Every 7,200 days (~19.7 years)
  readonly nextCalendarRoundReturn: CalendarRoundReturn | null
}

export interface TunBirthday {
  readonly tunNumber: number
  readonly gregorianDate: string
  readonly longCount: LongCount
  readonly isFuture: boolean
}

export interface KatunBirthday {
  readonly katunNumber: number
  readonly gregorianDate: string
  readonly longCount: LongCount
  readonly ageAtKatun: number  // Age in Gregorian years at this katun
  readonly isFuture: boolean
}

export interface CalendarRoundReturn {
  readonly gregorianDate: string
  readonly longCount: LongCount
  readonly yearsFromBirth: number
}

// Convert JDN to Long Count
export function jdnToLongCount(jdn: JulianDay | number): LongCount {
  let totalDays = jdn - GMT_CORRELATION

  // Handle negative days (dates before epoch)
  if (totalDays < 0) {
    throw new RangeError('Dates before Mayan epoch (3114 BCE) are not supported')
  }

  const baktun = Math.floor(totalDays / DAYS_PER_BAKTUN)
  totalDays %= DAYS_PER_BAKTUN

  const katun = Math.floor(totalDays / DAYS_PER_KATUN)
  totalDays %= DAYS_PER_KATUN

  const tun = Math.floor(totalDays / DAYS_PER_TUN)
  totalDays %= DAYS_PER_TUN

  const winal = Math.floor(totalDays / DAYS_PER_WINAL)
  const kin = totalDays % DAYS_PER_WINAL

  return Object.freeze({ baktun, katun, tun, winal, kin })
}

// Convert Long Count to JDN
export function longCountToJDN(lc: LongCount): JulianDay {
  const totalDays =
    lc.baktun * DAYS_PER_BAKTUN +
    lc.katun * DAYS_PER_KATUN +
    lc.tun * DAYS_PER_TUN +
    lc.winal * DAYS_PER_WINAL +
    lc.kin

  return asJulianDay(GMT_CORRELATION + totalDays)
}

// Convert JDN to Gregorian date string (YYYY-MM-DD)
export function jdnToGregorian(jdn: JulianDay | number): string {
  // Algorithm from astronomical algorithms
  const a = jdn + 32044
  const b = Math.floor((4 * a + 3) / 146097)
  const c = a - Math.floor(146097 * b / 4)
  const d = Math.floor((4 * c + 3) / 1461)
  const e = c - Math.floor(1461 * d / 4)
  const m = Math.floor((5 * e + 2) / 153)

  const day = e - Math.floor((153 * m + 2) / 5) + 1
  const month = m + 3 - 12 * Math.floor(m / 10)
  const year = 100 * b + d - 4800 + Math.floor(m / 10)

  // Format as YYYY-MM-DD
  const yearStr = year.toString().padStart(4, '0')
  const monthStr = month.toString().padStart(2, '0')
  const dayStr = day.toString().padStart(2, '0')

  return `${yearStr}-${monthStr}-${dayStr}`
}

// Convert date string to Long Count
export function dateToLongCount(dateStr: string): LongCount {
  const { year, month, day } = parseDate(dateStr)
  const jdn = gregorianToJDN(year, month, day)
  return jdnToLongCount(jdn)
}

// Convert JDN to Haab date
export function jdnToHaab(jdn: JulianDay | number): Haab {
  const daysSinceEpoch = jdn - GMT_CORRELATION

  // Calculate position in Haab cycle (0-364)
  let haabPosition = (daysSinceEpoch + HAAB_EPOCH_OFFSET) % 365
  if (haabPosition < 0) haabPosition += 365

  // Wayeb (5-day period at end of year)
  if (haabPosition >= 360) {
    return Object.freeze({
      month: 18,
      day: haabPosition - 360,
      monthName: HAAB_MONTHS[18],
      monthNameHebrew: HAAB_MONTHS_HEBREW[18],
    })
  }

  // Regular months (20 days each)
  const month = Math.floor(haabPosition / 20)
  const day = haabPosition % 20

  return Object.freeze({
    month,
    day,
    monthName: HAAB_MONTHS[month],
    monthNameHebrew: HAAB_MONTHS_HEBREW[month],
  })
}

// Convert date string to Haab
export function dateToHaab(dateStr: string): Haab {
  const { year, month, day } = parseDate(dateStr)
  const jdn = gregorianToJDN(year, month, day)
  return jdnToHaab(jdn)
}

// Get full Calendar Round for a date
export function getCalendarRound(dateStr: string): CalendarRound {
  const { year, month, day } = parseDate(dateStr)
  const jdn = gregorianToJDN(year, month, day)

  const tzolkin = dateToTzolkin(dateStr)
  const haab = jdnToHaab(jdn)

  // Format: "4 Ajaw 3 Kankin"
  const formatted = `${tzolkin.tone} ${tzolkin.daySign.yucatec} ${haab.day} ${haab.monthName}`
  const formattedHebrew = `${tzolkin.tone} ${tzolkin.daySign.hebrew} ${haab.day} ${haab.monthNameHebrew}`

  return Object.freeze({
    tzolkin,
    haab,
    formatted,
    formattedHebrew,
  })
}

// Get full Long Count data for a date
export function getLongCountData(dateStr: string): LongCountData {
  const { year, month, day } = parseDate(dateStr)
  const jdn = gregorianToJDN(year, month, day)

  const longCount = jdnToLongCount(jdn)
  const tzolkin = dateToTzolkin(dateStr)
  const haab = jdnToHaab(jdn)
  const calendarRound = getCalendarRound(dateStr)

  return Object.freeze({
    longCount,
    jdn: asJulianDay(jdn),
    daysSinceCreation: jdn - GMT_CORRELATION,
    tzolkin,
    haab,
    calendarRound,
  })
}

// Format Long Count as string (e.g., "13.0.11.5.12")
export function formatLongCount(lc: LongCount): string {
  return `${lc.baktun}.${lc.katun}.${lc.tun}.${lc.winal}.${lc.kin}`
}

// Parse Long Count from string
export function parseLongCount(str: string): LongCount {
  const parts = str.split('.').map(Number)

  if (parts.length !== 5 || parts.some(isNaN)) {
    throw new Error(`Invalid Long Count format: ${str}`)
  }

  const [baktun, katun, tun, winal, kin] = parts

  // Validate ranges
  if (baktun < 0 || baktun > 19) {
    throw new RangeError(`Invalid baktun: ${baktun} (must be 0-19)`)
  }
  if (katun < 0 || katun > 19) {
    throw new RangeError(`Invalid katun: ${katun} (must be 0-19)`)
  }
  if (tun < 0 || tun > 19) {
    throw new RangeError(`Invalid tun: ${tun} (must be 0-19)`)
  }
  if (winal < 0 || winal > 17) {
    throw new RangeError(`Invalid winal: ${winal} (must be 0-17)`)
  }
  if (kin < 0 || kin > 19) {
    throw new RangeError(`Invalid kin: ${kin} (must be 0-19)`)
  }

  return Object.freeze({ baktun, katun, tun, winal, kin })
}

// Validate Long Count
export function isValidLongCount(lc: LongCount): boolean {
  return (
    lc.baktun >= 0 && lc.baktun <= 19 &&
    lc.katun >= 0 && lc.katun <= 19 &&
    lc.tun >= 0 && lc.tun <= 19 &&
    lc.winal >= 0 && lc.winal <= 17 &&
    lc.kin >= 0 && lc.kin <= 19
  )
}

// Calculate days since creation (epoch)
export function daysSinceCreation(dateStr: string): number {
  const { year, month, day } = parseDate(dateStr)
  const jdn = gregorianToJDN(year, month, day)
  return jdn - GMT_CORRELATION
}

// Get today's date for reference
function getTodayJDN(): JulianDay {
  const now = new Date()
  return gregorianToJDN(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

// Calculate personal Mayan dates for a person
export function calculatePersonalMayanDates(birthDateStr: string): PersonalMayanDates {
  const { year, month, day } = parseDate(birthDateStr)
  const birthJDN = gregorianToJDN(year, month, day)
  const todayJDN = getTodayJDN()

  const birth = getLongCountData(birthDateStr)

  // Calculate tun birthdays (360-day cycles) - next 10 from now
  const tunBirthdays: TunBirthday[] = []
  for (let i = 1; i <= 100; i++) { // Search up to 100 tuns
    const tunJDN = birthJDN + (i * DAYS_PER_TUN)
    const isFuture = tunJDN > todayJDN

    // Include past 2 and future 10
    if (tunJDN > todayJDN - 2 * DAYS_PER_TUN) {
      tunBirthdays.push({
        tunNumber: i,
        gregorianDate: jdnToGregorian(tunJDN),
        longCount: jdnToLongCount(asJulianDay(tunJDN)),
        isFuture,
      })

      if (tunBirthdays.filter(t => t.isFuture).length >= 10) break
    }
  }

  // Calculate katun birthdays (7,200-day cycles) - all up to 5 katuns
  const katunBirthdays: KatunBirthday[] = []
  for (let i = 1; i <= 5; i++) {
    const katunJDN = birthJDN + (i * DAYS_PER_KATUN)
    const isFuture = katunJDN > todayJDN

    // Calculate approximate age at this katun
    const ageAtKatun = Math.round((i * DAYS_PER_KATUN) / 365.25)

    katunBirthdays.push({
      katunNumber: i,
      gregorianDate: jdnToGregorian(katunJDN),
      longCount: jdnToLongCount(asJulianDay(katunJDN)),
      ageAtKatun,
      isFuture,
    })
  }

  // Calculate next Calendar Round return (52 Haab years = 18,980 days)
  let nextCalendarRoundReturn: CalendarRoundReturn | null = null

  // Find the next CR return from today
  let crNumber = 1
  while (crNumber <= 3) { // Max 3 CR cycles (156 years)
    const crJDN = birthJDN + (crNumber * CALENDAR_ROUND_DAYS)
    if (crJDN > todayJDN) {
      const yearsFromBirth = Math.round((crNumber * CALENDAR_ROUND_DAYS) / 365.25)
      nextCalendarRoundReturn = {
        gregorianDate: jdnToGregorian(crJDN),
        longCount: jdnToLongCount(asJulianDay(crJDN)),
        yearsFromBirth,
      }
      break
    }
    crNumber++
  }

  return Object.freeze({
    birth,
    tunBirthdays: Object.freeze(tunBirthdays),
    katunBirthdays: Object.freeze(katunBirthdays),
    nextCalendarRoundReturn,
  })
}

// Historical anchor dates for validation and display
export interface HistoricalDate {
  readonly gregorian: string
  readonly longCount: string
  readonly tzolkin: string
  readonly haab: string
  readonly significance: string
  readonly significanceHebrew: string
}

export const HISTORICAL_DATES: readonly HistoricalDate[] = Object.freeze([
  {
    gregorian: '2012-12-21',
    longCount: '13.0.0.0.0',
    tzolkin: '4 Ajaw',
    haab: '3 Kankin',
    significance: 'End of 13th B\'ak\'tun cycle',
    significanceHebrew: 'סיום מחזור הבאקטון ה-13',
  },
  {
    gregorian: '1987-08-16',
    longCount: '12.18.14.5.1',
    tzolkin: '1 Imix',
    haab: '9 Mol',
    significance: 'Harmonic Convergence',
    significanceHebrew: 'ההתכנסות ההרמונית',
  },
  {
    gregorian: '1987-07-26',
    longCount: '12.18.14.4.0',
    tzolkin: '8 Ix',
    haab: '18 Xul',
    significance: 'Dreamspell Epoch (Galactic Synchronization)',
    significanceHebrew: 'תאריך התחלת הדרימספל',
  },
])

// Add a Long Count to another (for calculating future dates)
export function addToLongCount(lc: LongCount, days: number): LongCount {
  const jdn = longCountToJDN(lc)
  return jdnToLongCount(asJulianDay(jdn + days))
}

// Calculate the difference in days between two Long Counts
export function longCountDifference(lc1: LongCount, lc2: LongCount): number {
  const jdn1 = longCountToJDN(lc1)
  const jdn2 = longCountToJDN(lc2)
  return jdn2 - jdn1
}

// Get the current Long Count (today)
export function getCurrentLongCount(): LongCount {
  const now = new Date()
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return dateToLongCount(dateStr)
}

// Get full data for today
export function getCurrentLongCountData(): LongCountData {
  const now = new Date()
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return getLongCountData(dateStr)
}
