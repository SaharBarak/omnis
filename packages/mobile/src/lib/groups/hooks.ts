import type {
  Group,
  GroupCreateInput,
  GroupMember,
  GroupPatchInput,
  GroupWithMembers,
  PeopleList,
} from '@pleiad/api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { PEOPLE_QUERY_KEY } from '@/lib/people/hooks'
import { showToast } from '@/lib/toast'

/**
 * Circles data layer — F7/S11. Query ['groups'] holds the group list;
 * ['groups', id] holds one group with its member projections (shared by the
 * list rows' avatar stacks and the S12 analysis screen). Mutations update
 * optimistically and roll back on error, mirroring relationships/hooks.ts.
 */

export const GROUPS_QUERY_KEY = ['groups'] as const

export function groupQueryKey(id: string): readonly [string, string] {
  return ['groups', id] as const
}

const OPTIMISTIC_PREFIX = 'optimistic-'

export interface UseGroupsResult {
  groups: Group[]
  isPending: boolean
  isError: boolean
  isRefetching: boolean
  refetch: () => void
}

export function useGroups(): UseGroupsResult {
  const query = useQuery<Group[]>({
    queryKey: GROUPS_QUERY_KEY,
    queryFn: () => api.groups.list(),
  })

  const groups = [...(query.data ?? [])].sort((a, b) => a.name.localeCompare(b.name))

  return {
    groups,
    isPending: query.isPending,
    isError: query.isError,
    isRefetching: query.isRefetching,
    refetch: () => void query.refetch(),
  }
}

export interface UseGroupResult {
  group: GroupWithMembers | undefined
  isPending: boolean
  isError: boolean
  isRefetching: boolean
  refetch: () => void
}

/** One circle with member projections — the S12 source. */
export function useGroup(id: string | undefined): UseGroupResult {
  const query = useQuery<GroupWithMembers>({
    queryKey: groupQueryKey(id ?? ''),
    queryFn: () => api.groups.get(id ?? ''),
    enabled: id !== undefined && id.length > 0 && !id.startsWith(OPTIMISTIC_PREFIX),
  })

  return {
    group: query.data,
    isPending: query.isPending,
    isError: query.isError,
    isRefetching: query.isRefetching,
    refetch: () => void query.refetch(),
  }
}

interface GroupCallbacks {
  /** Server confirmed — the circle is real (safe to navigate/reset). */
  onServerSuccess?: (group: Group) => void
}

interface ListContext {
  previous: Group[] | undefined
}

/** Project people-cache rows into the member shape GET /api/groups/[id] returns. */
function membersFromPeopleCache(
  queryClient: ReturnType<typeof useQueryClient>,
  personIds: string[]
): GroupMember[] {
  const people = queryClient.getQueryData<PeopleList>(PEOPLE_QUERY_KEY)?.people ?? []
  const now = new Date().toISOString()
  return personIds.flatMap((personId) => {
    const person = people.find((candidate) => candidate.id === personId)
    if (person === undefined) return []
    return [
      {
        id: person.id,
        name: person.name,
        hebrew_name: person.hebrew_name,
        birth_date: person.birth_date,
        birth_time: person.birth_time,
        birth_place:
          person.birth_place != null
            ? { lat: person.birth_place.lat ?? null, lng: person.birth_place.lng ?? null }
            : null,
        added_at: now,
      },
    ]
  })
}

export function useCreateGroup(callbacks?: GroupCallbacks) {
  const queryClient = useQueryClient()

  return useMutation<Group, unknown, GroupCreateInput, ListContext>({
    mutationFn: (input) => api.groups.create(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: GROUPS_QUERY_KEY, exact: true })
      const previous = queryClient.getQueryData<Group[]>(GROUPS_QUERY_KEY)

      const now = new Date().toISOString()
      const optimistic: Group = {
        id: `${OPTIMISTIC_PREFIX}${Date.now()}`,
        owner_id: '',
        name: input.name,
        description: input.description ?? null,
        created_at: now,
        updated_at: now,
      }
      queryClient.setQueryData<Group[]>(GROUPS_QUERY_KEY, (list) => [
        ...(list ?? []),
        optimistic,
      ])
      return { previous }
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(GROUPS_QUERY_KEY, context?.previous)
      showToast("The circle didn't form. Try again.")
    },
    onSuccess: (group, input) => {
      queryClient.setQueryData<Group[]>(GROUPS_QUERY_KEY, (list) => [
        ...(list ?? []).filter((row) => !row.id.startsWith(OPTIMISTIC_PREFIX)),
        group,
      ])
      // Seed the detail cache from the people we already hold so the circle
      // opens instantly; the settled invalidation reconciles with the server.
      queryClient.setQueryData<GroupWithMembers>(groupQueryKey(group.id), {
        ...group,
        members: membersFromPeopleCache(queryClient, input.personIds ?? []),
      })
      callbacks?.onServerSuccess?.(group)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY })
    },
  })
}

