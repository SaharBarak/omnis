// Synastry (Relationship) Compatibility for Pleiad
// Compares two natal charts and produces a bilingual 0-100 compatibility score
// based on cross-aspects between key planets and Sun-sign element harmony.
//
// Pure, deterministic, side-effect free. Mirrors the style of
// services/compatibility.ts (score 0-100, bilingual connections[]).

import type { Element, PlanetId } from '../types/astrology'
import { calculateNatalChart } from '../calculations/astrology'

// ============================================================================
// PUBLIC TYPES
// ============================================================================

/**
 * Minimal birth input for a synastry comparison.
 * Location is optional: planet longitudes depend on date/time, not place.
 */
export interface SynastryInput {
  readonly birthDate: string // ISO date (YYYY-MM-DD)
  readonly birthTime?: string | null // HH:MM local time, optional
  readonly latitude?: number | null
  readonly longitude?: number | null
}

/** Classification of a detected cross-aspect's nature. */
export type SynastryHarmony = 'harmonious' | 'challenging'

/** Major aspect names we detect in synastry. */
export type SynastryAspect =
  | 'conjunction'
  | 'sextile'
  | 'square'
  | 'trine'
  | 'opposition'

/** A single detected connection between the two charts. */
export interface SynastryConnection {
  readonly type: 'cross-aspect' | 'element'
  readonly planet1: PlanetId | null
  readonly planet2: PlanetId | null
  readonly aspect: SynastryAspect | null
  readonly harmony: SynastryHarmony
  readonly description: string
  readonly descriptionHebrew: string
}

