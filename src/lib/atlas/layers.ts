import type { AtlasLayerId } from './types'
import type { ReadingSystemKey } from '@/lib/system-preferences'

/**
 * Display names. The Dreamspell ring is called Kin, never Maya or Mayan:
 * Dreamspell is a modern system (CONNECTION_ATLAS.md, naming rule).
 */
export interface LayerMeta {
  readonly id: AtlasLayerId
  readonly name: string
  /** The tradition the layer reads. */
  readonly reads: string
  /** What the layer needs from the birth data. */
  readonly needs: string
  /** The layer's number on the drawing's pins, the digest tiles and the switch, outside in. */
  readonly pin: number
  /** The catalog systems this layer draws; every other chart system is read beside the map. */
  readonly systems: readonly ReadingSystemKey[]
}

export const LAYER_META: Readonly<Record<AtlasLayerId, LayerMeta>> = {
  sky: { id: 'sky', name: 'Sky', reads: 'Western astrology', needs: 'Date. Time and place add the rising sign and houses.', pin: 1, systems: ['astrology'] },
  maya: { id: 'maya', name: 'Kin', reads: 'Dreamspell, with the traditional Tzolkin day', needs: 'Date only.', pin: 2, systems: ['dreamspell', 'tzolkin'] },
  body: { id: 'body', name: 'Body', reads: 'Human Design', needs: 'Date, time and place.', pin: 3, systems: ['humandesign'] },
  number: { id: 'number', name: 'Number', reads: 'Pythagorean numerology', needs: 'Date. A name in Latin letters adds expression.', pin: 4, systems: ['numerology'] },
}
