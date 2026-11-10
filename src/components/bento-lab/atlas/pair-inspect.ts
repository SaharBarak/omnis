import { createInspect, type Inspect } from './inspect'
import { pairMarkKey, tieKey, type PairMarkRef } from './pair-layout'
import { PAIR_SIDES, tieEnds } from './tie-geometry'
import { relatedMarks } from '@/lib/atlas/marks'
import type { PairAtlas } from '@/lib/atlas/types'

/**
 * What the pair drawing lights for the mark or tie being read
 * (docs/redesign/BENTO_SITE.md, "Ties explain themselves"). Pure: the stage
 * writes it onto the drawing's elements, keyed as the marks are.
 */

export const pairRefKey = (ref: PairMarkRef): string => (ref.kind === 'tie' ? tieKey(ref.index) : pairMarkKey(ref.side, ref.mark))

/** Which card the pair drawing has open. */
export const pairInspect: Inspect<PairMarkRef> = createInspect(pairRefKey)

export type LitState = 'active' | 'related'

export interface PairLighting {
  /** The marks and ties lit, by key, and how; everything else dims. */
  readonly states: ReadonlyMap<string, LitState>
  /** The marks that take their halo: the one read, and the ends of the ties lit for it. */
  readonly halos: ReadonlySet<string>
}

export const DARK: PairLighting = Object.freeze({ states: new Map<string, LitState>(), halos: new Set<string>() })

/** The marks a tie ends on, keyed for the drawing; a side whose end names no mark has none. */
export const tieEndKeys = (pair: PairAtlas, index: number): readonly string[] => {
  const refs = tieEnds(pair.reading.ties[index], pair)
  return PAIR_SIDES.flatMap((side) => (refs[side] ? [pairMarkKey(side, refs[side])] : []))
}

/**
 * A tie lights itself and the marks it ends on, which take their halos. A
 * mark lights itself with its halo, its relations in its own map (as on one
 * atlas), and every tie it ends with that tie's other end, haloed.
 */
export function pairLighting(pair: PairAtlas, ref: PairMarkRef | null): PairLighting {
  if (!ref) return DARK
  if (ref.kind === 'tie') {
    const ends = tieEndKeys(pair, ref.index)
    return { states: new Map([[tieKey(ref.index), 'active'], ...ends.map((key) => [key, 'related'] as const)]), halos: new Set(ends) }
  }
  const own = pairMarkKey(ref.side, ref.mark)
  const relations = relatedMarks(pair[ref.side], ref.mark).map((related) => pairMarkKey(ref.side, related))
  const ties = pair.reading.ties.flatMap((_, index) => {
    const ends = tieEndKeys(pair, index)
    return ends.includes(own) ? [{ key: tieKey(index), ends }] : []
  })
  const ends = ties.flatMap((t) => t.ends)
  const states = new Map<string, LitState>([...relations, ...ties.map((t) => t.key), ...ends].map((key) => [key, 'related']))
  return { states: states.set(own, 'active'), halos: new Set([own, ...ends]) }
}
