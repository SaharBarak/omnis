'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { fetchJson, jsonInit } from '@/lib/http/json'
import { cacheMutation } from '@/lib/query/cache-mutation'
import { QUERY_KEYS } from '@/lib/query/keys'
import { dropRow, newestBy, patchRow, sortedBy, upsertRow, within } from '@/lib/query/list-ops'
import type {
  RelationshipType,
  RelationshipWithPeople,
  RelationshipFromPerson,
  CreateRelationshipInput,
  UpdateRelationshipInput,
} from '@/lib/types/relationship'

// Client-facing shapes mirror the original Supabase row contract (nullable,
// never undefined) so existing consumers keep type-checking. The server
// serializer guarantees these shapes at runtime.
export interface Relationship {
  id: string
  owner_id: string
  person1_id: string
  person2_id: string
  type: RelationshipType
  subtype: string | null
  bidirectional: boolean
  strength: number
  start_date: string | null
  end_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

interface UseRelationshipsState {
  relationships: RelationshipWithPeople[]
  loading: boolean
  error: string | null
}

interface UseRelationshipsReturn extends UseRelationshipsState {
  fetchRelationships: () => Promise<void>
  addRelationship: (input: CreateRelationshipInput) => Promise<Relationship>
  updateRelationship: (id: string, input: UpdateRelationshipInput) => Promise<Relationship>
  deleteRelationship: (id: string) => Promise<void>
  getRelationshipsForPerson: (personId: string) => Promise<RelationshipFromPerson[]>
}

/** The cached shape, as persisted in browsers; kept so restored caches stay readable. */
type RelationshipsData = { relationships: RelationshipWithPeople[] }

const inRelationships = within<RelationshipsData, readonly RelationshipWithPeople[]>(
  (data) => data.relationships,
  (data, relationships) => ({ ...data, relationships: [...relationships] })
)

const RELATIONSHIP_ORDER = sortedBy(newestBy<RelationshipWithPeople>((r) => r.created_at))

/** Newest first, fetched and settled rows alike; module-level so the query memoises it. */
const showRelationships = (data: RelationshipsData): RelationshipsData => ({
  ...data,
  relationships: RELATIONSHIP_ORDER(data.relationships),
})

/** The update's fields in the API's names. */
function relationshipChanges(input: UpdateRelationshipInput): Partial<Relationship> {
  const changes: Partial<Relationship> = {}
  if (input.type !== undefined) changes.type = input.type
  if (input.subtype !== undefined) changes.subtype = input.subtype
  if (input.bidirectional !== undefined) changes.bidirectional = input.bidirectional
  if (input.strength !== undefined) changes.strength = input.strength
  if (input.startDate !== undefined) changes.start_date = input.startDate
  if (input.endDate !== undefined) changes.end_date = input.endDate
  if (input.notes !== undefined) changes.notes = input.notes
  return changes
}

const relationshipPath = (id: string) => `/api/relationships/${id}`

const CREATE = cacheMutation<RelationshipsData, CreateRelationshipInput, RelationshipWithPeople>({
  key: QUERY_KEYS.relationships,
  request: async (input) =>
    (
      await fetchJson<{ relationship: RelationshipWithPeople }>(
        '/api/relationships',
        jsonInit('POST', {
          person1_id: input.person1Id,
          person2_id: input.person2Id,
          type: input.type,
          subtype: input.subtype,
          bidirectional: input.bidirectional ?? true,
          strength: input.strength ?? 3,
          start_date: input.startDate,
          end_date: input.endDate,
          notes: input.notes,
        })
      )
    ).relationship,
  settle: (relationship) => (data) => ({ ...data, relationships: [...upsertRow(relationship)(data.relationships)] }),
})

/** The server's row keeps the people the list already joined; an update cannot change who is in it. */
const UPDATE = cacheMutation<RelationshipsData, { id: string; input: UpdateRelationshipInput }, Relationship>({
  key: QUERY_KEYS.relationships,
  request: async ({ id, input }) =>
    (await fetchJson<{ relationship: Relationship }>(relationshipPath(id), jsonInit('PATCH', relationshipChanges(input)))).relationship,
  optimistic: ({ id, input }) => inRelationships(patchRow<RelationshipWithPeople>(id, relationshipChanges(input))),
  settle: (relationship) => (data) => ({
    ...data,
    relationships: data.relationships.map((r) => (r.id === relationship.id ? { ...r, ...relationship } : r)),
  }),
})

const REMOVE = cacheMutation<RelationshipsData, string, unknown>({
  key: QUERY_KEYS.relationships,
  request: (id) => fetchJson(relationshipPath(id), { method: 'DELETE' }),
  optimistic: (id) => inRelationships(dropRow<RelationshipWithPeople>(id)),
})

export function useRelationships(): UseRelationshipsReturn {
  const queryClient = useQueryClient()

  // Cached (and persisted — see query-provider) server state. `loading` is
  // true only when there's nothing to show yet: a restored cache renders
  // immediately while a background refetch runs.
  const query = useQuery({
    queryKey: QUERY_KEYS.relationships,
    queryFn: ({ signal }) => fetchJson<RelationshipsData>('/api/relationships', { signal }),
    select: showRelationships,
  })

  const fetchRelationships = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: QUERY_KEYS.relationships })
  }, [queryClient])

  // Mutators resolve on the server's answer, already written into the list
  // (docs/perf/APP_PERFORMANCE_PROMPT.md "Mutations answer from the cache").
  const { mutateAsync: create } = useMutation(CREATE)
  const { mutateAsync: update } = useMutation(UPDATE)
  const { mutateAsync: remove } = useMutation(REMOVE)

  const addRelationship = useCallback((input: CreateRelationshipInput): Promise<Relationship> => create(input), [create])

  const updateRelationship = useCallback(
    (id: string, input: UpdateRelationshipInput) => update({ id, input }),
    [update]
  )

  const deleteRelationship = useCallback(async (id: string) => {
    await remove(id)
  }, [remove])

  // Get relationships for a specific person (both directions). Cached under a
  // per-person key; staleTime 0 keeps the original always-fetch-on-call
  // behavior despite the provider's 60s default.
  const getRelationshipsForPerson = useCallback(async (personId: string): Promise<RelationshipFromPerson[]> => {
    const { relationships } = await queryClient.fetchQuery({
      queryKey: QUERY_KEYS.relationshipsOf(personId),
      queryFn: ({ signal }) =>
        fetchJson<{ relationships: RelationshipFromPerson[] }>(`/api/relationships/person/${personId}`, { signal }),
      staleTime: 0,
    })
    return relationships
  }, [queryClient])

  return {
    relationships: query.data?.relationships ?? [],
    loading: query.isPending,
    error: query.error ? query.error.message : null,
    fetchRelationships,
    addRelationship,
    updateRelationship,
    deleteRelationship,
    getRelationshipsForPerson,
  }
}

// Utility functions for relationship type handling

export function getRelationshipColor(type: RelationshipType): string {
  const colors: Record<RelationshipType, string> = {
    family: '#EF4444',
    romantic: '#EC4899',
    friend: '#8B5CF6',
    professional: '#3B82F6',
    other: '#6B7280',
  }
  return colors[type]
}

export function getRelationshipLabel(type: RelationshipType, locale: 'he' | 'en' = 'he'): string {
  const labels: Record<RelationshipType, { en: string; he: string }> = {
    family: { en: 'Family', he: 'משפחה' },
    romantic: { en: 'Romantic', he: 'רומנטי' },
    friend: { en: 'Friend', he: 'חברים' },
    professional: { en: 'Professional', he: 'מקצועי' },
    other: { en: 'Other', he: 'אחר' },
  }
  return labels[type][locale]
}
