'use client'

import { useMemo } from 'react'
import { useRankedTies, type Tied } from './use-ranked-ties'
import { circleSeats } from '../atlas/circle-drawing'
import { loadCircleAtlasInTurn, loadPairAtlasFrom } from '@/lib/atlas/load'
import { buildMaya } from '@/lib/atlas/maya'
import type { AtlasPerson } from '@/lib/atlas/pair'
import type { CircleAtlas, PairAtlas } from '@/lib/atlas/types'
import { useDeferredCompute, type DeferredResult } from '@/lib/hooks/use-deferred-compute'

/** A circle needs this many people, `self` among them. */
export const CIRCLE_MIN = 3

/**
 * Who sits in `self`'s circle: `self`, then the people most tied to them in
 * rank order, while the ring sized by the widest label seated so far still
 * holds them. Someone who would not be seated never shrinks the ring.
 */
const seated = (self: AtlasPerson, ranked: readonly Tied[]): readonly AtlasPerson[] => {
  const people = [self, ...ranked.map((t) => t.other)]
  const labels = people.map((person) => ({ name: person.name, sub: buildMaya(person.input.date).title }))
  const firstLeftOut = people.findIndex((_, i) => i + 1 > circleSeats(labels.slice(0, i + 1)))
  return firstLeftOut === -1 ? people : people.slice(0, firstLeftOut)
}

const sameIds = (a: readonly { readonly id: string }[], b: readonly { readonly id: string }[]): boolean =>
  a.length === b.length && a.every((person, i) => person.id === b[i]?.id)

/** A deferred value that belongs to other people than the ones asked for reads as not ready, so an old drawing never sits under a new name. */
const forPeople = <T extends { readonly people: readonly { readonly id: string }[] }>(result: DeferredResult<T>, people: readonly { readonly id: string }[]): DeferredResult<T> =>
  result.value && !sameIds(result.value.people, people) ? { value: null, status: result.status === 'ready' ? 'loading' : result.status, error: result.error } : result

export interface TiesAtlases {
  readonly ranked: DeferredResult<readonly Tied[]>
  /** The heaviest pair, once ranked. */
  readonly best: Tied | null
  /** That pair drawn in full: both maps and the winning reading. */
  readonly pair: DeferredResult<PairAtlas>
  /** Who sits in `self`'s circle, `self` first. */
  readonly members: readonly AtlasPerson[]
  /** The circle, when asked for and there are at least `CIRCLE_MIN` members. */
  readonly circle: DeferredResult<CircleAtlas>
  /** How many more people a circle needs before it can be drawn: counted from everyone saved until the ring seats them, then from who it seats. 0 when enough. */
  readonly circleNeeds: number
  /** Why the pair could not be read, if it could not. */
  readonly failed: string | null
  /** Why the circle could not be drawn, if it could not. */
  readonly circleFailed: string | null
}

/**
 * `self`'s ties with everyone else, read in the browser one pair at a time:
 * the pairs ranked by weight, the heaviest drawn in full (reusing its winning
 * reading), and, when `circle` is asked for, the circle of the people most
 * tied to `self`. The bento dashboard and the v2 dashboard both read ties
 * through this one hook.
 */
export function useTiesAtlases(self: AtlasPerson | null, others: readonly AtlasPerson[], today: string, { circle: withCircle }: { readonly circle: boolean }): TiesAtlases {
  const ranked = useRankedTies(self, others)
  const best = ranked.value?.[0] ?? null
  const pairAsk = self && best ? { self, other: best.other, reading: best.reading } : null
  const pair = useDeferredCompute(pairAsk, (ask) => loadPairAtlasFrom(ask.self, ask.other, ask.reading, today), null, 0, [today])
  const members = useMemo(() => (self && ranked.value ? seated(self, ranked.value) : []), [self, ranked.value])
  const circle = useDeferredCompute(withCircle && members.length >= CIRCLE_MIN ? members : null, loadCircleAtlasInTurn, null, 0)
  const seats = ranked.status === 'ready' ? members.length : (self ? 1 : 0) + others.length

  return {
    ranked,
    best,
    pair: forPeople(pair, pairAsk ? [pairAsk.self, pairAsk.other] : []),
    members,
    circle: forPeople(circle, members),
    circleNeeds: Math.max(0, CIRCLE_MIN - seats),
    failed: ranked.status === 'error' ? ranked.error : pair.status === 'error' ? pair.error : null,
    circleFailed: ranked.status === 'error' ? ranked.error : circle.status === 'error' ? circle.error : null,
  }
}
