'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import { track } from '@/lib/analytics/posthog'
import type { CreateShareInput } from '@/lib/types/relationship'

// Client-facing shape mirrors the original Supabase shared_views row contract
// (nullable, never undefined) so existing consumers keep type-checking. The
// server serializer guarantees this shape at runtime.
type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

interface SharedViewRow {
  id: string
  owner_id: string
  share_type: 'person' | 'relationship' | 'group' | 'graph'
  options: Json
  url_token: string
  expires_at: string | null
  max_views: number | null
  view_count: number
  password_hash: string | null
  active: boolean
  created_at: string
}

export interface ShareLink {
  id: string
  url: string
  token: string
  shareType: SharedViewRow['share_type']
  expiresAt: string | null
  maxViews: number | null
  viewCount: number
  hasPassword: boolean
  active: boolean
  createdAt: string
}

function toShareLink(row: SharedViewRow): ShareLink {
  return {
    id: row.id,
    url: `${window.location.origin}/share/${row.url_token}`,
    token: row.url_token,
    shareType: row.share_type,
    expiresAt: row.expires_at,
    maxViews: row.max_views,
    viewCount: row.view_count,
    hasPassword: !!row.password_hash,
    active: row.active,
    createdAt: row.created_at,
  }
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...init })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const SHARES_QUERY_KEY = ['shares'] as const

export function useShares() {
  const queryClient = useQueryClient()

  // Mutators never throw — they report failure via the `error` slot and a
  // null/false return, exactly like the hand-rolled version. Query errors
  // live on the query itself, so mutator failures need this local slot;
  // the two merge in the returned `error` (most recent operation wins).
  const [mutationError, setMutationError] = useState<string | null>(null)

  // Cached (and persisted — see query-provider) server state. `loading` is
  // true only when there's nothing to show yet: a restored cache renders
  // immediately while a background refetch runs.
  const query = useQuery({
    queryKey: SHARES_QUERY_KEY,
    queryFn: async () => {
      const { shares: rows } = await fetchJson<{ shares: SharedViewRow[] }>(
        '/api/shares'
      )
      return rows.map(toShareLink)
    },
  })

  // Awaits the refetch before resolving, mirroring the previous hand-rolled
  // behavior that callers rely on (fresh data on resolve). Fetch failures
  // surface through `error`, not the returned promise.
  const fetchShares = useCallback(async () => {
    setMutationError(null)
    await queryClient.refetchQueries({ queryKey: SHARES_QUERY_KEY })
  }, [queryClient])

  const createShare = useCallback(async (input: CreateShareInput): Promise<ShareLink | null> => {
    setMutationError(null)

    try {
      // Token generation and password hashing happen SERVER-SIDE in
      // POST /api/shares; the minted url_token comes back in the response.
      const { share } = await fetchJson<{ share: SharedViewRow }>('/api/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          share_type: input.shareType,
          options: input.options,
          expires_at: input.expiresAt || null,
          max_views: input.maxViews || null,
          password: input.password || null,
        }),
      })

      const shareLink = toShareLink(share)
      track('share_created', { share_type: shareLink.shareType })
      // The server response is authoritative — write it into the cache
      // directly (no refetch), as the hand-rolled version prepended locally.
      queryClient.setQueryData<ShareLink[]>(SHARES_QUERY_KEY, prev => [
        shareLink,
        ...(prev ?? []),
      ])
      return shareLink
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : 'Failed to create share')
      return null
    }
  }, [queryClient])

  const deactivateShare = useCallback(async (id: string): Promise<boolean> => {
    setMutationError(null)

    try {
      await fetchJson(`/api/shares/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: false }),
      })

      queryClient.setQueryData<ShareLink[]>(SHARES_QUERY_KEY, prev =>
        (prev ?? []).map(s => s.id === id ? { ...s, active: false } : s)
      )
      return true
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : 'Failed to deactivate share')
      return false
    }
  }, [queryClient])

  const deleteShare = useCallback(async (id: string): Promise<boolean> => {
    setMutationError(null)

    try {
      await fetchJson(`/api/shares/${id}`, { method: 'DELETE' })
      queryClient.setQueryData<ShareLink[]>(SHARES_QUERY_KEY, prev =>
        (prev ?? []).filter(s => s.id !== id)
      )
      return true
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : 'Failed to delete share')
      return false
    }
  }, [queryClient])

  // NOTE: the anonymous share viewer lives at /share/[token] and talks to
  // GET/POST /api/share/[token] directly — expiry, max-view, and password
  // gating are all enforced server-side there. The old client-side
  // getSharedView (which verified passwords against a hash shipped to the
  // browser) was removed with the move to server-side share crypto.

  return {
    shares: query.data ?? [],
    loading: query.isPending,
    error: mutationError ?? (query.error ? query.error.message : null),
    fetchShares,
    createShare,
    deactivateShare,
    deleteShare,
  }
}
