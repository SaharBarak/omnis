'use client'

import { useCallback } from 'react'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { fetchJson } from '@/lib/http/json'
import { QUERY_KEYS } from '@/lib/query/keys'
import { PLANS, type PlanTier } from '@/lib/services/billing'

/**
 * Plan gate (#80) — the web's read on the user's entitlements. Paid plans
 * are store IAPs (RevenueCat); this hook only asks the server which tier
 * is active and answers gating questions from the shared PLANS table, so
 * web and mobile gate off one source of truth.
 *
 * `loading` matters: gated pages should render nothing (or a skeleton)
 * until the plan resolves, so premium content never flashes for free
 * users — the LockedPage contract.
 */

interface Usage {
  readonly used: number
  readonly limit: number
  readonly percentage: number
}

/** GET /api/billing/subscription, one cache entry for every reader. */
export interface Subscription {
  plan: PlanTier
  planName: string
  status: string
  currentPeriodEnd?: string
  cancelAtPeriodEnd: boolean
  hasSubscription: boolean
  usage: {
    profiles: Usage
    aiInterpretations: Usage
    boards: Usage
  }
  features: {
    exports: boolean
    timeline: boolean
    relationships: boolean | string
    groupAnalysis: boolean
    apiAccess: boolean
  }
}

const SUBSCRIPTION_URL = '/api/billing/subscription'

export const subscriptionQuery = queryOptions({
  queryKey: QUERY_KEYS.subscription,
  queryFn: ({ signal }) => fetchJson<Subscription>(SUBSCRIPTION_URL, { signal }),
  staleTime: 5 * 60_000,
})

/**
 * Re-syncs the plan from the store (`refresh=1`): a purchase on the phone
 * can race the store's webhook. The answer replaces the canonical entry,
 * after cancelling any plain read in flight so a slower one cannot overwrite
 * it. A query rather than an effect, so it is deduplicated and runs again
 * when the window regains focus, as after buying in the app; never persisted.
 */
const subscriptionSyncQuery = queryOptions({
  queryKey: QUERY_KEYS.subscriptionSync,
  queryFn: async ({ client, signal }): Promise<PlanTier> => {
    const synced = await fetchJson<Subscription>(`${SUBSCRIPTION_URL}?refresh=1`, { signal })
    await client.cancelQueries({ queryKey: QUERY_KEYS.subscription, exact: true })
    client.setQueryData(QUERY_KEYS.subscription, synced)
    return synced.plan
  },
  staleTime: 0,
  gcTime: 0,
  meta: { persist: false },
})

/**
 * The subscription and usage. With `sync`, the reader asks the store first
 * and skips the plain read, which the sync's answer would replace anyway.
 */
export function useSubscription({ sync = false }: { readonly sync?: boolean } = {}) {
  const plain = useQuery({ ...subscriptionQuery, enabled: !sync })
  const synced = useQuery({ ...subscriptionSyncQuery, enabled: sync })
  const waiting = sync ? synced.isPending : plain.isPending
  return {
    subscription: plain.data ?? null,
    loading: plain.data === undefined && waiting,
  }
}

export function usePlan() {
  const query = useQuery(subscriptionQuery)

  const plan: PlanTier = query.data?.plan ?? 'free'
  const limits = PLANS[plan].limits

  const canUseSystem = useCallback(
    (system: string) => (limits.systems as readonly string[]).includes(system),
    [limits]
  )

  return {
    plan,
    planName: PLANS[plan].name,
    limits,
    canUseSystem,
    loading: query.isPending,
  }
}
