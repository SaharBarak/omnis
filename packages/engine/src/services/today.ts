import { dateToKin, kinToSeal, kinToTone } from '../calculations/dreamspell'
import { getCurrentPlanetaryPositions } from '../calculations/astrology'
import { longitudeToGate } from '../data/human-design-gates'
import { SEALS } from '../data/seals'
import { TONES } from '../data/tones'

/**
 * "Today, across the systems" — the split-flap board values (homepage set
 * piece, mobile Today screen, live footer line). Pure and runtime-agnostic;
 * the Hebrew date needs Intl calendar support and degrades to null where
 * the runtime lacks it (some Hermes builds).
 */

export interface TodayAcrossSystems {
  readonly kin: string
  readonly moon: string
  readonly sun: string
  /** e.g. "Gate 52.4" — HD gate.line of today's Sun. */
  readonly gate: string
  /** e.g. "17 Tammuz 5786", or null when the runtime lacks the calendar. */
  readonly hebrewDate: string | null
}

const SYNODIC_MONTH = 29.530588853
/** New moon reference: 2000-01-06 18:14 UTC. */
const NEW_MOON_EPOCH_MS = Date.UTC(2000, 0, 6, 18, 14)

const MOON_PHASES = [
  'New Moon',
  'Waxing Crescent',
  'First Quarter',
  'Waxing Gibbous',
  'Full Moon',
  'Waning Gibbous',
  'Last Quarter',
  'Waning Crescent',
] as const

export function moonPhase(date: Date): string {
  const days = (date.getTime() - NEW_MOON_EPOCH_MS) / 86_400_000
  const cycle = ((days % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH
  const index = Math.floor((cycle / SYNODIC_MONTH) * 8 + 0.5) % 8
  return MOON_PHASES[index]
}

export function hebrewDate(date: Date): string | null {
  try {
    return new Intl.DateTimeFormat('en-u-ca-hebrew', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)
  } catch {
    return null
  }
}

interface SunNow {
  sign: string
  degree: number
  gate: number
  line: number
}

/** Real ephemeris sun (sign, degree, HD gate.line) — not date-table zodiac. */
export function sunNow(dateStr: string): SunNow {
  const positions = getCurrentPlanetaryPositions(dateStr)
  const sun = positions.find((p) => p.planet.id === 'sun')
  if (!sun) throw new Error('ephemeris returned no sun')
  const { gate, line } = longitudeToGate(sun.position.longitude)
  return {
    sign: sun.position.sign.name,
    degree: sun.position.degree,
    gate,
    line,
  }
}

export function getTodayAcrossSystems(now: Date = new Date()): TodayAcrossSystems {
  const dateStr = now.toISOString().split('T')[0]
  const kin = dateToKin(dateStr)
  const seal = SEALS.find((s) => s.number === kinToSeal(kin))
  const tone = TONES.find((t) => t.number === kinToTone(kin))
  const sun = sunNow(dateStr)

  return {
    kin: `Kin ${kin} · ${tone?.name ?? ''} ${seal?.english ?? ''}`.trim(),
    moon: moonPhase(now),
    sun: `Sun ${sun.degree}° ${sun.sign}`,
    gate: `Gate ${sun.gate}.${sun.line}`,
    hebrewDate: hebrewDate(now),
  }
}
