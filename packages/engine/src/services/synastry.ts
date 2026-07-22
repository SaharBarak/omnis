// Synastry (Relationship) Compatibility for Pleiad
// Compares two natal charts and produces a bilingual 0-100 compatibility score
// plus a set of typed connections between the charts.
//
// ── Why this file is shaped the way it is ────────────────────────────────────
// With standard synastry orbs any two planets are in aspect ~27% of the time,
// so ~27 inter-aspects exist between ANY two charts: the *existence* of a
// cross-aspect carries zero information (measured: fires on 100% of random
// pairs). The discriminating contacts are the RARE ones, and they are what a
// caller should rank and draw.
//
// Base rates below are MEASURED over 780 random pairs (40 synthetic people with
// full birth data). "per tie" is the rate of one SPECIFIC contact — that is the
// surprisal that licenses drawing an edge. "any" is the rate at which the type
// fires at all, which is not a finding:
//
//   tie                     per tie     any      tier
//   double-whammy           6-11%      73.6%     T3   the best discriminator
//   tight-aspect            ~2.8%      83.1%     T2   <= 1° orb; tightness IS the signal
//   vertex-contact             —        5.8%     T3   the "fated" point
//   node-axis-integration      —        7.8%     T3   structural integration
//   stellium-overlay (4+)      —        7.4%     T2   (5+ → T3; measured 0.1%)
//   stellium-overlay (3)       —       60.6%     T1   see the note on that builder
//   node-contact               —       28.1%     T1   (T2 when <= 1°)
//   angle-contact              —       49.7%     T1   (T2 when <= 1°)
//   house-overlay            ~8%      100.0%     T1   asymmetric — computed both ways
//   cross-aspect            ~27%      100.0%     T0   says nothing
//   element                    —       76.4%     T0   background, not a finding
//
// ── The never-fabricate rule ─────────────────────────────────────────────────
// Anything that needs data we do not have emits NOTHING. It never falls back to
// a default:
//   • Houses / angles / Vertex require the owner's exact birth TIME *and* PLACE.
//   • The Moon moves 12-15°/day, so a noon default carries up to ±7° error —
//     wider than every orb here. Every new tie that involves a Moon is
//     suppressed unless that Moon's owner supplied a birth time. That includes
//     the Sun–Moon double whammy.
//   • The Vertex is unstable above |lat| 66° and is null there.
//
// Pure, deterministic, side-effect free. Mirrors the style of
// services/compatibility.ts (score 0-100, bilingual connections[]).

import type { Element, NatalChart, PlanetId } from '../types/astrology'
import { calculateNatalChart } from '../calculations/astrology'

// ============================================================================
// PUBLIC TYPES
// ============================================================================

/**
 * Minimal birth input for a synastry comparison.
 * Time and location are optional — but every tie that depends on them is
 * suppressed when they are absent.
 */
export interface SynastryInput {
  readonly birthDate: string // ISO date (YYYY-MM-DD)
  readonly birthTime?: string | null // HH:MM local time, optional
  readonly latitude?: number | null
  readonly longitude?: number | null
}

/** Classification of a detected contact's nature. */
export type SynastryHarmony = 'harmonious' | 'challenging'

/** Major aspect names we detect in synastry. */
export type SynastryAspect =
  | 'conjunction'
  | 'sextile'
  | 'square'
  | 'trine'
  | 'opposition'

/** The four chart angles. */
export type SynastryAngle = 'ascendant' | 'descendant' | 'midheaven' | 'imumCoeli'

/** Every kind of tie the service can emit. */
export type SynastryConnectionType =
  | 'cross-aspect' // T0 — fires on ~100% of pairs. Background, never a headline.
  | 'element' // T0
  | 'house-overlay' // T1 — asymmetric, needs the house owner's time + place
  | 'node-contact' // T1/T2
  | 'angle-contact' // T1/T2 — needs the angle owner's time + place
  | 'tight-aspect' // T2 — cross-aspect within 1°
  | 'double-whammy' // T3 — reciprocal contact of the same planet pair
  | 'node-axis-integration' // T3
  | 'vertex-contact' // T3
  | 'stellium-overlay' // T3

/**
 * Surprisal tier (see docs/redesign/CONNECTION_ATLAS.md §1).
 *  T0 ~100%  structural — never an edge
 *  T1 20-75% common     — detail panel only
 *  T2 3-20%  selective  — may be drawn
 *  T3 <3-10% rare       — the headline
 */
export type SynastryTier = 'T0' | 'T1' | 'T2' | 'T3'

/**
 * Which person's body is the *actor* in an asymmetric tie.
 *  'p1-to-p2'  person 1's planet contacts person 2's angle/node/house
 *  'p2-to-p1'  the reverse
 *  'mutual'    symmetric (cross-aspects, double whammies, element harmony)
 */
