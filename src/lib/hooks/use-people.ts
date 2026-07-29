'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useComputedResults } from './use-computed-results'
import { track } from '@/lib/analytics/posthog'

// Client-facing shapes mirror the original Supabase row contract (nullable,
// never undefined) so existing consumers keep type-checking. The server
// serializer guarantees these shapes at runtime.
export interface Tag {
  id: string
  owner_id: string | null
  name: string
  hebrew_name: string
  color: string
  is_system: boolean
  sort_order: number
  created_at: string
}

export interface Person {
  id: string
  owner_id: string
  name: string
  hebrew_name: string | null
  birth_date: string
  birth_time: string | null
  birth_place: { lat?: number; lng?: number; name?: string } | null
  avatar_url: string | null
  notes: string | null
  is_self: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface PersonInsert {
  name: string
  birth_date: string
  hebrew_name?: string | null
  birth_time?: string | null
  birth_place?: { lat?: number; lng?: number; name?: string } | null
  avatar_url?: string | null
  notes?: string | null
  is_self?: boolean
  owner_id?: string
}
export type PersonUpdate = Partial<PersonInsert> & { deleted_at?: string | null }

export interface PersonWithTags extends Person {
  tags: Tag[]
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...init })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const PEOPLE_QUERY_KEY = ['people'] as const

export function usePeople() {
  const queryClient = useQueryClient()

  // Cached (and persisted — see query-provider) server state. `loading` is
  // true only when there's nothing to show yet: a restored cache renders
  // immediately while a background refetch runs.
  const query = useQuery({
    queryKey: PEOPLE_QUERY_KEY,
    queryFn: () =>
      fetchJson<{ people: PersonWithTags[]; tags: Tag[] }>('/api/people'),
  })

  const { computeAndStore, invalidateResults } = useComputedResults()

  // Mutators await the refetch before resolving, mirroring the previous
  // hand-rolled behavior that callers rely on (dialogs close on fresh data).
  const fetchPeople = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: PEOPLE_QUERY_KEY })
  }, [queryClient])

  const addPerson = useCallback(
    async (person: Omit<PersonInsert, 'owner_id'>, tagIds: string[] = []) => {
      const { person: created } = await fetchJson<{ person: Person }>(
        '/api/people',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ person, tagIds }),
        }
      )
      track('person_created', { is_self: created.is_self })
      await computeAndStore(created.id, {
        birthDate: created.birth_date,
        hebrewName: created.hebrew_name,
      })
      await fetchPeople()
      return created
    },
    [fetchPeople, computeAndStore]
  )

  const updatePerson = useCallback(
    async (id: string, updates: PersonUpdate, tagIds?: string[]) => {
      const { person } = await fetchJson<{ person: Person }>(
        `/api/people/${id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates, tagIds }),
        }
      )
      if (updates.birth_date) {
        await invalidateResults(id)
        await computeAndStore(id, {
          birthDate: person.birth_date,
          hebrewName: person.hebrew_name,
        })
      }
      await fetchPeople()
      return person
    },
    [fetchPeople, invalidateResults, computeAndStore]
  )

  const deletePerson = useCallback(
    async (id: string) => {
      await fetchJson(`/api/people/${id}`, { method: 'DELETE' })
      await fetchPeople()
    },
    [fetchPeople]
  )

  const restorePerson = useCallback(
    async (id: string) => {
      await fetchJson(`/api/people/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore' }),
      })
      await fetchPeople()
    },
    [fetchPeople]
  )

  const permanentlyDeletePerson = useCallback(
    async (id: string) => {
      await fetchJson(`/api/people/${id}?permanent=true`, { method: 'DELETE' })
      await fetchPeople()
    },
    [fetchPeople]
  )

  return {
    people: query.data?.people ?? [],
    tags: query.data?.tags ?? [],
    loading: query.isPending,
    error: query.error ? query.error.message : null,
    fetchPeople,
    addPerson,
    updatePerson,
    deletePerson,
    restorePerson,
    permanentlyDeletePerson,
  }
}
