/**
 * Human Design System Types
 *
 * Human Design is a synthesis system combining astrology, I Ching, Kabbalah,
 * and the chakra system. It generates a "bodygraph" based on precise birth
 * time and location.
 *
 * Note: Human Design requires birth time and place for accuracy.
 */

// =============================================================================
// CORE ENUMS & SCALAR TYPES
// =============================================================================

/**
 * The 9 energy centers in the bodygraph
 */
export type CenterId =
  | 'head' // Inspiration, pressure to think
  | 'ajna' // Conceptualization, mental awareness
  | 'throat' // Communication, manifestation
  | 'g' // Identity, love, direction (also called "G Center" or "Self")
  | 'heart' // Willpower, ego, material world (also called "Ego" or "Will")
  | 'spleen' // Intuition, health, survival
  | 'sacral' // Life force, sexuality, work
  | 'solar' // Emotions, feelings, desires (Solar Plexus)
  | 'root' // Pressure, adrenaline, drive

/**
 * The 5 Human Design types
 */
export type HumanDesignType =
  | 'manifestor'
  | 'generator'
  | 'manifesting-generator'
  | 'projector'
  | 'reflector'

/**
 * Inner authority for decision-making
 */
export type Authority =
  | 'emotional' // Solar Plexus defined
  | 'sacral' // Sacral defined, no emotional
  | 'splenic' // Spleen defined, no sacral/emotional
  | 'ego-manifested' // Heart to throat, Manifestor
  | 'ego-projected' // Heart defined, Projector
  | 'self-projected' // G center to throat, Projector
  | 'mental' // Projector, no inner authority
  | 'lunar' // Reflector, wait 28 days

/**
 * Profile line numbers (1-6)
 */
export type ProfileLine = 1 | 2 | 3 | 4 | 5 | 6

/**
 * Circuit groups that channels belong to
 */
export type Circuitry =
  | 'individual' // Mutation, empowerment
  | 'collective' // Sharing, logic/abstract
  | 'tribal' // Support, resources
  | 'integration' // Self-empowerment (special category)

/**
 * Definition type - how centers are connected
 */
export type Definition =
  | 'single' // All defined centers connected
  | 'split' // Two separate areas
  | 'triple-split' // Three separate areas
  | 'quadruple-split' // Four separate areas
  | 'none' // Reflector - no definitions

/**
 * Quarter of the Incarnation Cross wheel
 */
export type Quarter =
  | 'initiation' // Gates 13-24: Purpose through Mind
  | 'civilization' // Gates 2-33: Purpose through Form
  | 'duality' // Gates 7-44: Purpose through Bonding
  | 'mutation' // Gates 1-20: Purpose through Transformation

/**
 * Planets used in Human Design calculations
 */
export type HumanDesignPlanet =
  | 'sun'
  | 'earth'
  | 'moon'
  | 'north-node'
  | 'south-node'
  | 'mercury'
  | 'venus'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'pluto'

// =============================================================================
// DATA STRUCTURES
// =============================================================================

/**
 * A center in the bodygraph
 */
export interface Center {
  readonly id: CenterId
  readonly name: string
  readonly hebrew: string
  readonly biologicalCorrelation: string
  readonly function: string
  readonly notSelfTheme: string
  readonly gates: readonly number[]
}

/**
 * State of a center in a specific chart
 */
export interface CenterState {
  readonly centerId: CenterId
  readonly defined: boolean
  readonly activeGates: readonly number[]
}

/**
 * A gate (corresponds to an I Ching hexagram)
 */
export interface Gate {
  readonly number: number // 1-64
  readonly name: string
  readonly nameHebrew: string
  readonly centerId: CenterId
  readonly iChingHexagram: number
  readonly iChingName: string
  readonly keywords: readonly string[]
}

/**
 * A channel connecting two centers
 */
export interface Channel {
  readonly id: string // e.g., "1-8", "2-14"
  readonly name: string
  readonly nameHebrew: string
  readonly gates: readonly [number, number]
  readonly centers: readonly [CenterId, CenterId]
  readonly circuitry: Circuitry
  readonly keywords: readonly string[]
}

/**
 * A profile (conscious/unconscious line combination)
 */
