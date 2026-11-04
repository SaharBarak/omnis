import { DIGEST, type BesideSystem, type DigestEntry } from './layers'
import type { AtlasLayerId } from './types'

/**
 * What each digest tile shows (docs/redesign/BENTO_SITE.md, "The digest"):
 * its lead fact and its supports, in order, with each fact's label and its
 * share of the supports' row. The tile component and the wireframes read
 * this one table, so the built tile and its drawing can never disagree.
 */

export type TileId = AtlasLayerId | BesideSystem

export type FactId =
  | 'kin'
  | 'tone'
  | 'guide'
  | 'type'
  | 'profile'
  | 'authority'
  | 'longcount'
  | 'place'
  | 'lifePath'
  | 'birthday'
  | 'expression'
  | 'sun'
  | 'moon'
  | 'rising'

export interface FactShape {
  readonly id: FactId
  /** What the value is: a support's visible label, the lead's spoken one. */
  readonly label: string
  /** The fact's share of the supports' row. */
  readonly weight: number
}

export interface TileShape {
  readonly lead: FactShape
  /** A `place` support stands for one fact per Long Count place. */
  readonly supports: readonly FactShape[]
}

const fact = (id: FactId, label: string, weight = 1): FactShape => Object.freeze({ id, label, weight })

export const DIGEST_SHAPE: Readonly<Record<TileId, TileShape>> = Object.freeze({
  maya: { lead: fact('kin', 'Kin'), supports: [fact('tone', 'Tone'), fact('guide', 'Guide')] },
  body: { lead: fact('type', 'Type'), supports: [fact('profile', 'Profile', 2), fact('authority', 'Authority')] },
  longcount: { lead: fact('longcount', 'Long Count date'), supports: [fact('place', 'Place')] },
  number: { lead: fact('lifePath', 'Life path'), supports: [fact('birthday', 'Birthday'), fact('expression', 'Expression')] },
  sky: { lead: fact('sun', 'Sun'), supports: [fact('moon', 'Moon'), fact('rising', 'Rising')] },
})

export const tileOf = (entry: DigestEntry): TileId => (entry.kind === 'layer' ? entry.layer : entry.system)

/** The tiles in the lead order. */
export const DIGEST_TILES: readonly TileId[] = DIGEST.map(tileOf)
