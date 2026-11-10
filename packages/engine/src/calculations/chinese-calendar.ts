/**
 * The Chinese lunisolar calendar as the Purple Mountain Observatory sets it
 * (GB/T 33661-2017, "Calculation and promulgation of the Chinese calendar"),
 * every date in Beijing (China Standard Time, UTC+8):
 *
 * - a month begins on the day of the new Moon;
 * - the eleventh month holds the winter solstice (the Sun at 270°);
 * - where thirteen months begin from one eleventh month to the next, the
 *   first of them that holds no principal term (the Sun at a multiple of
 *   30°) is the leap month, numbered as the month before it;
 * - the year begins with the first month, which follows the twelfth.
 *
 * The solar terms are the Sun's apparent longitude at each fifteen degrees
 * from 315° (data/solar-terms.ts), each dated on the Beijing day it falls
 * in; a day keeps the term it reaches by its end. The instants come from
 * astronomy-engine (`SearchMoonPhase`, `SearchSunLongitude`, within an
 * arcminute of JPL Horizons), never from a day's noon. Each solstice year
 * (sui) and each year's terms are read once.
 */

import { MoonPhase, SearchMoonPhase, SearchSunLongitude } from 'astronomy-engine'
import { CHINESE_DAYS, CHINESE_FESTIVALS, CHINESE_MONTHS, LEAP_MARK, type ChineseFestival } from '../data/chinese-months'
import { LICHUN_LONGITUDE, SOLAR_TERMS, TERM_DEGREES, termAt, type SolarTerm } from '../data/solar-terms'
import { dateInZone, daysFrom, midnightInZone, shiftDay, type Dated } from './day-search'
import { SYNODIC_MONTH } from './moon'
import { sunLongitude } from './sky-events'

/** Hours east of UTC the calendar dates by: China Standard Time, the meridian of 120°E. */
export const CHINA_HOURS = 8

const DAY_MS = 86_400_000
const FULL_TURN = 360
/** The Sun's longitude at the winter solstice: the eleventh month holds it. */
const WINTER_SOLSTICE = 270
/** The principal terms: the Sun at each multiple of this. */
const PRINCIPAL_DEGREES = 2 * TERM_DEGREES
/** Months in a common year; a year with a leap month has one more. */
const MONTHS_IN_YEAR = 12
/** The Sun's slowest daily motion, near aphelion, in degrees: a term is searched over the days it can take to come, with one to spare. */
const SUN_SLOWEST = 0.95
const TERM_WITHIN = Math.ceil(TERM_DEGREES / SUN_SLOWEST) + 1

const dated = (at: Date): Dated => ({ at, date: dateInZone(at, CHINA_HOURS) })
const later = (at: Date, days: number): Date => new Date(at.getTime() + days * DAY_MS)

/** The first new Moon at or after `from`. */
function newMoonFrom(from: Date): Dated {
  const found = SearchMoonPhase(0, from, SYNODIC_MONTH + 2)
  if (!found) throw new RangeError(`No new Moon after ${from.toISOString()}`)
  return dated(found.date)
}

/** The first instant at or after `from` the Sun reaches `longitude`, within `days`. */
function sunAt(longitude: number, from: Date, days: number): Dated {
  const found = SearchSunLongitude(longitude, from, days)
  if (!found) throw new RangeError(`The Sun reaches no ${longitude}° in ${days} days from ${from.toISOString()}`)
  return dated(found.date)
}

/** The Moon's elongation from the Sun at noon in Beijing on day `day`, in degrees: its face that day. */
export const elongationOn = (day: string): number => MoonPhase(new Date(Date.parse(`${day}T12:00:00Z`) - CHINA_HOURS * 3_600_000))

/* ---------- the solar terms ---------- */

/** A solar term at its instant, on its Beijing day. */
export interface DatedTerm extends Dated {
  readonly term: SolarTerm
}

const LICHUNS = new Map<number, DatedTerm>()

