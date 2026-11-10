/**
 * The Persian (Solar Hijri) calendar on Intl's persian calendar (the
 * astronomical rule: the year begins on the day, in Iran Standard Time,
 * the March equinox falls on or before its noon), null-degrading where the
 * runtime lacks it: a year as its months matched by number, each day's
 * Zoroastrian name, the jashns, the year's feasts and Chaharshanbe Suri
 * (data/persian-days.ts), and the moment of the year's turning, the Tahvil,
 * from the ephemeris. Civil dates are YYYY-MM-DD read at noon UTC.
 */

import { Seasons } from 'astronomy-engine'
import { calendarYear } from './calendars'
import { daysFrom, noonOf, shiftDay } from './day-search'
import { CHAHARSHANBE_SURI, PERSIAN_FEASTS, PERSIAN_MONTHS, ZOROASTRIAN_DAYS, type PersianFeast, type PersianFeastKind, type PersianMonth, type ZoroastrianDay } from '../data/persian-days'

export { CHAHARSHANBE_SURI, PERSIAN_FEASTS, PERSIAN_MONTHS, PERSIAN_SEASONS, ZOROASTRIAN_DAYS, type PersianFeast, type PersianFeastKind, type PersianMonth, type PersianSeason, type ZoroastrianDay } from '../data/persian-days'

