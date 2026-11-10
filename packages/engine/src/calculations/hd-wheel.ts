/**
 * When the Sun next enters a gate of the Rave Mandala, and the two turns of
 * the Human Design year it marks: the Rave New Year, the Sun's return to
 * gate 41 at 2° Aquarius, and the next quarter of the mandala, opened at its
 * Sphinx gate. Built on `gateChanges`, the one rule for the Sun crossing
 * into its next gate: the search skips the days the Sun cannot cover the
 * arc in, then follows the Sun gate by gate.
 */

import { daysFrom, shiftDay } from './day-search'
import { gateChanges, memoSky, type NoonCrossing, type Sky } from './sky-dates'
import { GATE_SIZE_DEGREES, MANDALA_SEQUENCE_FULL, wheelDegrees, wheelPlace } from '../data/human-design-gates'
import { MANDALA_QUARTERS, quarterGates, quarterOfGate, type MandalaQuarter } from '../data/human-design'

const NOON = '12:00'
const FULL_TURN = 360

/** The mean tropical year, in days (Meeus, *Astronomical Algorithms*, 2nd ed., ch. 27). */
const TROPICAL_YEAR = 365.24219
/** The eccentricity of the Earth's orbit, J2000 (Meeus, ch. 25). */
const EARTH_ECCENTRICITY = 0.0167086

/**
 * The Sun's fastest apparent motion, in degrees a day, at perihelion: by
 * Kepler's second law, the mean motion times (1 + e)² / (1 − e²)^(3/2),
 * about 1.019° a day.
 */
const SUN_FASTEST = ((FULL_TURN / TROPICAL_YEAR) * (1 + EARTH_ECCENTRICITY) ** 2) / (1 - EARTH_ECCENTRICITY ** 2) ** 1.5

/**
 * The day the Sun next enters `gate` after `day`'s noon, a turn on where it
 * stands in the gate at that noon: the crossing's civil date in UTC, the
 * whole days to it, and the first noon past it.
 */
export function sunEntersGate(day: string, gate: number, sky: Sky = memoSky()): (NoonCrossing & { readonly gate: number }) | null {
  const index = MANDALA_SEQUENCE_FULL.indexOf(gate)
  if (index === -1) return null
  const sun = sky(day, NOON).get('sun')
  if (sun === undefined) return null
  const ahead = (index * GATE_SIZE_DEGREES - wheelDegrees(sun) + FULL_TURN) % FULL_TURN || FULL_TURN
  /* At its fastest the Sun covers less than the arc in these days, so the gate is still ahead at their last noon. */
  let from = shiftDay(day, Math.max(0, Math.floor(ahead / SUN_FASTEST) - 1))
  for (let step = 0; step < MANDALA_SEQUENCE_FULL.length; step++) {
    const next = gateChanges(from, sky)?.gate
    if (!next) return null
    if (next.gate === gate) return { date: next.date, inDays: daysFrom(day, next.date), noon: next.noon, gate }
    from = next.noon
  }
  return null
}

/** The next Rave New Year after `day`: the Sun's return to gate 41, where the mandala and the Human Design year begin (about 22 January). */
export const raveNewYear = (day: string, sky: Sky = memoSky()): (NoonCrossing & { readonly gate: number }) | null => sunEntersGate(day, MANDALA_SEQUENCE_FULL[0], sky)

/** The quarter of the mandala the Sun reaches next after the one it is in at `day`'s noon, and the day it enters its Sphinx gate. */
export function nextQuarter(day: string, sky: Sky = memoSky()): (NoonCrossing & { readonly quarter: MandalaQuarter }) | null {
  const sun = sky(day, NOON).get('sun')
  if (sun === undefined) return null
  const now = quarterOfGate(wheelPlace(sun).gate)
  if (!now) return null
  const quarter = MANDALA_QUARTERS[(MANDALA_QUARTERS.indexOf(now) + 1) % MANDALA_QUARTERS.length]
  const found = sunEntersGate(day, quarterGates(quarter)[0], sky)
  return found && { date: found.date, inDays: found.inDays, noon: found.noon, quarter }
}
