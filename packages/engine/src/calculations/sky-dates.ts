/**
 * When the sky next carries a value across a boundary: the Sun into its next
 * signs, tropical or sidereal, onto its next Human Design line and gate,
 * and the Moon to its next quarters. Every longitude comes from the engine's
 * ephemeris (`planetLongitudes`). A crossing is bracketed by whole days at
 * noon UTC, as the day's other values are read, found by bisection, then set
 * on its civil date by one reading at the UTC midnight between the two
 * noons. Angles are compared as signed turns from the boundary, so no
 * boundary is lost where the circle closes (Pisces to Aries, gate 60 to 41,
 * the new Moon at 0°). The Chinese calendar's new Moons and terms, dated in
 * Beijing, are instants (`chinese-calendar.ts`).
 */

import { planetLongitudes } from './astrology'
import { lahiriAyanamsa } from './ayanamsa'
import { daysFrom, firstDay, runAround, shiftDay, type DayRun } from './day-search'
import { SYNODIC_MONTH, type MoonPhaseName } from './moon'
import { GATE_SIZE_DEGREES, LINE_SIZE_DEGREES, MANDALA_SEQUENCE_FULL, wheelDegrees, wheelPlace } from '../data/human-design-gates'
import { ZODIAC_SIGNS } from '../data/zodiac-signs'
import type { PlanetId } from '../types/astrology'

/** Longitudes at a UTC time of a date; `memoSky` reads each instant once. */
export type Sky = (date: string, time: string) => ReadonlyMap<PlanetId, number>

/** A sky that reads each date and time once, for a set of searches over the same days. */
export function memoSky(read: Sky = planetLongitudes): Sky {
  const seen = new Map<string, ReadonlyMap<PlanetId, number>>()
  return (date, time) => {
    const key = `${date}T${time}`
    const found = seen.get(key)
    if (found) return found
    const value = read(date, time)
    seen.set(key, value)
    return value
  }
}

/** A day a value crosses into its next span: its civil date and the whole days to it (0 = later today). */
export interface Crossing {
  readonly date: string
  readonly inDays: number
}

/**
 * A crossing found over noons: also the first day whose noon finds the value
 * past it, the cell a calendar ruled by noons (a lunation, a sign's season)
 * marks it on. It is the crossing's own date, or the day after where the
 * crossing falls after that date's noon.
 */
export interface NoonCrossing extends Crossing {
  readonly noon: string
}

const NOON = '12:00'
const FULL_TURN = 360
const SIGN_DEGREES = FULL_TURN / ZODIAC_SIGNS.length
/** Days either side of a quarter's mean date that hold its true one. */
const QUARTER_SPREAD = 3
/** The Sun's slowest daily motion, near aphelion, in degrees. */
const SUN_SLOWEST = 0.95
/** The longest the Sun takes to cross a span of the circle, in whole days, with a day to spare. */
const sunWithin = (degrees: number): number => Math.ceil(degrees / SUN_SLOWEST) + 1
const SIGN_WITHIN = sunWithin(SIGN_DEGREES)
const GATE_WITHIN = sunWithin(GATE_SIZE_DEGREES)
const LINE_WITHIN = sunWithin(LINE_SIZE_DEGREES)

/** An angle as a signed turn from `boundary`, in (−180, 180]: negative before it, positive past it. */
const signedFrom = (angle: number, boundary: number): number => {
  const d = ((((angle - boundary) % FULL_TURN) + FULL_TURN + 180) % FULL_TURN) - 180
  return d === -180 ? 180 : d
}

/** An angle in [0, 360). */
const turn = (angle: number): number => ((angle % FULL_TURN) + FULL_TURN) % FULL_TURN

/** One angle the sky moves forward through, read at a time of a date. */
export type Reading = (date: string, time: string) => number

/** The UTC midnight between a day's noon and the noon before it. */
const MIDNIGHT = '00:00'

/**
 * The day `read` first reaches `boundary` after `day`'s noon, searched over
 * whole days `from` to `to`, where it starts behind the boundary and moves
 * forward less than half a turn; dated in UTC.
 */
function crossing(day: string, read: Reading, boundary: number, from: number, to: number): NoonCrossing | null {
  const pastAt = (date: string, time: string) => signedFrom(read(date, time), boundary) >= 0
  const after = firstDay(from, to, (offset) => pastAt(shiftDay(day, offset), NOON))
  if (after === null) return null
  const noon = shiftDay(day, after)
  const date = pastAt(noon, MIDNIGHT) ? shiftDay(noon, -1) : noon
  return { date, inDays: daysFrom(day, date), noon }
}

