'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useComputedResults } from './use-computed-results'
import { track } from '@/lib/analytics/posthog'
import { fetchJson, jsonInit } from '@/lib/http/json'
import { cacheMutation } from '@/lib/query/cache-mutation'
import { QUERY_KEYS } from '@/lib/query/keys'
import { ascendingBy, dropRow, patchRow, replaceRow, sortedBy, upsertRow, within, type Placement } from '@/lib/query/list-ops'

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

/** User-entered personality frameworks (#75) — engine PersonalityProfile. */
export interface PersonPersonality {
  mbti?: string | null
  enneagram?: string | null
  disc?: string | null
  attachment?: string | null
  loveLanguages?: string[] | null
  bigFive?: Partial<Record<'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'neuroticism', number>> | null
  viaStrengths?: string[] | null
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
  personality: PersonPersonality | null
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
  personality?: PersonPersonality | null
}
export type PersonUpdate = Partial<PersonInsert> & { deleted_at?: string | null }

export interface PersonWithTags extends Person {
  tags: Tag[]
}

type PeopleData = { people: PersonWithTags[]; tags: Tag[] }

const PEOPLE_ORDER = sortedBy(ascendingBy<PersonWithTags>((p) => p.name))

/** Shown by name, fetched and settled rows alike; module-level so the query memoises it. */
const showPeople = (data: PeopleData): PeopleData => ({ ...data, people: PEOPLE_ORDER(data.people) })

const inPeople = within<PeopleData, readonly PersonWithTags[]>(
  (data) => data.people,
  (data, people) => ({ ...data, people: [...people] })
)

const tagsWithIds = (tags: readonly Tag[], ids: readonly string[]): Tag[] => tags.filter((t) => ids.includes(t.id))

/** The server's person as the list shows it, with tags from the cache: the ones just set, else the ones it had. */
const listed = (person: Person, data: PeopleData, tagIds?: readonly string[]): PersonWithTags => ({
  ...person,
  tags: tagIds ? tagsWithIds(data.tags, tagIds) : (data.people.find((p) => p.id === person.id)?.tags ?? []),
})

const placePerson = (place: Placement) => (person: Person, tagIds?: readonly string[]) => (data: PeopleData): PeopleData => ({
  ...data,
  people: [...place(listed(person, data, tagIds))(data.people)],
})

/** Relationship and group rows embed people, so a person's change refreshes them too. */
const EMBEDDING = [QUERY_KEYS.relationships, QUERY_KEYS.groups]

const ADD = cacheMutation<PeopleData, { person: Omit<PersonInsert, 'owner_id'>; tagIds: string[] }, Person>({
  key: QUERY_KEYS.people,
  request: async (body) => (await fetchJson<{ person: Person }>('/api/people', jsonInit('POST', body))).person,
  settle: (created, { tagIds }) => placePerson(upsertRow)(created, tagIds),
})

const UPDATE = cacheMutation<PeopleData, { id: string; updates: PersonUpdate; tagIds?: string[] }, Person>({
  key: QUERY_KEYS.people,
  request: async ({ id, updates, tagIds }) =>
    (await fetchJson<{ person: Person }>(`/api/people/${id}`, jsonInit('PATCH', { updates, tagIds }))).person,
  optimistic: ({ id, updates, tagIds }) => (data) =>
    inPeople(patchRow<PersonWithTags>(id, { ...updates, ...(tagIds ? { tags: tagsWithIds(data.tags, tagIds) } : {}) }))(data),
  settle: (person, { tagIds }) => placePerson(replaceRow)(person, tagIds),
  also: EMBEDDING,
})

const REMOVE = cacheMutation<PeopleData, string, unknown>({
  key: QUERY_KEYS.people,
  request: (id) => fetchJson(`/api/people/${id}`, { method: 'DELETE' }),
  optimistic: (id) => inPeople(dropRow<PersonWithTags>(id)),
  also: EMBEDDING,
})

const RESTORE = cacheMutation<PeopleData, string, unknown>({
  key: QUERY_KEYS.people,
  request: (id) => fetchJson(`/api/people/${id}`, jsonInit('PATCH', { action: 'restore' })),
  also: EMBEDDING,
})

const ERASE = cacheMutation<PeopleData, string, unknown>({
  key: QUERY_KEYS.people,
  request: (id) => fetchJson(`/api/people/${id}?permanent=true`, { method: 'DELETE' }),
  optimistic: (id) => inPeople(dropRow<PersonWithTags>(id)),
  also: EMBEDDING,
})

const reportReadings = (error: unknown) => console.error('Storing readings failed; the person page computes them on its first visit:', error)

export function usePeople() {
  const queryClient = useQueryClient()

  // Cached (and persisted — see query-provider) server state. `loading` is
  // true only when there's nothing to show yet: a restored cache renders
  // immediately while a background refetch runs.
  const query = useQuery({
    queryKey: QUERY_KEYS.people,
    queryFn: ({ signal }) => fetchJson<PeopleData>('/api/people', { signal }),
    select: showPeople,
  })

  const { computeAndStore, invalidateResults } = useComputedResults()

  const fetchPeople = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: QUERY_KEYS.people })
  }, [queryClient])

  // Mutators resolve on the server's answer, already written into the list
  // (docs/perf/APP_PERFORMANCE_PROMPT.md "Mutations answer from the cache").
  // Readings are computed and stored after, off the critical path.
  const { mutateAsync: add } = useMutation(ADD)
  const { mutateAsync: update } = useMutation(UPDATE)
  const { mutateAsync: remove } = useMutation(REMOVE)
  const { mutateAsync: restore } = useMutation(RESTORE)
  const { mutateAsync: erase } = useMutation(ERASE)

  const addPerson = useCallback(
    async (person: Omit<PersonInsert, 'owner_id'>, tagIds: string[] = []) => {
      const created = await add({ person, tagIds })
      track('person_created', { is_self: created.is_self })
      void computeAndStore(created.id, { birthDate: created.birth_date, hebrewName: created.hebrew_name }).catch(reportReadings)
      return created
    },
    [add, computeAndStore]
  )

  const updatePerson = useCallback(
    async (id: string, updates: PersonUpdate, tagIds?: string[]) => {
      const person = await update({ id, updates, tagIds })
      if (updates.birth_date) {
        void invalidateResults(id)
          .then(() => computeAndStore(id, { birthDate: person.birth_date, hebrewName: person.hebrew_name }))
          .catch(reportReadings)
      }
      return person
    },
    [update, invalidateResults, computeAndStore]
  )

  const deletePerson = useCallback(async (id: string) => {
    await remove(id)
  }, [remove])
  const restorePerson = useCallback(async (id: string) => {
    await restore(id)
  }, [restore])
  const permanentlyDeletePerson = useCallback(async (id: string) => {
    await erase(id)
  }, [erase])

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
