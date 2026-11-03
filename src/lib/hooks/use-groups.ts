'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { track } from '@/lib/analytics/posthog'
import { fetchJson, jsonInit } from '@/lib/http/json'
import { cacheMutation } from '@/lib/query/cache-mutation'
import { QUERY_KEYS } from '@/lib/query/keys'
import { ascendingBy, dropRow, patchRow, sortedBy, upsertRow, within } from '@/lib/query/list-ops'
import type { Group } from '@/lib/types/database.types'
import type {
  GroupWithMembers,
  CreateGroupInput,
  UpdateGroupInput,
} from '@/lib/types/relationship'

// Client-facing shapes mirror the original Supabase row contract (nullable,
// never undefined) so existing consumers keep type-checking. All DB access
// happens server-side in /api/groups route handlers; this hook is a thin fetch
// client. The `Group` type is still sourced from the Supabase types module
// during the Mongo transition (Phase 4 removes it).

interface UseGroupsState {
  groups: Group[]
  loading: boolean
  error: string | null
}

interface UseGroupsReturn extends UseGroupsState {
  fetchGroups: () => Promise<void>
  getGroupWithMembers: (groupId: string) => Promise<GroupWithMembers | null>
  createGroup: (input: CreateGroupInput) => Promise<Group>
  updateGroup: (id: string, input: UpdateGroupInput) => Promise<Group>
  deleteGroup: (id: string) => Promise<void>
  addMemberToGroup: (groupId: string, personId: string) => Promise<void>
  removeMemberFromGroup: (groupId: string, personId: string) => Promise<void>
  setGroupMembers: (groupId: string, personIds: string[]) => Promise<void>
}

/** The cached shape, as persisted in browsers; kept so restored caches stay readable. */
type GroupsData = { groups: Group[] }

const inGroups = within<GroupsData, readonly Group[]>(
  (data) => data.groups,
  (data, groups) => ({ ...data, groups: [...groups] })
)

const GROUP_ORDER = sortedBy(ascendingBy<Group>((g) => g.name))

/** By name, fetched and settled rows alike; module-level so the query memoises it. */
const showGroups = (data: GroupsData): GroupsData => ({ ...data, groups: GROUP_ORDER(data.groups) })

const settleGroup = (group: Group) => (data: GroupsData): GroupsData => ({ ...data, groups: [...upsertRow(group)(data.groups)] })

const groupPath = (id: string) => `/api/groups/${encodeURIComponent(id)}`

const CREATE = cacheMutation<GroupsData, CreateGroupInput, Group>({
  key: QUERY_KEYS.groups,
  request: async ({ name, description, personIds }) =>
    (await fetchJson<{ group: Group }>('/api/groups', jsonInit('POST', { name, description, personIds }))).group,
  settle: settleGroup,
})

const UPDATE = cacheMutation<GroupsData, { id: string; input: UpdateGroupInput }, Group>({
  key: QUERY_KEYS.groups,
  request: async ({ id, input }) => (await fetchJson<{ group: Group }>(groupPath(id), jsonInit('PATCH', input))).group,
  optimistic: ({ id, input }) => inGroups(patchRow<Group>(id, input)),
  settle: settleGroup,
})

const REMOVE = cacheMutation<GroupsData, string, unknown>({
  key: QUERY_KEYS.groups,
  request: (id) => fetchJson(groupPath(id), { method: 'DELETE' }),
  optimistic: (id) => inGroups(dropRow<Group>(id)),
})

/** A change to a group's members. */
type MemberChange =
  | { readonly groupId: string; readonly add: string }
  | { readonly groupId: string; readonly remove: string }
  | { readonly groupId: string; readonly set: readonly string[] }

const membersPath = (groupId: string) => `${groupPath(groupId)}/members`

const sendMemberChange = (change: MemberChange): Promise<unknown> => {
  if ('add' in change) return fetchJson(membersPath(change.groupId), jsonInit('POST', { personId: change.add }))
  if ('remove' in change) return fetchJson(`${membersPath(change.groupId)}?personId=${encodeURIComponent(change.remove)}`, { method: 'DELETE' })
  return fetchJson(membersPath(change.groupId), jsonInit('POST', { personIds: change.set }))
}

/**
 * Membership writes run under the groups key: the list's refetch waits for
 * them, and each group's member list beneath the key refreshes after them.
 */
const MEMBERS = cacheMutation<GroupsData, MemberChange, unknown>({
  key: QUERY_KEYS.groups,
  request: sendMemberChange,
})

export function useGroups(): UseGroupsReturn {
  const queryClient = useQueryClient()

  // Cached (and persisted — see query-provider) server state. `loading` is
  // true only when there's nothing to show yet: a restored cache renders
  // immediately while a background refetch runs.
  const query = useQuery({
    queryKey: QUERY_KEYS.groups,
    queryFn: ({ signal }) => fetchJson<GroupsData>('/api/groups', { signal }),
    select: showGroups,
  })

  const fetchGroups = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: QUERY_KEYS.groups })
  }, [queryClient])

  // Get a group with its members. Cached under a per-group key; staleTime 0
  // keeps the original always-fetch-on-call behavior despite the provider's
  // 60s default. A 404 resolves to null (not an error), as before.
  const getGroupWithMembers = useCallback(
    async (groupId: string): Promise<GroupWithMembers | null> =>
      queryClient.fetchQuery({
        queryKey: QUERY_KEYS.group(groupId),
        queryFn: async ({ signal }): Promise<GroupWithMembers | null> => {
          const res = await fetch(groupPath(groupId), { credentials: 'include', signal })
          if (res.status === 404) return null
          if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            throw new Error(data.error || `Request failed: ${res.status}`)
          }
          const { group } = (await res.json()) as { group: GroupWithMembers }
          return group
        },
        staleTime: 0,
      }),
    [queryClient]
  )

  // Mutators resolve on the server's answer, already written into the list
  // (docs/perf/APP_PERFORMANCE_PROMPT.md "Mutations answer from the cache").
  const { mutateAsync: create } = useMutation(CREATE)
  const { mutateAsync: update } = useMutation(UPDATE)
  const { mutateAsync: remove } = useMutation(REMOVE)

  const createGroup = useCallback(
    async (input: CreateGroupInput): Promise<Group> => {
      const group = await create(input)
      // North Star input: the lead "fused group dynamics" action.
      track('group_created', { members: input.personIds?.length ?? 0 })
      return group
    },
    [create]
  )

  const updateGroup = useCallback((id: string, input: UpdateGroupInput) => update({ id, input }), [update])

  const deleteGroup = useCallback(async (id: string) => {
    await remove(id)
  }, [remove])

  const { mutateAsync: changeMembers } = useMutation(MEMBERS)

  const addMemberToGroup = useCallback(async (groupId: string, personId: string) => {
    await changeMembers({ groupId, add: personId })
  }, [changeMembers])

  const removeMemberFromGroup = useCallback(async (groupId: string, personId: string) => {
    await changeMembers({ groupId, remove: personId })
  }, [changeMembers])

  const setGroupMembers = useCallback(async (groupId: string, personIds: string[]) => {
    await changeMembers({ groupId, set: personIds })
  }, [changeMembers])

  return {
    groups: query.data?.groups ?? [],
    loading: query.isPending,
    error: query.error ? query.error.message : null,
    fetchGroups,
    getGroupWithMembers,
    createGroup,
    updateGroup,
    deleteGroup,
    addMemberToGroup,
    removeMemberFromGroup,
    setGroupMembers,
  }
}
