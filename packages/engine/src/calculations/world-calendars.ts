/**
 * Hijri, Persian, and Chinese calendars — structured date parts and holiday
 * proximity, mirroring hebrew-calendar.ts on the same zero-dependency Intl
 * foundation (null-degrading where the runtime lacks calendar data).
 *
 * Hijri and Persian holidays are read by month number in hijri-calendar.ts
 * and persian-calendar.ts. Chinese festivals are matched by (month name,
 * day) while scanning forward through civil days, so epact and leap-month
 * drift are handled by Intl itself.
 * Chinese leap months surface from Intl as e.g. "Sixth Monthbis" and never
 * match the festival tables — festivals belong to the regular month.
 */

import { daysFrom, noonOf } from './day-search'
import { CHINESE_FESTIVALS as FESTIVALS, CHINESE_MONTHS } from '../data/chinese-months'
import { HIJRI_DAYS, HIJRI_MONTHS, upcomingHijriDays } from './hijri-calendar'
import { PERSIAN_FEASTS, PERSIAN_MONTHS, jashnDays, nextPersianYear, persianFeastsIn, persianYearOf } from './persian-calendar'

export interface WorldDateParts {
  readonly day: number
  /** Intl's en month name: Safar / Mordad / "Sixth Month" … */
  readonly month: string
  readonly year: number
  /** e.g. "15 Safar 1448 AH". */
  readonly formatted: string
}

function intlDateParts(
  date: Date,
  calendar: string,
  era: boolean
): WorldDateParts | null {
  try {
    const parts = new Intl.DateTimeFormat(`en-GB-u-ca-${calendar}`, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).formatToParts(date)
    const get = (type: string) => parts.find((p) => p.type === type)?.value
    const day = Number(get('day'))
    const month = get('month')
    const year = Number(get('year') ?? get('relatedYear'))
    if (!month || !Number.isFinite(day) || !Number.isFinite(year)) return null
    const suffix = era ? ` ${get('era') ?? ''}`.trimEnd() : ''
    return { day, month, year, formatted: `${day} ${month} ${year}${suffix}` }
  } catch {
    return null
  }
}

/** e.g. { day: 15, month: "Safar", year: 1448, formatted: "15 Safar 1448 AH" } */
export function hijriDateParts(date: Date): WorldDateParts | null {
  return intlDateParts(date, 'islamic-umalqura', true)
}

/** e.g. { day: 7, month: "Mordad", year: 1405, formatted: "7 Mordad 1405 AP" } */
export function persianDateParts(date: Date): WorldDateParts | null {
  return intlDateParts(date, 'persian', true)
}

/**
 * Chinese lunisolar date; `year` is Intl's relatedYear (the Gregorian year
 * the Chinese year began in), e.g. "16 Sixth Month 2026".
 */
export function chineseDateParts(date: Date): WorldDateParts | null {
  return intlDateParts(date, 'chinese', false)
}

export interface WorldHoliday {
  readonly name: string
  /** Native-script or romanized native name. */
  readonly nativeName: string
  /** Intl en month name(s) this holiday anchors to. */
  readonly month: string | readonly string[]
  readonly day: number
  readonly note: string
}

/** The Hijri days (data/hijri-months.ts) as holidays, each by its month's Intl name; one table, read by month number in hijri-calendar.ts. */
const HIJRI_BY_ID: ReadonlyMap<string, WorldHoliday> = new Map(
  HIJRI_DAYS.map((d) => [d.id, Object.freeze({ name: d.name, nativeName: d.arabic, month: HIJRI_MONTHS[d.month - 1]?.intl ?? '', day: d.day, note: d.note })]),
)

export const HIJRI_HOLIDAYS: readonly WorldHoliday[] = Object.freeze([...HIJRI_BY_ID.values()])

