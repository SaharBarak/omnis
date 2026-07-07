import { createHmac, webcrypto } from 'node:crypto'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import {
  syncPaddleSubscription,
  resyncSubscriptionIfStale,
  verifyPaddleWebhookSignature,
} from './subscription-sync'

/**
 * Paddle subscription sync tests.
 *
 * The Paddle API and the subscriptions repo are mocked: the repo is an
 * in-memory store keyed by user_id, and `paddle().subscriptions.get` returns
 * whatever "current truth" the test configures. This exercises the
 * stripe-recommendations invariant: webhook payloads are only a signal —
 * state always comes from the (mocked) Paddle API fetch.
 */

interface Row {
  user_id: string
  plan?: string
  status?: string
  paddle_subscription_id?: string | null
  paddle_customer_id?: string | null
  cancel_at_period_end?: boolean
  current_period_start?: Date | string | null
  current_period_end?: Date | string | null
  updated_at: string
}

const state = vi.hoisted(() => ({
  rows: new Map<string, Record<string, unknown>>(),
  paddleGet: vi.fn(),
}))

vi.mock('@/lib/services/billing', () => ({
  paddle: () => ({ subscriptions: { get: state.paddleGet } }),
  getPlanFromPriceId: (priceId?: string | null) => {
    if (priceId === 'pri_explorer') return 'explorer'
    if (priceId === 'pri_complete') return 'complete'
    if (priceId === 'pri_practitioner') return 'practitioner'
    return 'free'
  },
}))

