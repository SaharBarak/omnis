/**
 * The Hebrew calendar on the same zero-dependency Intl foundation as
 * calendars.ts (null-degrading where the runtime lacks calendar data): a
 * year as its months (Intl counts them, so a leap month needs no table),
 * its type (keviah), its place in the nineteen-year and the seven-year
 * cycles, its holidays kept in Israel or the diaspora with the rules that
 * move them (data/hebrew-holidays.ts), the new months and their molad, and
 * the Omer. Civil dates are YYYY-MM-DD read at noon UTC.
 */

import { calendarYear } from './calendars'
import { daysFrom, noonOf, shiftDay } from './day-search'
import { HEBREW_HOLIDAYS, HEBREW_SEASONS, type HebrewHoliday, type HebrewReckoning, type HebrewSeason } from '../data/hebrew-holidays'
import { HEBREW_LETTERS } from '../data/hebrew-letters'
import { HEBREW_MONTHS, hebrewMonthNamed, type HebrewMonth, type HebrewMonthId } from '../data/hebrew-months'
import { SEFIROT, type Sefirah } from '../data/tree-of-life'

export { HEBREW_HOLIDAYS, HEBREW_SEASONS, type HebrewDayKind, type HebrewHoliday, type HebrewReckoning, type HebrewSeason } from '../data/hebrew-holidays'

export interface HebrewDateParts {
  readonly day: number
  /** Intl's en month name: Tishri, Heshvan, … , Adar, Adar I, Adar II. */
  readonly month: string
  readonly year: number
  /** e.g. "10 Av 5786". */
  readonly formatted: string
}

