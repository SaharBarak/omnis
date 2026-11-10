import { asJulianDay, type JulianDay } from '../core/types'
import { HAAB_DAYS, HAAB_MONTH_DAYS, HAAB_MONTH_TABLE, haabMonth } from '../data/haab-months'
import { gregorianToJDN, parseDate } from './julian'
import { GMT_CORRELATION, daysSinceEraBase, dateToTzolkin, tzolkinOfDays } from './tzolkin'
import type { TzolkinDay } from '../types/tzolkin'

/** Days in one unit of each Long Count place. */
export const PLACE_DAYS = Object.freeze({ kin: 1, winal: 20, tun: 360, katun: 7200, baktun: 144000 })

const DAYS_PER_KIN = PLACE_DAYS.kin
const DAYS_PER_WINAL = PLACE_DAYS.winal
const DAYS_PER_TUN = PLACE_DAYS.tun
const DAYS_PER_KATUN = PLACE_DAYS.katun
const DAYS_PER_BAKTUN = PLACE_DAYS.baktun

// Calendar Round cycle length (52 Haab years = 18,980 days)
const CALENDAR_ROUND_DAYS = 18980

/** The era base's Haab' day, 8 Kumk'u: its place in the Haab' year, from 0 Pop. */
const BASE_HAAB = { month: HAAB_MONTH_TABLE.findIndex((m) => m.name === "Kumk'u"), day: 8 }
const HAAB_EPOCH_OFFSET = BASE_HAAB.month * HAAB_MONTH_DAYS + BASE_HAAB.day

/** Haab' month names in order, 0 Pop to 18 Wayeb' (`data/haab-months.ts`). */
export const HAAB_MONTHS: readonly string[] = Object.freeze(HAAB_MONTH_TABLE.map((m) => m.name))

/** Hebrew transliterations of the Haab' months, in the same order. */
export const HAAB_MONTHS_HEBREW: readonly string[] = Object.freeze(HAAB_MONTH_TABLE.map((m) => m.hebrew))

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

/** A day's place in the Haab' year, 0 (0 Pop) to 364 (4 Wayeb'). */
export const haabDayOfYear = ({ month, day }: Pick<Haab, 'month' | 'day'>): number => month * HAAB_MONTH_DAYS + day

/** The Haab' day `days` after the era base (before it, where negative): the year counted on from 8 Kumk'u. */
export function haabOfDays(days: number): Haab {
  const position = (((days + HAAB_EPOCH_OFFSET) % HAAB_DAYS) + HAAB_DAYS) % HAAB_DAYS
  const month = haabMonth(Math.floor(position / HAAB_MONTH_DAYS))
  return Object.freeze({
    month: month.index,
    day: position - month.index * HAAB_MONTH_DAYS,
    monthName: month.name,
    monthNameHebrew: month.hebrew,
  })
}

// Convert JDN to Haab date
export function jdnToHaab(jdn: JulianDay | number): Haab {
  return haabOfDays(jdn - GMT_CORRELATION)
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

  // Format: "4 Ajaw 3 K'ank'in"
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

/** A Haab' year: its 0 Pop and its year bearer, the Tzolk'in day that falls on it, in days from the era base. */
export interface HaabYear {
  readonly start: number
  readonly bearer: TzolkinDay
}

/**
 * The Haab' year a day `days` after the era base falls in: it opens on 0 Pop,
 * whose Tzolk'in day bears it. 365 being 5 more than eighteen twenties and 1
 * more than twenty-eight thirteens, each year's bearer is five day signs and
 * one number on from the last, so only four signs bear years: Ik', Manik',
 * Eb' and Kab'an in the Classic reckoning of Tikal and the Dresden Codex
 * (https://en.wikipedia.org/wiki/Maya_calendar, Year Bearer, after Thompson
 * 1966 and Tedlock 1992); Kettunen and Helmke's table of the Haab' numbers
 * each day sign can take (2020, p. 51) holds the same four on 0.
 */
export function haabYearOf(days: number): HaabYear {
  const start = days - haabDayOfYear(haabOfDays(days))
  return { start, bearer: tzolkinOfDays(start) }
}

/** The places that turn on a day `days` after the era base, from the tun up: the period it ends (a tun, a k'atun, a b'ak'tun), or none. */
export function periodEnding(days: number): 'tun' | 'katun' | 'baktun' | undefined {
  if (days % PLACE_DAYS.tun !== 0) return undefined
  if (days % PLACE_DAYS.baktun === 0) return 'baktun'
  return days % PLACE_DAYS.katun === 0 ? 'katun' : 'tun'
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
  return daysSinceEraBase(dateStr)
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

/** An anchor date with its count and Calendar Round read from the date, so the words never drift from the engine. */
const historical = (gregorian: string, significance: string, significanceHebrew: string): HistoricalDate => {
  const { longCount, calendarRound } = getLongCountData(gregorian)
  const { tzolkin, haab } = calendarRound
  return Object.freeze({
    gregorian,
    longCount: formatLongCount(longCount),
    tzolkin: `${tzolkin.tone} ${tzolkin.daySign.yucatec}`,
    haab: `${haab.day} ${haab.monthName}`,
    significance,
    significanceHebrew,
  })
}

/** 13.0.0.0.0 4 Ajaw 3 K'ank'in; 12.18.14.5.1 1 Imix 9 Yaxk'in; 12.18.14.4.0 6 Ajaw 8 Xul. */
export const HISTORICAL_DATES: readonly HistoricalDate[] = Object.freeze([
  historical('2012-12-21', "End of 13th B'ak'tun cycle", 'סיום מחזור הבאקטון ה-13'),
  historical('1987-08-16', 'Harmonic Convergence', 'ההתכנסות ההרמונית'),
  historical('1987-07-26', 'Dreamspell Epoch (Galactic Synchronization)', 'תאריך התחלת הדרימספל'),
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
