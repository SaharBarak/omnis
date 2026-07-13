import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { revenueCatProvider, __test } from './revenuecat'

/**
 * RevenueCat provider tests.
 *
 * `normalize` is the load-bearing translation from RevenueCat's subscriber
 * payload to our plan/status — an over-permissive bug here hands out paid
 * features for free, so the expiry and unknown-entitlement paths are covered
 * explicitly.
 */

const NOW = new Date('2026-07-15T00:00:00Z').getTime()
const FUTURE = '2026-08-01T00:00:00Z'
const PAST = '2026-07-01T00:00:00Z'

const { normalize } = __test

describe('normalize — entitlement → plan', () => {
  it('grants the plan for an active entitlement', () => {
    const result = normalize(
      {
        original_app_user_id: 'auth0|abc',
        entitlements: {
          complete: {
            expires_date: FUTURE,
            purchase_date: PAST,
            product_identifier: 'pleiad_complete_monthly',
          },
        },
        subscriptions: {
          pleiad_complete_monthly: { expires_date: FUTURE, period_type: 'normal' },
        },
      },
      'auth0|abc',
      NOW
    )

    expect(result).toMatchObject({
      plan: 'complete',
      status: 'active',
      customerId: 'auth0|abc',
      subscriptionId: 'pleiad_complete_monthly',
      cancelAtPeriodEnd: false,
    })
    expect(result.currentPeriodEnd).toEqual(new Date(FUTURE))
  })

  it('does NOT grant a plan for an expired entitlement', () => {
    const result = normalize(
      {
        entitlements: {
          complete: {
            expires_date: PAST, // lapsed before NOW
            purchase_date: '2026-06-01T00:00:00Z',
            product_identifier: 'pleiad_complete_monthly',
          },
        },
      },
      'auth0|abc',
      NOW
    )

    expect(result.plan).toBe('free')
    expect(result.status).toBe('canceled')
  })

  it('returns free for an unknown customer', () => {
    expect(normalize(null, 'auth0|abc', NOW).plan).toBe('free')
  })

  it('returns free when the customer exists but owns nothing', () => {
    const result = normalize({ entitlements: {} }, 'auth0|abc', NOW)
    expect(result.plan).toBe('free')
    expect(result.customerId).toBe('auth0|abc')
  })

  it('ignores an entitlement id we do not recognise', () => {
    // A stray entitlement configured in the RevenueCat dashboard must never
    // silently unlock a paid tier.
    const result = normalize(
      {
        entitlements: {
          some_promo: {
            expires_date: FUTURE,
            purchase_date: PAST,
            product_identifier: 'promo',
          },
        },
      },
      'auth0|abc',
      NOW
    )

    expect(result.plan).toBe('free')
  })

  it('picks the strongest plan when several entitlements are active', () => {
    const result = normalize(
      {
        entitlements: {
          explorer: {
            expires_date: FUTURE,
            purchase_date: PAST,
            product_identifier: 'pleiad_explorer_monthly',
          },
          practitioner: {
            expires_date: FUTURE,
            purchase_date: PAST,
            product_identifier: 'pleiad_practitioner_monthly',
          },
        },
      },
      'auth0|abc',
      NOW
    )

    expect(result.plan).toBe('practitioner')
    expect(result.subscriptionId).toBe('pleiad_practitioner_monthly')
  })
})

describe('normalize — lifetime', () => {
  it('treats a null expiry as never expiring', () => {
    const result = normalize(
      {
        entitlements: {
          lifetime: {
            expires_date: null, // non-consumable — no expiry
            purchase_date: PAST,
            product_identifier: 'pleiad_founding_lifetime',
          },
        },
        // No `subscriptions` entry at all: a one-time purchase is not a sub.
      },
      'auth0|abc',
      NOW
    )

    expect(result).toMatchObject({
      plan: 'lifetime',
      status: 'active',
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    })
  })
})

