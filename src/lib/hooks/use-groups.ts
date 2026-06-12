'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Group } from '@/lib/supabase/database.types'
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

export function useGroups(): UseGroupsReturn {
  const [state, setState] = useState<UseGroupsState>({
    groups: [],
    loading: true,
    error: null,
  })

  // Fetch all groups
  const fetchGroups = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const { groups } = await fetchJson<{ groups: Group[] }>('/api/groups')
      setState({
        groups: groups || [],
        loading: false,
        error: null,
      })
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Error fetching groups',
      }))
    }
  }, [])

  // Get a group with its members
  const getGroupWithMembers = useCallback(
    async (groupId: string): Promise<GroupWithMembers | null> => {
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
    []
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

  // Initial fetch
  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  return {
    ...state,
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
