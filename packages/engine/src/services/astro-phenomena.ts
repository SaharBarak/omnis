import { getCurrentPlanetaryPositions, calculateNatalChart } from '../calculations/astrology'
import { getLunation, type MoonPhaseName } from '../calculations/moon'
import { getPlanetById } from '../data/planets'
import type { PlanetId } from '../types/astrology'

/**
 * Daily astronomical phenomena for a calendar date — moon phase, active
 * retrogrades, notable same-day aspects, and day-over-day transitions
 * (a planet stationing retrograde, changing sign, or the moon reaching a
 * cardinal phase). Built entirely from the existing ephemeris functions; no
 * new astronomy. Feeds the daily-kin email, the digest, and the mobile push.
 *
 * Not covered (need dedicated astronomy, deliberately out of scope): eclipses,
 * exact next-new/next-full calendar dates, and personal transit-to-natal.
 */

/** The eight true bodies that can be meaningfully "retrograde" (nodes excluded). */
const RETROGRADE_BODIES: readonly PlanetId[] = [
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
]

/** Greenwich noon — the mundane reference for same-day planetary aspects. */
const MUNDANE_LAT = 51.4772
const MUNDANE_LON = -0.0005
const MUNDANE_TIME = '12:00'

/** Only surface tight, major aspects — the ones worth a sentence. */
const ASPECT_MAX_ORB = 3

export interface AstroMoon {
  readonly phase: MoonPhaseName
  /** Illuminated fraction, 0-1. */
  readonly illumination: number
  readonly daysToFull: number
  readonly daysToNew: number
}

export interface AstroRetrograde {
  readonly planet: string
  readonly symbol: string
}

export interface AstroAspect {
  readonly planet1: string
  readonly planet2: string
  readonly aspect: string
  readonly nature: 'major-hard' | 'major-soft'
  readonly orb: number
}

export type AstroTransitionKind =
  | 'retrograde-begins'
  | 'retrograde-ends'
  | 'sign-ingress'
  | 'moon-phase'

export interface AstroTransition {
  readonly kind: AstroTransitionKind
  /** Human phrase, e.g. "Mercury stations retrograde", "Venus enters Leo". */
  readonly detail: string
}

export interface AstroPhenomena {
  readonly date: string
  readonly moon: AstroMoon
  readonly sun: { readonly sign: string; readonly formatted: string }
  readonly retrogrades: readonly AstroRetrograde[]
  readonly aspects: readonly AstroAspect[]
  /** Day-over-day changes vs the previous date (the newsworthy events). */
  readonly transitions: readonly AstroTransition[]
  /** One-line human summary for a push notification or email preheader. */
  readonly summary: string
}

/** Shift a YYYY-MM-DD date by whole days in UTC. */
function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function planetName(id: PlanetId): string {
  return getPlanetById(id).name
}

/** Compute the day-over-day transitions between the previous date and this one. */
function computeTransitions(date: string): AstroTransition[] {
  const prev = shiftDate(date, -1)
  const transitions: AstroTransition[] = []

  const todayPositions = getCurrentPlanetaryPositions(date)
  const prevPositions = getCurrentPlanetaryPositions(prev)
  const prevById = new Map(prevPositions.map((p) => [p.planet.id, p]))

  for (const position of todayPositions) {
    if (!RETROGRADE_BODIES.includes(position.planet.id)) continue
    const before = prevById.get(position.planet.id)
    if (before === undefined) continue

    if (!before.retrograde && position.retrograde) {
      transitions.push({
        kind: 'retrograde-begins',
        detail: `${position.planet.name} stations retrograde`,
      })
    } else if (before.retrograde && !position.retrograde) {
      transitions.push({
        kind: 'retrograde-ends',
        detail: `${position.planet.name} stations direct`,
      })
    }

    if (before.position.sign.id !== position.position.sign.id) {
      transitions.push({
        kind: 'sign-ingress',
        detail: `${position.planet.name} enters ${position.position.sign.name}`,
      })
    }
  }

  // Only the four cardinal phases are newsworthy (New, First Quarter, Full,
  // Last Quarter = octants 0/2/4/6); crossing into a crescent/gibbous isn't.
  const todayMoon = getLunation(date)
  const prevMoon = getLunation(prev)
  const CARDINAL_PHASES = [0, 2, 4, 6]
  if (
    todayMoon.phaseIndex !== prevMoon.phaseIndex &&
    CARDINAL_PHASES.includes(todayMoon.phaseIndex)
  ) {
    transitions.push({
      kind: 'moon-phase',
      detail: `Moon reaches ${todayMoon.phase}`,
    })
  }

  return transitions
}

export function getDailyAstroPhenomena(date: string): AstroPhenomena {
  const lunation = getLunation(date)
  const positions = getCurrentPlanetaryPositions(date)

  const sunPosition = positions.find((p) => p.planet.id === 'sun')
  const sun = {
    sign: sunPosition?.position.sign.name ?? 'Unknown',
    formatted: sunPosition?.position.formatted ?? '',
  }

  const retrogrades: AstroRetrograde[] = positions
    .filter((p) => p.retrograde && RETROGRADE_BODIES.includes(p.planet.id))
    .map((p) => ({ planet: p.planet.name, symbol: p.planet.symbol }))

  const chart = calculateNatalChart({
    date,
    latitude: MUNDANE_LAT,
    longitude: MUNDANE_LON,
    time: MUNDANE_TIME,
  })
  const aspects: AstroAspect[] = chart.aspects
    .filter((a) => a.aspect.nature.startsWith('major') && a.orb <= ASPECT_MAX_ORB)
    .map((a) => ({
      planet1: planetName(a.planet1),
      planet2: planetName(a.planet2),
      aspect: a.aspect.name,
      nature: a.aspect.nature as 'major-hard' | 'major-soft',
      orb: Math.round(a.orb * 10) / 10,
    }))

  const transitions = computeTransitions(date)

  return {
    date,
    moon: {
      phase: lunation.phase,
      illumination: Math.round(lunation.illumination * 100) / 100,
      daysToFull: Math.round(lunation.daysToFull),
      daysToNew: Math.round(lunation.daysToNew),
    },
    sun,
    retrogrades,
    aspects,
    transitions,
    summary: buildSummary(lunation.phase, lunation.illumination, retrogrades, sun.sign, transitions),
  }
}

/** A single legible line for a push body or email preheader. */
function buildSummary(
  phase: MoonPhaseName,
  illumination: number,
  retrogrades: readonly AstroRetrograde[],
  sunSign: string,
  transitions: readonly AstroTransition[],
): string {
  const parts: string[] = []

  // Transitions lead — they're the news of the day.
  for (const t of transitions) parts.push(t.detail)

  const lit = Math.round(illumination * 100)
  parts.push(`${phase} (${lit}% lit)`)

  if (retrogrades.length > 0) {
    const names = retrogrades.map((r) => r.planet).join(', ')
    parts.push(`${names} retrograde`)
  }

  parts.push(`Sun in ${sunSign}`)

  return parts.join(' · ')
}
