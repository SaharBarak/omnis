import type { PlanetId } from '@pleiad/engine/types/astrology'
import type { CenterId } from '@pleiad/engine/types/human-design'
import type { CircleReading } from './circle'
import type { PairReading } from '@/lib/relations/pair-ties'

/**
 * The person atlas: one map, four layers drawn from the outside in
 * (docs/redesign/BENTO_SITE.md, "The Atlas"). Plain serialisable data, so the
 * server can build it and a client component can draw it or rebuild it.
 */

export type AtlasLayerId = 'sky' | 'maya' | 'body' | 'number'

export const ATLAS_LAYERS: readonly AtlasLayerId[] = ['sky', 'maya', 'body', 'number']

export interface BirthPlace {
  readonly lat: number
  readonly lng: number
  readonly label: string | null
}

export interface BirthInput {
  /** ISO date, YYYY-MM-DD. */
  readonly date: string
  /** HH:MM local time at the birth place. */
  readonly time: string | null
  readonly place: BirthPlace | null
  readonly name: string | null
  readonly hebrewName: string | null
}

export interface GlyphRef {
  readonly n: number
  readonly name: string
  readonly src: string
}

export interface MayaLayer {
  readonly kin: number
  /** e.g. "Yellow Galactic Sun". */
  readonly title: string
  /** The seal's colour, e.g. "Yellow". */
  readonly colour: string
  readonly seal: GlyphRef
  readonly tone: GlyphRef
  readonly oracle: {
    readonly guide: GlyphRef
    readonly analog: GlyphRef
    readonly antipode: GlyphRef
    readonly occult: GlyphRef
  }
  /** Traditional count (GMT correlation), e.g. "8 Ajaw". */
  readonly tzolkin: string
}

/** The Maya Long Count, a chart system read beside the map: date only. */
export interface LongCountReading {
  /** Most significant first: baktun, katun, tun, winal and kin, with any places a count past 19 baktuns carries into above them. */
  readonly places: readonly number[]
  /** The places written with dots, e.g. "12.18.17.16.7". */
  readonly date: string
  /** The day's Tzolkin and Haab together, e.g. "7 Manik' 0 Kumku". */
  readonly round: string
}

export interface SkyBody {
  readonly id: PlanetId
  readonly name: string
  readonly symbol: string
  readonly src: string | null
  /** Ecliptic longitude, 0-360. */
  readonly longitude: number
  /** When the birth time is unknown: the arc the body covers that day. */
  readonly arc: readonly [number, number] | null
  readonly sign: GlyphRef
  readonly degree: number
  readonly retrograde: boolean
}

/** exact: time and place known. day: positions at noon, the Moon drawn as its day's arc. */
export type SkyPrecision = 'exact' | 'day'

export interface SkyLayer {
  readonly precision: SkyPrecision
  readonly bodies: readonly SkyBody[]
  readonly ascendant: number | null
}

export interface BodyChannel {
  readonly id: string
  readonly name: string
  readonly gates: readonly [number, number]
}

export interface BodyLayer {
  readonly type: string
  readonly strategy: string
  readonly authority: string
  /** The centre the authority speaks from; null for mental and lunar authority, which have none of their own. */
  readonly authorityCentre: CenterId | null
  readonly profile: string
  readonly definition: string
  readonly cross: string
  readonly definedCenters: readonly CenterId[]
  readonly channels: readonly BodyChannel[]
  readonly gates: readonly number[]
}

export interface NumberLayer {
  readonly lifePath: number
  readonly birthday: number
  /** Null when the name has no Latin letters. */
  readonly expression: number | null
  readonly soulUrge: number | null
  readonly personalYear: number
}

export type MissingInput = 'time' | 'place' | 'time-and-place'

export interface ReadoutRow {
  readonly layer: AtlasLayerId
  readonly label: string
  readonly value: string
}

export interface PersonAtlas {
  readonly input: BirthInput
  readonly sky: SkyLayer
  readonly maya: MayaLayer
  readonly body: BodyLayer | null
  /** Why the body layer is empty, when it is. */
  readonly bodyNeeds: MissingInput | null
  readonly number: NumberLayer
  readonly longCount: LongCountReading
  /** The atlas as text: every value the drawing shows, in reading order. */
  readonly readout: readonly ReadoutRow[]
}

/** The light readings (two layers and the Long Count), available before the heavy engines load. */
export type LightAtlas = Pick<PersonAtlas, 'input' | 'maya' | 'number' | 'longCount'>

export interface AtlasPersonRef {
  readonly id: string
  readonly name: string
}

export interface PairAtlas {
  readonly a: PersonAtlas
  readonly b: PersonAtlas
  readonly people: readonly [AtlasPersonRef, AtlasPersonRef]
  readonly reading: PairReading
}

export interface CircleAtlas {
  readonly people: readonly (AtlasPersonRef & { readonly maya: MayaLayer })[]
  readonly circle: CircleReading
}
