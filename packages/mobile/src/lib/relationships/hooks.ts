import {
  PleiadApiError,
  type PeopleList,
  type Person,
  type Relationship,
  type RelationshipCreateInput,
  type RelationshipPatchInput,
  type RelationshipWithPeople,
} from '@pleiad/api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { PEOPLE_QUERY_KEY } from '@/lib/people/hooks'
import { showToast } from '@/lib/toast'

/**
 * Relationships data layer — F5/F6. Query ['relationships'] holds the
 * enriched edge list; mutations update it optimistically and roll back on
 * error. A 409 (duplicate pair+type) NEVER toasts here — it surfaces through
 * `onDuplicate` so the caller can route to the existing edge (F5).
 */

export const RELATIONSHIPS_QUERY_KEY = ['relationships'] as const

export interface UseRelationshipsResult {
  relationships: RelationshipWithPeople[]
  isPending: boolean
  isError: boolean
  isRefetching: boolean
  refetch: () => void
}

export function useRelationships(): UseRelationshipsResult {
  const query = useQuery<RelationshipWithPeople[]>({
    queryKey: RELATIONSHIPS_QUERY_KEY,
    queryFn: () => api.relationships.list(),
  })

  return {
    relationships: query.data ?? [],
    isPending: query.isPending,
    isError: query.isError,
    isRefetching: query.isRefetching,
    refetch: () => void query.refetch(),
  }
}

interface RelationshipCallbacks {
  /** 409 — this pair already holds this bond; navigate to the existing edge. */
  onDuplicate?: () => void
  /** Server confirmed — the edge is real. */
  onServerSuccess?: (relationship: Relationship) => void
}

function isDuplicate(error: unknown): boolean {
  return error instanceof PleiadApiError && error.status === 409
}

interface OptimisticContext {
  previous: RelationshipWithPeople[] | undefined
}

const OPTIMISTIC_PREFIX = 'optimistic-'

export function useCreateRelationship(callbacks?: RelationshipCallbacks) {
  const queryClient = useQueryClient()

  return useMutation<Relationship, unknown, RelationshipCreateInput, OptimisticContext>({
    mutationFn: (input) => api.relationships.create(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: RELATIONSHIPS_QUERY_KEY })
      const previous = queryClient.getQueryData<RelationshipWithPeople[]>(
        RELATIONSHIPS_QUERY_KEY
      )

      // The enriched shape needs both Person rows — read them from the
      // people cache. If either is missing (shouldn't happen from the map),
      // skip the optimistic insert; the settled invalidation still lands.
      const people = queryClient.getQueryData<PeopleList>(PEOPLE_QUERY_KEY)?.people ?? []
      const person1: Person | undefined = people.find(
        (person) => person.id === input.person1_id
      )
      const person2: Person | undefined = people.find(
        (person) => person.id === input.person2_id
      )

      if (person1 !== undefined && person2 !== undefined) {
        const now = new Date().toISOString()
        const optimistic: RelationshipWithPeople = {
          id: `${OPTIMISTIC_PREFIX}${Date.now()}`,
          owner_id: person1.owner_id,
          person1_id: input.person1_id,
          person2_id: input.person2_id,
          type: input.type,
          subtype: input.subtype ?? null,
          bidirectional: input.bidirectional ?? true,
          strength: (input.strength ?? 3) as Relationship['strength'],
          start_date: input.start_date ?? null,
          end_date: input.end_date ?? null,
          notes: input.notes ?? null,
          created_at: now,
          updated_at: now,
          person1,
          person2,
        }
        queryClient.setQueryData<RelationshipWithPeople[]>(
          RELATIONSHIPS_QUERY_KEY,
          (list) => [...(list ?? []), optimistic]
        )
      }
      return { previous }
    },
    onError: (error, _input, context) => {
      queryClient.setQueryData(RELATIONSHIPS_QUERY_KEY, context?.previous)
      if (isDuplicate(error)) {
        callbacks?.onDuplicate?.()
        return
      }
      showToast("The bond didn't hold. Try again.")
    },
    onSuccess: (relationship) => {
      queryClient.setQueryData<RelationshipWithPeople[]>(
        RELATIONSHIPS_QUERY_KEY,
        (list) =>
          (list ?? []).map((edge) =>
            edge.id.startsWith(OPTIMISTIC_PREFIX) &&
            edge.person1_id === relationship.person1_id &&
            edge.person2_id === relationship.person2_id &&
            edge.type === relationship.type
              ? { ...edge, ...relationship }
              : edge
          )
      )
      callbacks?.onServerSuccess?.(relationship)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: RELATIONSHIPS_QUERY_KEY })
    },
  })
}

export interface UpdateRelationshipVariables {
  id: string
  updates: RelationshipPatchInput
}

export function useUpdateRelationship(callbacks?: RelationshipCallbacks) {
  const queryClient = useQueryClient()

  return useMutation<Relationship, unknown, UpdateRelationshipVariables, OptimisticContext>({
    mutationFn: ({ id, updates }) => api.relationships.update(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: RELATIONSHIPS_QUERY_KEY })
      const previous = queryClient.getQueryData<RelationshipWithPeople[]>(
        RELATIONSHIPS_QUERY_KEY
      )
      queryClient.setQueryData<RelationshipWithPeople[]>(RELATIONSHIPS_QUERY_KEY, (list) =>
        (list ?? []).map((edge) =>
          edge.id === id
            ? {
                ...edge,
                ...updates,
                // zod widens strength to number; the API guarantees 1–5.
                strength: (updates.strength ?? edge.strength) as Relationship['strength'],
                updated_at: new Date().toISOString(),
              }
            : edge
        )
      )
      return { previous }
    },
    onError: (error, _variables, context) => {
      queryClient.setQueryData(RELATIONSHIPS_QUERY_KEY, context?.previous)
      if (isDuplicate(error)) {
        callbacks?.onDuplicate?.()
        return
      }
      showToast("The change didn't hold. Try again.")
    },
    onSuccess: (relationship) => {
      queryClient.setQueryData<RelationshipWithPeople[]>(RELATIONSHIPS_QUERY_KEY, (list) =>
        (list ?? []).map((edge) =>
          edge.id === relationship.id ? { ...edge, ...relationship } : edge
        )
      )
      callbacks?.onServerSuccess?.(relationship)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: RELATIONSHIPS_QUERY_KEY })
    },
  })
}

export function useDeleteRelationship() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, string, OptimisticContext>({
    mutationFn: (id) => api.relationships.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: RELATIONSHIPS_QUERY_KEY })
      const previous = queryClient.getQueryData<RelationshipWithPeople[]>(
        RELATIONSHIPS_QUERY_KEY
      )
      queryClient.setQueryData<RelationshipWithPeople[]>(RELATIONSHIPS_QUERY_KEY, (list) =>
        (list ?? []).filter((edge) => edge.id !== id)
      )
      return { previous }
    },
    onError: (_error, _id, context) => {
      queryClient.setQueryData(RELATIONSHIPS_QUERY_KEY, context?.previous)
      showToast("Couldn't release the bond. Try again.")
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: RELATIONSHIPS_QUERY_KEY })
    },
  })
}
