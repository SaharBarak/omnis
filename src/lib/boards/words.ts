/**
 * How a board says a date (BENTO_V2.md "Rows open their calendar's board"):
 * one set of words for the server that writes a cell's readout and the
 * client that writes when something comes next. Civil dates are read at
 * noon UTC, as the engine dated them. Client safe.
 */

const at = (date: string): Date => new Date(`${date}T12:00:00Z`)

const DAY = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
const DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const MONTH = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' })
const MONTH_YEAR = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
const WEEKDAY = new Intl.DateTimeFormat('en-GB', { weekday: 'long', timeZone: 'UTC' })
const MS_PER_DAY = 24 * 60 * 60 * 1000

/** "Tue 17 Nov". */
export const dayWords = (date: string): string => DAY.format(at(date))

/** A date `inDays` from the board's day: "Tue 17 Nov" within the day's year, "Tue 7 Sept 2032" past it. */
export const whenWords = (date: string, inDays: number): string => {
  const then = at(date)
  const from = new Date(then.getTime() - inDays * MS_PER_DAY)
  const day = DAY.format(then)
  return then.getUTCFullYear() === from.getUTCFullYear() ? day : `${day} ${then.getUTCFullYear()}`
}

/** "22 Nov". */
export const dateWords = (date: string): string => DATE.format(at(date))

/** "Nov". */
export const monthShort = (date: string): string => MONTH.format(at(date))

/** "November 2026". */
export const monthWords = (date: string): string => MONTH_YEAR.format(at(date))

/** "Sunday". */
export const weekdayWords = (date: string): string => WEEKDAY.format(at(date))

/** Whole days from the board's day, as said: "today", "tomorrow", "in 9 days", "yesterday", "3 days ago". */
export const fromToday = (n: number): string =>
  n === 0 ? 'today' : n === 1 ? 'tomorrow' : n === -1 ? 'yesterday' : n > 0 ? `in ${n} days` : `${-n} days ago`
