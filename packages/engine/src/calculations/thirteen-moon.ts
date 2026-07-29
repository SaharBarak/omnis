/**
 * 13-Moon (13 × 28) calendar — the Dreamspell year that runs beside the
 * Tzolkin count (#59). Thirteen moons of exactly 28 days from each July 26,
 * plus two days outside the count: July 25 (Day Out of Time) every year, and
 * February 29 (0.0 Hunab Ku) in leap years — the same skipped leap day as
 * dateToKin, so the two counts stay phase-locked by construction.
 */

import { gregorianToJDN, isLeapYear, parseDate } from './julian'

export const MOON_NAMES = [
  'Magnetic', 'Lunar', 'Electric', 'Self-Existing', 'Overtone',
  'Rhythmic', 'Resonant', 'Galactic', 'Solar', 'Planetary',
  'Spectral', 'Crystal', 'Cosmic',
] as const

export const MOON_TOTEMS = [
  'Bat', 'Scorpion', 'Deer', 'Owl', 'Peacock',
  'Lizard', 'Monkey', 'Hawk', 'Jaguar', 'Dog',
  'Serpent', 'Rabbit', 'Turtle',
] as const

/** The 7-day radial week — day names within each moon. */
export const PLASMA_NAMES = [
  'Dali', 'Seli', 'Gamma', 'Kali', 'Alpha', 'Limi', 'Silio',
] as const

export type ThirteenMoonKind = 'day' | 'dayOutOfTime' | 'hunabKu'

export interface ThirteenMoonDate {
  readonly kind: ThirteenMoonKind
  /** 1-13; absent on the two out-of-count days. */
  readonly moon?: number
  /** 1-28 within the moon. */
  readonly dayOfMoon?: number
  readonly moonName?: string
  readonly totem?: string
  /** Radial weekday name, Dali … Silio. */
  readonly plasma?: string
  /** 1-4 within the moon. */
  readonly week?: number
  /** Gregorian year this 13-Moon year began in (on July 26). */
  readonly yearStart: number
  /** e.g. "Magnetic Moon · day 4 · Kali", "Day Out of Time". */
  readonly formatted: string
}

/** The 13-Moon position of a civil date. */
export function thirteenMoonDate(dateStr: string): ThirteenMoonDate {
  const { year, month, day } = parseDate(dateStr)

  if (month === 2 && day === 29) {
    return { kind: 'hunabKu', yearStart: year - 1, formatted: '0.0 Hunab Ku' }
  }
  if (month === 7 && day === 25) {
    return { kind: 'dayOutOfTime', yearStart: year - 1, formatted: 'Day Out of Time' }
  }

  const afterNewYear = month > 7 || (month === 7 && day >= 26)
  const yearStart = afterNewYear ? year : year - 1

  let n = gregorianToJDN(year, month, day) - gregorianToJDN(yearStart, 7, 26)
  // A Feb 29 inside the year window sits outside the count.
  if (!afterNewYear && isLeapYear(year) && month > 2) n -= 1

  const moon = Math.floor(n / 28) + 1
  const dayOfMoon = (n % 28) + 1
  const moonName = MOON_NAMES[moon - 1]
  const totem = MOON_TOTEMS[moon - 1]
  const plasma = PLASMA_NAMES[(dayOfMoon - 1) % 7]
  const week = Math.floor((dayOfMoon - 1) / 7) + 1

  return {
    kind: 'day',
    moon,
    dayOfMoon,
    moonName,
    totem,
    plasma,
    week,
    yearStart,
    formatted: `${moonName} Moon · day ${dayOfMoon} · ${plasma}`,
  }
}

export interface ThirteenMoonCell {
  /** Civil date (YYYY-MM-DD) of this day of the moon. */
  readonly iso: string
  readonly dayOfMoon: number
}

export interface ThirteenMoonMonth {
  readonly moon: number
  readonly moonName: string
  readonly totem: string
  /** Exactly 28 civil dates. */
  readonly days: readonly ThirteenMoonCell[]
}

function isoFromJdnOffset(startIso: string, offset: number): string {
  const d = new Date(`${startIso}T12:00:00Z`)
  return new Date(d.getTime() + offset * 86_400_000).toISOString().split('T')[0]
}

/**
 * The full 13 × 28 grid of the year beginning July 26 of `yearStart`.
 * Out-of-count days (Feb 29, July 25) are excluded — each moon holds exactly
 * the 28 civil dates that carry its days, so a leap year shifts the later
 * moons by one civil day exactly as the calendar does.
 */
export function thirteenMoonYear(yearStart: number): ThirteenMoonMonth[] {
  const startIso = `${yearStart}-07-26`
  const skipsFeb29 = isLeapYear(yearStart + 1)
  const feb29Offset = skipsFeb29
    ? gregorianToJDN(yearStart + 1, 2, 29) - gregorianToJDN(yearStart, 7, 26)
    : -1

  const moons: ThirteenMoonMonth[] = []
  let offset = 0
  for (let m = 1; m <= 13; m++) {
    const days: ThirteenMoonCell[] = []
    for (let d = 1; d <= 28; d++) {
      if (offset === feb29Offset) offset += 1
      days.push({ iso: isoFromJdnOffset(startIso, offset), dayOfMoon: d })
      offset += 1
    }
    moons.push({
      moon: m,
      moonName: MOON_NAMES[m - 1],
      totem: MOON_TOTEMS[m - 1],
      days,
    })
  }
  return moons
}