describe('normalize — status', () => {
  it('reports a trial as trialing', () => {
    const result = normalize(
      {
        entitlements: {
          complete: {
            expires_date: FUTURE,
            purchase_date: PAST,
            product_identifier: 'pleiad_complete_monthly',
          },
        },
        subscriptions: {
          pleiad_complete_monthly: { expires_date: FUTURE, period_type: 'trial' },
        },
      },
      'auth0|abc',
      NOW
    )

    expect(result.status).toBe('trialing')
  })

  it('reports a billing issue as past_due', () => {
    const result = normalize(
      {
        entitlements: {
          complete: {
            expires_date: FUTURE,
            purchase_date: PAST,
            product_identifier: 'pleiad_complete_monthly',
          },
        },
        subscriptions: {
          pleiad_complete_monthly: {
            expires_date: FUTURE,
            period_type: 'normal',
            billing_issues_detected_at: '2026-07-14T00:00:00Z',
          },
        },
      },
      'auth0|abc',
      NOW
    )

    expect(result.status).toBe('past_due')
  })

  it('flags cancel_at_period_end when auto-renew is off but access remains', () => {
    const result = normalize(
      {
        entitlements: {
          complete: {
            expires_date: FUTURE,
            purchase_date: PAST,
            product_identifier: 'pleiad_complete_monthly',
          },
        },
        subscriptions: {
          pleiad_complete_monthly: {
            expires_date: FUTURE,
            period_type: 'normal',
            unsubscribe_detected_at: '2026-07-10T00:00:00Z',
          },
        },
      },
      'auth0|abc',
      NOW
    )

    // Still entitled until the period ends — this is not a downgrade yet.
    expect(result).toMatchObject({
      plan: 'complete',
      status: 'active',
      cancelAtPeriodEnd: true,
    })
  })
})

describe('verifyWebhook', () => {
  beforeEach(() => {
    vi.stubEnv('REVENUECAT_WEBHOOK_SECRET', 'super-secret')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  const body = JSON.stringify({
    event: { id: 'evt_1', type: 'RENEWAL', app_user_id: 'auth0|abc' },
  })

  it('accepts a request carrying the configured secret', async () => {
    const event = await revenueCatProvider.verifyWebhook(
      body,
      new Headers({ authorization: 'super-secret' })
    )

    expect(event).toMatchObject({ type: 'RENEWAL', userIds: ['auth0|abc'] })
  })

  it('rejects a wrong secret', async () => {
    expect(
      await revenueCatProvider.verifyWebhook(
        body,
        new Headers({ authorization: 'wrong' })
      )
    ).toBeNull()
  })

  it('rejects a missing Authorization header', async () => {
    expect(await revenueCatProvider.verifyWebhook(body, new Headers())).toBeNull()
  })

  it('rejects an unparseable body', async () => {
    expect(
      await revenueCatProvider.verifyWebhook(
        'not json',
        new Headers({ authorization: 'super-secret' })
      )
    ).toBeNull()
  })

  it('throws when the secret is unconfigured (fails closed, never accepts)', async () => {
    vi.stubEnv('REVENUECAT_WEBHOOK_SECRET', '')

    await expect(
      revenueCatProvider.verifyWebhook(
        body,
        new Headers({ authorization: 'anything' })
      )
    ).rejects.toThrow(/REVENUECAT_WEBHOOK_SECRET/)
  })

  it('returns both sides of a TRANSFER so each is re-synced', async () => {
    const transfer = JSON.stringify({
      event: {
        id: 'evt_2',
        type: 'TRANSFER',
        transferred_from: ['auth0|old'],
        transferred_to: ['auth0|new'],
      },
    })

    const event = await revenueCatProvider.verifyWebhook(
      transfer,
      new Headers({ authorization: 'super-secret' })
    )

    expect(event?.userIds).toEqual(['auth0|old', 'auth0|new'])
  })
})
