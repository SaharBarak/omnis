import type { SharedView } from '@pleiad/api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { ENV } from '@/lib/env'
import { showToast } from '@/lib/toast'

/**
 * Shares data layer — F8/S16. Query ['shares'] holds every share the user
 * owns; the composer filters it down to one subject (a person or a circle).
 *
 * The `options` payload mirrors the web ShareOptions contract EXACTLY
 * (src/lib/types/relationship.ts + src/components/share-dialog.tsx): the
 * server stores it opaquely and the public viewer reads `groupId` /
 * `personIds` / `includeSystems` / `includeAnalysis` from it, so the two
 * clients must write the same shape.
 */

export const SHARES_QUERY_KEY = ['shares'] as const

/** What is being shared — drives share_type and the options payload. */
export type ShareSubject =
  | { type: 'person'; personId: string; title: string }
  | { type: 'group'; groupId: string; title: string }

/** Per-person systems the public viewer can render. */
const PERSON_SYSTEMS = [
  'dreamspell',
  'tzolkin',
  'astrology',
  'humandesign',
  'gematria',
] as const

/** Build the options body POST /api/shares expects for this subject. */
export function shareOptionsFor(subject: ShareSubject): Record<string, unknown> {
  if (subject.type === 'group') {
    // Mirror of the web groups page: analysis on, core systems listed.
    return {
      groupId: subject.groupId,
      includeSystems: ['dreamspell', 'tzolkin'],
      includeAnalysis: true,
    }
  }
  return {
    personIds: [subject.personId],
    includeSystems: [...PERSON_SYSTEMS],
    includeAnalysis: false,
  }
}

/** Does this stored share point at the given subject? */
export function shareMatchesSubject(share: SharedView, subject: ShareSubject): boolean {
  if (subject.type === 'group') {
    return share.share_type === 'group' && share.options.groupId === subject.groupId
  }
  const ids = share.options.personIds
  return (
    share.share_type === 'person' &&
    Array.isArray(ids) &&
    ids.includes(subject.personId)
  )
}

/** Public viewer URL — same origin as the API (the web app). */
export function shareUrl(token: string): string {
  return `${ENV.apiUrl}/share/${token}`
}

export interface UseSharesResult {
  /** Active links for this subject, newest first. */
  shares: SharedView[]
  isPending: boolean
  isError: boolean
  refetch: () => void
}

export function useSubjectShares(subject: ShareSubject, enabled: boolean): UseSharesResult {
  const query = useQuery<SharedView[]>({
    queryKey: SHARES_QUERY_KEY,
    queryFn: () => api.shares.list(),
    enabled,
  })

  const shares = (query.data ?? [])
    .filter((share) => share.active && shareMatchesSubject(share, subject))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))

  return {
    shares,
    isPending: query.isPending,
    isError: query.isError,
    refetch: () => void query.refetch(),
  }
}

export interface CreateShareVariables {
  subject: ShareSubject
  /** null = the link never expires. */
  expiresAt: string | null
  /** null = unlimited views. */
  maxViews: number | null
  /** null = open link. Hashed server-side; never stored raw. */
  password: string | null
}

export function useCreateShare(callbacks?: { onCreated?: (share: SharedView) => void }) {
  const queryClient = useQueryClient()

  return useMutation<SharedView, unknown, CreateShareVariables>({
    mutationFn: ({ subject, expiresAt, maxViews, password }) =>
      api.shares.create({
        share_type: subject.type,
        options: shareOptionsFor(subject),
        expires_at: expiresAt,
        max_views: maxViews,
        password,
      }),
    onSuccess: (share) => {
      queryClient.setQueryData<SharedView[]>(SHARES_QUERY_KEY, (list) => [
        share,
        ...(list ?? []),
      ])
      callbacks?.onCreated?.(share)
    },
    onError: () => {
      showToast("The link didn't mint. Try again.")
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: SHARES_QUERY_KEY })
    },
  })
}

interface RevokeContext {
  previous: SharedView[] | undefined
}

/** PATCH active:false — the link dies instantly for every viewer. */
export function useRevokeShare() {
  const queryClient = useQueryClient()

  return useMutation<SharedView, unknown, string, RevokeContext>({
    mutationFn: (id) => api.shares.update(id, { active: false }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: SHARES_QUERY_KEY })
      const previous = queryClient.getQueryData<SharedView[]>(SHARES_QUERY_KEY)
      queryClient.setQueryData<SharedView[]>(SHARES_QUERY_KEY, (list) =>
        (list ?? []).map((share) =>
          share.id === id ? { ...share, active: false } : share
        )
      )
      return { previous }
    },
    onError: (_error, _id, context) => {
      queryClient.setQueryData(SHARES_QUERY_KEY, context?.previous)
      showToast("The link is still live. Try again.")
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: SHARES_QUERY_KEY })
    },
  })
}
