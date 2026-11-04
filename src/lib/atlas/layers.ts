import { ATLAS_LAYERS, type AtlasLayerId } from './types'
import { SYSTEM_CATALOG, type ReadingSystemKey } from '@/lib/system-preferences'

/**
 * The map's layers and the order the product leads with (BENTO_SITE.md,
 * "The Atlas"). A layer is named by the system it reads, from the system
 * catalog, so the map and the settings can never call it two names. The
 * Dreamspell layer is never called Maya or Mayan: Dreamspell is a modern
 * system (CONNECTION_ATLAS.md, naming rule).
 */
export interface LayerMeta {
  readonly id: AtlasLayerId
  /** The catalog label of the layer's first system. */
  readonly name: string
  /** What the layer draws, for the readout's group head. */
  readonly reads: string
  /** What the layer needs from the birth data. */
  readonly needs: string
  /** The layer's number on the drawing's pins, the digest tiles and the switch: its place in the lead order. */
  readonly pin: number
  /** The catalog systems this layer draws; every other chart system is read beside the map. */
  readonly systems: readonly ReadingSystemKey[]
}

/** A digest tile: one of the map's layers, or a chart system read beside the map from the same birth date. */
export type DigestEntry = { readonly kind: 'layer'; readonly layer: AtlasLayerId } | { readonly kind: 'beside'; readonly system: BesideSystem }

/** The chart systems the digest reads beside the map: date only and light. */
export type BesideSystem = Extract<ReadingSystemKey, 'longcount'>

/** The lead order: the digest reads top to bottom in it, and the layers take their pin numbers from it. */
export const DIGEST: readonly DigestEntry[] = [
  { kind: 'layer', layer: 'maya' },
  { kind: 'layer', layer: 'body' },
  { kind: 'beside', system: 'longcount' },
  { kind: 'layer', layer: 'number' },
  { kind: 'layer', layer: 'sky' },
]

const LAYER_BASE: Readonly<Record<AtlasLayerId, Omit<LayerMeta, 'id' | 'name' | 'pin'>>> = {
  sky: { reads: 'The sky at birth', needs: 'Date. Time and place add the rising sign and houses.', systems: ['astrology'] },
  maya: { reads: 'The 260-day count, with the traditional Tzolkin day', needs: 'Date only.', systems: ['dreamspell', 'tzolkin'] },
  body: { reads: 'The bodygraph', needs: 'Date, time and place.', systems: ['humandesign'] },
  number: { reads: 'Pythagorean numbers', needs: 'Date. A name in Latin letters adds expression.', systems: ['numerology'] },
}

/** What a system read beside the map reads and needs, as a layer's meta says it for the layer. */
export const BESIDE_META: Readonly<Record<BesideSystem, Pick<LayerMeta, 'reads' | 'needs'>>> = {
  longcount: { reads: 'The days since the count began, in base-twenty places', needs: 'Date only.' },
}

/** A catalog system's label; every system the map names is in the catalog. */
export function systemLabel(key: ReadingSystemKey): string {
  const system = SYSTEM_CATALOG.find((s) => s.key === key)
  if (!system) throw new Error(`No catalog entry for ${key}`)
  return system.label
}

/** The map's layers in the lead order. */
export const LAYERS_BY_PIN: readonly AtlasLayerId[] = DIGEST.flatMap((entry) => (entry.kind === 'layer' ? [entry.layer] : []))

export const LAYER_META: Readonly<Record<AtlasLayerId, LayerMeta>> = Object.fromEntries(
  ATLAS_LAYERS.map((id) => {
    const base = LAYER_BASE[id]
    return [id, { id, name: systemLabel(base.systems[0]), pin: LAYERS_BY_PIN.indexOf(id) + 1, ...base }]
  }),
) as Record<AtlasLayerId, LayerMeta>
