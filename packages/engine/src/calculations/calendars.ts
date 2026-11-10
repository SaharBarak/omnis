/**
 * World calendars and the sidereal zodiac.
 *
 * Calendar conversions ride on Intl.DateTimeFormat (hebrew already lives in
 * services/today.ts; here: islamic-umalqura, persian, chinese) — zero
 * dependencies, and every Intl-backed function degrades to null on runtimes
 * without calendar data (some Hermes builds), matching the hebrewDate
 * contract. The sidereal Sun derives from the existing ephemeris, by the
 * Lahiri ayanamsa approximation (`ayanamsa.ts`). The Chinese year's names
 * come from the sexagenary table (data/sexagenary.ts); its dates from the
 * Chinese calendar (`chinese-calendar.ts`). The Panchang is its own module
 * (`panchang.ts`), read at sunrise in Ujjain, and re-exported here.
 */

import { getCurrentPlanetaryPositions } from './astrology'
import { ZODIAC_SIGNS } from '../data/zodiac-signs'
import { lahiriAyanamsa } from './ayanamsa'
import { SEXAGENARY_CYCLE, pairAt } from '../data/sexagenary'
import type { PhaseName } from '../data/wuxing'
import { firstDay, noonOf, shiftDay } from './day-search'

/** Degrees in a full turn of the sky. */
const FULL_TURN = 360
/** Degrees in a sign of the zodiac. */
const SIGN_SPAN = FULL_TURN / ZODIAC_SIGNS.length
/** An angle in [0, 360). */
const inTurn = (angle: number): number => ((angle % FULL_TURN) + FULL_TURN) % FULL_TURN

// ---------------------------------------------------------------------------
// Intl-backed calendar dates
// ---------------------------------------------------------------------------

function intlCalendarDate(date: Date, calendar: string): string | null {
  try {
    return new Intl.DateTimeFormat(`en-GB-u-ca-${calendar}`, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)
  } catch {
    return null
  }
}

/** The Intl calendars a day board lays out as a month. */
export type MonthCalendar = 'hebrew' | 'islamic-umalqura' | 'persian'

/** A day's place in its month in one calendar: the day, month and year, the month's length, its first weekday, and the next month. */
export interface CalendarMonth {
  readonly day: number
  readonly month: string
  readonly year: number
  /** Days in the month. */
  readonly length: number
  /** The weekday of the month's first day, 0 for Sunday. */
  readonly firstWeekday: number
  /** The next month's name, and the whole days until its first day. */
  readonly next: { readonly month: string; readonly inDays: number }
}

/** The longest month any of these calendars has (31 days, the Persian spring's), with a day to spare. */
const MONTH_WITHIN = 32