const sunOf = (sky: Sky): Reading => (date, time) => sky(date, time).get('sun') ?? Number.NaN

/** The Sun's longitude in the zodiac a board reads: tropical, or sidereal by the Lahiri ayanamsa. */
export const zodiacSun = (sky: Sky, zodiac: 'tropical' | 'sidereal'): Reading => {
  const sun = sunOf(sky)
  return zodiac === 'tropical' ? sun : (date, time) => turn(sun(date, time) - lahiriAyanamsa(date))
}

/** The next `count` signs the Sun enters after `day`, nearest first, in the tropical or sidereal zodiac: each searched from the last, a sign at a time. */
export function signIngresses(day: string, count: number, zodiac: 'tropical' | 'sidereal' = 'tropical', sky: Sky = memoSky()): readonly (NoonCrossing & { readonly sign: string })[] {
  const read = zodiacSun(sky, zodiac)
  const sign = Math.floor(read(day, NOON) / SIGN_DEGREES)
  const found: (NoonCrossing & { readonly sign: string })[] = []
  for (let i = 0; i < count; i++) {
    const from = found.length > 0 ? found[found.length - 1].inDays : 0
    const entered = (sign + i + 1) % ZODIAC_SIGNS.length
    const next = crossing(day, read, entered * SIGN_DEGREES, from, from + SIGN_WITHIN)
    if (!next) break
    found.push({ ...next, sign: ZODIAC_SIGNS[entered].name })
  }
  return found
}

/** The day the Sun entered the sign it is in at `day`'s noon, on or before `day`, in the tropical or sidereal zodiac. */
export function signEntered(day: string, zodiac: 'tropical' | 'sidereal' = 'tropical', sky: Sky = memoSky()): (NoonCrossing & { readonly sign: string }) | null {
  const read = zodiacSun(sky, zodiac)
  const sign = Math.floor(read(day, NOON) / SIGN_DEGREES)
  const found = crossing(day, read, sign * SIGN_DEGREES, -SIGN_WITHIN, 0)
  return found && { ...found, sign: ZODIAC_SIGNS[sign].name }
}

/**
 * The next day after `day` the Sun reaches `longitude` in the tropical or
 * sidereal zodiac: the start of its next decan, term, nakshatra or pada.
 * Searched over the days the Sun can take to cross the arc ahead.
 */
export function sunArrives(day: string, longitude: number, zodiac: 'tropical' | 'sidereal' = 'tropical', sky: Sky = memoSky()): NoonCrossing | null {
  const read = zodiacSun(sky, zodiac)
  return crossing(day, read, turn(longitude), 0, sunWithin(turn(longitude - read(day, NOON))))
}

/** The days whose noon finds the Sun in the sign it is in at `day`'s noon: the sign's season, in the tropical or sidereal zodiac. */
export function seasonOn(day: string, zodiac: 'tropical' | 'sidereal' = 'tropical', sky: Sky = memoSky()): DayRun {
  const read = zodiacSun(sky, zodiac)
  const sign = (date: string) => Math.floor(read(date, NOON) / SIGN_DEGREES)
  return runAround(day, (earlier, later) => sign(earlier) === sign(later), SIGN_WITHIN)
}

/** The longest lunation in whole days, with a day to spare. */
const LUNATION_WITHIN = Math.ceil(SYNODIC_MONTH) + 1

/** The days of the lunation `day` stands in, each read at noon: from the first noon after a new Moon to the last before the next, the elongation growing throughout. */
export function lunationOn(day: string, sky: Sky = memoSky()): DayRun {
  const elongation = elongationOf(sky)
  return runAround(day, (earlier, later) => elongation(later, NOON) > elongation(earlier, NOON), LUNATION_WITHIN)
}

/** The Sun's next Human Design line and gate after `day`: the line it moves onto (in its gate or the next) and the next gate on the wheel. */
export function gateChanges(
  day: string,
  sky: Sky = memoSky(),
): { readonly line: NoonCrossing & { readonly gate: number; readonly line: number }; readonly gate: NoonCrossing & { readonly gate: number } } | null {
  const sun = sunOf(sky)
  const wheel: Reading = (date, time) => wheelDegrees(sun(date, time))
  const { gateIndex, lineIndex } = wheelPlace(sun(day, NOON))
  const nextLine = crossing(day, wheel, turn((lineIndex + 1) * LINE_SIZE_DEGREES), 0, LINE_WITHIN)
  const nextGate = crossing(day, wheel, turn((gateIndex + 1) * GATE_SIZE_DEGREES), 0, GATE_WITHIN)
  if (!nextLine || !nextGate) return null
  const lines = GATE_SIZE_DEGREES / LINE_SIZE_DEGREES
  const lineAhead = (lineIndex + 1) % (MANDALA_SEQUENCE_FULL.length * lines)
  return {
    line: { ...nextLine, gate: MANDALA_SEQUENCE_FULL[Math.floor(lineAhead / lines)], line: (lineAhead % lines) + 1 },
    gate: { ...nextGate, gate: MANDALA_SEQUENCE_FULL[(gateIndex + 1) % MANDALA_SEQUENCE_FULL.length] },
  }
}

