import { NUMBER_MEANINGS } from '@pleiad/engine/calculations/numerology'
import type { PlanetId } from '@pleiad/engine/types/astrology'
import type { TileId } from './digest-shape'
import { MARK_LAYER, markKey, type AtlasMarkRef } from './marks'
import type { PersonAtlas } from './types'
import type { OracleRoleId } from '@/lib/dreamspell-oracle'

/**
 * What a digest fact refers to (docs/redesign/BENTO_SITE.md, "Facts explain
 * themselves"). A fact the drawing also draws keeps its mark reference; the
 * rest are readings of a system. Light and pure: the words that explain them
 * live in explain.ts, which loads after first paint.
 */

export type NumberRole = 'lifePath' | 'birthday' | 'expression'

export type ReadingRef =
  | AtlasMarkRef
  | { readonly kind: 'system'; readonly id: TileId }
  | { readonly kind: 'kin' }
  /** A seat of the oracle, read as that seat even where its seal also holds another (the guide is the own seal on tones 1, 6 and 11). */
  | { readonly kind: 'seat'; readonly role: OracleRoleId }
  | { readonly kind: 'type' }
  | { readonly kind: 'profile' }
  | { readonly kind: 'authority' }
  | { readonly kind: 'number'; readonly role: NumberRole }
  | { readonly kind: 'longcount' }
  /** A Long Count place by its unit, least significant first (Kin is 0), never by its value. */
  | { readonly kind: 'place'; readonly unit: number }
  /** A body in its sign, as the digest reads it. */
  | { readonly kind: 'placement'; readonly id: PlanetId }

/** The parts of an atlas the digest's readings read. */
export type ReadingSource = Pick<PersonAtlas, 'sky' | 'maya' | 'body' | 'number' | 'longCount'>

export const isMarkRef = (ref: ReadingRef): ref is AtlasMarkRef => Object.hasOwn(MARK_LAYER, ref.kind)

/** A stable key per reference: a mark's own key, else its kind and what tells it apart. */
export const readingKey = (ref: ReadingRef): string => {
  if (isMarkRef(ref)) return markKey(ref)
  switch (ref.kind) {
    case 'system':
      return `system:${ref.id}`
    case 'number':
    case 'seat':
      return `${ref.kind}:${ref.role}`
    case 'place':
      return `place:${ref.unit}`
    case 'placement':
      return `placement:${ref.id}`
    default:
      return ref.kind
  }
}

/** A number's entry in the numerology table, split at its dash: the name (`The seeker`) and what it reads. */
export interface NumberWords {
  readonly name: string
  readonly reads: string | null
}

const DASH = ' — '

export const numberWords = (n: number): NumberWords | null => {
  const entry = NUMBER_MEANINGS[n]
  if (!entry) return null
  const [name, ...rest] = entry.split(DASH)
  return { name, reads: rest.join(', ') || null }
}