/** The Persian feasts and jashns that keep one date (data/persian-days.ts), as holidays; Chaharshanbe Suri, dated by its weekday, is read in persian-calendar.ts. */
const PERSIAN_BY_ID: ReadonlyMap<string, WorldHoliday> = new Map([
  ...PERSIAN_FEASTS.map((f) => [f.id, Object.freeze({ name: f.name, nativeName: f.persian, month: PERSIAN_MONTHS[f.month - 1]?.intl ?? '', day: f.day, note: f.note })] as const),
  ...PERSIAN_MONTHS.flatMap((m) =>
    jashnDays(m).map(
      (d, _, all) =>
        [`jashn-${m.number}-${d.day}`, Object.freeze({ name: all.length > 1 ? `${m.jashn}, ${d.name} day` : m.jashn, nativeName: `جشن ${d.persian}`, month: m.intl, day: d.day, note: `The name-day feast of ${m.yazata}`})] as const,
    ),
  ),
])

export const PERSIAN_HOLIDAYS: readonly WorldHoliday[] = Object.freeze([...PERSIAN_BY_ID.values()])

/** The traditional festivals (data/chinese-months.ts) as holidays, each by its month's Intl name; one table, read by month number in chinese-calendar.ts. */
export const CHINESE_FESTIVALS: readonly WorldHoliday[] = Object.freeze(
  FESTIVALS.map((f) => Object.freeze({ name: f.name, nativeName: f.characters, month: CHINESE_MONTHS[f.month - 1]?.intl ?? '', day: f.day, note: f.note })),
)

export interface UpcomingWorldHoliday {
  readonly holiday: WorldHoliday
  /** Civil date (YYYY-MM-DD, UTC) of the holiday's anchor day. */
  readonly date: string
  /** The date formatted in its own calendar. */
  readonly calendarDate: string
  /** Whole days from `from` (0 = today). */
  readonly inDays: number
}

function matchesMonth(holiday: WorldHoliday, month: string): boolean {
  return Array.isArray(holiday.month)
    ? holiday.month.includes(month)
    : holiday.month === month
}

/**
 * The next `count` holidays on/after `from`, by scanning civil days forward
 * (≤ 400 — covers a full year of every supported calendar, leap or not).
 */
function upcomingHolidays(
  from: Date,
  count: number,
  holidays: readonly WorldHoliday[],
  partsOf: (d: Date) => WorldDateParts | null
): UpcomingWorldHoliday[] {
  const found: UpcomingWorldHoliday[] = []
  const start = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())
  for (let i = 0; i <= 400 && found.length < count; i++) {
    const d = new Date(start + i * 86_400_000)
    const parts = partsOf(d)
    if (!parts) return found
    for (const holiday of holidays) {
      if (holiday.day === parts.day && matchesMonth(holiday, parts.month)) {
        found.push({
          holiday,
          date: d.toISOString().split('T')[0],
          calendarDate: parts.formatted,
          inDays: i,
        })
      }
    }
  }
  return found
}

/** The next `count` Hijri holidays on or after `from`, matched by month number (hijri-calendar.ts). */
export function upcomingHijriHolidays(from: Date, count = 4): UpcomingWorldHoliday[] {
  return upcomingHijriDays(from.toISOString().slice(0, 10), count).flatMap((o) => {
    const holiday = HIJRI_BY_ID.get(o.holiday.id)
    return holiday ? [{ holiday, date: o.date, calendarDate: hijriDateParts(noonOf(o.date))?.formatted ?? '', inDays: o.inDays }] : []
  })
}

/** The next `count` Persian holidays on or after `from`, by their first day, matched by month number (persian-calendar.ts). */
export function upcomingPersianHolidays(from: Date, count = 4): UpcomingWorldHoliday[] {
  const found: UpcomingWorldHoliday[] = []
  const day = from.toISOString().slice(0, 10)
  for (let year = persianYearOf(day); year && found.length < count; year = nextPersianYear(year)) {
    for (const o of persianFeastsIn(year)) {
      const holiday = PERSIAN_BY_ID.get(o.id)
      if (!holiday || o.day !== 1 || o.date < day || found.length >= count) continue
      found.push({ holiday, date: o.date, calendarDate: persianDateParts(noonOf(o.date))?.formatted ?? '', inDays: daysFrom(day, o.date) })
    }
  }
  return found
}

export function upcomingChineseFestivals(from: Date, count = 4): UpcomingWorldHoliday[] {
  return upcomingHolidays(from, count, CHINESE_FESTIVALS, chineseDateParts)
}
