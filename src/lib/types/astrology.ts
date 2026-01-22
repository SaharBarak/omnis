/**
 * Astrology Type Definitions
 * Western tropical astrology types for natal chart calculations
 */

// Element and modality types
export type Element = 'fire' | 'earth' | 'air' | 'water'
export type Modality = 'cardinal' | 'fixed' | 'mutable'

// Planet classification
export type PlanetType = 'luminary' | 'personal' | 'social' | 'transpersonal' | 'point'

// Planet identifier (for referencing in calculations)
export type PlanetId =
  | 'sun' | 'moon' | 'mercury' | 'venus' | 'mars'
  | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto'
  | 'northNode' | 'southNode' | 'lilith'

// Zodiac sign identifier
export type ZodiacSignId =
  | 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo'
  | 'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces'

// Aspect nature classification
export type AspectNature = 'major-hard' | 'major-soft' | 'minor'

// Dignity types
export type Dignity = 'domicile' | 'exaltation' | 'detriment' | 'fall' | 'neutral'

// Chart shape patterns
export type ChartShape = 'bundle' | 'bowl' | 'bucket' | 'locomotive' | 'seesaw' | 'splash' | 'splay'

// House system options
export type HouseSystem =
  | 'placidus'
  | 'koch'
  | 'whole-sign'
  | 'equal'
  | 'campanus'
  | 'regiomontanus'
  | 'topocentric'

// Zodiac type (tropical vs sidereal)
export type ZodiacType = 'tropical' | 'sidereal'

// Zodiac Sign definition
export interface ZodiacSign {
  readonly id: ZodiacSignId
  readonly number: number          // 1-12
  readonly name: string
  readonly hebrew: string
  readonly symbol: string
  readonly element: Element
  readonly modality: Modality
  readonly ruler: PlanetId
  readonly degreesStart: number    // 0, 30, 60, etc.
  readonly degreesEnd: number
  readonly keywords: readonly string[]
}

// Planet definition
export interface Planet {
  readonly id: PlanetId
  readonly name: string
  readonly hebrew: string
  readonly symbol: string
  readonly type: PlanetType
  readonly keywords: readonly string[]
  readonly orbitDays?: number
}

// Astrological house definition
export interface House {
  readonly number: number          // 1-12
  readonly name: string
  readonly hebrew: string
  readonly theme: string
  readonly keywords: readonly string[]
  readonly naturalSign: ZodiacSignId
}

// Aspect definition
export interface Aspect {
  readonly name: string
  readonly hebrew: string
  readonly symbol: string
  readonly angle: number
  readonly orb: number             // Allowed deviation in degrees
  readonly nature: AspectNature
  readonly keywords: readonly string[]
}

// Position in the zodiac
export interface ZodiacPosition {
  readonly sign: ZodiacSign
  readonly degree: number          // 0-29
  readonly minute: number          // 0-59
  readonly longitude: number       // 0-360 (total ecliptic longitude)
  readonly formatted: string       // e.g., "15°23' Aries"
}

// Planet position in a chart
export interface PlanetPosition {
  readonly planet: Planet
  readonly position: ZodiacPosition
  readonly house: number | null    // null if no birth time
  readonly retrograde: boolean
  readonly dignity: Dignity
}

// House cusp position
export interface HousePosition {
  readonly house: House
  readonly cusp: ZodiacPosition
  readonly planets: readonly PlanetId[]  // Planets in this house
}

// Aspect between two planets
export interface AspectInstance {
  readonly planet1: PlanetId
  readonly planet2: PlanetId
  readonly aspect: Aspect
  readonly exactAngle: number
  readonly orb: number             // How far from exact
  readonly applying: boolean       // Getting closer or separating
}

// Birth place information
export interface BirthPlace {
  readonly name: string
  readonly latitude: number
  readonly longitude: number
  readonly timezone: string
}

// Complete natal chart
export interface NatalChart {
  // Birth data
  readonly birthDate: string       // ISO date string
  readonly birthTime: string | null // HH:MM or null if unknown
  readonly birthPlace: BirthPlace
  readonly hasBirthTime: boolean

