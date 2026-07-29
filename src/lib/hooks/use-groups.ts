'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { track } from '@/lib/analytics/posthog'
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

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...init })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const GROUPS_QUERY_KEY = ['groups'] as const

export function useGroups(): UseGroupsReturn {
  const queryClient = useQueryClient()

  // Cached (and persisted — see query-provider) server state. `loading` is
  // true only when there's nothing to show yet: a restored cache renders
  // immediately while a background refetch runs.
  const query = useQuery({
    queryKey: GROUPS_QUERY_KEY,
    queryFn: () => fetchJson<{ groups: Group[] }>('/api/groups'),
  })

  // Mutators await the refetch before resolving, mirroring the previous
  // hand-rolled behavior that callers rely on (dialogs close on fresh data).
  const fetchGroups = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: GROUPS_QUERY_KEY })
  }, [queryClient])

  // Get a group with its members. Cached under a per-group key; staleTime 0
  // keeps the original always-fetch-on-call behavior despite the provider's
  // 60s default. A 404 resolves to null (not an error), as before.
  const getGroupWithMembers = useCallback(
    async (groupId: string): Promise<GroupWithMembers | null> =>
      queryClient.fetchQuery({
        queryKey: [...GROUPS_QUERY_KEY, groupId] as const,
        queryFn: async (): Promise<GroupWithMembers | null> => {
          const res = await fetch(
            `/api/groups/${encodeURIComponent(groupId)}`,
            { credentials: 'include' }
          )
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

  // Create a new group
  const createGroup = useCallback(
    async (input: CreateGroupInput): Promise<Group> => {
      const { group } = await fetchJson<{ group: Group }>('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: input.name,
          description: input.description,
          personIds: input.personIds,
        }),
      })
      // North Star input: the lead "fused group dynamics" action.
      track('group_created', { members: input.personIds?.length ?? 0 })
      await fetchGroups()
      return group
    },
    [fetchGroups]
  )

  // Update a group
  const updateGroup = useCallback(
    async (id: string, input: UpdateGroupInput): Promise<Group> => {
      const { group } = await fetchJson<{ group: Group }>(
        `/api/groups/${encodeURIComponent(id)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        }
      )
      await fetchGroups()
      return group
    },
    [fetchGroups]
  )

  // Delete a group
  const deleteGroup = useCallback(
    async (id: string): Promise<void> => {
      await fetchJson(`/api/groups/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      await fetchGroups()
    },
    [fetchGroups]
  )

  // Add a member to a group
  const addMemberToGroup = useCallback(
    async (groupId: string, personId: string): Promise<void> => {
      await fetchJson(`/api/groups/${encodeURIComponent(groupId)}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId }),
      })
    },
    []
  )

  // Remove a member from a group
  const removeMemberFromGroup = useCallback(
    async (groupId: string, personId: string): Promise<void> => {
      await fetchJson(
        `/api/groups/${encodeURIComponent(groupId)}/members?personId=${encodeURIComponent(personId)}`,
        { method: 'DELETE' }
      )
    },
    []
  )

  // Set all members of a group (replaces existing)
  const setGroupMembers = useCallback(
    async (groupId: string, personIds: string[]): Promise<void> => {
      await fetchJson(`/api/groups/${encodeURIComponent(groupId)}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personIds }),
      })
    },
    []
  )

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
