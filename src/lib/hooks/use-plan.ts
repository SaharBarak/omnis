'use client'

import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
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

interface SubscriptionResponse {
  plan: PlanTier
}

export function usePlan() {
  const query = useQuery<SubscriptionResponse>({
    queryKey: ['billing', 'subscription'],
    queryFn: async () => {
      const res = await fetch('/api/billing/subscription', { credentials: 'include' })
      if (!res.ok) throw new Error(`subscription fetch failed: ${res.status}`)
      return res.json() as Promise<SubscriptionResponse>
    },
    staleTime: 5 * 60_000,
  })

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
