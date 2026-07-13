/**
 * Billing webhook handler.
 *
 * SYSTEM context: authenticated by the provider's verified webhook secret, NOT
 * a user session. It must NOT use requireUserId().
 *
 * Hardened per t3dotgg/stripe-recommendations:
 * - Event payloads are NOT trusted as state. Every event triggers a re-fetch of
 *   the affected user's entitlement from the provider, which is upserted as the
 *   single source of truth (syncSubscription). Duplicate deliveries are
 *   therefore idempotent and out-of-order deliveries convergent.
 * - The secret is compared in constant time inside the provider's verifyWebhook.
 * - Real processing failures (provider API / DB errors) return 500 so the
 *   provider retries; permanently unresolvable events return 200 so it stops.
 *
 * The raw request body MUST be passed to verification unmodified — do not parse
 * it before verification.
 */

import { NextResponse } from 'next/server'
import { getBillingProvider } from '@/lib/services/billing-provider'
import { syncSubscription } from '@/lib/services/subscription-sync'

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()

    const provider = await getBillingProvider()

    // Throws if the webhook secret is unconfigured -> 500 -> provider retries
    // once it is fixed. Returns null on a bad/absent secret -> 401.
    const event = await provider.verifyWebhook(rawBody, request.headers)
    if (!event) {
      console.error(`[billing] ${provider.name} webhook rejected: bad signature`)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Only user ids are read from the payload; all state is re-fetched from the
    // provider inside the sync. A TRANSFER event carries two users.
    const results = await Promise.all(
      event.userIds.map(async (userId) => ({
        userId,
        // Throws on provider/DB failure -> outer catch -> 500 -> retry.
        result: await syncSubscription(userId),
      }))
    )

    const unresolved = results.filter((r) => r.result === 'unresolved_user')
    if (unresolved.length > 0) {
      // Permanent: retries redeliver the same payload with the same empty id.
      console.error(
        `[billing] ${event.type} (${event.eventId ?? 'no id'}): unresolvable users; acknowledged without sync`
      )
    }

    console.log(
      `[billing] ${event.type} (${event.eventId ?? 'no id'}): synced ${results.length - unresolved.length}/${results.length} user(s)`
    )
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[billing] webhook error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