export interface Profile {
  readonly id: string // e.g., "1/3", "4/6"
  readonly conscious: ProfileLine
  readonly unconscious: ProfileLine
  readonly name: string
  readonly nameHebrew: string
  readonly theme: string
}

/**
 * Type definition with strategy and themes
 */
export interface TypeDefinition {
  readonly type: HumanDesignType
  readonly name: string
  readonly nameHebrew: string
  readonly strategy: string
  readonly strategyHebrew: string
  readonly notSelfTheme: string
  readonly signatureTheme: string
  readonly aura: string
  readonly population: string
}

/**
 * Authority definition
 */
export interface AuthorityDefinition {
  readonly authority: Authority
  readonly name: string
  readonly nameHebrew: string
  readonly description: string
  readonly decisionProcess: string
}

/**
 * Incarnation Cross - life purpose theme
 */
export interface IncarnationCross {
  readonly name: string
  readonly nameHebrew: string
  readonly quarter: Quarter
  readonly gates: {
    readonly personalitySun: number
    readonly personalityEarth: number
    readonly designSun: number
    readonly designEarth: number
  }
  readonly theme: string
}

// =============================================================================
// CALCULATION INPUT/OUTPUT
// =============================================================================

/**
 * Input for Human Design calculations
 */
export interface HumanDesignInput {
  readonly birthDate: string // ISO date string (YYYY-MM-DD)
  readonly birthTime: string | null // HH:MM format, null if unknown
  readonly latitude: number
  readonly longitude: number
  readonly timezone?: string // IANA timezone, optional
}

/**
 * Planetary activation in a specific gate/line
 */
export interface PlanetaryActivation {
  readonly planet: HumanDesignPlanet
  readonly gate: number
  readonly line: ProfileLine
  readonly color?: number // 1-6, advanced
  readonly tone?: number // 1-6, advanced
  readonly base?: number // 1-5, advanced
  readonly zodiacDegree: number // Original position in degrees
}

/**
 * Complete activation set (personality + design)
 */
export interface ActivationSet {
  readonly personality: readonly PlanetaryActivation[] // At birth
  readonly design: readonly PlanetaryActivation[] // ~88° earlier
}

/**
 * Complete bodygraph/chart
 */
export interface Bodygraph {
  // Input data
  readonly birthDate: string
  readonly birthTime: string | null
  readonly birthPlace: {
    readonly latitude: number
    readonly longitude: number
  }

  /** Birth moment resolved to absolute UTC (ISO 8601) */
  readonly birthInstantUtc?: string
  /** The moment the Sun stood exactly 88° of arc earlier (ISO 8601) */
  readonly designInstantUtc?: string

  // Core type information
  readonly type: HumanDesignType
  readonly typeDefinition: TypeDefinition
  readonly authority: Authority
  readonly authorityDefinition: AuthorityDefinition
  readonly profile: Profile
  readonly definition: Definition

  // Chart structure
  readonly centers: Readonly<Record<CenterId, CenterState>>
  readonly definedCenters: readonly CenterId[]
  readonly undefinedCenters: readonly CenterId[]
  readonly channels: readonly Channel[]
  readonly gates: readonly number[]

  // Planetary activations
  readonly activations: ActivationSet

  // Life purpose
  readonly incarnationCross: IncarnationCross

  // Validity flags
  readonly hasBirthTime: boolean
  readonly isComplete: boolean
}

/**
 * Simplified bodygraph for display without birth time
 */
export interface PartialBodygraph {
  readonly birthDate: string
  readonly hasBirthTime: false
  readonly message: string
  readonly messageHebrew: string
}

/**
 * Result type for Human Design calculations
 */
export type HumanDesignResult = Bodygraph | PartialBodygraph

// =============================================================================
// RELATIONSHIP/COMPOSITE TYPES
// =============================================================================

/**
 * Types of connections between two charts
 */
export type ConnectionType =
  | 'electromagnetic' // Each person has one gate of a channel
  | 'companionship' // Both have the same gate
  | 'dominance' // One has full channel, other has one gate
  | 'compromise' // One has full channel, other is open

/**
 * Composite analysis of two bodygraphs
 */
