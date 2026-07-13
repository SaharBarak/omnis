import { describe, it, expect, vi, beforeEach } from 'vitest'

import { POST } from './route'

/**
 * Webhook route semantics (failure visibility):
 * - 401 when the provider rejects the signature/secret
 * - 500 on real processing failures so the provider retries
 * - 200 once every affected user has been re-synced, and on permanently
 *   unresolvable events so the provider stops redelivering
 * - a TRANSFER event re-syncs both sides
 */

const mocks = vi.hoisted(() => ({
  verifyWebhook: vi.fn(),
  sync: vi.fn(),
}))

vi.mock('@/lib/services/billing-provider', () => ({
  getBillingProvider: async () => ({
    name: 'revenuecat',
    verifyWebhook: mocks.verifyWebhook,
  }),
}))

vi.mock('@/lib/services/subscription-sync', () => ({
  syncSubscription: mocks.sync,
}))

function webhookRequest(body: Record<string, unknown> = {}) {
  return new Request('https://example.com/api/billing/webhook', {
    method: 'POST',
    headers: { authorization: 'secret' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.verifyWebhook.mockResolvedValue({
    type: 'RENEWAL',
    eventId: 'evt_1',
    userIds: ['user-1'],
  })
  mocks.sync.mockResolvedValue('synced')
})

describe('POST /api/billing/webhook', () => {
  it('re-syncs the affected user and acknowledges', async () => {
    const response = await POST(webhookRequest())

    expect(response.status).toBe(200)
    expect(mocks.sync).toHaveBeenCalledWith('user-1')
  })

  it('rejects with 401 when the provider does not verify the request', async () => {
    mocks.verifyWebhook.mockResolvedValue(null)

    const response = await POST(webhookRequest())

    expect(response.status).toBe(401)
    // A forged request must never reach the sync.
    expect(mocks.sync).not.toHaveBeenCalled()
  })

  it('returns 500 when the webhook secret is unconfigured (so it retries once fixed)', async () => {
    mocks.verifyWebhook.mockRejectedValue(
      new Error('REVENUECAT_WEBHOOK_SECRET is not set')
    )

    const response = await POST(webhookRequest())

    expect(response.status).toBe(500)
    expect(mocks.sync).not.toHaveBeenCalled()
  })

  it('returns 500 when the sync fails, so the provider retries', async () => {
    mocks.sync.mockRejectedValue(new Error('revenuecat down'))

    const response = await POST(webhookRequest())

    expect(response.status).toBe(500)
  })

  it('acknowledges (200) an unresolvable user so the provider stops redelivering', async () => {
    mocks.sync.mockResolvedValue('unresolved_user')

    const response = await POST(webhookRequest())

    expect(response.status).toBe(200)
  })

  it('re-syncs both sides of a TRANSFER event', async () => {
    mocks.verifyWebhook.mockResolvedValue({
      type: 'TRANSFER',
      eventId: 'evt_2',
      userIds: ['user-from', 'user-to'],
    })

    const response = await POST(webhookRequest())

    expect(response.status).toBe(200)
    expect(mocks.sync).toHaveBeenCalledWith('user-from')
    expect(mocks.sync).toHaveBeenCalledWith('user-to')
  })
})