export type SynastryDirection = 'p1-to-p2' | 'p2-to-p1' | 'mutual'

/**
 * A single detected connection between the two charts.
 *
 * Ownership convention: `planet1` always belongs to person 1 and `planet2` to
 * person 2. `direction` says which of them is doing the contacting.
 */
export interface SynastryConnection {
  readonly type: SynastryConnectionType
  readonly tier: SynastryTier
  readonly planet1: PlanetId | null
  readonly planet2: PlanetId | null
  readonly aspect: SynastryAspect | null
  readonly harmony: SynastryHarmony
  readonly direction: SynastryDirection
  /** Degrees from exact. Null only for ties with no angular measure (element). */
  readonly orb: number | null
  /** True when the contact is within 1° — tightness is itself the signal. */
  readonly tight: boolean
  /** Angle touched, for 'angle-contact' / 'node-axis-integration'. */
  readonly angle: SynastryAngle | null
  /** House (1-12) of the *receiving* chart, for overlay ties. */
  readonly house: number | null
  /** Bodies involved, for ties that are not a simple two-body contact. */
  readonly planets: readonly PlanetId[] | null
  readonly description: string
  readonly descriptionHebrew: string
}

/** What the input data actually licenses us to compute, per person. */
export interface SynastryDataQuality {
  readonly hasBirthTime: boolean
  readonly hasPlace: boolean
  /** Angles, houses and Vertex need time AND place. */
  readonly hasAngles: boolean
  /** The Vertex additionally requires |latitude| <= 66°. */
  readonly hasVertex: boolean
}

