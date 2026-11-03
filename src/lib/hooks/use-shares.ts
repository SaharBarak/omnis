'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import { track } from '@/lib/analytics/posthog'
import { fetchJson, jsonInit } from '@/lib/http/json'
import { cacheMutation } from '@/lib/query/cache-mutation'
import { QUERY_KEYS } from '@/lib/query/keys'
import { dropRow, newestBy, patchRow, sortedBy, upsertRow } from '@/lib/query/list-ops'
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

type Shares = readonly ShareLink[]

/** Newest first, fetched and settled rows alike; module-level so the query memoises it. */
const showShares = sortedBy(newestBy<ShareLink>((share) => share.createdAt))

const sharePath = (id: string) => `/api/shares/${id}`

// Token generation and password hashing happen SERVER-SIDE in POST
// /api/shares; the minted url_token comes back in the response.
const CREATE = cacheMutation<Shares, CreateShareInput, ShareLink>({
  key: QUERY_KEYS.shares,
  request: async (input) => {
    const { share } = await fetchJson<{ share: SharedViewRow }>(
      '/api/shares',
      jsonInit('POST', {
        share_type: input.shareType,
        options: input.options,
        expires_at: input.expiresAt || null,
        max_views: input.maxViews || null,
        password: input.password || null,
      })
    )
    return toShareLink(share)
  },
  settle: (share) => upsertRow(share),
})

const DEACTIVATE = cacheMutation<Shares, string, unknown>({
  key: QUERY_KEYS.shares,
  request: (id) => fetchJson(sharePath(id), jsonInit('PATCH', { active: false })),
  optimistic: (id) => patchRow<ShareLink>(id, { active: false }),
})

const REMOVE = cacheMutation<Shares, string, unknown>({
  key: QUERY_KEYS.shares,
  request: (id) => fetchJson(sharePath(id), { method: 'DELETE' }),
  optimistic: (id) => dropRow<ShareLink>(id),
})

const messageOf = (err: unknown, fallback: string): string => (err instanceof Error ? err.message : fallback)

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
    queryKey: QUERY_KEYS.shares,
    queryFn: async ({ signal }) => {
      const { shares: rows } = await fetchJson<{ shares: SharedViewRow[] }>('/api/shares', { signal })
      return rows.map(toShareLink)
    },
    select: showShares,
  })

  // Awaits the refetch before resolving. Fetch failures surface through
  // `error`, not the returned promise.
  const fetchShares = useCallback(async () => {
    setMutationError(null)
    await queryClient.refetchQueries({ queryKey: QUERY_KEYS.shares })
  }, [queryClient])

  // Mutators resolve on the server's answer, already written into the list
  // (docs/perf/APP_PERFORMANCE_PROMPT.md "Mutations answer from the cache").
  const { mutateAsync: create } = useMutation(CREATE)
  const { mutateAsync: deactivate } = useMutation(DEACTIVATE)
  const { mutateAsync: remove } = useMutation(REMOVE)

  const createShare = useCallback(async (input: CreateShareInput): Promise<ShareLink | null> => {
    setMutationError(null)
    try {
      const shareLink = await create(input)
      track('share_created', { share_type: shareLink.shareType })
      return shareLink
    } catch (err) {
      setMutationError(messageOf(err, 'Failed to create share'))
      return null
    }
  }, [create])

  const deactivateShare = useCallback(async (id: string): Promise<boolean> => {
    setMutationError(null)
    try {
      await deactivate(id)
      return true
    } catch (err) {
      setMutationError(messageOf(err, 'Failed to deactivate share'))
      return false
    }
  }, [deactivate])

  const deleteShare = useCallback(async (id: string): Promise<boolean> => {
    setMutationError(null)
    try {
      await remove(id)
      return true
    } catch (err) {
      setMutationError(messageOf(err, 'Failed to delete share'))
      return false
    }
  }, [remove])

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
