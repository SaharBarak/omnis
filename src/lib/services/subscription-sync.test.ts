import { describe, it, expect, vi, beforeEach } from 'vitest'

import { syncSubscription, resyncSubscriptionIfStale } from './subscription-sync'
import type { NormalizedSubscription } from './billing-provider'

/**
 * Subscription sync tests.
 *
 * The billing provider and the subscriptions repo are mocked: the repo is an
 * in-memory store keyed by user_id, and `fetchEntitlement` returns whatever
 * "current truth" the test configures. This exercises the
 * stripe-recommendations invariant: webhook payloads are only a signal —
 * state always comes from the provider fetch.
 */

interface Row {
  user_id: string
  plan?: string
  status?: string
  billing_provider?: string | null
  billing_subscription_id?: string | null
  billing_customer_id?: string | null
  cancel_at_period_end?: boolean
  current_period_start?: Date | string | null
  current_period_end?: Date | string | null
  updated_at: string
}

const state = vi.hoisted(() => ({
  rows: new Map<string, Record<string, unknown>>(),
  fetchEntitlement: vi.fn(),
}))

vi.mock('@/lib/services/billing-provider', () => ({
  getBillingProvider: async () => ({
    name: 'revenuecat',
    fetchEntitlement: state.fetchEntitlement,
  }),
}))

vi.mock('@/lib/db/repositories/subscriptions-repo', () => ({
  getSubscription: async (userId: string) => state.rows.get(userId) ?? null,
  upsertSubscriptionByUserId: async (
    userId: string,
    data: Record<string, unknown>
  ) => {
    const existing = state.rows.get(userId) ?? { user_id: userId }
    state.rows.set(userId, {
      ...existing,
      ...data,
      user_id: userId,
      updated_at: new Date().toISOString(),
    })
  },
}))

/** The provider's view of an active Complete subscription. */
function entitlement(
  overrides: Partial<NormalizedSubscription> = {}
): NormalizedSubscription {
  return {
    plan: 'complete',
    status: 'active',
    customerId: 'user-1',
    subscriptionId: 'pleiad_complete_monthly',
    currentPeriodStart: new Date('2026-07-01T00:00:00Z'),
    currentPeriodEnd: new Date('2026-08-01T00:00:00Z'),
    cancelAtPeriodEnd: false,
    ...overrides,
  }
}

/** No active entitlement — what the provider returns for a free user. */
function freeEntitlement(): NormalizedSubscription {
  return {
    plan: 'free',
    status: 'canceled',
    customerId: 'user-1',
    subscriptionId: null,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  }
}

/** Row snapshot without the write timestamp, for state comparisons. */
function snapshot(userId: string) {
  const row = state.rows.get(userId)
  if (!row) return null
  const { updated_at: _updated_at, ...rest } = row as unknown as Row
  return rest
}

beforeEach(() => {
  state.rows.clear()
  state.fetchEntitlement.mockReset()
})

describe('syncSubscription — idempotency', () => {
  it('repeated delivery of the same event converges to identical state', async () => {
    state.fetchEntitlement.mockResolvedValue(entitlement())

    expect(await syncSubscription('user-1')).toBe('synced')
    const afterFirst = snapshot('user-1')

    // The provider redelivers — same event, same API truth.
    expect(await syncSubscription('user-1')).toBe('synced')
    const afterSecond = snapshot('user-1')

    expect(state.rows.size).toBe(1)
    expect(afterSecond).toEqual(afterFirst)
    expect(afterSecond).toMatchObject({
      plan: 'complete',
      status: 'active',
      billing_provider: 'revenuecat',
      billing_subscription_id: 'pleiad_complete_monthly',
      billing_customer_id: 'user-1',
      cancel_at_period_end: false,
    })
  })
})