/** Result of a synastry compatibility calculation. */
export interface SynastryCompatibility {
  readonly score: number // 0-100
  /** Every tie, including the near-universal T0 background. */
  readonly connections: readonly SynastryConnection[]
  /**
   * The subset worth drawing: T2/T3 only, rarest first, then tightest orb.
   * This is what a map should render as an edge.
   */
  readonly discriminators: readonly SynastryConnection[]
  readonly sunElement1: Element | null
  readonly sunElement2: Element | null
  readonly dataQuality1: SynastryDataQuality
  readonly dataQuality2: SynastryDataQuality
  readonly available: boolean
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Key planets compared across the two charts for aspects. */
const KEY_PLANETS: readonly PlanetId[] = [
  'sun',
  'moon',
  'venus',
  'mars',
  'mercury',
  'jupiter',
]

/** Personal planets — the bodies that carry a relationship contact. */
const PERSONAL_PLANETS: readonly PlanetId[] = ['sun', 'moon', 'mercury', 'venus', 'mars']

const NODES: readonly PlanetId[] = ['northNode', 'southNode']

const ANGLES: readonly SynastryAngle[] = [
  'ascendant',
  'descendant',
  'midheaven',
  'imumCoeli',
]

/** Orb budgets for the rare contacts (degrees). */
const TIGHT_ORB = 1
const NODE_ORB = 3
const NODE_AXIS_ORB = 3
const ANGLE_ORB = 3
const VERTEX_ORB = 1

/** A single house holding this many of a partner's planets is a stellium. */
const STELLIUM_MIN = 3

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

const ANGLE_NAME: Readonly<Record<SynastryAngle, string>> = {
  ascendant: 'Ascendant',
  descendant: 'Descendant',
  midheaven: 'Midheaven',
  imumCoeli: 'Imum Coeli',
}

const ANGLE_HEBREW: Readonly<Record<SynastryAngle, string>> = {
  ascendant: 'האופק העולה',
  descendant: 'האופק השוקע',
  midheaven: 'רום השמיים',
  imumCoeli: 'שפל השמיים',
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

/**
 * Separation between two AXES (each defined by one of its poles): 0-90.
 * An axis conjuncts an axis whether the poles align or oppose.
 */
function axisSeparation(lon1: number, lon2: number): number {
  const sep = angularSeparation(lon1, lon2)
  return Math.min(sep, 180 - sep)
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

/** Round an orb for display without losing ranking precision downstream. */
const roundOrb = (orb: number): number => Math.round(orb * 100) / 100

const fmtOrb = (orb: number): string => orb.toFixed(1)

// ============================================================================
// PERSON / CHART BUILDING
// ============================================================================

/**
 * One side of the comparison, with an explicit record of what its data
 * licenses. Everything downstream consults these flags before emitting.
 */
interface Person {
  readonly chart: NatalChart
  readonly lon: ReadonlyMap<PlanetId, number>
  readonly quality: SynastryDataQuality
  /** Ecliptic longitudes of the four angles — null unless time AND place. */
  readonly angles: Readonly<Record<SynastryAngle, number>> | null
  /** Ecliptic longitude of the Vertex — null unless time, place and |lat| <= 66. */
  readonly vertex: number | null
  /** The 12 house cusps — null unless time AND place. */
  readonly houseCusps: readonly number[] | null
}

const hasPlaceData = (input: SynastryInput): boolean =>
  typeof input.latitude === 'number' &&
  Number.isFinite(input.latitude) &&
  typeof input.longitude === 'number' &&
  Number.isFinite(input.longitude)

/**
 * Build a person from a SynastryInput.
 *
 * Location defaults to (0, 0) when missing so that planet longitudes (which
 * depend on date/time, not place) stay valid — but `quality.hasPlace` is false
 * and NOTHING place-dependent is derived from that fallback.
 * Returns null if the chart cannot be computed at all.
 */
function buildPerson(input: SynastryInput): Person | null {
  if (!input.birthDate) return null

  const hasBirthTime = typeof input.birthTime === 'string' && input.birthTime.length > 0
  const hasPlace = hasPlaceData(input)

  let chart: NatalChart
  try {
    chart = calculateNatalChart({
      date: input.birthDate,
      time: hasBirthTime ? (input.birthTime as string) : undefined,
      latitude: hasPlace ? (input.latitude as number) : 0,
      longitude: hasPlace ? (input.longitude as number) : 0,
    })
  } catch {
    return null
  }

  // Guard: a usable chart must at least have the Sun positioned.
  if (!chart.planets.some((p) => p.planet.id === 'sun')) return null

  const lon = new Map<PlanetId, number>()
  for (const p of chart.planets) {
    lon.set(p.planet.id, p.position.longitude)
  }
  // The South Node is the North Node's opposite pole; derive it if absent.
  const north = lon.get('northNode')
  if (north !== undefined && !lon.has('southNode')) {
    lon.set('southNode', (north + 180) % 360)
  }

  const hasAngles =
    hasBirthTime && hasPlace && chart.ascendant !== null && chart.midheaven !== null

  const angles: Record<SynastryAngle, number> | null = hasAngles
    ? {
        ascendant: chart.ascendant!.longitude,
        descendant: (chart.ascendant!.longitude + 180) % 360,
        midheaven: chart.midheaven!.longitude,
        imumCoeli: (chart.midheaven!.longitude + 180) % 360,
      }
    : null

  // The Vertex is only meaningful with a real place; calculateNatalChart already
  // returns null above |lat| 66°, but a (0,0) fallback place must never be used.
  const vertex = hasBirthTime && hasPlace ? (chart.vertex?.longitude ?? null) : null

  const houseCusps =
    hasBirthTime && hasPlace && chart.houses && chart.houses.length === 12
      ? chart.houses.map((h) => h.cusp.longitude)
      : null

  return {
    chart,
    lon,
    quality: {
      hasBirthTime,
      hasPlace,
      hasAngles: angles !== null,
      hasVertex: vertex !== null,
    },
    angles,
    vertex,
    houseCusps,
  }
}

/**
 * THE NEVER-FABRICATE GATE.
 *
 * Is this body's position trustworthy enough to make a claim about?
 * The Moon moves 12-15°/day: with a noon default its longitude carries up to
 * ±7° of error — wider than every orb in this file. So no Moon claim without a
 * birth time. Every other body we use is slow enough for a date to suffice.
 */
function isTrustworthy(person: Person, planet: PlanetId): boolean {
  if (planet === 'moon') return person.quality.hasBirthTime
  return person.lon.has(planet)
}

/** Longitude of a body, or null if absent OR untrustworthy without a birth time. */
function trustedLongitude(person: Person, planet: PlanetId): number | null {
  if (!isTrustworthy(person, planet)) return null
  return person.lon.get(planet) ?? null
}

/** House (1-12) containing a longitude, given 12 cusps. */
function houseForLongitude(longitude: number, cusps: readonly number[]): number {
  const lon = ((longitude % 360) + 360) % 360

  for (let i = 0; i < 12; i++) {
    const cusp = cusps[i]
    const next = cusps[(i + 1) % 12]
    const inHouse =
      cusp < next ? lon >= cusp && lon < next : lon >= cusp || lon < next
    if (inHouse) return i + 1
  }

  return 1
}

// ============================================================================
// CONNECTION BUILDERS
// ============================================================================

/** Defaults so every builder below only states what it actually means. */
const baseConnection = {
  planet1: null,
  planet2: null,
  aspect: null,
  direction: 'mutual' as SynastryDirection,
  orb: null,
  tight: false,
  angle: null,
  house: null,
  planets: null,
} as const

function buildAspectConnection(
  p1: PlanetId,
  p2: PlanetId,
  def: AspectDef,
  orb: number
): SynastryConnection {
  const harmonyEn = def.harmony === 'harmonious' ? 'flowing' : 'dynamic'
  const harmonyHe = def.harmony === 'harmonious' ? 'הרמוני וזורם' : 'דינמי ומאתגר'

  return {
    ...baseConnection,
    type: 'cross-aspect',
    tier: 'T0',
    planet1: p1,
    planet2: p2,
    aspect: def.name,
    harmony: def.harmony,
    orb: roundOrb(orb),
    tight: orb <= TIGHT_ORB,
    description: `${PLANET_NAME[p1]} ${ASPECT_NAME[def.name]} ${PLANET_NAME[p2]}, a ${harmonyEn} connection`,
    descriptionHebrew: `${PLANET_HEBREW[p1]} ב${ASPECT_HEBREW[def.name]} ל${PLANET_HEBREW[p2]}, חיבור ${harmonyHe}`,
  }
}

/** A cross-aspect held to <= 1°. Tightness is the signal — ~15% of pairs. */
function buildTightAspectConnection(
  p1: PlanetId,
  p2: PlanetId,
  def: AspectDef,
  orb: number
): SynastryConnection {
  return {
    ...baseConnection,
    type: 'tight-aspect',
    tier: 'T2',
    planet1: p1,
    planet2: p2,
    aspect: def.name,
    harmony: def.harmony,
    orb: roundOrb(orb),
    tight: true,
    description: `${PLANET_NAME[p1]} ${ASPECT_NAME[def.name]} ${PLANET_NAME[p2]} within ${fmtOrb(orb)}°, an exact contact`,
    descriptionHebrew: `${PLANET_HEBREW[p1]} ב${ASPECT_HEBREW[def.name]} ל${PLANET_HEBREW[p2]} במרווח ${fmtOrb(orb)}°, מגע מדויק`,
  }
}

/**
 * Double whammy (Arroyo): the same two planets aspect each other in BOTH
 * directions — A's Venus to B's Mars *and* B's Venus to A's Mars.
 * The single best discriminator obtainable from date + time (~7%).
 */
function buildDoubleWhammyConnection(
  planetA: PlanetId,
  planetB: PlanetId,
  forward: { def: AspectDef; orb: number },
  reverse: { def: AspectDef; orb: number }
): SynastryConnection {
  // The weakest link governs: a double whammy is only as tight as its looser leg.
  const orb = Math.max(forward.orb, reverse.orb)
  const harmony: SynastryHarmony =
    forward.def.harmony === 'harmonious' && reverse.def.harmony === 'harmonious'
      ? 'harmonious'
      : 'challenging'

  const enA = PLANET_NAME[planetA]
  const enB = PLANET_NAME[planetB]
  const heA = PLANET_HEBREW[planetA]
  const heB = PLANET_HEBREW[planetB]

  return {
    ...baseConnection,
    type: 'double-whammy',
    tier: 'T3',
    planet1: planetA,
    planet2: planetB,
    aspect: forward.def.name,
    harmony,
    orb: roundOrb(orb),
    tight: orb <= TIGHT_ORB,
    planets: [planetA, planetB],
    description:
      `Double whammy: ${enA}/${enB} aspect each other both ways ` +
      `(${ASPECT_NAME[forward.def.name]} and ${ASPECT_NAME[reverse.def.name]}, widest orb ${fmtOrb(orb)}°)`,
    descriptionHebrew:
      `לולאה כפולה: ${heA} ו${heB} פוגשים זה את זה בשני הכיוונים ` +
      `(${ASPECT_HEBREW[forward.def.name]} ו${ASPECT_HEBREW[reverse.def.name]}, מרווח ${fmtOrb(orb)}°)`,
  }
}

/** Personal planet conjunct the partner's lunar node. */
function buildNodeConnection(
  body: PlanetId,
  node: PlanetId,
  orb: number,
  direction: 'p1-to-p2' | 'p2-to-p1'
): SynastryConnection {
  const forward = direction === 'p1-to-p2'
  return {
    ...baseConnection,
    type: 'node-contact',
    tier: orb <= TIGHT_ORB ? 'T2' : 'T1',
    planet1: forward ? body : node,
    planet2: forward ? node : body,
    aspect: 'conjunction',
    harmony: 'harmonious',
    direction,
    orb: roundOrb(orb),
    tight: orb <= TIGHT_ORB,
    planets: [body, node],
    description: `${PLANET_NAME[body]} conjunct the ${PLANET_NAME[node]} within ${fmtOrb(orb)}°, a karmic pull`,
    descriptionHebrew: `${PLANET_HEBREW[body]} בצמידות ל${PLANET_HEBREW[node]} במרווח ${fmtOrb(orb)}°, משיכה גורלית`,
  }
}

/** One person's node AXIS on the other's ASC/DSC axis — structural integration. */
function buildNodeAxisConnection(
  orb: number,
  direction: 'p1-to-p2' | 'p2-to-p1'
): SynastryConnection {
  const forward = direction === 'p1-to-p2'
  return {
    ...baseConnection,
    type: 'node-axis-integration',
    tier: 'T3',
    planet1: forward ? 'northNode' : null,
    planet2: forward ? null : 'northNode',
    aspect: 'conjunction',
    harmony: 'harmonious',
    direction,
    orb: roundOrb(orb),
    tight: orb <= TIGHT_ORB,
    angle: 'ascendant',
    planets: ['northNode', 'southNode'],
    description: `Node axis on the partner's Ascendant/Descendant axis within ${fmtOrb(orb)}°, structural integration`,
    descriptionHebrew: `ציר הקשרים על ציר האופק של בן/בת הזוג במרווח ${fmtOrb(orb)}°, שילוב מבני`,
  }
}

/** Personal planet conjunct one of the partner's four angles. */
function buildAngleConnection(
  body: PlanetId,
  angle: SynastryAngle,
  orb: number,
  direction: 'p1-to-p2' | 'p2-to-p1'
): SynastryConnection {
  const tight = orb <= TIGHT_ORB
  const forward = direction === 'p1-to-p2'
  return {
    ...baseConnection,
    type: 'angle-contact',
    tier: tight ? 'T2' : 'T1',
    planet1: forward ? body : null,
    planet2: forward ? null : body,
    aspect: 'conjunction',
    harmony: 'harmonious',
    direction,
    orb: roundOrb(orb),
    tight,
    angle,
    planets: [body],
    description: `${PLANET_NAME[body]} on the partner's ${ANGLE_NAME[angle]} within ${fmtOrb(orb)}°${tight ? ', exact' : ''}`,
    descriptionHebrew: `${PLANET_HEBREW[body]} על ${ANGLE_HEBREW[angle]} של בן/בת הזוג במרווח ${fmtOrb(orb)}°${tight ? ', מדויק' : ''}`,
  }
}

/** Personal planet conjunct the partner's Vertex within 1° — the "fated" point. */
function buildVertexConnection(
  body: PlanetId,
  orb: number,
  direction: 'p1-to-p2' | 'p2-to-p1'
): SynastryConnection {
  const forward = direction === 'p1-to-p2'
  return {
    ...baseConnection,
    type: 'vertex-contact',
    tier: 'T3',
    planet1: forward ? body : null,
    planet2: forward ? null : body,
    aspect: 'conjunction',
    harmony: 'harmonious',
    direction,
    orb: roundOrb(orb),
    tight: true,
    planets: [body],
    description: `${PLANET_NAME[body]} on the partner's Vertex within ${fmtOrb(orb)}°, a fated meeting point`,
    descriptionHebrew: `${PLANET_HEBREW[body]} על הוורטקס של בן/בת הזוג במרווח ${fmtOrb(orb)}°, נקודת מפגש גורלית`,
  }
}

/** One person's planet falling in one of the other's houses (asymmetric). */
function buildHouseOverlayConnection(
  body: PlanetId,
  house: number,
  direction: 'p1-to-p2' | 'p2-to-p1'
): SynastryConnection {
  const forward = direction === 'p1-to-p2'
  return {
    ...baseConnection,
    type: 'house-overlay',
    tier: 'T1',
    planet1: forward ? body : null,
    planet2: forward ? null : body,
    harmony: 'harmonious',
    direction,
    house,
    planets: [body],
    description: `${PLANET_NAME[body]} falls in the partner's ${house}${ordinalSuffix(house)} house`,
    descriptionHebrew: `${PLANET_HEBREW[body]} נופל בבית ה-${house} של בן/בת הזוג`,
  }
}

/**
 * 3+ of one person's planets landing in a single house of the other.
 *
 * MEASURED, and it corrects the folklore: over 780 random pairs a 3-planet
 * overlay fires on 60.6% — Sun/Mercury/Venus are never more than ~76° apart and
 * Placidus houses can be very wide, so three-in-a-house is nearly the norm. The
 * "~4% stellium" quoted in the literature is really the FOUR-planet rate
 * (measured: 7.4%; five is 0.1%). So the tier comes from the cluster's SIZE,
 * not from its name.
 */
function buildStelliumOverlayConnection(
  bodies: readonly PlanetId[],
  house: number,
  direction: 'p1-to-p2' | 'p2-to-p1'
): SynastryConnection {
  const names = bodies.map((b) => PLANET_NAME[b]).join(', ')
  const namesHe = bodies.map((b) => PLANET_HEBREW[b]).join(', ')
  const tier: SynastryTier = bodies.length >= 5 ? 'T3' : bodies.length === 4 ? 'T2' : 'T1'
  return {
    ...baseConnection,
    type: 'stellium-overlay',
    tier,
    harmony: 'harmonious',
    direction,
    house,
    planets: [...bodies],
    description: `Stellium overlay: ${names} all land in the partner's ${house}${ordinalSuffix(house)} house`,
    descriptionHebrew: `צביר: ${namesHe} נופלים כולם בבית ה-${house} של בן/בת הזוג`,
  }
}

function ordinalSuffix(n: number): string {
  if (n === 1) return 'st'
  if (n === 2) return 'nd'
  if (n === 3) return 'rd'
  return 'th'
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
      ...baseConnection,
      type: 'element',
      tier: 'T0',
      harmony: 'harmonious',
      description: `Shared ${ELEMENT_EN[e1]} element, instinctive understanding`,
      descriptionHebrew: `יסוד ${ELEMENT_HE[e1]} משותף, הבנה אינסטינקטיבית`,
    }
  }

  if (kind === 'compatible') {
    return {
      ...baseConnection,
      type: 'element',
      tier: 'T0',
      harmony: 'harmonious',
      description: `${ELEMENT_EN[e1]} and ${ELEMENT_EN[e2]} elements complement each other`,
      descriptionHebrew: `יסודות ${ELEMENT_HE[e1]} ו${ELEMENT_HE[e2]} משלימים זה את זה`,
    }
  }

  return {
    ...baseConnection,
    type: 'element',
    tier: 'T0',
    harmony: 'challenging',
    description: `${ELEMENT_EN[e1]} and ${ELEMENT_EN[e2]} elements create friction`,
    descriptionHebrew: `יסודות ${ELEMENT_HE[e1]} ו${ELEMENT_HE[e2]} יוצרים חיכוך`,
  }
}

// ============================================================================
// DETECTORS — each is pure and each refuses to guess
// ============================================================================

/**
 * Cross-aspects (T0, ~100% of pairs) and, where an aspect is held to <= 1°,
 * the tight contact (T2, ~15%).
 *
 * Cross-aspects are emitted for every key planet pair, exactly as before, so
 * the legacy score is untouched. Tight aspects additionally pass the
 * never-fabricate gate: no Moon claim without a birth time.
 */
function detectCrossAspects(
  p1: Person,
  p2: Person
): {
  readonly connections: readonly SynastryConnection[]
  readonly score: number
} {
  const connections: SynastryConnection[] = []
  let score = 0

  for (const planetA of KEY_PLANETS) {
    const a = p1.lon.get(planetA)
    if (a === undefined) continue

    for (const planetB of KEY_PLANETS) {
      const b = p2.lon.get(planetB)
      if (b === undefined) continue

      const match = matchAspect(angularSeparation(a, b))
      if (!match) continue

      const { def, orb } = match
      const weight = pairWeight(planetA, planetB)
      const tightness = 1 - orb / def.orb // tighter orb -> closer to full baseScore

      if (def.harmony === 'harmonious') {
        score += def.baseScore * weight * tightness
      } else {
        // Challenging aspects grant a small "growth" credit only.
        score += def.baseScore * weight * tightness * 0.25
      }

      connections.push(buildAspectConnection(planetA, planetB, def, orb))

      const trustworthy = isTrustworthy(p1, planetA) && isTrustworthy(p2, planetB)
      if (orb <= TIGHT_ORB && trustworthy) {
        connections.push(buildTightAspectConnection(planetA, planetB, def, orb))
      }
    }
  }

  return { connections, score }
}

/**
 * Double whammies: for each unordered pair of DISTINCT planets {X, Y}, both
 * A.X–B.Y and A.Y–B.X must be in aspect. (X = Y is excluded: that contact is
 * the same separation twice and would fire trivially.)
 *
 * If either planet is the Moon, BOTH people need a birth time — the reciprocal
 * structure means each side's Moon is used.
 */
function detectDoubleWhammies(p1: Person, p2: Person): readonly SynastryConnection[] {
  const connections: SynastryConnection[] = []

  for (let i = 0; i < KEY_PLANETS.length; i++) {
    for (let j = i + 1; j < KEY_PLANETS.length; j++) {
      const x = KEY_PLANETS[i]
      const y = KEY_PLANETS[j]

      // Both legs use both people's copies of both planets — all four must be
      // trustworthy or we say nothing.
      const p1x = trustedLongitude(p1, x)
      const p1y = trustedLongitude(p1, y)
      const p2x = trustedLongitude(p2, x)
      const p2y = trustedLongitude(p2, y)
      if (p1x === null || p1y === null || p2x === null || p2y === null) continue

      const forward = matchAspect(angularSeparation(p1x, p2y)) // A.X -> B.Y
      const reverse = matchAspect(angularSeparation(p1y, p2x)) // A.Y -> B.X
      if (!forward || !reverse) continue

      connections.push(buildDoubleWhammyConnection(x, y, forward, reverse))
    }
  }

  return connections
}

/**
 * Nodal contacts. Nodes need only a birth date, so these survive a missing
 * birth time — except for a Moon, which never does.
 */
function detectNodeContacts(p1: Person, p2: Person): readonly SynastryConnection[] {
  const connections: SynastryConnection[] = []

  const scan = (
    actor: Person,
    receiver: Person,
    direction: 'p1-to-p2' | 'p2-to-p1'
  ): void => {
    for (const body of PERSONAL_PLANETS) {
      const bodyLon = trustedLongitude(actor, body)
      if (bodyLon === null) continue

      for (const node of NODES) {
        const nodeLon = receiver.lon.get(node)
        if (nodeLon === undefined) continue

        const orb = angularSeparation(bodyLon, nodeLon)
        if (orb <= NODE_ORB) {
          connections.push(buildNodeConnection(body, node, orb, direction))
        }
      }
    }
  }

  scan(p1, p2, 'p1-to-p2')
  scan(p2, p1, 'p2-to-p1')

  return connections
}

/**
 * Node axis conjunct the partner's ASC/DSC axis (~7%).
 * Needs the ANGLE owner's exact time and place; emits nothing otherwise.
 */
function detectNodeAxisIntegration(
  p1: Person,
  p2: Person
): readonly SynastryConnection[] {
  const connections: SynastryConnection[] = []

  const scan = (
    nodeOwner: Person,
    angleOwner: Person,
    direction: 'p1-to-p2' | 'p2-to-p1'
  ): void => {
    const node = nodeOwner.lon.get('northNode')
    const angles = angleOwner.angles
    if (node === undefined || !angles) return

    const orb = axisSeparation(node, angles.ascendant)
    if (orb <= NODE_AXIS_ORB) {
      connections.push(buildNodeAxisConnection(orb, direction))
    }
  }

  scan(p1, p2, 'p1-to-p2')
  scan(p2, p1, 'p2-to-p1')

  return connections
}

/**
 * Personal planet conjunct one of the partner's angles.
 * Needs the ANGLE owner's exact time and place; emits nothing otherwise.
 */
function detectAngleContacts(p1: Person, p2: Person): readonly SynastryConnection[] {
  const connections: SynastryConnection[] = []

  const scan = (
    actor: Person,
    angleOwner: Person,
    direction: 'p1-to-p2' | 'p2-to-p1'
  ): void => {
    const angles = angleOwner.angles
    if (!angles) return

    for (const body of PERSONAL_PLANETS) {
      const bodyLon = trustedLongitude(actor, body)
      if (bodyLon === null) continue

      for (const angle of ANGLES) {
        const orb = angularSeparation(bodyLon, angles[angle])
        if (orb <= ANGLE_ORB) {
          connections.push(buildAngleConnection(body, angle, orb, direction))
        }
      }
    }
  }

  scan(p1, p2, 'p1-to-p2')
  scan(p2, p1, 'p2-to-p1')

  return connections
}

/**
 * Personal planet conjunct the partner's Vertex within 1°.
 * Needs the VERTEX owner's exact time and latitude, and is never emitted above
 * |lat| 66° where the Vertex is undefined.
 */
function detectVertexContacts(p1: Person, p2: Person): readonly SynastryConnection[] {
  const connections: SynastryConnection[] = []

  const scan = (
    actor: Person,
    vertexOwner: Person,
    direction: 'p1-to-p2' | 'p2-to-p1'
  ): void => {
    const vertex = vertexOwner.vertex
    if (vertex === null) return

    for (const body of PERSONAL_PLANETS) {
      const bodyLon = trustedLongitude(actor, body)
      if (bodyLon === null) continue

      const orb = angularSeparation(bodyLon, vertex)
      if (orb <= VERTEX_ORB) {
        connections.push(buildVertexConnection(body, orb, direction))
      }
    }
  }

  scan(p1, p2, 'p1-to-p2')
  scan(p2, p1, 'p2-to-p1')

  return connections
}

/**
 * House overlays — asymmetric, so computed in BOTH directions.
 * Needs the HOUSE owner's exact time AND place. This is the most common way
 * consumer apps fabricate; without the data we emit nothing at all.
 * A house holding 3+ of the partner's planets also emits a stellium overlay.
 */
function detectHouseOverlays(p1: Person, p2: Person): readonly SynastryConnection[] {
  const connections: SynastryConnection[] = []

  const scan = (
    actor: Person,
    houseOwner: Person,
    direction: 'p1-to-p2' | 'p2-to-p1'
  ): void => {
    const cusps = houseOwner.houseCusps
    if (!cusps) return

    const byHouse = new Map<number, PlanetId[]>()

    for (const body of KEY_PLANETS) {
      const bodyLon = trustedLongitude(actor, body)
      if (bodyLon === null) continue

      const house = houseForLongitude(bodyLon, cusps)
      connections.push(buildHouseOverlayConnection(body, house, direction))

      const bucket = byHouse.get(house)
      if (bucket) bucket.push(body)
      else byHouse.set(house, [body])
    }

    for (const [house, bodies] of [...byHouse.entries()].sort((a, b) => a[0] - b[0])) {
      if (bodies.length >= STELLIUM_MIN) {
        connections.push(buildStelliumOverlayConnection(bodies, house, direction))
      }
    }
  }

  scan(p1, p2, 'p1-to-p2')
  scan(p2, p1, 'p2-to-p1')

  return connections
}

// ============================================================================
// MAIN CALCULATION
// ============================================================================

const BASE_SCORE = 20
const ELEMENT_SAME_BONUS = 12
const ELEMENT_COMPATIBLE_BONUS = 8
const ELEMENT_CLASH_PENALTY = 6

const TIER_RANK: Readonly<Record<SynastryTier, number>> = { T3: 0, T2: 1, T1: 2, T0: 3 }

const UNAVAILABLE_QUALITY: SynastryDataQuality = {
  hasBirthTime: false,
  hasPlace: false,
  hasAngles: false,
  hasVertex: false,
}

/** The tiers a caller may draw as an edge. */
function isDiscriminating(conn: SynastryConnection): boolean {
  return conn.tier === 'T2' || conn.tier === 'T3'
}

/** Rarest first, then tightest. */
function byRarityThenTightness(a: SynastryConnection, b: SynastryConnection): number {
  const tier = TIER_RANK[a.tier] - TIER_RANK[b.tier]
  if (tier !== 0) return tier
  return (a.orb ?? Number.POSITIVE_INFINITY) - (b.orb ?? Number.POSITIVE_INFINITY)
}

/**
 * Scoring model (unchanged — the new ties are surfaced, not scored, so that
 * downstream scores stay stable)
 * ─────────────
 *   base                      20
 *   + harmonious cross-aspect  baseScore * pairWeight * (1 - orb/maxOrb)
 *   + challenging cross-aspect  small growth credit (~25% of its baseScore,
 *                               weighted) — productive tension, not free points
 *   + element harmony          +12 same / +8 compatible / -6 clashing
 *   clamped to [0, 100]
 *
 * Rank `discriminators` — not `score` — when deciding what to show.
 */
export function calculateSynastryCompatibility(
  p1: SynastryInput,
  p2: SynastryInput
): SynastryCompatibility {
  const person1 = buildPerson(p1)
  const person2 = buildPerson(p2)

  if (!person1 || !person2) {
    return {
      score: 0,
      connections: [],
      discriminators: [],
      sunElement1: null,
      sunElement2: null,
      dataQuality1: person1?.quality ?? UNAVAILABLE_QUALITY,
      dataQuality2: person2?.quality ?? UNAVAILABLE_QUALITY,
      available: false,
    }
  }

  const cross = detectCrossAspects(person1, person2)

  const connections: SynastryConnection[] = [...cross.connections]
  let score = BASE_SCORE + cross.score

  // Sun-sign element compatibility (T0 — background, not a finding).
  const e1 = person1.chart.sunSign.element
  const e2 = person2.chart.sunSign.element
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

  // The rare, discriminating contacts.
  connections.push(
    ...detectDoubleWhammies(person1, person2),
    ...detectNodeContacts(person1, person2),
    ...detectNodeAxisIntegration(person1, person2),
    ...detectAngleContacts(person1, person2),
    ...detectVertexContacts(person1, person2),
    ...detectHouseOverlays(person1, person2)
  )

  const discriminators = connections
    .filter(isDiscriminating)
    .slice()
    .sort(byRarityThenTightness)

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    connections,
    discriminators,
    sunElement1: e1,
    sunElement2: e2,
    dataQuality1: person1.quality,
    dataQuality2: person2.quality,
    available: true,
  }
}
