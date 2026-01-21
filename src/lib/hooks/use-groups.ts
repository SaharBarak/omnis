'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  Group,
  GroupInsert,
  GroupUpdate,
} from '@/lib/supabase/database.types'
import type {
  GroupWithMembers,
  CreateGroupInput,
  UpdateGroupInput,
} from '@/lib/types/relationship'

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

export function useGroups(): UseGroupsReturn {
  const [state, setState] = useState<UseGroupsState>({
    groups: [],
    loading: true,
    error: null,
  })

  const supabase = createClient()

  // Fetch all groups
  const fetchGroups = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const { data: groups, error } = await supabase
        .from('groups')
        .select('*')
        .order('name')

      if (error) throw error

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
  }, [supabase])

  // Get a group with its members
  const getGroupWithMembers = useCallback(async (groupId: string): Promise<GroupWithMembers | null> => {
    const { data, error } = await supabase
      .rpc('get_group_with_members', { p_group_id: groupId })

    if (error) throw error

    if (!data || data.length === 0) return null

    const result = data[0]
    return {
      id: result.id,
      owner_id: '', // Not returned by function, will be fetched if needed
      name: result.name,
      description: result.description,
      created_at: result.created_at,
      updated_at: result.updated_at,
      members: (result.members as GroupWithMembers['members']) || [],
    }
  }, [supabase])

  // Create a new group
  const createGroup = useCallback(async (input: CreateGroupInput): Promise<Group> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const insertData: GroupInsert = {
      owner_id: user.id,
      name: input.name,
      description: input.description,
    }

    const { data: group, error } = await supabase
      .from('groups')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error

    // Add members if provided
    if (input.personIds && input.personIds.length > 0) {
      const { error: membersError } = await supabase
        .from('group_members')
        .insert(
          input.personIds.map(personId => ({
            group_id: group.id,
            person_id: personId,
          }))
        )

      if (membersError) throw membersError
    }

    await fetchGroups()
    return group
  }, [supabase, fetchGroups])

  // Update a group
  const updateGroup = useCallback(async (id: string, input: UpdateGroupInput): Promise<Group> => {
    const updateData: GroupUpdate = {}

    if (input.name !== undefined) updateData.name = input.name
    if (input.description !== undefined) updateData.description = input.description

    const { data, error } = await supabase
      .from('groups')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    await fetchGroups()
    return data
  }, [supabase, fetchGroups])

  // Delete a group
  const deleteGroup = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', id)

    if (error) throw error

    await fetchGroups()
  }, [supabase, fetchGroups])

  // Add a member to a group
  const addMemberToGroup = useCallback(async (groupId: string, personId: string): Promise<void> => {
    const { error } = await supabase
      .from('group_members')
      .insert({ group_id: groupId, person_id: personId })

    if (error) {
      if (error.code === '23505') {
        throw new Error('Person is already a member of this group')
      }
      throw error
    }
  }, [supabase])

  // Remove a member from a group
  const removeMemberFromGroup = useCallback(async (groupId: string, personId: string): Promise<void> => {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('person_id', personId)

    if (error) throw error
  }, [supabase])

  // Set all members of a group (replaces existing)
  const setGroupMembers = useCallback(async (groupId: string, personIds: string[]): Promise<void> => {
    // Remove all existing members
    const { error: deleteError } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)

    if (deleteError) throw deleteError

    // Add new members
    if (personIds.length > 0) {
      const { error: insertError } = await supabase
        .from('group_members')
        .insert(
          personIds.map(personId => ({
            group_id: groupId,
            person_id: personId,
          }))
        )

      if (insertError) throw insertError
    }
  }, [supabase])

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