const PARTS_FORMAT = (() => {
  try {
    return new Intl.DateTimeFormat('en-GB-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
  } catch {
    return null
  }
})()

export function hebrewDateParts(date: Date): HebrewDateParts | null {
  try {
    const parts = PARTS_FORMAT?.formatToParts(date)
    if (!parts) return null
    const get = (type: string) => parts.find((p) => p.type === type)?.value
    const day = Number(get('day'))
    const month = get('month')
    const year = Number(get('year'))
    if (!month || !Number.isFinite(day) || !Number.isFinite(year)) return null
    return { day, month, year, formatted: `${day} ${month} ${year}` }
  } catch {
    return null
  }
}

/* ---------- numerals ---------- */

/** The letters by value, largest first: the numeral is written greedily from them. */
const BY_VALUE = [...HEBREW_LETTERS].sort((a, b) => b.standardValue - a.standardValue)
const GERESH = '׳'
const GERSHAYIM = '״'
/** 15 and 16 are written 9 + 6 and 9 + 7, so no numeral spells a name of God. */
const AVOIDED = new Set([15, 16])
const TEN = 10
const NINE = 9
const THOUSAND = 1000

/** The letters of `n` (1–999), largest value first. */
function numeralLetters(n: number): string {
  if (n <= 0) return ''
  if (AVOIDED.has(n % (TEN * TEN))) {
    const hundreds = n - (n % (TEN * TEN))
    return numeralLetters(hundreds) + numeralLetters(NINE) + numeralLetters((n % (TEN * TEN)) - NINE)
  }
  const letter = BY_VALUE.find((l) => l.standardValue <= n)
  return letter ? letter.letter + numeralLetters(n - letter.standardValue) : ''
}

/**
 * `n` in Hebrew numerals, as a Hebrew date writes its day and year: the
 * letters' values summed, largest first, the thousands dropped (5787 is
 * תשפ״ז); a geresh after a lone letter, gershayim before the last of
 * several. Empty for zero.
 */
export function hebrewNumeral(n: number): string {
  const letters = [...numeralLetters(Math.floor(n) % THOUSAND)]
  if (letters.length === 0) return ''
  return letters.length === 1 ? `${letters[0]}${GERESH}` : `${letters.slice(0, -1).join('')}${GERSHAYIM}${letters[letters.length - 1]}`
}

/* ---------- the year ---------- */

/** A month of a Hebrew year: what it is, Intl's name for it, its first civil day and its length. */
export interface HebrewYearMonth {
  readonly month: HebrewMonth
  readonly name: string
  readonly first: string
  readonly length: number
}

/** A year's length in its kind: Heshvan and Kislev both short, as the rule sets them, or both full. */
export type HebrewYearKind = 'deficient' | 'regular' | 'complete'

/**
 * A year's type (keviah) as the tradition writes it: the weekday of Rosh
 * Hashanah, the year's kind, and the weekday Pesach begins, each a letter
 * (בחג: Monday, deficient, Tuesday). Weekdays 0 Sunday … 6 Shabbat.
 */
export interface Keviah {
  readonly roshHashanah: number
  readonly kind: HebrewYearKind
  readonly pesach: number
  readonly letters: string
}

export interface HebrewYear {
  readonly year: number
  /** 1 Tishrei. */
  readonly first: string
  readonly length: number
  /** Thirteen months, Adar doubled. */
  readonly leap: boolean
  readonly keviah: Keviah
  readonly months: readonly HebrewYearMonth[]
  /** The year's place in the nineteen-year cycle (1–19), whose years 3, 6, 8, 11, 14, 17 and 19 are leap. */
  readonly cycleYear: number
  /** The year's place in the seven-year cycle (1–7), the seventh the shmita, the land's year of rest. */
  readonly shmitaYear: number
}

/** The shortest common and leap years (Rambam, Kiddush HaChodesh 8:5–7): a year one day longer is regular, two complete. */
const SHORTEST_COMMON = 353
const SHORTEST_LEAP = 383
const KINDS: readonly HebrewYearKind[] = ['deficient', 'regular', 'complete']
/** The kinds as the keviah writes them: חסרה, כסדרה, שלמה. */
const KIND_LETTERS: Readonly<Record<HebrewYearKind, string>> = { deficient: 'ח', regular: 'כ', complete: 'ש' }
/** The weekdays by their numerals, Sunday א to Shabbat ז. */
const WEEKDAY_LETTERS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז'] as const
export const METONIC_YEARS = 19
export const SHMITA_YEARS = 7
const NISAN_FESTIVAL_DAY = 15

/** A civil date's weekday, 0 Sunday … 6 Shabbat. */
export const weekdayOf = (date: string): number => noonOf(date).getUTCDay()

const YEARS = new Map<number, HebrewYear>()
const YEARS_KEPT = 64

/** The Hebrew year `day` (YYYY-MM-DD) falls in, or null where the runtime lacks the calendar. */
export function hebrewYearOf(day: string): HebrewYear | null {
  const parts = hebrewDateParts(noonOf(day))
  if (!parts) return null
  const kept = YEARS.get(parts.year)
  if (kept) return kept
  const counted = calendarYear(day, 'hebrew')
  if (!counted) return null
  const months = counted.flatMap((m): HebrewYearMonth[] => {
    const month = hebrewMonthNamed(m.month)
    return month ? [{ month, name: m.month, first: m.first, length: m.length }] : []
  })
  const first = months[0]?.first
  if (!first || months.length !== counted.length) return null
  const length = months.reduce((sum, m) => sum + m.length, 0)
  const leap = months.length > HEBREW_MONTHS.length - 1
  const kind = KINDS[length - (leap ? SHORTEST_LEAP : SHORTEST_COMMON)] ?? 'regular'
  const nisan = months.find((m) => m.month.id === 'nisan')
  const pesach = nisan ? weekdayOf(shiftDay(nisan.first, NISAN_FESTIVAL_DAY - 1)) : 0
  const roshHashanah = weekdayOf(first)
  const year: HebrewYear = {
    year: parts.year,
    first,
    length,
    leap,
    keviah: { roshHashanah, kind, pesach, letters: `${WEEKDAY_LETTERS[roshHashanah]}${KIND_LETTERS[kind]}${WEEKDAY_LETTERS[pesach]}` },
    months,
    cycleYear: ((parts.year - 1) % METONIC_YEARS) + 1,
    shmitaYear: ((parts.year - 1) % SHMITA_YEARS) + 1,
  }
  YEARS.set(parts.year, year)
  for (const old of [...YEARS.keys()].slice(0, Math.max(0, YEARS.size - YEARS_KEPT))) YEARS.delete(old)
  return year
}

/** The year after `year`, from its Rosh Hashanah. */
export const nextHebrewYear = (year: HebrewYear): HebrewYear | null => hebrewYearOf(shiftDay(year.first, year.length))

/** The year before `year`, from its last day. */
export const previousHebrewYear = (year: HebrewYear): HebrewYear | null => hebrewYearOf(shiftDay(year.first, -1))

/** The civil date of `day` in `month` of `year`, or null where the month has no such day (or the year no such month). */
export function hebrewDateIn(year: HebrewYear, month: HebrewMonthId, day: number): string | null {
  const held = year.months.find((m) => m.month.id === month)
  return held && day >= 1 && day <= held.length ? shiftDay(held.first, day - 1) : null
}

/** Where a civil date stands in its Hebrew year: the year, the month, the day of the month. */
export interface HebrewDay {
  readonly year: HebrewYear
  readonly month: HebrewYearMonth
  readonly day: number
}

export function hebrewDayOf(date: string): HebrewDay | null {
  const year = hebrewYearOf(date)
  const month = year?.months.find((m) => m.first <= date && daysFrom(m.first, date) < m.length)
  return year && month ? { year, month, day: daysFrom(month.first, date) + 1 } : null
}

/* ---------- holidays ---------- */

/** A holiday as kept on one civil day: its place in its span, its name that day, and whether it is a day of rest there. */
export interface HebrewObservance {
  readonly date: string
  readonly holiday: HebrewHoliday
  readonly name: string
  readonly hebrewName: string
  /** Its place in the holiday's span, 1 its first day. */
  readonly day: number
  /** A Yom Tov, a festival day of rest, in this reckoning. */
  readonly rest: boolean
  /** A festival's intermediate day (Chol HaMoed). */
  readonly between: boolean
  /** The days a postponement moved it by, 0 where it stands on its own day. */
  readonly moved: number
}

/** A holiday's eve: the day before it, from whose sundown it is kept. */
export interface HebrewEve {
  readonly date: string
  readonly holiday: HebrewHoliday
  readonly name: string
  readonly hebrewName: string
}

/** Where `holiday` stands in `year`, after its postponement, or null where the year does not keep it. */
function observedFirst(holiday: HebrewHoliday, year: HebrewYear, reckoning: HebrewReckoning): { readonly date: string; readonly moved: number } | null {
  if ((holiday.only && holiday.only !== reckoning) || (holiday.leapOnly && !year.leap) || (holiday.since && year.year < holiday.since)) return null
  const anchor = hebrewDateIn(year, holiday.month, holiday.day)
  if (!anchor) return null
  const move = holiday.moves?.find((m) => m.on === weekdayOf(anchor) && (m.since === undefined || year.year >= m.since))
  return { date: shiftDay(anchor, move?.by ?? 0), moved: move?.by ?? 0 }
}

/** The days of `holiday` in `year`, each named as it is kept that day. */
function observancesOf(holiday: HebrewHoliday, year: HebrewYear, reckoning: HebrewReckoning): readonly HebrewObservance[] {
  const first = observedFirst(holiday, year, reckoning)
  if (!first) return []
  const span = holiday.span?.[reckoning] ?? 1
  return Array.from({ length: span }, (_, i) => {
    const day = i + 1
    const rest = holiday.kind === 'yomtov' && (holiday.restDays?.[reckoning].includes(day) ?? true)
    const between = holiday.kind === 'yomtov' && !rest
    const named = holiday.named?.[day]
    const single = reckoning === 'israel' && holiday.israelName ? holiday.israelName : holiday.name
    const name = named?.name ?? (span > 1 ? `${holiday.name}, day ${day}${between ? ' · Chol HaMoed' : ''}` : single)
    const hebrewName = named?.hebrew ?? (span > 1 ? `${holiday.hebrewName} ${hebrewNumeral(day)}` : holiday.hebrewName)
    return { date: shiftDay(first.date, i), holiday, name, hebrewName, day, rest, between, moved: first.moved }
  })
}

/** Every holiday day of `year` as `reckoning` keeps it, in date order. */
export function hebrewHolidaysIn(year: HebrewYear, reckoning: HebrewReckoning = 'israel'): readonly HebrewObservance[] {
  return HEBREW_HOLIDAYS.flatMap((h) => observancesOf(h, year, reckoning)).sort((a, b) => a.date.localeCompare(b.date))
}

/** The eves of `year`'s holidays that begin at sundown, each on the day before its first day (Rosh Hashanah's in the year before). */
export function hebrewEvesIn(year: HebrewYear, reckoning: HebrewReckoning = 'israel'): readonly HebrewEve[] {
  return HEBREW_HOLIDAYS.flatMap((holiday) => {
    const first = holiday.erev ? observedFirst(holiday, year, reckoning) : null
    return first ? [{ date: shiftDay(first.date, -1), holiday, name: `Erev ${holiday.name}`, hebrewName: `ערב ${holiday.hebrewName}` }] : []
  }).sort((a, b) => a.date.localeCompare(b.date))
}

/** The holidays kept on `date` (a civil date read in UTC) in Israel; empty where the runtime lacks the calendar. */
export function hebrewHolidaysOn(date: Date): readonly HebrewHoliday[] {
  const day = date.toISOString().slice(0, 10)
  const year = hebrewYearOf(day)
  return year ? [...new Set(hebrewHolidaysIn(year).filter((o) => o.date === day).map((o) => o.holiday))] : []
}

export interface UpcomingHoliday {
  readonly holiday: HebrewHoliday
  /** Civil date (YYYY-MM-DD, UTC) of the holiday's first day as kept. */
  readonly date: string
  readonly hebrewDate: string
  /** Whole days from `from` (0 = today). */
  readonly inDays: number
}

/** The next `count` holidays on or after `from`, by their first day as kept in Israel. */
export function upcomingHebrewHolidays(from: Date, count = 4): UpcomingHoliday[] {
  const day = from.toISOString().slice(0, 10)
  const found: UpcomingHoliday[] = []
  for (let year = hebrewYearOf(day); year && found.length < count; year = nextHebrewYear(year)) {
    for (const o of hebrewHolidaysIn(year)) {
      if (o.day !== 1 || o.date < day || found.length >= count) continue
      found.push({ holiday: o.holiday, date: o.date, hebrewDate: hebrewDateParts(noonOf(o.date))?.formatted ?? '', inDays: daysFrom(day, o.date) })
    }
  }
  return found
}

/* ---------- new months ---------- */

/** A day of Rosh Chodesh: the month it begins, and its day of the two where the month before has thirty. */
export interface RoshChodesh {
  readonly date: string
  readonly month: HebrewYearMonth
  readonly day: number
  readonly of: number
}

/** The days of Rosh Chodesh in `year`: the first of each month but Tishrei, and the thirtieth of the month before where it has one. */
export function roshChodeshIn(year: HebrewYear): readonly RoshChodesh[] {
  return year.months.slice(1).flatMap((month, i) => {
    const before = year.months[i]
    const two = (before?.length ?? 0) === 30
    return two ? [{ date: shiftDay(month.first, -1), month, day: 1, of: 2 }, { date: month.first, month, day: 2, of: 2 }] : [{ date: month.first, month, day: 1, of: 1 }]
  })
}

/* ---------- molad ---------- */

/**
 * The molad, the mean conjunction the calendar is reckoned by (Rambam,
 * Kiddush HaChodesh 6): a month of 29 days, 12 hours and 793 parts (1080
 * parts to the hour), counted from BaHaRaD, the molad of Tishrei of year 1,
 * on the second day (Monday) at 5 hours and 204 parts from the evening
 * before; the hours of a Hebrew day count from 6 pm.
 */
const PARTS_PER_HOUR = 1080
const HOURS_PER_DAY = 24
const PARTS_PER_DAY = PARTS_PER_HOUR * HOURS_PER_DAY
const PARTS_PER_MINUTE = 18
const MINUTES_PER_HOUR = 60
const LUNATION_PARTS = 29 * PARTS_PER_DAY + 12 * PARTS_PER_HOUR + 793
/** BaHaRaD: one whole day (Sunday) and 5 hours 204 parts, from the evening that begins Sunday. */
const BAHARAD_PARTS = 1 * PARTS_PER_DAY + 5 * PARTS_PER_HOUR + 204
/** The months of a nineteen-year cycle: twelve years of twelve, seven of thirteen. */
const MONTHS_IN_CYCLE = 235
/** The Hebrew day begins at 6 pm of the civil day before. */
const EVENING_HOUR = 18
/**
 * The Julian Day Number of 1 Tishrei of year 1, Monday 7 October 3761 BCE
 * (proleptic Julian; Reingold and Dershowitz, Calendrical Calculations, the
 * Hebrew epoch R.D. −1,373,427), and of 1 January 1970.
 */
const HEBREW_EPOCH_JDN = 347_998
const UNIX_EPOCH_JDN = 2_440_588

/** The months from BaHaRaD to Tishrei of `year`: whole cycles, the cycle's years before it, and their leap months (Rambam 6:10–11). */
const monthsBefore = (year: number): number => {
  const cycles = Math.floor((year - 1) / METONIC_YEARS)
  const inCycle = (year - 1) % METONIC_YEARS
  return MONTHS_IN_CYCLE * cycles + 12 * inCycle + Math.floor((7 * inCycle + 1) / METONIC_YEARS)
}

/** A molad as announced: its civil date and weekday in Jerusalem, and its clock time to the part (18 to the minute). */
export interface Molad {
  readonly date: string
  readonly weekday: number
  readonly hour: number
  readonly minute: number
  readonly parts: number
}

/** The molad of the month `index` months after Tishrei (0) of `year`, in Jerusalem's mean time. */
export function moladOf(year: number, index: number): Molad {
  const total = BAHARAD_PARTS + (monthsBefore(year) + index) * LUNATION_PARTS
  const days = Math.floor(total / PARTS_PER_DAY)
  const within = total % PARTS_PER_DAY
  const hours = Math.floor(within / PARTS_PER_HOUR)
  const clock = (hours + EVENING_HOUR) % HOURS_PER_DAY
  /* Hebrew day `days` (0 the Sunday before the epoch's Monday) began at 6 pm of the civil day before it. */
  const civilDay = HEBREW_EPOCH_JDN - 1 + days - (hours + EVENING_HOUR < HOURS_PER_DAY ? 1 : 0)
  const date = shiftDay('1970-01-01', civilDay - UNIX_EPOCH_JDN)
  const inHour = within % PARTS_PER_HOUR
  return { date, weekday: weekdayOf(date), hour: clock, minute: Math.floor(inHour / PARTS_PER_MINUTE), parts: inHour % PARTS_PER_MINUTE }
}

/** The molad of `month` of `year`. */
export const moladOfMonth = (year: HebrewYear, month: HebrewYearMonth): Molad => moladOf(year.year, Math.max(0, year.months.indexOf(month)))

/* ---------- seasons and the Omer ---------- */

/** A named stretch as `year` holds it, first and last civil days. */
export interface HebrewSpan {
  readonly season: HebrewSeason
  readonly first: string
  readonly last: string
}

/** The named stretches of `year` (data/hebrew-holidays.ts HEBREW_SEASONS). */
export function hebrewSeasonsIn(year: HebrewYear): readonly HebrewSpan[] {
  return HEBREW_SEASONS.flatMap((season) => {
    const first = hebrewDateIn(year, ...season.from)
    const last = hebrewDateIn(year, ...season.to)
    return first && last ? [{ season, first, last }] : []
  })
}

const DAYS_IN_WEEK = 7
/** The seven lower sefirot the Omer's weeks and days pass through, Chesed to Malkhut (the Kabbalistic count printed in siddurim after the Arizal). */
const OMER_SEFIROT: readonly Sefirah[] = SEFIROT.slice(3)

/** The day of the Omer `date` is (1–49), counted the evening before, or null outside it. */
export function omerDayOf(date: string, year: HebrewYear): number | null {
  const omer = hebrewSeasonsIn(year).find((s) => s.season.id === 'omer')
  return omer && date >= omer.first && date <= omer.last ? daysFrom(omer.first, date) + 1 : null
}

/** An Omer day's two sefirot: the day's within the week's ("Hod of Gevurah"), and its weeks and days. */
export function omerSefirot(n: number): { readonly day: Sefirah; readonly week: Sefirah; readonly weeks: number; readonly days: number } | null {
  const day = OMER_SEFIROT[(n - 1) % DAYS_IN_WEEK]
  const week = OMER_SEFIROT[Math.floor((n - 1) / DAYS_IN_WEEK)]
  return day && week ? { day, week, weeks: Math.floor(n / DAYS_IN_WEEK), days: n % DAYS_IN_WEEK } : null
}