  // Calculated positions
  readonly planets: readonly PlanetPosition[]
  readonly houses: readonly HousePosition[] | null  // null if no birth time
  readonly aspects: readonly AspectInstance[]

  // Key angular points (null if no birth time)
  readonly ascendant: ZodiacPosition | null
  readonly midheaven: ZodiacPosition | null
  readonly descendant: ZodiacPosition | null
  readonly imumCoeli: ZodiacPosition | null

  // Quick reference
  readonly sunSign: ZodiacSign
  readonly moonSign: ZodiacSign
  readonly risingSign: ZodiacSign | null  // null if no birth time

  // Derived patterns
  readonly elementBalance: Readonly<Record<Element, number>>
  readonly modalityBalance: Readonly<Record<Modality, number>>
  readonly chartShape: ChartShape | null
}

// Simplified chart without birth time
export interface SunSignChart {
  readonly birthDate: string
  readonly sunSign: ZodiacSign
  readonly planets: ReadonlyArray<{
    readonly planet: Planet
    readonly sign: ZodiacSign
    readonly approximate: boolean
  }>
  readonly aspects: readonly AspectInstance[]
}

// Input for chart calculation
export interface AstrologyInput {
  readonly date: string            // ISO date (YYYY-MM-DD)
  readonly time?: string           // HH:MM local time (optional)
  readonly latitude: number
  readonly longitude: number
  readonly timezone?: string       // IANA timezone (defaults to UTC)
  readonly houseSystem?: HouseSystem
  readonly zodiacType?: ZodiacType
}

// Transit between current and natal positions
export interface Transit {
  readonly transitingPlanet: Planet
  readonly natalPlanet: Planet
  readonly aspect: Aspect
  readonly exactDate: string       // ISO date
  readonly orb: number
}

// Transit report
export interface TransitReport {
  readonly date: string
  readonly activeTransits: readonly Transit[]
  readonly upcomingTransits: readonly Transit[]
}

// Synastry (relationship comparison)
export interface InterAspect {
  readonly planet1: {
    readonly person: 1 | 2
    readonly planet: Planet
    readonly position: ZodiacPosition
  }
  readonly planet2: {
    readonly person: 1 | 2
    readonly planet: Planet
    readonly position: ZodiacPosition
  }
  readonly aspect: Aspect
  readonly orb: number
}

export interface SynastryReport {
  readonly person1Chart: NatalChart
  readonly person2Chart: NatalChart
  readonly interAspects: readonly InterAspect[]
}

// Element balance labels for display
export const ELEMENT_LABELS: Readonly<Record<Element, { label: string; labelHebrew: string; emoji: string }>> = {
  fire: { label: 'Fire', labelHebrew: 'אש', emoji: '🔥' },
  earth: { label: 'Earth', labelHebrew: 'אדמה', emoji: '🌍' },
  air: { label: 'Air', labelHebrew: 'אוויר', emoji: '💨' },
  water: { label: 'Water', labelHebrew: 'מים', emoji: '💧' },
}

// Modality labels for display
export const MODALITY_LABELS: Readonly<Record<Modality, { label: string; labelHebrew: string }>> = {
  cardinal: { label: 'Cardinal', labelHebrew: 'קרדינלי' },
  fixed: { label: 'Fixed', labelHebrew: 'קבוע' },
  mutable: { label: 'Mutable', labelHebrew: 'משתנה' },
}

// House system labels for display
export const HOUSE_SYSTEM_LABELS: Readonly<Record<HouseSystem, { label: string; labelHebrew: string }>> = {
  'placidus': { label: 'Placidus', labelHebrew: 'פלסידוס' },
  'koch': { label: 'Koch', labelHebrew: 'קוך' },
  'whole-sign': { label: 'Whole Sign', labelHebrew: 'סימן שלם' },
  'equal': { label: 'Equal House', labelHebrew: 'בתים שווים' },
  'campanus': { label: 'Campanus', labelHebrew: 'קמפנוס' },
  'regiomontanus': { label: 'Regiomontanus', labelHebrew: 'רגיומונטנוס' },
  'topocentric': { label: 'Topocentric', labelHebrew: 'טופוצנטרי' },
}
