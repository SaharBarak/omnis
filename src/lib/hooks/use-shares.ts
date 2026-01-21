'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SharedView, SharedViewInsert, Json } from '@/lib/supabase/database.types'
import type { CreateShareInput } from '@/lib/types/relationship'

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
  shareType: SharedView['share_type']
  expiresAt: string | null
  maxViews: number | null
  viewCount: number
  hasPassword: boolean
  active: boolean
  createdAt: string
}

export function useShares() {
  const [shares, setShares] = useState<ShareLink[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchShares = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('shared_views')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      const shareLinks: ShareLink[] = (data || []).map(share => ({
        id: share.id,
        url: `${window.location.origin}/share/${share.url_token}`,
        token: share.url_token,
        shareType: share.share_type,
        expiresAt: share.expires_at,
        maxViews: share.max_views,
        viewCount: share.view_count,
        hasPassword: !!share.password_hash,
        active: share.active,
        createdAt: share.created_at,
      }))

      setShares(shareLinks)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch shares')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const createShare = useCallback(async (input: CreateShareInput): Promise<ShareLink | null> => {
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const token = generateToken()
      const passwordHash = input.password ? await hashPassword(input.password) : null

      const insertData: SharedViewInsert = {
        owner_id: user.id,
        share_type: input.shareType,
        options: input.options as unknown as Json,
        url_token: token,
        expires_at: input.expiresAt || null,
        max_views: input.maxViews || null,
        password_hash: passwordHash,
        active: true,
      }

      const { data, error: insertError } = await supabase
        .from('shared_views')
        .insert(insertData)
        .select()
        .single()

      if (insertError) throw insertError

      const shareLink: ShareLink = {
        id: data.id,
        url: `${window.location.origin}/share/${data.url_token}`,
        token: data.url_token,
        shareType: data.share_type,
        expiresAt: data.expires_at,
        maxViews: data.max_views,
        viewCount: data.view_count,
        hasPassword: !!data.password_hash,
        active: data.active,
        createdAt: data.created_at,
      }

      setShares(prev => [shareLink, ...prev])
      return shareLink
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create share')
      return null
    }
  }, [supabase])

  const deactivateShare = useCallback(async (id: string): Promise<boolean> => {
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('shared_views')
        .update({ active: false })
        .eq('id', id)

      if (updateError) throw updateError

      setShares(prev => prev.map(s => s.id === id ? { ...s, active: false } : s))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate share')
      return false
    }
  }, [supabase])

  const deleteShare = useCallback(async (id: string): Promise<boolean> => {
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('shared_views')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      setShares(prev => prev.filter(s => s.id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete share')
      return false
    }
  }, [supabase])

  // Get shared view by token (public access)
  const getSharedView = useCallback(async (token: string, password?: string): Promise<{
    data: SharedView | null
    error: string | null
    requiresPassword: boolean
  }> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('shared_views')
        .select('*')
        .eq('url_token', token)
        .eq('active', true)
        .single()

      if (fetchError || !data) {
        return { data: null, error: 'Share not found or expired', requiresPassword: false }
      }

      // Check expiration
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return { data: null, error: 'Share has expired', requiresPassword: false }
      }

      // Check max views
      if (data.max_views !== null && data.view_count >= data.max_views) {
        return { data: null, error: 'Share has reached maximum views', requiresPassword: false }
      }

      // Check password
      if (data.password_hash) {
        if (!password) {
          return { data: null, error: null, requiresPassword: true }
        }
        const valid = await verifyPassword(password, data.password_hash)
        if (!valid) {
          return { data: null, error: 'Incorrect password', requiresPassword: true }
        }
      }

      // Increment view count
      await supabase.rpc('increment_shared_view_count', { p_token: token })

      return { data, error: null, requiresPassword: false }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch share', requiresPassword: false }
    }
  }, [supabase])

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