vi.mock('@/lib/db/repositories/subscriptions-repo', () => ({
  getSubscription: async (userId: string) => state.rows.get(userId) ?? null,
  getByPaddleSubscriptionId: async (subscriptionId: string) => {
    for (const row of state.rows.values()) {
      if (row.paddle_subscription_id === subscriptionId) return row
    }
    return null
  },
  updateByPaddleSubscriptionId: async (
    subscriptionId: string,
    data: Record<string, unknown>
  ) => {
    for (const [userId, row] of state.rows) {
      if (row.paddle_subscription_id === subscriptionId) {
        state.rows.set(userId, {
          ...row,
          ...data,
          updated_at: new Date().toISOString(),
        })
        return true
      }
    }
    return false
  },
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

function paddleSub(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub_123',
    status: 'active',
    customerId: 'ctm_1',
    customData: { omnis_user_id: 'user-1' },
    items: [{ price: { id: 'pri_complete' } }],
    currentBillingPeriod: {
      startsAt: '2026-07-01T00:00:00Z',
      endsAt: '2026-08-01T00:00:00Z',
    },
    scheduledChange: null,
    ...overrides,
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
  state.paddleGet.mockReset()
})

describe('syncPaddleSubscription — idempotency', () => {
  it('repeated delivery of the same event converges to identical state', async () => {
    state.paddleGet.mockResolvedValue(paddleSub())

    expect(await syncPaddleSubscription('sub_123', 'user-1')).toBe('synced')
    const afterFirst = snapshot('user-1')

    // Paddle redelivers — same event, same API truth.
    expect(await syncPaddleSubscription('sub_123', 'user-1')).toBe('synced')
    const afterSecond = snapshot('user-1')

    expect(state.rows.size).toBe(1)
    expect(afterSecond).toEqual(afterFirst)
    expect(afterSecond).toMatchObject({
      plan: 'complete',
      status: 'active',
      paddle_subscription_id: 'sub_123',
      paddle_customer_id: 'ctm_1',
      cancel_at_period_end: false,
    })
  })
})

describe('syncPaddleSubscription — out-of-order delivery', () => {
  it('a stale "active" event arriving after cancellation cannot resurrect the subscription', async () => {
    // 1. Subscription is created and synced while active.
    state.paddleGet.mockResolvedValue(paddleSub())
    await syncPaddleSubscription('sub_123', 'user-1')
    expect(snapshot('user-1')).toMatchObject({ status: 'active', plan: 'complete' })

    // 2. The user cancels; Paddle's current truth becomes canceled.
    state.paddleGet.mockResolvedValue(
      paddleSub({ status: 'canceled', currentBillingPeriod: null })
    )

    // 3. A delayed subscription.updated webhook (payload still says active)
    //    finally arrives. Payload is ignored; the API truth wins.
    await syncPaddleSubscription('sub_123', 'user-1')

    expect(snapshot('user-1')).toMatchObject({
      status: 'canceled',
      plan: 'free',
      cancel_at_period_end: false,
    })
  })

  it('updated arriving before created backfills the row from API truth', async () => {
    state.paddleGet.mockResolvedValue(paddleSub())

    // No local row exists yet (created webhook not delivered).
    expect(await syncPaddleSubscription('sub_123')).toBe('synced')

    expect(snapshot('user-1')).toMatchObject({
      plan: 'complete',
      status: 'active',
      paddle_subscription_id: 'sub_123',
      paddle_customer_id: 'ctm_1',
    })

    // The late created webhook now lands — pure no-op re-sync.
    expect(await syncPaddleSubscription('sub_123', 'user-1')).toBe('synced')
    expect(state.rows.size).toBe(1)
  })

  it('falls back to the event user id when API custom data lacks one', async () => {
    state.paddleGet.mockResolvedValue(paddleSub({ customData: null }))

    expect(await syncPaddleSubscription('sub_123', 'user-2')).toBe('synced')
    expect(state.rows.get('user-2')).toBeDefined()
  })

  it('returns unresolved_user (no write) when no user can be attributed', async () => {
    state.paddleGet.mockResolvedValue(paddleSub({ customData: null }))

    expect(await syncPaddleSubscription('sub_123')).toBe('unresolved_user')
    expect(state.rows.size).toBe(0)
  })

  it('never downgrades a lifetime row matched by subscription id', async () => {
    state.rows.set('user-1', {
      user_id: 'user-1',
      plan: 'lifetime',
      status: 'active',
      paddle_subscription_id: 'sub_123',
      updated_at: new Date().toISOString(),
    })
    state.paddleGet.mockResolvedValue(paddleSub({ status: 'canceled' }))

    expect(await syncPaddleSubscription('sub_123', 'user-1')).toBe('synced')
    expect(snapshot('user-1')).toMatchObject({ plan: 'lifetime', status: 'active' })
  })

  it('never overwrites a lifetime row in the user-keyed backfill path', async () => {
    // Lifetime rows have no paddle_subscription_id — only the user key matches.
    state.rows.set('user-1', {
      user_id: 'user-1',
      plan: 'lifetime',
      status: 'active',
      paddle_subscription_id: null,
      updated_at: new Date().toISOString(),
    })
    state.paddleGet.mockResolvedValue(paddleSub())

    expect(await syncPaddleSubscription('sub_123', 'user-1')).toBe('synced')
    expect(snapshot('user-1')).toMatchObject({
      plan: 'lifetime',
      paddle_subscription_id: null,
    })
  })

  it('propagates Paddle API failures so webhook callers can 500 for retry', async () => {
    state.paddleGet.mockRejectedValue(new Error('paddle down'))

    await expect(syncPaddleSubscription('sub_123', 'user-1')).rejects.toThrow(
      'paddle down'
    )
    expect(state.rows.size).toBe(0)
  })
})

describe('resyncSubscriptionIfStale', () => {
  function seedRow(updatedAt: string) {
    state.rows.set('user-1', {
      user_id: 'user-1',
      plan: 'complete',
      status: 'active',
      paddle_subscription_id: 'sub_123',
      paddle_customer_id: 'ctm_1',
      cancel_at_period_end: false,
      updated_at: updatedAt,
    })
  }

  it('skips the Paddle API for fresh rows', async () => {
    seedRow(new Date().toISOString())

    const row = await resyncSubscriptionIfStale('user-1')

    expect(state.paddleGet).not.toHaveBeenCalled()
    expect(row).toMatchObject({ plan: 'complete' })
  })

  it('re-syncs stale rows (>24h) from Paddle', async () => {
    seedRow(new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString())
    state.paddleGet.mockResolvedValue(paddleSub({ status: 'past_due' }))

    const row = await resyncSubscriptionIfStale('user-1')

    expect(state.paddleGet).toHaveBeenCalledWith('sub_123')
    expect(row).toMatchObject({ status: 'past_due' })
  })

  it('re-syncs fresh rows when forced', async () => {
    seedRow(new Date().toISOString())
    state.paddleGet.mockResolvedValue(
      paddleSub({ scheduledChange: { action: 'cancel' } })
    )

    const row = await resyncSubscriptionIfStale('user-1', { force: true })

    expect(row).toMatchObject({ cancel_at_period_end: true })
  })

  it('serves the cached row when the Paddle API is unreachable', async () => {
    seedRow(new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString())
    state.paddleGet.mockRejectedValue(new Error('paddle down'))

    const row = await resyncSubscriptionIfStale('user-1')

    expect(row).toMatchObject({ plan: 'complete', status: 'active' })
  })

  it('does nothing for users without a Paddle subscription', async () => {
    const row = await resyncSubscriptionIfStale('user-1')

    expect(row).toBeNull()
    expect(state.paddleGet).not.toHaveBeenCalled()
  })
})

describe('verifyPaddleWebhookSignature', () => {
  const SECRET = 'whsec_test_secret'

  beforeEach(() => {
    // jsdom lacks SubtleCrypto — use Node's Web Crypto implementation.
    if (!globalThis.crypto?.subtle) {
      vi.stubGlobal('crypto', webcrypto)
    }
  })

  function sign(body: string, ts: number, secret = SECRET) {
    const h1 = createHmac('sha256', secret).update(`${ts}:${body}`).digest('hex')
    return `ts=${ts};h1=${h1}`
  }

  it('accepts a correctly signed payload', async () => {
    const body = '{"event_type":"subscription.updated"}'
    const ts = Math.floor(Date.now() / 1000)

    expect(await verifyPaddleWebhookSignature(body, sign(body, ts), SECRET)).toBe(
      true
    )
  })

  it('rejects a tampered body', async () => {
    const ts = Math.floor(Date.now() / 1000)
    const header = sign('{"amount":1}', ts)

    expect(
      await verifyPaddleWebhookSignature('{"amount":9999}', header, SECRET)
    ).toBe(false)
  })

  it('rejects a signature made with the wrong secret', async () => {
    const body = '{}'
    const ts = Math.floor(Date.now() / 1000)
    const header = sign(body, ts, 'whsec_other')

    expect(await verifyPaddleWebhookSignature(body, header, SECRET)).toBe(false)
  })

  it('rejects malformed signature headers', async () => {
    expect(await verifyPaddleWebhookSignature('{}', 'garbage', SECRET)).toBe(false)
    expect(await verifyPaddleWebhookSignature('{}', 'ts=123', SECRET)).toBe(false)
    expect(await verifyPaddleWebhookSignature('{}', 'h1=abc', SECRET)).toBe(false)
    expect(await verifyPaddleWebhookSignature('{}', '', SECRET)).toBe(false)
  })
})