/** The Lichun that falls in Gregorian `year`: the Sun at 315°, early February. */
function lichunOf(year: number): DatedTerm {
  const kept = LICHUNS.get(year)
  if (kept) return kept
  const term = SOLAR_TERMS[0]
  if (!term) throw new RangeError('No Lichun')
  const found = { ...sunAt(LICHUN_LONGITUDE, new Date(Date.UTC(year, 0, 20)), 2 * TERM_WITHIN), term }
  LICHUNS.set(year, found)
  return found
}

/** The Gregorian year of the Lichun on or before Beijing day `day`: the year of the four pillars, which turns at Lichun. */
export function solarYearOn(day: string): number {
  const year = Number(day.slice(0, 4))
  return lichunOf(year).date <= day ? year : year - 1
}

const TERM_YEARS = new Map<number, readonly DatedTerm[]>()

/** The twenty-four terms from the Lichun of Gregorian `year` to the Dahan before the next, each on its Beijing day. */
export function solarTermsOf(year: number): readonly DatedTerm[] {
  const kept = TERM_YEARS.get(year)
  if (kept) return kept
  const found: DatedTerm[] = [lichunOf(year)]
  for (const term of SOLAR_TERMS.slice(1)) {
    const last = found[found.length - 1]
    if (!last) break
    found.push({ ...sunAt(term.longitude, later(last.at, 1), TERM_WITHIN), term })
  }
  TERM_YEARS.set(year, found)
  return found
}

/** The term in force on Beijing day `day`: the last one dated on or before it. */
export function solarTermOn(day: string): DatedTerm {
  const term = termAt(sunLongitude(midnightInZone(shiftDay(day, 1), CHINA_HOURS)))
  const found = solarTermsOf(solarYearOn(day))[term.index]
  if (!found) throw new RangeError(`No ${term.pinyin} for ${day}`)
  return found
}

/** The next `count` terms dated after Beijing day `day`, nearest first. */
export function nextSolarTerms(day: string, count: number): readonly DatedTerm[] {
  const year = solarYearOn(day)
  return [...solarTermsOf(year), ...solarTermsOf(year + 1)].filter((t) => t.date > day).slice(0, count)
}

/* ---------- the lunar months ---------- */

/** A month of the Chinese calendar: its number, whether it is the leap month, its first Beijing day and length, the Gregorian year its Chinese year began in, and its name as written. */
export interface LunarMonth {
  readonly number: number
  readonly leap: boolean
  readonly first: string
  readonly length: number
  readonly year: number
  /** e.g. "九月", "闰六月". */
  readonly characters: string
}

/** The new Moon that begins the eleventh month of Gregorian `year`: the last whose Beijing day is on or before the solstice's. */
function eleventhMonth(year: number): Dated {
  const solstice = sunAt(WINTER_SOLSTICE, new Date(Date.UTC(year, 11, 1)), 2 * TERM_WITHIN)
  let held = newMoonFrom(later(solstice.at, -Math.ceil(SYNODIC_MONTH) - 1))
  for (let next = newMoonFrom(later(held.at, 1)); next.date <= solstice.date; next = newMoonFrom(later(next.at, 1))) held = next
  return held
}

/** The Beijing days of the principal terms from the instant `from` to `to`. */
function principalDays(from: Date, to: Date): readonly string[] {
  const days: string[] = []
  let longitude = (Math.floor(sunLongitude(from) / PRINCIPAL_DEGREES) + 1) * PRINCIPAL_DEGREES
  for (let at = from; ; ) {
    const found = sunAt(longitude % FULL_TURN, at, 2 * TERM_WITHIN)
    if (found.at > to) return days
    days.push(found.date)
    at = later(found.at, 1)
    longitude += PRINCIPAL_DEGREES
  }
}

const monthName = (number: number, leap: boolean): string => `${leap ? LEAP_MARK : ''}${CHINESE_MONTHS[number - 1]?.characters ?? ''}`

const SUIS = new Map<number, readonly LunarMonth[]>()

/**
 * The months from the eleventh month of Gregorian `year - 1` to the month
 * before the eleventh of `year`: the solstice year (sui) that holds the
 * first month of the Chinese year beginning in `year`.
 */
