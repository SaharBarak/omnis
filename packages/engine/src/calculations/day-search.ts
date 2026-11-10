/**
 * Whole civil days (UTC) as the unit of a search in time: a date shifted by
 * days, the first day on which a change has happened, and the run of days a
 * day belongs to.
 */

const DAY_MS = 86_400_000

/** `day` (YYYY-MM-DD) shifted by `by` whole days, read at noon UTC so no offset moves it. */
export const shiftDay = (day: string, by: number): string => new Date(Date.parse(`${day}T12:00:00Z`) + by * DAY_MS).toISOString().slice(0, 10)

/** Whole days from `from` to `to` (YYYY-MM-DD), negative when `to` is earlier. */
export const daysFrom = (from: string, to: string): number => Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / DAY_MS)

/** Noon UTC of `day`: the instant every daily value is read at. */
export const noonOf = (day: string): Date => new Date(`${day}T12:00:00Z`)

const HOUR_MS = 3_600_000

/** The civil date (YYYY-MM-DD) of an instant in a zone `hours` east of UTC: China Standard Time 8, India Standard Time 5.5. */
export const dateInZone = (at: Date, hours: number): string => new Date(at.getTime() + hours * HOUR_MS).toISOString().slice(0, 10)

/** An instant and the civil day it falls on in the zone a calendar dates by. */
export interface Dated {
  readonly at: Date
  readonly date: string
}

/** The instant civil day `day` begins in a zone `hours` east of UTC. */
export const midnightInZone = (day: string, hours: number): Date => new Date(Date.parse(`${day}T00:00:00Z`) - hours * HOUR_MS)

/**
 * The first whole day in (`from`, `to`] on which `changed` holds, by
 * bisection; once true, `changed` must stay true to `to`. Null when it is
 * not true at `to`, or already true at `from`: the change is not inside the
 * range, and no day in it can be named.
 */
export function firstDay(from: number, to: number, changed: (offset: number) => boolean): number | null {
  if (!changed(to) || changed(from)) return null
  let held = from
  let past = to
  while (past - held > 1) {
    const mid = Math.floor((held + past) / 2)
    if (changed(mid)) past = mid
    else held = mid
  }
  return past
}

/** A run of whole days: its first and last (YYYY-MM-DD), how many, and where a day stands in it (1 first). */
export interface DayRun {
  readonly first: string
  readonly last: string
  readonly length: number
  readonly at: number
}

/**
 * The run of days around `day` in which each day is joined to the next by
 * `joined(earlier, later)` (the same sign, the Moon's elongation still
 * growing), reaching at most `max` days either way.
 */
export function runAround(day: string, joined: (earlier: string, later: string) => boolean, max: number): DayRun {
  const reach = (step: 1 | -1): number => {
    let n = 0
    while (n < max && (step > 0 ? joined(shiftDay(day, n), shiftDay(day, n + 1)) : joined(shiftDay(day, -n - 1), shiftDay(day, -n)))) n++
    return n
  }
  const back = reach(-1)
  const ahead = reach(1)
  return { first: shiftDay(day, -back), last: shiftDay(day, ahead), length: back + ahead + 1, at: back + 1 }
}
