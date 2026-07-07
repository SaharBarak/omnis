'use client'

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

export function useShares() {
  const [shares, setShares] = useState<ShareLink[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchShares = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { shares: rows } = await fetchJson<{ shares: SharedViewRow[] }>(
        '/api/shares'
      )
      setShares(rows.map(toShareLink))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch shares')
    } finally {
      setLoading(false)
    }
  }, [])

  const createShare = useCallback(async (input: CreateShareInput): Promise<ShareLink | null> => {
    setError(null)

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
      setShares(prev => [shareLink, ...prev])
      return shareLink
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create share')
      return null
    }
  }, [])

  const deactivateShare = useCallback(async (id: string): Promise<boolean> => {
    setError(null)

    try {
      await fetchJson(`/api/shares/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: false }),
      })

      setShares(prev => prev.map(s => s.id === id ? { ...s, active: false } : s))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate share')
      return false
    }
  }, [])

  const deleteShare = useCallback(async (id: string): Promise<boolean> => {
    setError(null)

    try {
      await fetchJson(`/api/shares/${id}`, { method: 'DELETE' })
      setShares(prev => prev.filter(s => s.id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete share')
      return false
    }
  }, [])

  // NOTE: the anonymous share viewer lives at /share/[token] and talks to
  // GET/POST /api/share/[token] directly — expiry, max-view, and password
  // gating are all enforced server-side there. The old client-side
  // getSharedView (which verified passwords against a hash shipped to the
  // browser) was removed with the move to server-side share crypto.

  return {
    shares,
    loading,
    error,
    fetchShares,
    createShare,
    deactivateShare,
    deleteShare,
  }
}
