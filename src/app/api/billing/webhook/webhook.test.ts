import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { POST } from './route'

/**
 * Webhook route semantics tests (failure visibility):
 * - non-2xx on real processing failures so Paddle retries
 * - 2xx on deliberately ignored events and permanently unresolvable ones
 * - 400 on missing/invalid signatures
 */

const mocks = vi.hoisted(() => ({
  headerGet: vi.fn(),
  verify: vi.fn(),
  sync: vi.fn(),
  unmarshal: vi.fn(),
  upsertByUserId: vi.fn(),
}))

vi.mock('next/headers', () => ({
  headers: async () => ({ get: mocks.headerGet }),
}))

vi.mock('@/lib/services/billing', () => ({
  unmarshalWebhookEvent: mocks.unmarshal,
  getPlanFromPriceId: (priceId?: string | null) =>
    priceId === 'pri_lifetime' ? 'lifetime' : 'free',
}))

vi.mock('@/lib/services/subscription-sync', () => ({
  verifyPaddleWebhookSignature: mocks.verify,
  syncPaddleSubscription: mocks.sync,
}))

vi.mock('@/lib/db/repositories/subscriptions-repo', () => ({
  upsertSubscriptionByUserId: mocks.upsertByUserId,
}))

// IP allowlisting is a separate defense-in-depth layer with its own tests in
// src/lib/security/paddle-ips; these cases exercise signature/secret/sync
// semantics, so treat the source IP as allowed.
vi.mock('@/lib/security/paddle-ips', () => ({
  isAllowedPaddleIp: async () => true,
}))

function webhookRequest(body: Record<string, unknown> = {}) {
  return new Request('https://example.com/api/billing/webhook', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

function subscriptionEvent(overrides: Record<string, unknown> = {}) {
  return {
    eventType: 'subscription.updated',
    eventId: 'evt_1',
    data: {
      id: 'sub_123',
      customData: { omnis_user_id: 'user-1' },
    },
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('PADDLE_WEBHOOK_SECRET', 'whsec_test')
  mocks.headerGet.mockReturnValue('ts=1;h1=abc')
  mocks.verify.mockResolvedValue(true)
  mocks.unmarshal.mockResolvedValue(subscriptionEvent())
  mocks.sync.mockResolvedValue('synced')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('POST /api/billing/webhook', () => {
  it('returns 400 when the paddle-signature header is missing', async () => {
    mocks.headerGet.mockReturnValue(null)

    const res = await POST(webhookRequest())

    expect(res.status).toBe(400)
    expect(mocks.sync).not.toHaveBeenCalled()
  })

  it('returns 500 when the webhook secret is not configured', async () => {
    vi.stubEnv('PADDLE_WEBHOOK_SECRET', '')

    const res = await POST(webhookRequest())

    expect(res.status).toBe(500)
    expect(mocks.sync).not.toHaveBeenCalled()
  })

  it('returns 400 on a signature mismatch without touching the sync layer', async () => {
    mocks.verify.mockResolvedValue(false)

    const res = await POST(webhookRequest())

    expect(res.status).toBe(400)
    expect(mocks.unmarshal).not.toHaveBeenCalled()
    expect(mocks.sync).not.toHaveBeenCalled()
  })

  it('re-syncs from the Paddle API on subscription events and returns 200', async () => {
    const res = await POST(webhookRequest())

    expect(res.status).toBe(200)
    expect(mocks.sync).toHaveBeenCalledWith('sub_123', 'user-1')
  })

  it('returns 500 when the sync fails so Paddle retries the delivery', async () => {
    mocks.sync.mockRejectedValue(new Error('paddle API down'))

    const res = await POST(webhookRequest())

    expect(res.status).toBe(500)
  })

  it('acknowledges (200) permanently unresolvable subscriptions', async () => {
    mocks.unmarshal.mockResolvedValue(
      subscriptionEvent({ data: { id: 'sub_123', customData: null } })
    )
    mocks.sync.mockResolvedValue('unresolved_user')

    const res = await POST(webhookRequest())

    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ received: true, unresolved: 'sub_123' })
  })

  it('acknowledges (200) events it deliberately ignores', async () => {
    mocks.unmarshal.mockResolvedValue(
      subscriptionEvent({ eventType: 'customer.updated' })
    )

    const res = await POST(webhookRequest())

    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ ignored: 'customer.updated' })
    expect(mocks.sync).not.toHaveBeenCalled()
  })

  it('activates lifetime on transaction.completed with a lifetime price', async () => {
    mocks.unmarshal.mockResolvedValue({
      eventType: 'transaction.completed',
      eventId: 'evt_txn',
      data: {
        id: 'txn_1',
        customerId: 'ctm_1',
        customData: { omnis_user_id: 'user-1' },
        items: [{ price: { id: 'pri_lifetime' } }],
      },
    })

    const res = await POST(webhookRequest())

    expect(res.status).toBe(200)
    expect(mocks.upsertByUserId).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ plan: 'lifetime', status: 'active' })
    )
    expect(mocks.sync).not.toHaveBeenCalled()
  })

  it('ignores non-lifetime transaction.completed events', async () => {
    mocks.unmarshal.mockResolvedValue({
      eventType: 'transaction.completed',
      eventId: 'evt_txn',
      data: {
        id: 'txn_2',
        customData: { omnis_user_id: 'user-1' },
        items: [{ price: { id: 'pri_complete' } }],
      },
    })

    const res = await POST(webhookRequest())

    expect(res.status).toBe(200)
    expect(mocks.upsertByUserId).not.toHaveBeenCalled()
  })
})
