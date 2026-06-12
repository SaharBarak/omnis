'use client'

import { useState, useCallback } from 'react'
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

// Generate a random URL token
function generateToken(length = 16): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let result = ''
  const randomValues = new Uint32Array(length)
  crypto.getRandomValues(randomValues)
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length]
  }
  return result
}

// Hash password using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Verify password against hash
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
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
      const token = generateToken()
      const passwordHash = input.password ? await hashPassword(input.password) : null

      const { share } = await fetchJson<{ share: SharedViewRow }>('/api/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          share_type: input.shareType,
          options: input.options,
          url_token: token,
          expires_at: input.expiresAt || null,
          max_views: input.maxViews || null,
          password_hash: passwordHash,
        }),
      })

      const shareLink = toShareLink(share)
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

  // Get shared view by token (public access)
  const getSharedView = useCallback(async (token: string, password?: string): Promise<{
    data: SharedViewRow | null
    error: string | null
    requiresPassword: boolean
  }> => {
    try {
      const res = await fetch(`/api/shares/public/${token}`)
      if (!res.ok) {
        return { data: null, error: 'Share not found or expired', requiresPassword: false }
      }
      const { share } = (await res.json()) as { share: SharedViewRow }
      if (!share) {
        return { data: null, error: 'Share not found or expired', requiresPassword: false }
      }

      // Check expiration
      if (share.expires_at && new Date(share.expires_at) < new Date()) {
        return { data: null, error: 'Share has expired', requiresPassword: false }
      }

      // Check max views
      if (share.max_views !== null && share.view_count >= share.max_views) {
        return { data: null, error: 'Share has reached maximum views', requiresPassword: false }
      }

      // Check password
      if (share.password_hash) {
        if (!password) {
          return { data: null, error: null, requiresPassword: true }
        }
        const valid = await verifyPassword(password, share.password_hash)
        if (!valid) {
          return { data: null, error: 'Incorrect password', requiresPassword: true }
        }
      }

      // Increment view count via the public endpoint
      await fetch(`/api/shares/public/${token}/view`, { method: 'POST' })

      return { data: share, error: null, requiresPassword: false }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch share', requiresPassword: false }
    }
  }, [])

  return {
    shares,
    loading,
    error,
    fetchShares,
    createShare,
    deactivateShare,
    deleteShare,
    getSharedView,
  }
}