export interface CompositeAnalysis {
  readonly person1: Bodygraph
  readonly person2: Bodygraph
  readonly electromagneticChannels: readonly Channel[]
  readonly companionshipGates: readonly number[]
  readonly dominanceChannels: readonly Channel[]
  readonly compromiseChannels: readonly Channel[]
  readonly bridgingGates: readonly number[] // Gates that complete channels
  readonly connectionStrength: number // 0-100
}

// =============================================================================
// DISPLAY LABELS
// =============================================================================

export const TYPE_LABELS: Readonly<Record<HumanDesignType, string>> = {
  manifestor: 'Manifestor',
  generator: 'Generator',
  'manifesting-generator': 'Manifesting Generator',
  projector: 'Projector',
  reflector: 'Reflector',
}

export const TYPE_LABELS_HEBREW: Readonly<Record<HumanDesignType, string>> = {
  manifestor: 'מניפסטור',
  generator: "ג'נרטור",
  'manifesting-generator': "מניפסטינג ג'נרטור",
  projector: "פרוג'קטור",
  reflector: 'רפלקטור',
}

export const AUTHORITY_LABELS: Readonly<Record<Authority, string>> = {
  emotional: 'Emotional',
  sacral: 'Sacral',
  splenic: 'Splenic',
  'ego-manifested': 'Ego Manifested',
  'ego-projected': 'Ego Projected',
  'self-projected': 'Self-Projected',
  mental: 'Mental (None)',
  lunar: 'Lunar',
}

export const AUTHORITY_LABELS_HEBREW: Readonly<Record<Authority, string>> = {
  emotional: 'סמכות רגשית',
  sacral: 'סמכות סקרלית',
  splenic: 'סמכות טחולית',
  'ego-manifested': 'סמכות אגו מניפסטית',
  'ego-projected': 'סמכות אגו מוקרנת',
  'self-projected': 'סמכות עצמית מוקרנת',
  mental: 'סמכות מנטלית (אין)',
  lunar: 'סמכות ירחית',
}

export const CENTER_LABELS: Readonly<Record<CenterId, string>> = {
  head: 'Head',
  ajna: 'Ajna',
  throat: 'Throat',
  g: 'G Center',
  heart: 'Heart',
  spleen: 'Spleen',
  sacral: 'Sacral',
  solar: 'Solar Plexus',
  root: 'Root',
}

export const CENTER_LABELS_HEBREW: Readonly<Record<CenterId, string>> = {
  head: 'ראש',
  ajna: "אג'נה",
  throat: 'גרון',
  g: 'מרכז G',
  heart: 'לב',
  spleen: 'טחול',
  sacral: 'סקראל',
  solar: 'מקלעת השמש',
  root: 'שורש',
}

export const DEFINITION_LABELS: Readonly<Record<Definition, string>> = {
  single: 'Single Definition',
  split: 'Split Definition',
  'triple-split': 'Triple Split Definition',
  'quadruple-split': 'Quadruple Split Definition',
  none: 'No Definition',
}

export const DEFINITION_LABELS_HEBREW: Readonly<Record<Definition, string>> = {
  single: 'הגדרה יחידה',
  split: 'הגדרה מפוצלת',
  'triple-split': 'הגדרה משולשת',
  'quadruple-split': 'הגדרה מרובעת',
  none: 'ללא הגדרה',
}

export const CIRCUITRY_LABELS: Readonly<Record<Circuitry, string>> = {
  individual: 'Individual',
  collective: 'Collective',
  tribal: 'Tribal',
  integration: 'Integration',
}

export const CIRCUITRY_LABELS_HEBREW: Readonly<Record<Circuitry, string>> = {
  individual: 'אינדיבידואלי',
  collective: 'קולקטיבי',
  tribal: 'שבטי',
  integration: 'אינטגרציה',
}

export const QUARTER_LABELS: Readonly<Record<Quarter, string>> = {
  initiation: 'Initiation',
  civilization: 'Civilization',
  duality: 'Duality',
  mutation: 'Mutation',
}

export const QUARTER_LABELS_HEBREW: Readonly<Record<Quarter, string>> = {
  initiation: 'התחלה',
  civilization: 'ציביליזציה',
  duality: 'דואליות',
  mutation: 'מוטציה',
}