export interface UpdateGroupVariables {
  id: string
  updates: GroupPatchInput
}

interface UpdateContext {
  previous: Group[] | undefined
  previousDetail: GroupWithMembers | undefined
}

export function useUpdateGroup(callbacks?: GroupCallbacks) {
  const queryClient = useQueryClient()

  return useMutation<Group, unknown, UpdateGroupVariables, UpdateContext>({
    mutationFn: ({ id, updates }) => api.groups.update(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: GROUPS_QUERY_KEY })
      const previous = queryClient.getQueryData<Group[]>(GROUPS_QUERY_KEY)
      const previousDetail = queryClient.getQueryData<GroupWithMembers>(groupQueryKey(id))

      const now = new Date().toISOString()
      queryClient.setQueryData<Group[]>(GROUPS_QUERY_KEY, (list) =>
        (list ?? []).map((row) =>
          row.id === id ? { ...row, ...updates, updated_at: now } : row
        )
      )
      if (previousDetail !== undefined) {
        queryClient.setQueryData<GroupWithMembers>(groupQueryKey(id), {
          ...previousDetail,
          ...updates,
          updated_at: now,
        })
      }
      return { previous, previousDetail }
    },
    onError: (_error, variables, context) => {
      queryClient.setQueryData(GROUPS_QUERY_KEY, context?.previous)
      queryClient.setQueryData(groupQueryKey(variables.id), context?.previousDetail)
      showToast("The change didn't hold. Try again.")
    },
    onSuccess: (group) => {
      queryClient.setQueryData<Group[]>(GROUPS_QUERY_KEY, (list) =>
        (list ?? []).map((row) => (row.id === group.id ? { ...row, ...group } : row))
      )
      callbacks?.onServerSuccess?.(group)
    },
    onSettled: (_group, _error, variables) => {
      void queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY, exact: true })
      void queryClient.invalidateQueries({ queryKey: groupQueryKey(variables.id) })
    },
  })
}

export function useDeleteGroup() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, string, ListContext>({
    mutationFn: (id) => api.groups.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: GROUPS_QUERY_KEY })
      const previous = queryClient.getQueryData<Group[]>(GROUPS_QUERY_KEY)
      queryClient.setQueryData<Group[]>(GROUPS_QUERY_KEY, (list) =>
        (list ?? []).filter((row) => row.id !== id)
      )
      queryClient.removeQueries({ queryKey: groupQueryKey(id) })
      return { previous }
    },
    onError: (_error, _id, context) => {
      queryClient.setQueryData(GROUPS_QUERY_KEY, context?.previous)
      showToast("Couldn't dissolve the circle. Try again.")
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY, exact: true })
    },
  })
}

export interface SetGroupMembersVariables {
  id: string
  personIds: string[]
}

interface MembersContext {
  previousDetail: GroupWithMembers | undefined
}

/** POST /api/groups/[id]/members with personIds — REPLACES the member set. */
export function useSetGroupMembers() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, SetGroupMembersVariables, MembersContext>({
    mutationFn: ({ id, personIds }) => api.groups.setMembers(id, personIds),
    onMutate: async ({ id, personIds }) => {
      await queryClient.cancelQueries({ queryKey: groupQueryKey(id) })
      const previousDetail = queryClient.getQueryData<GroupWithMembers>(groupQueryKey(id))
      if (previousDetail !== undefined) {
        queryClient.setQueryData<GroupWithMembers>(groupQueryKey(id), {
          ...previousDetail,
          members: membersFromPeopleCache(queryClient, personIds),
        })
      }
      return { previousDetail }
    },
    onError: (_error, variables, context) => {
      queryClient.setQueryData(groupQueryKey(variables.id), context?.previousDetail)
      showToast("The circle didn't change. Try again.")
    },
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({ queryKey: groupQueryKey(variables.id) })
    },
  })
}