/** Result of a synastry compatibility calculation. */
export interface SynastryCompatibility {
  readonly score: number // 0-100
  readonly connections: readonly SynastryConnection[]
  readonly sunElement1: Element | null
  readonly sunElement2: Element | null
  readonly available: boolean
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Key planets compared across the two charts. */
const KEY_PLANETS: readonly PlanetId[] = [
  'sun',
  'moon',
  'venus',
  'mars',
  'mercury',
  'jupiter',
]

interface AspectDef {
  readonly name: SynastryAspect
  readonly angle: number
  readonly orb: number
  readonly harmony: SynastryHarmony
  readonly baseScore: number // points awarded for an exact (orb 0) hit
}

/** Major aspects with their orbs and harmony classification. */
const ASPECT_DEFS: readonly AspectDef[] = [
  { name: 'conjunction', angle: 0, orb: 8, harmony: 'harmonious', baseScore: 10 },
  { name: 'sextile', angle: 60, orb: 4, harmony: 'harmonious', baseScore: 6 },
  { name: 'square', angle: 90, orb: 6, harmony: 'challenging', baseScore: 4 },
  { name: 'trine', angle: 120, orb: 8, harmony: 'harmonious', baseScore: 10 },
  { name: 'opposition', angle: 180, orb: 8, harmony: 'challenging', baseScore: 5 },
]

/**
 * Relationship-significant planet pairs (order-independent) get a weight
 * multiplier — the classic attraction / bonding pairs.
 */
const PAIR_WEIGHTS: ReadonlyArray<readonly [PlanetId, PlanetId, number]> = [
  ['sun', 'moon', 2.0], // core identity <-> emotional core
  ['venus', 'mars', 2.0], // attraction / chemistry
  ['sun', 'venus', 1.5], // identity <-> affection
  ['moon', 'venus', 1.5], // emotional bonding
]

/** Hebrew names for the key planets used in connection descriptions. */
const PLANET_HEBREW: Readonly<Record<PlanetId, string>> = {
  sun: 'שמש',
  moon: 'ירח',
  mercury: 'כוכב חמה',
  venus: 'נוגה',
  mars: 'מאדים',
  jupiter: 'צדק',
  saturn: 'שבתאי',
  uranus: 'אורנוס',
  neptune: 'נפטון',
  pluto: 'פלוטו',
  northNode: 'ראש הדרקון',
  southNode: 'זנב הדרקון',
  lilith: 'לילית',
}

/** English title-case names for the key planets. */
const PLANET_NAME: Readonly<Record<PlanetId, string>> = {
  sun: 'Sun',
  moon: 'Moon',
  mercury: 'Mercury',
  venus: 'Venus',
  mars: 'Mars',
  jupiter: 'Jupiter',
  saturn: 'Saturn',
  uranus: 'Uranus',
  neptune: 'Neptune',
  pluto: 'Pluto',
  northNode: 'North Node',
  southNode: 'South Node',
  lilith: 'Lilith',
}

const ASPECT_HEBREW: Readonly<Record<SynastryAspect, string>> = {
  conjunction: 'צמידות',
  sextile: 'משושה',
  square: 'ריבוע',
  trine: 'משולש',
  opposition: 'ניגוד',
}

const ASPECT_NAME: Readonly<Record<SynastryAspect, string>> = {
  conjunction: 'Conjunction',
  sextile: 'Sextile',
  square: 'Square',
  trine: 'Trine',
  opposition: 'Opposition',
}

// ============================================================================
// ELEMENT HARMONY
// ============================================================================

/**
 * Classify the relationship between two elements:
 *  - 'same'       identical element (strong resonance)
 *  - 'compatible' fire+air or earth+water (natural flow)
 *  - 'clashing'   fire+water or earth+air (friction)
 *  - 'neutral'    any other mixed pairing
 */
function classifyElements(
  a: Element,
  b: Element
): 'same' | 'compatible' | 'clashing' | 'neutral' {
  if (a === b) return 'same'

  const pair = new Set([a, b])
  const isPair = (x: Element, y: Element): boolean => pair.has(x) && pair.has(y)

  if (isPair('fire', 'air') || isPair('earth', 'water')) return 'compatible'
  if (isPair('fire', 'water') || isPair('earth', 'air')) return 'clashing'

  return 'neutral'
}

// ============================================================================
// ANGULAR MATH
// ============================================================================

/** Smallest angular separation between two ecliptic longitudes (0-180). */
function angularSeparation(lon1: number, lon2: number): number {
  let diff = Math.abs(lon1 - lon2) % 360
  if (diff > 180) diff = 360 - diff
  return diff
}

/** Returns the matching aspect definition within orb, or null. */
function matchAspect(separation: number): { def: AspectDef; orb: number } | null {
  for (const def of ASPECT_DEFS) {
    const orb = Math.abs(separation - def.angle)
    if (orb <= def.orb) {
      return { def, orb }
    }
  }
  return null
}

/** Lookup the weight multiplier for a planet pair (order-independent). */
function pairWeight(p1: PlanetId, p2: PlanetId): number {
  for (const [a, b, w] of PAIR_WEIGHTS) {
    if ((a === p1 && b === p2) || (a === p2 && b === p1)) return w
  }
  return 1.0
}

// ============================================================================
// CHART BUILDING
// ============================================================================

/**
 * Build a natal chart from a SynastryInput.
 * Location defaults to (0, 0) when missing — planet longitudes depend on
 * date/time, not place, so Sun/planets stay valid. Time is passed only if
 * present (Moon is precise only with a birth time).
 * Returns null if the chart cannot be computed.
 */
function buildChart(input: SynastryInput): ReturnType<typeof calculateNatalChart> | null {
  if (!input.birthDate) return null

  try {
    const chart = calculateNatalChart({
      date: input.birthDate,
      time: input.birthTime ?? undefined,
      latitude: input.latitude ?? 0,
      longitude: input.longitude ?? 0,
    })

    // Guard: a usable chart must at least have the Sun positioned.
    const hasSun = chart.planets.some((p) => p.planet.id === 'sun')
    return hasSun ? chart : null
  } catch {
    return null
  }
}

/** Build a quick lookup of planetId -> ecliptic longitude. */
function longitudeMap(
  chart: ReturnType<typeof calculateNatalChart>
): Map<PlanetId, number> {
  const map = new Map<PlanetId, number>()
  for (const p of chart.planets) {
    map.set(p.planet.id, p.position.longitude)
  }
  return map
}

// ============================================================================
// CONNECTION BUILDERS
// ============================================================================

function buildAspectConnection(
  p1: PlanetId,
  p2: PlanetId,
  def: AspectDef
): SynastryConnection {
  const en1 = PLANET_NAME[p1]
  const en2 = PLANET_NAME[p2]
  const he1 = PLANET_HEBREW[p1]
  const he2 = PLANET_HEBREW[p2]
  const aspectEn = ASPECT_NAME[def.name]
  const aspectHe = ASPECT_HEBREW[def.name]

  const harmonyEn = def.harmony === 'harmonious' ? 'flowing' : 'dynamic'
  const harmonyHe = def.harmony === 'harmonious' ? 'הרמוני וזורם' : 'דינמי ומאתגר'

  return {
    type: 'cross-aspect',
    planet1: p1,
    planet2: p2,
    aspect: def.name,
    harmony: def.harmony,
    description: `${en1} ${aspectEn} ${en2} — a ${harmonyEn} connection`,
    descriptionHebrew: `${he1} ב${aspectHe} ל${he2} — חיבור ${harmonyHe}`,
  }
}

function buildElementConnection(
  kind: 'same' | 'compatible' | 'clashing',
  e1: Element,
  e2: Element
): SynastryConnection {
  const ELEMENT_EN: Record<Element, string> = {
    fire: 'Fire',
    earth: 'Earth',
    air: 'Air',
    water: 'Water',
  }
  const ELEMENT_HE: Record<Element, string> = {
    fire: 'אש',
    earth: 'אדמה',
    air: 'אוויר',
    water: 'מים',
  }

  if (kind === 'same') {
    return {
      type: 'element',
      planet1: null,
      planet2: null,
      aspect: null,
      harmony: 'harmonious',
      description: `Shared ${ELEMENT_EN[e1]} element — instinctive understanding`,
      descriptionHebrew: `יסוד ${ELEMENT_HE[e1]} משותף — הבנה אינסטינקטיבית`,
    }
  }

  if (kind === 'compatible') {
    return {
      type: 'element',
      planet1: null,
      planet2: null,
      aspect: null,
      harmony: 'harmonious',
      description: `${ELEMENT_EN[e1]} and ${ELEMENT_EN[e2]} elements complement each other`,
      descriptionHebrew: `יסודות ${ELEMENT_HE[e1]} ו${ELEMENT_HE[e2]} משלימים זה את זה`,
    }
  }

  return {
    type: 'element',
    planet1: null,
    planet2: null,
    aspect: null,
    harmony: 'challenging',
    description: `${ELEMENT_EN[e1]} and ${ELEMENT_EN[e2]} elements create friction`,
    descriptionHebrew: `יסודות ${ELEMENT_HE[e1]} ו${ELEMENT_HE[e2]} יוצרים חיכוך`,
  }
}

// ============================================================================
// MAIN CALCULATION
// ============================================================================

const BASE_SCORE = 20
const ELEMENT_SAME_BONUS = 12
const ELEMENT_COMPATIBLE_BONUS = 8
const ELEMENT_CLASH_PENALTY = 6

/**
 * Scoring model
 * ─────────────
 *   base                      20
 *   + harmonious cross-aspect  baseScore * pairWeight * (1 - orb/maxOrb)
 *   + challenging cross-aspect  small growth credit (~25% of its baseScore,
 *                               weighted) — productive tension, not free points
 *   + element harmony          +12 same / +8 compatible / -6 clashing
 *   clamped to [0, 100]
 */
export function calculateSynastryCompatibility(
  p1: SynastryInput,
  p2: SynastryInput
): SynastryCompatibility {
  const chart1 = buildChart(p1)
  const chart2 = buildChart(p2)

  if (!chart1 || !chart2) {
    return {
      score: 0,
      connections: [],
      sunElement1: null,
      sunElement2: null,
      available: false,
    }
  }

  const lon1 = longitudeMap(chart1)
  const lon2 = longitudeMap(chart2)

  const connections: SynastryConnection[] = []
  let score = BASE_SCORE

  // Cross-aspects: every key planet of person 1 vs every key planet of person 2.
  for (const planetA of KEY_PLANETS) {
    const a = lon1.get(planetA)
    if (a === undefined) continue

    for (const planetB of KEY_PLANETS) {
      const b = lon2.get(planetB)
      if (b === undefined) continue

      const separation = angularSeparation(a, b)
      const match = matchAspect(separation)
      if (!match) continue

      const { def, orb } = match
      const weight = pairWeight(planetA, planetB)
      // Tighter orb -> closer to full baseScore.
      const tightness = 1 - orb / def.orb

      if (def.harmony === 'harmonious') {
        score += def.baseScore * weight * tightness
      } else {
        // Challenging aspects grant a small "growth" credit only.
        score += def.baseScore * weight * tightness * 0.25
      }

      connections.push(buildAspectConnection(planetA, planetB, def))
    }
  }

  // Sun-sign element compatibility.
  const e1 = chart1.sunSign.element
  const e2 = chart2.sunSign.element
  const elementKind = classifyElements(e1, e2)

  if (elementKind === 'same') {
    score += ELEMENT_SAME_BONUS
    connections.push(buildElementConnection('same', e1, e2))
  } else if (elementKind === 'compatible') {
    score += ELEMENT_COMPATIBLE_BONUS
    connections.push(buildElementConnection('compatible', e1, e2))
  } else if (elementKind === 'clashing') {
    score -= ELEMENT_CLASH_PENALTY
    connections.push(buildElementConnection('clashing', e1, e2))
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)))

  return {
    score: finalScore,
    connections,
    sunElement1: e1,
    sunElement2: e2,
    available: true,
  }
}