function suiOf(year: number): readonly LunarMonth[] {
  const kept = SUIS.get(year)
  if (kept) return kept
  const from = eleventhMonth(year - 1)
  const to = eleventhMonth(year)
  const starts: Dated[] = [from]
  while (starts.length <= MONTHS_IN_YEAR + 1) {
    const last = starts[starts.length - 1]
    if (!last || last.date === to.date) break
    starts.push(newMoonFrom(later(last.at, 1)))
  }
  const count = starts.length - 1
  if (starts[count]?.date !== to.date || (count !== MONTHS_IN_YEAR && count !== MONTHS_IN_YEAR + 1)) throw new RangeError(`${count} months in the sui of ${year}`)
  const principals = principalDays(from.at, to.at)
  const holdsPrincipal = (i: number) => principals.some((d) => d >= (starts[i]?.date ?? '') && d < (starts[i + 1]?.date ?? ''))
  const leap = count === MONTHS_IN_YEAR ? -1 : starts.findIndex((_, i) => i > 0 && i < count && !holdsPrincipal(i))
  const months: LunarMonth[] = []
  let number = 11
  for (let i = 0; i < count; i++) {
    const isLeap = i === leap
    if (i > 0 && !isLeap) number = (number % MONTHS_IN_YEAR) + 1
    const first = starts[i]?.date ?? ''
    const next = starts[i + 1]?.date ?? ''
    /* The eleventh and twelfth months open the sui but close the Chinese year before. */
    const opened = months.some((m) => m.number === 1 && !m.leap) || (number === 1 && !isLeap)
    months.push({ number, leap: isLeap, first, length: daysFrom(first, next), year: opened ? year : year - 1, characters: monthName(number, isLeap) })
  }
  SUIS.set(year, months)
  return months
}

/** The month Beijing day `day` falls in. */
export function lunarMonthOn(day: string): LunarMonth {
  const year = Number(day.slice(0, 4))
  const found = [...suiOf(year), ...suiOf(year + 1)].find((m) => m.first <= day && daysFrom(m.first, day) < m.length)
  if (!found) throw new RangeError(`No lunar month holds ${day}`)
  return found
}

/** The month after `month`. */
export const monthAfter = (month: LunarMonth): LunarMonth => lunarMonthOn(shiftDay(month.first, month.length))

/** A Beijing day in the Chinese calendar: its month, its day in the month (1–30) and both as written. */
export interface LunarDate {
  readonly month: LunarMonth
  readonly day: number
  /** e.g. "初一", "三十". */
  readonly dayCharacters: string
  /** e.g. "九月三十". */
  readonly characters: string
}

export function lunarDateOn(day: string): LunarDate {
  const month = lunarMonthOn(day)
  const n = daysFrom(month.first, day) + 1
  const dayCharacters = CHINESE_DAYS[n - 1] ?? ''
  return { month, day: n, dayCharacters, characters: `${month.characters}${dayCharacters}` }
}

/** The festivals of a month, each on its Beijing day: none in a leap month. */
export function festivalsIn(month: LunarMonth): readonly (ChineseFestival & { readonly date: string })[] {
  if (month.leap) return []
  return CHINESE_FESTIVALS.filter((f) => f.month === month.number && f.day <= month.length).map((f) => ({ ...f, date: shiftDay(month.first, f.day - 1) }))
}

/* ---------- the year ---------- */

/** The Beijing day the Chinese year beginning in Gregorian `year` begins: the first day of its first month. */
export function chineseNewYear(year: number): string | null {
  return suiOf(year).find((m) => m.number === 1 && !m.leap)?.first ?? null
}

/** The Gregorian year whose Chinese year is in force on Beijing day `day`. */
export function chineseYearOn(day: string): number | null {
  return lunarMonthOn(day).year
}

/** The next Chinese new year after `day`: its Beijing day, the days to it, and the Gregorian year it begins in. */
export function nextChineseNewYear(day: string): { readonly date: string; readonly inDays: number; readonly year: number } | null {
  const year = Number(day.slice(0, 4))
  for (const candidate of [year, year + 1]) {
    const date = chineseNewYear(candidate)
    if (date !== null && date > day) return { date, inDays: daysFrom(day, date), year: candidate }
  }
  return null
}
