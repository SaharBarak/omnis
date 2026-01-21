'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  Relationship,
  RelationshipInsert,
  RelationshipUpdate,
  Person,
} from '@/lib/supabase/database.types'
import type {
  RelationshipType,
  RelationshipWithPeople,
  RelationshipFromPerson,
  RawGraphData,
  CreateRelationshipInput,
  UpdateRelationshipInput,
} from '@/lib/types/relationship'

// Type for the get_person_relationships RPC return
interface PersonRelationshipRow {
  id: string
  person1_id: string
  person2_id: string
  type: string
  subtype: string | null
  bidirectional: boolean
  strength: number
  start_date: string | null
  end_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
  other_person_id: string
  other_person_name: string
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
  getGraphData: () => Promise<RawGraphData>
}

export function useRelationships(): UseRelationshipsReturn {
  const [state, setState] = useState<UseRelationshipsState>({
    relationships: [],
    loading: true,
    error: null,
  })

  const supabase = createClient()

  // Fetch all relationships with person details
  const fetchRelationships = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Fetch relationships
      const { data: relationships, error: relError } = await supabase
        .from('relationships')
        .select('*')
        .order('created_at', { ascending: false })

      if (relError) throw relError

      if (!relationships || relationships.length === 0) {
        setState({
          relationships: [],
          loading: false,
          error: null,
        })
        return
      }

      // Get unique person IDs
      const personIds = new Set<string>()
      relationships.forEach(r => {
        personIds.add(r.person1_id)
        personIds.add(r.person2_id)
      })

      // Fetch people
      const { data: people, error: peopleError } = await supabase
        .from('people')
        .select('*')
        .in('id', Array.from(personIds))

      if (peopleError) throw peopleError

      const peopleMap = new Map<string, Person>()
      people?.forEach(p => peopleMap.set(p.id, p))

      // Build relationships with people
      const relationshipsWithPeople: RelationshipWithPeople[] = relationships
        .filter(r => peopleMap.has(r.person1_id) && peopleMap.has(r.person2_id))
        .map(r => ({
          ...r,
          person1: peopleMap.get(r.person1_id)!,
          person2: peopleMap.get(r.person2_id)!,
        }))

      setState({
        relationships: relationshipsWithPeople,
        loading: false,
        error: null,
      })
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Error fetching relationships',
      }))
    }
  }, [supabase])

  // Add a new relationship
  const addRelationship = useCallback(async (input: CreateRelationshipInput): Promise<Relationship> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const insertData: RelationshipInsert = {
      owner_id: user.id,
      person1_id: input.person1Id,
      person2_id: input.person2Id,
      type: input.type,
      subtype: input.subtype,
      bidirectional: input.bidirectional ?? true,
      strength: input.strength ?? 3,
      start_date: input.startDate,
      end_date: input.endDate,
      notes: input.notes,
    }

    const { data, error } = await supabase
      .from('relationships')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new Error('A relationship of this type already exists between these people')
      }
      throw error
    }

    await fetchRelationships()
    return data
  }, [supabase, fetchRelationships])

  // Update a relationship
  const updateRelationship = useCallback(async (id: string, input: UpdateRelationshipInput): Promise<Relationship> => {
    const updateData: RelationshipUpdate = {}

    if (input.type !== undefined) updateData.type = input.type
    if (input.subtype !== undefined) updateData.subtype = input.subtype
    if (input.bidirectional !== undefined) updateData.bidirectional = input.bidirectional
    if (input.strength !== undefined) updateData.strength = input.strength
    if (input.startDate !== undefined) updateData.start_date = input.startDate
    if (input.endDate !== undefined) updateData.end_date = input.endDate
    if (input.notes !== undefined) updateData.notes = input.notes

    const { data, error } = await supabase
      .from('relationships')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    await fetchRelationships()
    return data
  }, [supabase, fetchRelationships])

  // Delete a relationship
  const deleteRelationship = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('relationships')
      .delete()
      .eq('id', id)

    if (error) throw error

    await fetchRelationships()
  }, [supabase, fetchRelationships])

  // Get relationships for a specific person
  const getRelationshipsForPerson = useCallback(async (personId: string): Promise<RelationshipFromPerson[]> => {
    // Use the database function for efficient querying
    const { data, error } = await supabase
      .rpc('get_person_relationships', { p_person_id: personId })

    if (error) throw error

    if (!data) return []

    const typedData = data as PersonRelationshipRow[]

    // Get people details for the other person
    const otherPersonIds = typedData.map(r => r.other_person_id)
    const { data: people, error: peopleError } = await supabase
      .from('people')
      .select('*')
      .in('id', otherPersonIds)

    if (peopleError) throw peopleError

    const peopleMap = new Map<string, Person>()
    people?.forEach(p => peopleMap.set(p.id, p))

    return typedData
      .filter(r => peopleMap.has(r.other_person_id))
      .map(r => ({
        id: r.id,
        type: r.type as RelationshipType,
        subtype: r.subtype,
        strength: r.strength,
        bidirectional: r.bidirectional,
        startDate: r.start_date,
        endDate: r.end_date,
        notes: r.notes,
        otherPerson: peopleMap.get(r.other_person_id)!,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }))
  }, [supabase])

  // Get graph data for visualization
  const getGraphData = useCallback(async (): Promise<RawGraphData> => {
    const { data, error } = await supabase.rpc('get_relationship_graph')

    if (error) throw error

    if (!data || data.length === 0) {
      return { nodes: [], edges: [] }
    }

    const result = data[0]
    return {
      nodes: (result.nodes as RawGraphData['nodes']) || [],
      edges: (result.edges as RawGraphData['edges']) || [],
    }
  }, [supabase])

  // Initial fetch
  useEffect(() => {
    fetchRelationships()
  }, [fetchRelationships])

  return {
    ...state,
    fetchRelationships,
    addRelationship,
    updateRelationship,
    deleteRelationship,
    getRelationshipsForPerson,
    getGraphData,
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