describe('syncSubscription — out-of-order delivery', () => {
  it('a stale "active" event arriving after expiry cannot resurrect the plan', async () => {
    // 1. Purchase synced while active.
    state.fetchEntitlement.mockResolvedValue(entitlement())
    await syncSubscription('user-1')
    expect(snapshot('user-1')).toMatchObject({ status: 'active', plan: 'complete' })

    // 2. The subscription lapses; the provider's truth becomes "no entitlement".
    state.fetchEntitlement.mockResolvedValue(freeEntitlement())

    // 3. A delayed RENEWAL webhook (payload still says active) finally arrives.
    //    The payload is ignored entirely; the provider's truth wins.
    await syncSubscription('user-1')

    expect(snapshot('user-1')).toMatchObject({
      status: 'canceled',
      plan: 'free',
      cancel_at_period_end: false,
    })
  })

  it('backfills a row that does not exist yet from provider truth', async () => {
    state.fetchEntitlement.mockResolvedValue(entitlement())

    // No local row exists yet (the purchase webhook is the first thing we see).
    expect(await syncSubscription('user-1')).toBe('synced')

    expect(snapshot('user-1')).toMatchObject({
      plan: 'complete',
      status: 'active',
      billing_subscription_id: 'pleiad_complete_monthly',
    })

    // A late duplicate lands — pure no-op re-sync.
    expect(await syncSubscription('user-1')).toBe('synced')
    expect(state.rows.size).toBe(1)
  })

  it('records cancel_at_period_end when auto-renew is turned off', async () => {
    state.fetchEntitlement.mockResolvedValue(
      entitlement({ cancelAtPeriodEnd: true })
    )

    await syncSubscription('user-1')

    // Still active — access runs to the end of the paid period.
    expect(snapshot('user-1')).toMatchObject({
      plan: 'complete',
      status: 'active',
      cancel_at_period_end: true,
    })
  })

  it('returns unresolved_user (no write) for an empty user id', async () => {
    expect(await syncSubscription('')).toBe('unresolved_user')
    expect(state.rows.size).toBe(0)
    expect(state.fetchEntitlement).not.toHaveBeenCalled()
  })

  it('never downgrades a lifetime row', async () => {
    state.rows.set('user-1', {
      user_id: 'user-1',
      plan: 'lifetime',
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    // Provider reports nothing active (e.g. a lapsed subscription alongside it).
    state.fetchEntitlement.mockResolvedValue(freeEntitlement())

    expect(await syncSubscription('user-1')).toBe('synced')
    expect(snapshot('user-1')).toMatchObject({ plan: 'lifetime', status: 'active' })
  })

  it('a lifetime purchase never expires (null period end)', async () => {
    state.fetchEntitlement.mockResolvedValue(
      entitlement({
        plan: 'lifetime',
        subscriptionId: 'pleiad_founding_lifetime',
        currentPeriodEnd: null,
      })
    )

    expect(await syncSubscription('user-1')).toBe('synced')
    expect(snapshot('user-1')).toMatchObject({
      plan: 'lifetime',
      status: 'active',
      current_period_end: null,
    })
  })

  it('propagates provider failures so webhook callers can 500 for retry', async () => {
    state.fetchEntitlement.mockRejectedValue(new Error('revenuecat down'))

    await expect(syncSubscription('user-1')).rejects.toThrow('revenuecat down')
    expect(state.rows.size).toBe(0)
  })
})

describe('resyncSubscriptionIfStale', () => {
  function seedRow(updatedAt: string) {
    state.rows.set('user-1', {
      user_id: 'user-1',
      plan: 'complete',
      status: 'active',
      billing_provider: 'revenuecat',
      billing_subscription_id: 'pleiad_complete_monthly',
      cancel_at_period_end: false,
      updated_at: updatedAt,
    })
  }

  it('skips the provider for fresh rows', async () => {
    seedRow(new Date().toISOString())

    const row = await resyncSubscriptionIfStale('user-1')

    expect(state.fetchEntitlement).not.toHaveBeenCalled()
    expect(row).toMatchObject({ plan: 'complete' })
  })

  it('re-syncs stale rows (>24h) from the provider', async () => {
    seedRow(new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString())
    state.fetchEntitlement.mockResolvedValue(entitlement({ status: 'past_due' }))

    const row = await resyncSubscriptionIfStale('user-1')

    expect(state.fetchEntitlement).toHaveBeenCalledWith('user-1')
    expect(row).toMatchObject({ status: 'past_due' })
  })

  it('re-syncs fresh rows when forced', async () => {
    seedRow(new Date().toISOString())
    state.fetchEntitlement.mockResolvedValue(
      entitlement({ cancelAtPeriodEnd: true })
    )

    const row = await resyncSubscriptionIfStale('user-1', { force: true })

    expect(row).toMatchObject({ cancel_at_period_end: true })
  })

  it('serves the cached row when the provider is unreachable', async () => {
    seedRow(new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString())
    state.fetchEntitlement.mockRejectedValue(new Error('revenuecat down'))

    const row = await resyncSubscriptionIfStale('user-1')

    expect(row).toMatchObject({ plan: 'complete', status: 'active' })
  })

  it('self-heals a user with no local row (purchase made on the phone)', async () => {
    // The web has never seen this user pay — but the store has. A missed
    // webhook must not lock a paying customer out of the web app.
    state.fetchEntitlement.mockResolvedValue(entitlement())

    const row = await resyncSubscriptionIfStale('user-1')

    expect(state.fetchEntitlement).toHaveBeenCalledWith('user-1')
    expect(row).toMatchObject({ plan: 'complete', status: 'active' })
  })
})
