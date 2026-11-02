'use client'

import { loadPairReadings } from '@/lib/atlas/load'
import type { AtlasPerson } from '@/lib/atlas/pair'
import { useDeferredCompute, type DeferredResult } from '@/lib/hooks/use-deferred-compute'
import type { PairReading } from '@/lib/relations/pair-ties'

export interface Tied {
  readonly other: AtlasPerson
  readonly reading: PairReading
}

interface Ask {
  readonly self: AtlasPerson
  readonly others: readonly AtlasPerson[]
}

async function rank({ self, others }: Ask): Promise<readonly Tied[]> {
  const read = await loadPairReadings(others.map((other) => [self, other] as const))
  return others.map((other, i) => ({ other, reading: read[i] })).sort((x, y) => y.reading.bits - x.reading.bits)
}

/**
 * `self`'s ties with each of `others`, heaviest first (most bits), read in the
 * browser one pair at a time. Readings are shared for the visit, so a person
 * page, the dashboard and a circle never read the same pair twice.
 */
export function useRankedTies(self: AtlasPerson | null, others: readonly AtlasPerson[]): DeferredResult<readonly Tied[]> {
  return useDeferredCompute(self && others.length > 0 ? { self, others } : null, rank, null, 0)
}