/** One formatter per calendar: a month or a year searches hundreds of days through it. */
const PARTS_FORMATS = new Map<MonthCalendar, Intl.DateTimeFormat>()
const partsFormat = (calendar: MonthCalendar): Intl.DateTimeFormat => {
  const kept = PARTS_FORMATS.get(calendar)
  if (kept) return kept
  const made = new Intl.DateTimeFormat(`en-GB-u-ca-${calendar}`, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
  PARTS_FORMATS.set(calendar, made)
  return made
}

/** A date's day, month and year in `calendar`, read in UTC, or null when the runtime lacks it. */
function monthParts(day: string, calendar: MonthCalendar): { readonly day: number; readonly month: string; readonly year: number } | null {
  try {
    const parts = partsFormat(calendar).formatToParts(noonOf(day))
    const get = (type: string) => parts.find((p) => p.type === type)?.value
    const dayOf = Number(get('day'))
    const month = get('month')
    const year = Number.parseInt(get('year') ?? '', 10)
    return month && Number.isFinite(dayOf) && Number.isFinite(year) ? { day: dayOf, month, year } : null
  } catch {
    return null
  }
}

/** `day` (YYYY-MM-DD) in its month of `calendar`: Intl counts the months, so a leap month needs no table. Null when the runtime lacks the calendar. */
export function calendarMonth(day: string, calendar: MonthCalendar): CalendarMonth | null {
  const today = monthParts(day, calendar)
  if (!today) return null
  const inNext = (offset: number) => {
    const then = monthParts(shiftDay(day, offset), calendar)
    return then !== null && (then.month !== today.month || then.year !== today.year)
  }
  const toNext = firstDay(0, MONTH_WITHIN, inNext)
  const next = toNext === null ? null : monthParts(shiftDay(day, toNext), calendar)
  if (toNext === null || !next) return null
  return {
    ...today,
    length: today.day - 1 + toNext,
    firstWeekday: noonOf(shiftDay(day, 1 - today.day)).getUTCDay(),
    next: { month: next.month, inDays: toNext },
  }
}

/** A month of a calendar's year: its name, its first civil day (YYYY-MM-DD), its length. */
export interface YearMonth {
  readonly month: string
  readonly first: string
  readonly length: number
}

/** The most months a calendar year holds (the Hebrew leap year's thirteen), with one to spare. */
const MONTHS_WITHIN = 14

/** The months of the year `day` falls in, in `calendar`, first to last: Intl counts them, so a leap month needs no table. Null when the runtime lacks the calendar. */
export function calendarYear(day: string, calendar: MonthCalendar): readonly YearMonth[] | null {
  const today = calendarMonth(day, calendar)
  if (!today) return null
  const monthAt = (first: string): (YearMonth & { readonly year: number }) | null => {
    const month = calendarMonth(first, calendar)
    return month && { month: month.month, year: month.year, first, length: month.length }
  }
  const holding = monthAt(shiftDay(day, 1 - today.day))
  if (!holding) return null
  const before: YearMonth[] = []
  for (let at = holding, n = 0; n < MONTHS_WITHIN; n++) {
    const back = calendarMonth(shiftDay(at.first, -1), calendar)
    const prior = back && monthAt(shiftDay(at.first, -back.day))
    if (!prior || prior.year !== today.year) break
    before.unshift(prior)
    at = prior
  }
  const after: YearMonth[] = []
  for (let at = holding, n = 0; n < MONTHS_WITHIN; n++) {
    const next = monthAt(shiftDay(at.first, at.length))
    if (!next || next.year !== today.year) break
    after.push(next)
    at = next
  }
  return [...before, holding, ...after].map(({ month, first, length }) => ({ month, first, length }))
}

/** e.g. "10 Safar 1448 AH", or null when the runtime lacks the calendar. */
export function hijriDate(date: Date): string | null {
  return intlCalendarDate(date, 'islamic-umalqura')
}

/** e.g. "2 Mordad 1405 AP", or null when the runtime lacks the calendar. */
export function persianDate(date: Date): string | null {
  return intlCalendarDate(date, 'persian')
}

// ---------------------------------------------------------------------------
// Chinese year — sexagenary stem-branch cycle
// ---------------------------------------------------------------------------

/** The sexagenary place, 0 (Jia Zi), of a year: AD 4 opened a sixty (Jia Zi, the Wood Rat), so 1984 and 2044 open one too. */
const JIAZI_YEAR = 4

/** Stems and branches turn together until both come round: sixty years. */
export const YEARS_IN_CYCLE = SEXAGENARY_CYCLE

export interface ChineseYear {
  /** Element of the year's heavenly stem, e.g. "Fire". */
  readonly element: PhaseName
  /** Animal of the year's earthly branch, e.g. "Horse". */
  readonly animal: string
  /** Stems alternate yang/yin. */
  readonly polarity: 'Yang' | 'Yin'
  /** "Fire Horse" */
  readonly name: string
  /** The year's place in the sixty-year cycle of stems and branches, 1 (Wood Rat) to 60. */
  readonly cycle: number
  /** Its stem and branch as written, e.g. "丙午". */
  readonly characters: string
  /** Its stem and branch in pinyin, e.g. "Bing Wu". */
  readonly pinyin: string
}

/** The Chinese year that began in Gregorian `year`: its stem's element and polarity, its branch's animal, its place in the sixty. */
export function chineseYearOf(year: number): ChineseYear {
  const { position, stem, branch, characters, pinyin } = pairAt(year - JIAZI_YEAR)
  return {
    element: stem.phase,
    animal: branch.animal,
    polarity: stem.polarity,
    name: `${stem.phase} ${branch.animal}`,
    cycle: position + 1,
    characters,
    pinyin,
  }
}

/**
 * The Chinese year in effect on `date`, respecting the lunisolar new year
 * boundary via Intl's chinese calendar (its relatedYear part is the Gregorian
 * year the Chinese year began in): for a reader without the ephemeris. ICU
 * sets a new Moon near Beijing's midnight a day off (1954, 2027, 2030 in
 * 1950–2060); a reader with the ephemeris uses `chineseYearOn`
 * (`chinese-calendar.ts`).
 */
export function chineseYear(date: Date): ChineseYear | null {
  try {
    const parts = new Intl.DateTimeFormat('en-u-ca-chinese', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).formatToParts(date)
    // TS's Intl part-type union predates 'relatedYear'; it is real at runtime.
    const related = parts.find((p) => (p.type as string) === 'relatedYear')?.value
    if (!related) return null
    const year = Number(related)
    if (!Number.isFinite(year)) return null
    return chineseYearOf(year)
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Sidereal zodiac — Lahiri ayanamsa
// ---------------------------------------------------------------------------

export { SIDEREAL_AYANAMSA, lahiriAyanamsa } from './ayanamsa'

export interface SiderealSun {
  readonly sign: string
  readonly degree: number
}

/** Sidereal sun sign+degree from the tropical ephemeris minus ayanamsa. */
export function siderealSun(dateStr: string): SiderealSun {
  const positions = getCurrentPlanetaryPositions(dateStr)
  const sun = positions.find((p) => p.planet.id === 'sun')
  if (!sun) throw new Error('ephemeris returned no sun')
  const longitude = inTurn(sun.position.longitude - lahiriAyanamsa(dateStr))
  const sign = ZODIAC_SIGNS[Math.floor(longitude / SIGN_SPAN)]
  return { sign: sign.name, degree: Math.floor(longitude % SIGN_SPAN) }
}

// ---------------------------------------------------------------------------
// Panchang — its own module, read at sunrise in Ujjain
// ---------------------------------------------------------------------------

export { TITHIS, panchang, tithiAt, tithiNumbered, type Panchang, type Tithi } from './panchang'