/** The six lines of the gate the Sun is in at `day`'s noon, bottom first: each the day the Sun reaches it, before or after `day`. */
export function gateLines(day: string, sky: Sky = memoSky()): readonly (NoonCrossing & { readonly line: number })[] {
  const sun = sunOf(sky)
  const wheel: Reading = (date, time) => wheelDegrees(sun(date, time))
  const { gateIndex } = wheelPlace(sun(day, NOON))
  const lines = GATE_SIZE_DEGREES / LINE_SIZE_DEGREES
  return Array.from({ length: lines }, (_, i) => {
    const found = crossing(day, wheel, turn(gateIndex * GATE_SIZE_DEGREES + i * LINE_SIZE_DEGREES), -GATE_WITHIN, GATE_WITHIN)
    return found && { ...found, line: i + 1 }
  }).filter((found): found is NoonCrossing & { readonly line: number } => found !== null)
}

/** The Moon's quarters by its elongation from the Sun. */
export const QUARTERS: readonly (readonly [number, MoonPhaseName])[] = [
  [90, 'First Quarter'],
  [180, 'Full Moon'],
  [270, 'Last Quarter'],
  [0, 'New Moon'],
]

/** The Moon's elongation from the Sun: 0 new, 180 full. */
export const elongationOf =
  (sky: Sky): Reading =>
  (date, time) => {
    const at = sky(date, time)
    return turn((at.get('moon') ?? Number.NaN) - (at.get('sun') ?? Number.NaN))
  }

/** The Moon's next arrival at `boundary` (its elongation) after `day`, dated in UTC. */
function nextPhase(day: string, elongation: Reading, boundary: number): NoonCrossing | null {
  const ahead = turn(boundary - elongation(day, NOON)) || FULL_TURN
  /* The mean month only brackets the phase; the ephemeris finds it. */
  const mean = (ahead / FULL_TURN) * SYNODIC_MONTH
  return crossing(day, elongation, boundary, Math.max(0, Math.floor(mean) - QUARTER_SPREAD), Math.ceil(mean) + QUARTER_SPREAD)
}

/** The next day after `day` the Moon reaches `degrees` of elongation from the Sun (a tithi's start, a quarter), dated in UTC. */
export function nextElongation(day: string, degrees: number, sky: Sky = memoSky()): NoonCrossing | null {
  return nextPhase(day, elongationOf(sky), turn(degrees))
}

/** The Moon's next first quarter, full, last quarter and new Moon after `day`, nearest first. */
export function moonQuarters(day: string, sky: Sky = memoSky()): readonly (NoonCrossing & { readonly phase: MoonPhaseName })[] {
  const elongation = elongationOf(sky)
  return QUARTERS.flatMap(([boundary, phase]) => {
    const found = nextPhase(day, elongation, boundary)
    return found ? [{ ...found, phase }] : []
  }).sort((a, b) => a.inDays - b.inDays)
}

/** Every quarter of the Moon whose noon cell falls from `first` to `last` (inclusive), a noon-ruled run, in date order; each `inDays` counted from `day`. */
export function moonQuartersBetween(day: string, first: string, last: string, sky: Sky = memoSky()): readonly (NoonCrossing & { readonly phase: MoonPhaseName })[] {
  const elongation = elongationOf(sky)
  return QUARTERS.flatMap(([boundary, phase]) => {
    const found: (NoonCrossing & { readonly phase: MoonPhaseName })[] = []
    /* A quarter comes round a lunation later, so each search starts the day after the last. */
    for (let from = shiftDay(first, -1); ; ) {
      const next = nextPhase(from, elongation, boundary)
      if (!next || next.noon > last) break
      if (next.noon >= first) found.push({ date: next.date, inDays: daysFrom(day, next.date), noon: next.noon, phase })
      from = shiftDay(next.date, 1)
    }
    return found
  }).sort((a, b) => a.inDays - b.inDays)
}
