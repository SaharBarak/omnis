/**
 * The Hijri calendar by the Umm al-Qura reckoning (Intl's
 * islamic-umalqura, Saudi Arabia's civil calendar), null-degrading where
 * the runtime lacks it: a year as its twelve months, each matched to its
 * table entry by its number, never by the runtime's spelling of its name;
 * its days and named stretches (data/hijri-months.ts). Civil dates are
 * YYYY-MM-DD read at noon UTC.
 */

import { calendarYear } from './calendars'
import { daysFrom, noonOf, shiftDay } from './day-search'
import { HIJRI_DAYS, HIJRI_MONTHS, HIJRI_SPANS, type HijriDay, type HijriMonth, type HijriSpan } from '../data/hijri-months'

export { HIJRI_DAYS, HIJRI_MONTHS, HIJRI_SPANS, type HijriDay, type HijriDayKind, type HijriMonth, type HijriSpan } from '../data/hijri-months'

const NUMBERS = (() => {
  try {
    return new Intl.DateTimeFormat('en-GB-u-ca-islamic-umalqura', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' })
  } catch {
    return null
  }
})()

/** A civil date's Hijri year, month number and day, or null where the runtime lacks the calendar. */
export function hijriNumbers(date: string): { readonly year: number; readonly month: number; readonly day: number } | null {
  try {
    const parts = NUMBERS?.formatToParts(noonOf(date))
    const get = (type: string) => Number.parseInt(parts?.find((p) => p.type === type)?.value ?? '', 10)
    const numbers = { year: get('year'), month: get('month'), day: get('day') }
    return Object.values(numbers).every(Number.isFinite) ? numbers : null
  } catch {
    return null
  }
}

/** A month of a Hijri year: its table entry, Intl's name for it, its first civil day and its length. */
export interface HijriYearMonth {
  readonly month: HijriMonth
  readonly name: string
  readonly first: string
  readonly length: number
}

export interface HijriYear {
  /** Anno Hegirae. */
  readonly year: number
  readonly first: string
  readonly length: number
  readonly months: readonly HijriYearMonth[]
}

const YEARS = new Map<number, HijriYear>()
const YEARS_KEPT = 16

/** The Hijri year `day` falls in, or null where the runtime lacks the calendar. */
export function hijriYearOf(day: string): HijriYear | null {
  const today = hijriNumbers(day)
  if (!today) return null
  const kept = YEARS.get(today.year)
  if (kept) return kept
  const counted = calendarYear(day, 'islamic-umalqura')
  const months = (counted ?? []).flatMap((m): HijriYearMonth[] => {
    const month = HIJRI_MONTHS[(hijriNumbers(m.first)?.month ?? 0) - 1]
    return month ? [{ month, name: m.month, first: m.first, length: m.length }] : []
  })
  const first = months[0]?.first
  if (!first || months.length !== HIJRI_MONTHS.length) return null
  const year: HijriYear = { year: today.year, first, length: months.reduce((sum, m) => sum + m.length, 0), months }
  YEARS.set(today.year, year)
  for (const old of [...YEARS.keys()].slice(0, Math.max(0, YEARS.size - YEARS_KEPT))) YEARS.delete(old)
  return year
}

/** The year after `year`. */
export const nextHijriYear = (year: HijriYear): HijriYear | null => hijriYearOf(shiftDay(year.first, year.length))

/** The civil date of `day` in month `month` (1–12) of `year`, or null where the month has no such day. */
export function hijriDateIn(year: HijriYear, month: number, day: number): string | null {
  const held = year.months[month - 1]
  return held && day >= 1 && day <= held.length ? shiftDay(held.first, day - 1) : null
}

/** Where a civil date stands in its Hijri year. */
export interface HijriDate {
  readonly year: HijriYear
  readonly month: HijriYearMonth
  readonly day: number
}

export function hijriDateOf(date: string): HijriDate | null {
  const year = hijriYearOf(date)
  const month = year?.months.find((m) => m.first <= date && daysFrom(m.first, date) < m.length)
  return year && month ? { year, month, day: daysFrom(month.first, date) + 1 } : null
}

/** A day of the year as kept: its civil day, and for a night the evening it begins, the day before. */
export interface HijriObservance {
  readonly date: string
  readonly holiday: HijriDay
  readonly evening?: string
}

/** The year's days (data/hijri-months.ts HIJRI_DAYS), in date order. */
export function hijriDaysIn(year: HijriYear): readonly HijriObservance[] {
  return HIJRI_DAYS.flatMap((holiday) => {
    const date = hijriDateIn(year, holiday.month, holiday.day)
    return date ? [{ date, holiday, ...(holiday.kind === 'night' ? { evening: shiftDay(date, -1) } : {}) }] : []
  }).sort((a, b) => a.date.localeCompare(b.date))
}

/** A named stretch as one month holds it. */
export interface HijriStretch {
  readonly span: HijriSpan
  readonly month: HijriYearMonth
  readonly first: string
  readonly last: string
}

/** The year's named stretches, each month's white days among them, in date order. */
export function hijriStretchesIn(year: HijriYear): readonly HijriStretch[] {
  return HIJRI_SPANS.flatMap((span) =>
    year.months.flatMap((month) => {
      if (span.month !== 0 && span.month !== month.month.number) return []
      const last = Math.min(span.to, month.length)
      return [{ span, month, first: shiftDay(month.first, span.from - 1), last: shiftDay(month.first, last - 1) }]
    }),
  ).sort((a, b) => a.first.localeCompare(b.first))
}

/** The next `count` days of the table on or after `from` (YYYY-MM-DD), each with the whole days to it. */
export function upcomingHijriDays(from: string, count: number): readonly (HijriObservance & { readonly inDays: number })[] {
  const found: (HijriObservance & { readonly inDays: number })[] = []
  for (let year = hijriYearOf(from); year && found.length < count; year = nextHijriYear(year)) {
    for (const o of hijriDaysIn(year)) if (o.date >= from && found.length < count) found.push({ ...o, inDays: daysFrom(from, o.date) })
  }
  return found
}
