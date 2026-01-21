'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Person, PersonInsert, PersonUpdate, Tag } from '@/lib/supabase/database.types'
import { useComputedResults } from './use-computed-results'

export interface PersonWithTags extends Person {
  tags: Tag[]
}

interface UsePeopleState {
  people: PersonWithTags[]
  tags: Tag[]
  loading: boolean
  error: string | null
}

export function usePeople() {
  const [state, setState] = useState<UsePeopleState>({
    people: [],
    tags: [],
    loading: true,
    error: null,
  })

  const supabase = createClient()
  const { computeAndStore, invalidateResults } = useComputedResults()

  // Fetch all people with their tags
  const fetchPeople = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Fetch people (excluding soft deleted)
      const { data: people, error: peopleError } = await supabase
        .from('people')
        .select('*')
        .is('deleted_at', null)
        .order('name')

      if (peopleError) throw peopleError

      // Fetch all tags (system + user custom)
      const { data: tags, error: tagsError } = await supabase
        .from('tags')
        .select('*')
        .order('sort_order')

      if (tagsError) throw tagsError

      // Fetch person-tag relationships
      const { data: personTags, error: personTagsError } = await supabase
        .from('person_tags')
        .select('*')

      if (personTagsError) throw personTagsError

      // Build people with tags
      const peopleWithTags: PersonWithTags[] = (people || []).map(person => ({
        ...person,
        tags: (personTags || [])
          .filter(pt => pt.person_id === person.id)
          .map(pt => (tags || []).find(t => t.id === pt.tag_id))
          .filter((t): t is Tag => t !== undefined),
      }))

      setState({
        people: peopleWithTags,
        tags: tags || [],
        loading: false,
        error: null,
      })
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Error fetching people',
      }))
    }
  }, [supabase])

  // Add a new person
  const addPerson = useCallback(async (person: Omit<PersonInsert, 'owner_id'>, tagIds: string[] = []) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('people')
      .insert({ ...person, owner_id: user.id })
      .select()
      .single()

    if (error) throw error

    // Add tags
    if (tagIds.length > 0) {
      await supabase.from('person_tags').insert(
        tagIds.map(tagId => ({ person_id: data.id, tag_id: tagId }))
      )
    }

    // Compute and store symbolic results for the new person
    await computeAndStore(data.id, data.birth_date)

    await fetchPeople()
    return data
  }, [supabase, fetchPeople, computeAndStore])

  // Update a person
  const updatePerson = useCallback(async (id: string, updates: PersonUpdate, tagIds?: string[]) => {
    const { data, error } = await supabase
      .from('people')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Update tags if provided
    if (tagIds !== undefined) {
      // Remove existing tags
      await supabase.from('person_tags').delete().eq('person_id', id)

      // Add new tags
      if (tagIds.length > 0) {
        await supabase.from('person_tags').insert(
          tagIds.map(tagId => ({ person_id: id, tag_id: tagId }))
        )
      }
    }

    // If birth_date was updated, recompute symbolic results
    if (updates.birth_date) {
      await invalidateResults(id)
      await computeAndStore(id, data.birth_date)
    }

    await fetchPeople()
    return data
  }, [supabase, fetchPeople, invalidateResults, computeAndStore])

  // Soft delete a person
  const deletePerson = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('people')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    await fetchPeople()
  }, [supabase, fetchPeople])

  // Restore a soft deleted person
  const restorePerson = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('people')
      .update({ deleted_at: null })
      .eq('id', id)

    if (error) throw error

    await fetchPeople()
  }, [supabase, fetchPeople])

  // Permanently delete a person
  const permanentlyDeletePerson = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('people')
      .delete()
      .eq('id', id)

    if (error) throw error

    await fetchPeople()
  }, [supabase, fetchPeople])

  // Add a custom tag
  const addTag = useCallback(async (tag: { name: string; hebrew_name: string; color: string }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('tags')
      .insert({ ...tag, owner_id: user.id, is_system: false })
      .select()
      .single()

    if (error) throw error

    await fetchPeople()
    return data
  }, [supabase, fetchPeople])

  // Delete a custom tag
  const deleteTag = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id)
      .eq('is_system', false) // Ensure we can't delete system tags

    if (error) throw error

    await fetchPeople()
  }, [supabase, fetchPeople])

  // Initial fetch
  useEffect(() => {
    fetchPeople()
  }, [fetchPeople])

  return {
    ...state,
    fetchPeople,
    addPerson,
    updatePerson,
    deletePerson,
    restorePerson,
    permanentlyDeletePerson,
    addTag,
    deleteTag,
  }
}
