'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchJson } from '@/lib/http/json'
import { QUERY_KEYS } from '@/lib/query/keys'
import type { MatrixPairScore } from '@/lib/services/resonance-matrix'

export interface MatrixPerson {
  id: string
  name: string
  hebrew_name: string | null
  is_self: boolean
}

export interface MatrixResponse {
  people: MatrixPerson[]
  pairs: MatrixPairScore[]
  meta: { pairCount: number; cachedCount: number; computedCount: number }
}

/**
 * GET /api/compatibility/matrix: every pair of the user's people, scored.
 * Cached beneath the people key, so any change to a person refreshes it.
 */
export function useResonanceMatrix() {
  const query = useQuery({
    queryKey: QUERY_KEYS.matrix,
    queryFn: ({ signal }) => fetchJson<MatrixResponse>('/api/compatibility/matrix', { signal }),
  })
  return {
    data: query.data ?? null,
    loading: query.isPending,
    error: query.error ? query.error.message : null,
    retry: query.refetch,
  }
}
