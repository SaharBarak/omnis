import { asSeal, asTone, type SealNumber, type ToneNumber } from '../core/types'
import { gregorianToJDN, parseDate } from './julian'
import { KINS, kinOf } from './harmonic-module'
import type { TzolkinDay } from '../types/tzolkin'
import { TZOLKIN_SIGNS, getTzolkinSign } from '../data/tzolkin-signs'

/**
 * The GMT correlation (Goodman–Martínez–Thompson, 584283): the Julian Day
 * Number of the era base 13.0.0.0.0 4 Ajaw 8 Kumk'u, so that 13.0.0.0.0
 * fell on 21 December 2012. Every Maya count here is read from it.
 */
export const GMT_CORRELATION = 584283

/** The era base's Tzolk'in day, 4 Ajaw: every inscription's creation date. */
const BASE_TONE = 4
const BASE_SIGN = TZOLKIN_SIGNS.length

/** The Tzolk'in's days, twenty signs meshed with thirteen numbers, and a trecena's, a run of the numbers from 1. */
export const TZOLKIN_DAYS = KINS
export const TRECENA_DAYS = TZOLKIN_DAYS / TZOLKIN_SIGNS.length
const TONES = TRECENA_DAYS

const mod = (n: number, m: number): number => ((n % m) + m) % m

/** Days from the era base to a civil date (YYYY-MM-DD): the Long Count's day number. */
export function daysSinceEraBase(dateStr: string): number {
  const { year, month, day } = parseDate(dateStr)
  return gregorianToJDN(year, month, day) - GMT_CORRELATION
}

/** The Tzolk'in day `days` after the era base (before it, where negative): the number and the day sign each step by one a day. */
export function tzolkinOfDays(days: number): TzolkinDay {
  return {
    daySign: getTzolkinSign(mod(BASE_SIGN - 1 + days, TZOLKIN_SIGNS.length) + 1),
    tone: mod(BASE_TONE - 1 + days, TONES) + 1,
  }
}

export function dateToTzolkin(dateStr: string): TzolkinDay {
  return tzolkinOfDays(daysSinceEraBase(dateStr))
}

/**
 * A Tzolk'in day's place in the 260, 1 Imix first and 13 Ajaw last: the one
 * day that is both its number and its sign (the count Dreamspell numbers its
 * kins by, `kinOf`).
 */
export const tzolkinPosition = ({ daySign, tone }: TzolkinDay): number => kinOf(daySign.number, tone)

/** The first day of a day's trecena, its thirteen days from a 1: as many days back as its number is past one. */
export const trecenaStart = (days: number): number => days - (tzolkinOfDays(days).tone - 1)

export function getTzolkinSealNumber(dateStr: string): SealNumber {
  const { daySign } = dateToTzolkin(dateStr)
  return asSeal(daySign.number)
}

export function getTzolkinTone(dateStr: string): ToneNumber {
  const { tone } = dateToTzolkin(dateStr)
  return asTone(tone)
}
