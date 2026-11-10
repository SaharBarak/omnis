import type { PairMarkRef } from './pair-layout'
import { PAIR_SIDES, pairPerson, TIE_LAYER, tieEnds, type PairSide } from './tie-geometry'
import type { MarkReading } from '@/lib/atlas/explain'
import { LAYER_META } from '@/lib/atlas/layers'
import { MARK_LAYER, markTitle, type AtlasMarkRef, type MarkSource, type MarkTitle } from '@/lib/atlas/marks'
import type { AtlasLayerId, PairAtlas } from '@/lib/atlas/types'
import { TIE_FACT, tieBetween, tieBits, tieView } from '@/lib/relations/tie-text'

/**
 * The words a card on the pair drawing says (docs/redesign/BENTO_SITE.md,
 * "Ties explain themselves"). Every line comes from the tie's own words
 * (`tieView`) and the marks' titles (`markTitle`); none is written here.
 */

const nameOf = (pair: PairAtlas, side: PairSide): string => pairPerson(pair, side).name

const personName = (pair: PairAtlas) => (id: string): string => pair.people.find((p) => p.id === id)?.name ?? id

/** The card's label and its strong line: the tie's name and its odds, or the mark's own title. */
export function pairTitle(pair: PairAtlas, ref: PairMarkRef): MarkTitle | null {
  if (ref.kind === 'mark') return markTitle(pair[ref.side], ref.mark)
  const view = tieView(pair.reading.ties[ref.index])
  return { label: view.name, value: view.odds }
}

/** The line over the label: whose mark it is, or that it is a tie, then its system. The pair draws no pins, so it names none. */
export function pairEyebrow(pair: PairAtlas, ref: PairMarkRef): string {
  if (ref.kind === 'mark') return `${nameOf(pair, ref.side)} · ${LAYER_META[pairLayer(pair, ref)].name}`
  return `Tie · ${tieView(pair.reading.ties[ref.index]).system}`
}

/** The layer a card is keyed to: the mark's, or the tie's system's. */
export const pairLayer = (pair: PairAtlas, ref: PairMarkRef): AtlasLayerId =>
  ref.kind === 'tie' ? TIE_LAYER[pair.reading.ties[ref.index].system] : MARK_LAYER[ref.mark.kind]

/** What a target is called to assistive technology: whose mark, or which tie. */
export function pairTargetTitle(pair: PairAtlas, ref: PairMarkRef): MarkTitle | null {
  const title = pairTitle(pair, ref)
  if (!title) return null
  return { label: ref.kind === 'tie' ? `Tie, ${title.label}` : `${nameOf(pair, ref.side)}, ${title.label}`, value: title.value }
}

/** A tie's end in one map, in that person's words: the mark's title. */
const endFact = (pair: PairAtlas, side: PairSide, ref: AtlasMarkRef | null) => {
  const title = ref ? markTitle(pair[side], ref) : null
  return title ? [{ label: nameOf(pair, side), value: `${title.label}, ${title.value}` }] : []
}

/** A tie's meaning and facts: who it is between, its tier, its weight, and each end. */
export function tieReading(pair: PairAtlas, index: number): MarkReading {
  const tie = pair.reading.ties[index]
  const view = tieView(tie)
  const ends = tieEnds(tie, pair)
  return {
    meaning: view.meaning || null,
    facts: [
      { label: TIE_FACT.between, value: tieBetween(tie, personName(pair)) },
      { label: TIE_FACT.rarity, value: view.tier },
      { label: TIE_FACT.weight, value: tieBits(view.bits) },
      ...PAIR_SIDES.flatMap((side) => endFact(pair, side, ends[side])),
    ],
  }
}

/** The card's meaning and facts: a tie's at once; a mark's once the meanings have loaded. */
export function pairReading(pair: PairAtlas, ref: PairMarkRef, explain: ((atlas: MarkSource, ref: AtlasMarkRef) => MarkReading | null) | null): MarkReading | null {
  if (ref.kind === 'tie') return tieReading(pair, ref.index)
  return explain?.(pair[ref.side], ref.mark) ?? null
}

