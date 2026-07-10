import {
  PleiadApiError,
  type PeopleList,
  type Person,
  type PersonCreateInput,
  type PersonPatchInput,
  type PersonWithTags,
  type Tag,
} from '@pleiad/api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { maybePromptForPush } from '@/lib/notifications/opt-in'
import { writeBehindComputedResults } from '@/lib/people/compute'
import { showToast } from '@/lib/toast'

/**
 * People data layer — F3/S6. Query ['people'] holds the full PeopleList;
 * mutations update it optimistically and roll back on error. A 403
 * `limit_exceeded` NEVER toasts — it surfaces through `onLimitExceeded` so
 * the UI opens the paywall (cross-flow rule in USER_FLOWS.md).
 */

export const PEOPLE_QUERY_KEY = ['people'] as const

/** Draft fields for create — the `person` body of POST /api/people. */
export type PersonDraftInput = PersonCreateInput['person']

/** Update payload for PATCH /api/people/[id]. */
export type PersonUpdates = NonNullable<Omit<PersonPatchInput, 'action'>['updates']>

export interface UsePeopleResult {
  /** Living people (soft-deleted rows filtered), self first, then by name. */
  people: PersonWithTags[]
  tags: Tag[]
  isPending: boolean
  isError: boolean
  isRefetching: boolean
  refetch: () => void
}

export function usePeople(): UsePeopleResult {
  const query = useQuery<PeopleList>({
    queryKey: PEOPLE_QUERY_KEY,
    queryFn: () => api.people.list(),
  })

  const people = (query.data?.people ?? [])
    .filter((person) => person.deleted_at === null)
    .sort((a, b) => {
      if (a.is_self !== b.is_self) return a.is_self ? -1 : 1
      return a.name.localeCompare(b.name)
    })

  return {
    people,
    tags: query.data?.tags ?? [],
    isPending: query.isPending,
    isError: query.isError,
    isRefetching: query.isRefetching,
    refetch: () => void query.refetch(),
  }
}

interface MutationCallbacks {
  /** 403 code 'limit_exceeded' — open the paywall; the cache is rolled back. */
  onLimitExceeded?: () => void
  /** Server confirmed — safe to clear retained drafts. */
  onServerSuccess?: (person: Person) => void
}

function isLimitExceeded(error: unknown): boolean {
  return error instanceof PleiadApiError && error.isLimitExceeded
}

function patchPeopleCache(
  list: PeopleList | undefined,
  mutate: (people: PersonWithTags[]) => PersonWithTags[]
): PeopleList | undefined {
  if (list === undefined) return undefined
  return { ...list, people: mutate(list.people) }
}

interface OptimisticContext {
  previous: PeopleList | undefined
}

export function useCreatePerson(callbacks?: MutationCallbacks) {
  const queryClient = useQueryClient()

  return useMutation<Person, unknown, PersonDraftInput, OptimisticContext>({
    mutationFn: (draft) => api.people.create({ person: draft }),
    onMutate: async (draft) => {
      await queryClient.cancelQueries({ queryKey: PEOPLE_QUERY_KEY })
      const previous = queryClient.getQueryData<PeopleList>(PEOPLE_QUERY_KEY)

      const now = new Date().toISOString()
      const optimistic: PersonWithTags = {
        id: `optimistic-${Date.now()}`,
        owner_id: '',
        name: draft.name,
        hebrew_name: draft.hebrew_name ?? null,
        birth_date: draft.birth_date,
        birth_time: draft.birth_time ?? null,
        birth_place: draft.birth_place ?? null,
        avatar_url: draft.avatar_url ?? null,
        notes: draft.notes ?? null,
        is_self: false,
        deleted_at: null,
        created_at: now,
        updated_at: now,
        tags: [],
      }

      queryClient.setQueryData<PeopleList>(
        PEOPLE_QUERY_KEY,
        (list) =>
          patchPeopleCache(list, (people) => [...people, optimistic]) ?? {
            people: [optimistic],
            tags: [],
          }
      )
      return { previous }
    },
    onError: (error, _draft, context) => {
      queryClient.setQueryData(PEOPLE_QUERY_KEY, context?.previous)
      if (isLimitExceeded(error)) {
        callbacks?.onLimitExceeded?.()
        return
      }
      showToast("Couldn't save them to your map. Try again.")
    },
    onSuccess: (person) => {
      // Replace the optimistic row with the server person, then write the
      // computed rows behind the save (retries + silence live in compute.ts).
      queryClient.setQueryData<PeopleList>(PEOPLE_QUERY_KEY, (list) =>
        patchPeopleCache(list, (people) => [
          ...people.filter((p) => !p.id.startsWith('optimistic-')),
          { ...person, tags: [] },
        ])
      )
      writeBehindComputedResults(person.id, person)
      callbacks?.onServerSuccess?.(person)
      // F9 opt-in moment: the first person is on the map — the one sanctioned
      // time to invite the morning digest (never on launch; self-guarding).
      void maybePromptForPush()
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: PEOPLE_QUERY_KEY })
    },
  })
}

export interface UpdatePersonVariables {
  id: string
  updates: PersonUpdates
}

export function useUpdatePerson(callbacks?: MutationCallbacks) {
  const queryClient = useQueryClient()

  return useMutation<Person, unknown, UpdatePersonVariables, OptimisticContext>({
    mutationFn: ({ id, updates }) => api.people.update(id, { updates }),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: PEOPLE_QUERY_KEY })
      const previous = queryClient.getQueryData<PeopleList>(PEOPLE_QUERY_KEY)
      queryClient.setQueryData<PeopleList>(PEOPLE_QUERY_KEY, (list) =>
        patchPeopleCache(list, (people) =>
          people.map((person) =>
            person.id === id
              ? { ...person, ...updates, updated_at: new Date().toISOString() }
              : person
          )
        )
      )
      return { previous }
    },
    onError: (error, _variables, context) => {
      queryClient.setQueryData(PEOPLE_QUERY_KEY, context?.previous)
      if (isLimitExceeded(error)) {
        callbacks?.onLimitExceeded?.()
        return
      }
      showToast("The change didn't hold. Try again.")
    },
    onSuccess: (person) => {
      queryClient.setQueryData<PeopleList>(PEOPLE_QUERY_KEY, (list) =>
        patchPeopleCache(list, (people) =>
          people.map((existing) =>
            existing.id === person.id ? { ...existing, ...person } : existing
          )
        )
      )
      // Birth data may have changed — recompute every system row.
      writeBehindComputedResults(person.id, person)
      callbacks?.onServerSuccess?.(person)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: PEOPLE_QUERY_KEY })
    },
  })
}

export function useDeletePerson() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, string, OptimisticContext>({
    mutationFn: (id) => api.people.delete(id), // soft delete
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: PEOPLE_QUERY_KEY })
      const previous = queryClient.getQueryData<PeopleList>(PEOPLE_QUERY_KEY)
      queryClient.setQueryData<PeopleList>(PEOPLE_QUERY_KEY, (list) =>
        patchPeopleCache(list, (people) => people.filter((person) => person.id !== id))
      )
      return { previous }
    },
    onError: (_error, _id, context) => {
      queryClient.setQueryData(PEOPLE_QUERY_KEY, context?.previous)
      showToast("Couldn't remove them. Try again.")
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: PEOPLE_QUERY_KEY })
    },
  })
}