const NUMBERS = (() => {
  try {
    return new Intl.DateTimeFormat('en-GB-u-ca-persian', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' })
  } catch {
    return null
  }
})()

/** A civil date's Persian year, month number and day, or null where the runtime lacks the calendar. */
export function persianNumbers(date: string): { readonly year: number; readonly month: number; readonly day: number } | null {
  try {
    const parts = NUMBERS?.formatToParts(noonOf(date))
    const get = (type: string) => Number.parseInt(parts?.find((p) => p.type === type)?.value ?? '', 10)
    const numbers = { year: get('year'), month: get('month'), day: get('day') }
    return Object.values(numbers).every(Number.isFinite) ? numbers : null
  } catch {
    return null
  }
}

export interface PersianYearMonth {
  readonly month: PersianMonth
  readonly name: string
  readonly first: string
  readonly length: number
}

export interface PersianYear {
  /** Anno Persico. */
  readonly year: number
  readonly first: string
  readonly length: number
  readonly months: readonly PersianYearMonth[]
}

const YEARS = new Map<number, PersianYear>()
const YEARS_KEPT = 16

/** The Persian year `day` falls in, or null where the runtime lacks the calendar. */
export function persianYearOf(day: string): PersianYear | null {
  const today = persianNumbers(day)
  if (!today) return null
  const kept = YEARS.get(today.year)
  if (kept) return kept
  const months = (calendarYear(day, 'persian') ?? []).flatMap((m): PersianYearMonth[] => {
    const month = PERSIAN_MONTHS[(persianNumbers(m.first)?.month ?? 0) - 1]
    return month ? [{ month, name: m.month, first: m.first, length: m.length }] : []
  })
  const first = months[0]?.first
  if (!first || months.length !== PERSIAN_MONTHS.length) return null
  const year: PersianYear = { year: today.year, first, length: months.reduce((sum, m) => sum + m.length, 0), months }
  YEARS.set(today.year, year)
  for (const old of [...YEARS.keys()].slice(0, Math.max(0, YEARS.size - YEARS_KEPT))) YEARS.delete(old)
  return year
}

export const nextPersianYear = (year: PersianYear): PersianYear | null => persianYearOf(shiftDay(year.first, year.length))

/** The civil date of `day` in month `month` (1–12) of `year`, or null where the month has no such day. */
export function persianDateIn(year: PersianYear, month: number, day: number): string | null {
  const held = year.months[month - 1]
  return held && day >= 1 && day <= held.length ? shiftDay(held.first, day - 1) : null
}

export interface PersianDate {
  readonly year: PersianYear
  readonly month: PersianYearMonth
  readonly day: number
}

export function persianDateOf(date: string): PersianDate | null {
  const year = persianYearOf(date)
  const month = year?.months.find((m) => m.first <= date && daysFrom(m.first, date) < m.length)
  return year && month ? { year, month, day: daysFrom(month.first, date) + 1 } : null
}

/** A day of the month's Zoroastrian name, read onto the civil day (1–30); the civil 31st has none. */
export const zoroastrianDay = (day: number): ZoroastrianDay | undefined => ZOROASTRIAN_DAYS[day - 1]

/** The days of a month that are its jashns: those whose yazata is the month's. */
export const jashnDays = (month: PersianMonth): readonly ZoroastrianDay[] => ZOROASTRIAN_DAYS.filter((d) => d.yazata === month.yazata)

/** A feast as kept on one civil day: a feast of the table, a jashn, or Chaharshanbe Suri; its day in its span. */
export interface PersianObservance {
  readonly date: string
  readonly id: string
  readonly name: string
  readonly persian: string
  readonly kind: PersianFeastKind | 'jashn'
  readonly note: string
  readonly day: number
  readonly feast?: PersianFeast
}

const WEDNESDAY = 3

/** The year's feasts (data/persian-days.ts), its jashns and Chaharshanbe Suri, in date order. */
export function persianFeastsIn(year: PersianYear): readonly PersianObservance[] {
  const feasts = PERSIAN_FEASTS.flatMap((feast) => {
    const first = persianDateIn(year, feast.month, feast.day)
    return first
      ? Array.from({ length: feast.span ?? 1 }, (_, i) => ({
          date: shiftDay(first, i),
          id: feast.id,
          name: (feast.span ?? 1) > 1 ? `${feast.name}, day ${i + 1}` : feast.name,
          persian: feast.persian,
          kind: feast.kind,
          note: feast.note,
          day: i + 1,
          feast,
        }))
      : []
  })
  const jashns = year.months.flatMap(({ month }) => {
    const days = jashnDays(month)
    return days.flatMap((d) => {
      const date = persianDateIn(year, month.number, d.day)
      const name = days.length > 1 ? `${month.jashn}, ${d.name} day` : month.jashn
      return date ? [{ date, id: `jashn-${month.number}-${d.day}`, name, persian: `جشن ${d.persian}`, kind: 'jashn' as const, note: `${d.name} day of ${month.name}, both ${month.yazata}’s`, day: 1 }] : []
    })
  })
  const end = shiftDay(year.first, year.length)
  const lastWednesday = shiftDay(end, -(((noonOf(end).getUTCDay() - WEDNESDAY + 6) % 7) + 1))
  const suri = { date: shiftDay(lastWednesday, -1), ...CHAHARSHANBE_SURI, kind: 'evening' as const, day: 1 }
  return [...feasts, ...jashns, suri].sort((a, b) => a.date.localeCompare(b.date))
}

/** The next `count` feasts on or after `from`, each with the whole days to it. */
export function upcomingPersianFeasts(from: string, count: number): readonly (PersianObservance & { readonly inDays: number })[] {
  const found: (PersianObservance & { readonly inDays: number })[] = []
  for (let year = persianYearOf(from); year && found.length < count; year = nextPersianYear(year)) {
    for (const o of persianFeastsIn(year)) if (o.date >= from && found.length < count) found.push({ ...o, inDays: daysFrom(from, o.date) })
  }
  return found
}

/** Iran Standard Time, UTC+3:30, kept all year since Iran ended daylight saving in 2022 (and in force at every Tahvil before it, the clocks then moving on 2 Farvardin). */
const TEHRAN_OFFSET_MINUTES = 210
const MS_PER_MINUTE = 60_000
/** The Solar Hijri era begins in AD 622: a Persian year begins in March of its number plus 621. */
const ERA_OFFSET = 621

/** The Tahvil: the March equinox that turns Persian year `year`, its instant, and its date and time on Tehran's clock. */
export function tahvilOf(year: number): { readonly instant: Date; readonly date: string; readonly time: string } {
  const instant = Seasons(year + ERA_OFFSET).mar_equinox.date
  const tehran = new Date(instant.getTime() + TEHRAN_OFFSET_MINUTES * MS_PER_MINUTE).toISOString()
  return { instant, date: tehran.slice(0, 10), time: tehran.slice(11, 19) }
}
