/**
 * Paddle Webhook Handler
 * Processes subscription lifecycle events from Paddle.
 *
 * SYSTEM context: authenticated by the verified Paddle signature, NOT a user
 * session. It must NOT use requireUserId().
 *
 * Hardened per t3dotgg/stripe-recommendations, adapted to Paddle:
 * - Event payloads are NOT trusted as state. Every subscription event triggers
 *   a re-fetch of the current subscription from the Paddle API, which is
 *   upserted as the single source of truth (syncPaddleSubscription). This makes
 *   duplicate deliveries idempotent and out-of-order deliveries convergent.
 * - The signature is verified timing-safe before the SDK's unmarshal (which
 *   re-verifies with timestamp freshness and parses the typed event).
 * - Real processing failures (Paddle API/DB errors) return 500 so Paddle
 *   retries; deliberately ignored events and permanently unresolvable ones
 *   return 200 so Paddle stops redelivering.
 *
 * The raw request body MUST be passed to verification unmodified — do not
 * parse it before verification or the signature check fails.
 */

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { EventName } from '@paddle/paddle-node-sdk'
import {
  unmarshalWebhookEvent,
  getPlanFromPriceId,
} from '@/lib/services/billing'
import { upsertSubscriptionByUserId } from '@/lib/db/repositories/subscriptions-repo'
import {
  syncPaddleSubscription,
  verifyPaddleWebhookSignature,
} from '@/lib/services/subscription-sync'

interface PaddleTransactionData {
  id: string
  customerId?: string | null
  customData?: Record<string, unknown> | null
  items?: Array<{ price?: { id?: string } | null }>
}

/** All subscription lifecycle events are handled identically: re-sync. */
const SUBSCRIPTION_EVENTS = new Set<string>([
  EventName.SubscriptionCreated,
  EventName.SubscriptionActivated,
  EventName.SubscriptionTrialing,
  EventName.SubscriptionUpdated,
  EventName.SubscriptionPastDue,
  EventName.SubscriptionPaused,
  EventName.SubscriptionResumed,
  EventName.SubscriptionCanceled,
])

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const signature = (await headers()).get('paddle-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing paddle-signature header' },
        { status: 400 }
      )
    }

    const secret = process.env.PADDLE_WEBHOOK_SECRET
    if (!secret) {
      // Misconfiguration — 500 so Paddle retries once it is fixed.
      console.error('PADDLE_WEBHOOK_SECRET not configured')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    // Timing-safe verification first; the SDK unmarshal below re-verifies
    // (adding timestamp freshness) and parses the typed event.
    if (!(await verifyPaddleWebhookSignature(rawBody, signature, secret))) {
      console.error('Paddle webhook signature mismatch')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    let event
    try {
      event = await unmarshalWebhookEvent(rawBody, signature)
    } catch (err) {
      console.error('Paddle webhook verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    if (SUBSCRIPTION_EVENTS.has(event.eventType)) {
      // Only the subscription id (and a user-id hint) are read from the
      // payload; state is re-fetched from the Paddle API inside the sync.
      const data = event.data as {
        id: string
        customData?: Record<string, unknown> | null
      }
      const fallbackUserId =
        typeof data.customData?.omnis_user_id === 'string'
          ? data.customData.omnis_user_id
          : undefined

      // Throws on Paddle API/DB failure -> outer catch -> 500 -> Paddle retries.
      const result = await syncPaddleSubscription(data.id, fallbackUserId)

      if (result === 'unresolved_user') {
        // Permanent: no omnis_user_id anywhere — retries cannot fix this.
        console.error(
          `Paddle ${event.eventType} (${event.eventId}): subscription ${data.id} has no resolvable user; acknowledged without sync`
        )
        return NextResponse.json({ received: true, unresolved: data.id })
      }

      console.log(
        `Paddle ${event.eventType} (${event.eventId}): synced subscription ${data.id}`
      )
      return NextResponse.json({ received: true })
    }

    if (event.eventType === EventName.TransactionCompleted) {
      // One-time purchases (Founding Lifetime) never emit subscription
      // events — activation happens here. Subscription-tier transactions
      // are ignored; their state flows through the subscription events.
      const txn = event.data as unknown as PaddleTransactionData
      const plan = getPlanFromPriceId(txn.items?.[0]?.price?.id)
      if (plan !== 'lifetime') {
        return NextResponse.json({ received: true, ignored: event.eventType })
      }

      const userId = txn.customData?.omnis_user_id as string | undefined
      if (!userId) {
        // Permanent: retries redeliver the same payload without a user id.
        console.error('Lifetime TransactionCompleted missing omnis_user_id:', txn.id)
        return NextResponse.json({ received: true, unresolved: txn.id })
      }
      // Lifetime never expires: status stays 'active' and
      // current_period_end stays null, so getUserPlan never downgrades it.
      // Idempotent: repeated deliveries upsert the same row to the same state.
      await upsertSubscriptionByUserId(userId, {
        plan: 'lifetime',
        status: 'active',
        paddle_customer_id: txn.customerId ?? null,
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
      })
      console.log(`Lifetime plan activated for user ${userId} (txn ${txn.id})`)
      return NextResponse.json({ received: true })
    }

    console.log(`Ignoring Paddle event ${event.eventType} (${event.eventId})`)
    return NextResponse.json({ received: true, ignored: event.eventType })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
