/**
 * Moon phase calculations.
 *
 * Phase is derived from the Sun–Moon ecliptic elongation using the same
 * simplified ephemeris that powers the astrology engine, so a natal moon
 * phase for any birth date is consistent with the person's natal chart.
 * Elongation is accurate to a degree or two — far inside the 45° width of
 * a phase octant.
 */
import { Body, Illumination } from 'astronomy-engine'
import { getCurrentPlanetaryPositions } from './astrology'

export const MOON_PHASES = [
  'New Moon',
  'Waxing Crescent',
  'First Quarter',
  'Waxing Gibbous',
  'Full Moon',
  'Waning Gibbous',
  'Last Quarter',
  'Waning Crescent',
] as const

export type MoonPhaseName = (typeof MOON_PHASES)[number]

export interface MoonReading {
  /** Sun→Moon elongation in degrees, 0 = new, 180 = full. */
  readonly angle: number
  readonly phase: MoonPhaseName
  /** Octant index 0-7 into MOON_PHASES. */
  readonly phaseIndex: number
  /** Illuminated fraction 0-1. */
  readonly illumination: number
}

/** The mean synodic month, in days. */
export const SYNODIC_MONTH = 29.530588853

/** Sun→Moon elongation for a calendar date (degrees, 0-360). */
export function getMoonPhaseAngle(date: string): number {
  const positions = getCurrentPlanetaryPositions(date)
  const sun = positions.find((p) => p.planet.id === 'sun')
  const moon = positions.find((p) => p.planet.id === 'moon')
  if (!sun || !moon) return 0
  return ((moon.position.longitude - sun.position.longitude) % 360 + 360) % 360
}

export function angleToPhaseIndex(angle: number): number {
  // Octants centered on the cardinal angles: new spans [-22.5°, 22.5°), etc.
  return Math.floor((((angle + 22.5) % 360) + 360) / 45) % 8
}

/**
 * The Moon's lit fraction at an instant, as seen from the Earth's centre:
 * astronomy-engine's `Illumination` phase fraction, from the phase angle
 * between the Sun and the Earth as seen from the Moon in three dimensions
 * (the Moon's latitude and both distances counted), not from the ecliptic
 * elongation alone.
 */
export const moonIllumination = (at: Date): number => Illumination(Body.Moon, at).phase_fraction

/** The Moon's phase at a Sun–Moon elongation, in degrees, and its lit fraction (`moonIllumination` at the same instant). */
export function moonReadingAt(angle: number, illumination: number): MoonReading {
  const phaseIndex = angleToPhaseIndex(angle)
  return { angle, phase: MOON_PHASES[phaseIndex], phaseIndex, illumination }
}

/** The Moon's reading for a date, at noon UTC, as every daily value is read. */
export function getMoonReading(date: string): MoonReading {
  return moonReadingAt(getMoonPhaseAngle(date), moonIllumination(new Date(`${date}T12:00:00Z`)))
}

export interface Lunation extends MoonReading {
  /** Approximate days until the next full moon. */
  readonly daysToFull: number
  /** Approximate days until the next new moon. */
  readonly daysToNew: number
}

/** Current (or given-date) lunation with countdowns. */
export function getLunation(date: string): Lunation {
  const reading = getMoonReading(date)
  const dayPerDegree = SYNODIC_MONTH / 360
  const toFull = ((180 - reading.angle + 360) % 360) * dayPerDegree
  const toNew = ((360 - reading.angle) % 360) * dayPerDegree
  return { ...reading, daysToFull: toFull, daysToNew: toNew }
}
