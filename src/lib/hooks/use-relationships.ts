'use client'

import { useCallback, useEffect, useState } from 'react'
import type {
  RelationshipType,
  RelationshipWithPeople,
  RelationshipFromPerson,
  RawGraphData,
  CreateRelationshipInput,
  UpdateRelationshipInput,
} from '@/lib/types/relationship'

// Client-facing shapes mirror the original Supabase row contract (nullable,
// never undefined) so existing consumers keep type-checking. The server
// serializer guarantees these shapes at runtime.
export interface Relationship {
  id: string
  owner_id: string
  person1_id: string
  person2_id: string
  type: RelationshipType
  subtype: string | null
  bidirectional: boolean
  strength: number
  start_date: string | null
  end_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
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

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...init })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export function useRelationships(): UseRelationshipsReturn {
  const [state, setState] = useState<UseRelationshipsState>({
    relationships: [],
    loading: true,
    error: null,
  })

  // Fetch all relationships with person details
  const fetchRelationships = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const { relationships } = await fetchJson<{
        relationships: RelationshipWithPeople[]
      }>('/api/relationships')

      setState({
        relationships,
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
  }, [])

  // Add a new relationship
  const addRelationship = useCallback(async (input: CreateRelationshipInput): Promise<Relationship> => {
    const { relationship } = await fetchJson<{ relationship: Relationship }>(
      '/api/relationships',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          person1_id: input.person1Id,
          person2_id: input.person2Id,
          type: input.type,
          subtype: input.subtype,
          bidirectional: input.bidirectional ?? true,
          strength: input.strength ?? 3,
          start_date: input.startDate,
          end_date: input.endDate,
          notes: input.notes,
        }),
      }
    )

    await fetchRelationships()
    return relationship
  }, [fetchRelationships])

  // Update a relationship
  const updateRelationship = useCallback(async (id: string, input: UpdateRelationshipInput): Promise<Relationship> => {
    const updates: Record<string, unknown> = {}

    if (input.type !== undefined) updates.type = input.type
    if (input.subtype !== undefined) updates.subtype = input.subtype
    if (input.bidirectional !== undefined) updates.bidirectional = input.bidirectional
    if (input.strength !== undefined) updates.strength = input.strength
    if (input.startDate !== undefined) updates.start_date = input.startDate
    if (input.endDate !== undefined) updates.end_date = input.endDate
    if (input.notes !== undefined) updates.notes = input.notes

    const { relationship } = await fetchJson<{ relationship: Relationship }>(
      `/api/relationships/${id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }
    )

    await fetchRelationships()
    return relationship
  }, [fetchRelationships])

  // Delete a relationship
  const deleteRelationship = useCallback(async (id: string): Promise<void> => {
    await fetchJson(`/api/relationships/${id}`, { method: 'DELETE' })
    await fetchRelationships()
  }, [fetchRelationships])

  // Get relationships for a specific person (both directions)
  const getRelationshipsForPerson = useCallback(async (personId: string): Promise<RelationshipFromPerson[]> => {
    const { relationships } = await fetchJson<{
      relationships: RelationshipFromPerson[]
    }>(`/api/relationships/person/${personId}`)
    return relationships
  }, [])

  // Get graph data for visualization
  const getGraphData = useCallback(async (): Promise<RawGraphData> => {
    return fetchJson<RawGraphData>('/api/relationships/graph')
  }, [])

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
