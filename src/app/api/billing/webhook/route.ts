/**
 * Paddle Webhook Handler
 * Processes subscription lifecycle events from Paddle.
 *
 * SYSTEM context: authenticated by the verified Paddle signature, NOT a user
 * session. It must NOT use requireUserId(). It writes subscription state keyed
 * off Paddle identifiers (subscription/customer id) or the OmnisX user id carried
 * in verified custom data, via the system-context repo functions.
 *
 * The raw request body MUST be passed to unmarshal unmodified — do not parse it
 * before verification or the signature check fails.
 */

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { EventName } from '@paddle/paddle-node-sdk'
import {
  unmarshalWebhookEvent,
  getPlanFromPriceId,
  mapPaddleStatus,
} from '@/lib/services/billing'
import {
  upsertSubscriptionByUserId,
  updateByPaddleSubscriptionId,
} from '@/lib/db/repositories/subscriptions-repo'

interface PaddleSubscriptionData {
  id: string
  status: string
  customerId: string
  customData?: Record<string, unknown> | null
  items?: Array<{ price?: { id?: string } | null }>
  currentBillingPeriod?: { startsAt?: string; endsAt?: string } | null
  scheduledChange?: { action?: string } | null
}

function periodDates(sub: PaddleSubscriptionData) {
  const start = sub.currentBillingPeriod?.startsAt
  const end = sub.currentBillingPeriod?.endsAt
  return {
    current_period_start: start ? new Date(start) : null,
    current_period_end: end ? new Date(end) : null,
  }
}

function planFromItems(sub: PaddleSubscriptionData) {
  return getPlanFromPriceId(sub.items?.[0]?.price?.id)
}

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

    let event
    try {
      event = await unmarshalWebhookEvent(rawBody, signature)
    } catch (err) {
      console.error('Paddle webhook verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    switch (event.eventType) {
      case EventName.SubscriptionCreated: {
        const sub = event.data as unknown as PaddleSubscriptionData
        const userId = sub.customData?.omnis_user_id as string | undefined
        if (!userId) {
          console.error('SubscriptionCreated missing omnis_user_id:', sub.id)
          break
        }
        await upsertSubscriptionByUserId(userId, {
          plan: planFromItems(sub),
          status: mapPaddleStatus(sub.status),
          paddle_subscription_id: sub.id,
          paddle_customer_id: sub.customerId,
          cancel_at_period_end: sub.scheduledChange?.action === 'cancel',
          ...periodDates(sub),
        })
        console.log(`Subscription created for user ${userId}`)
        break
      }

      case EventName.SubscriptionUpdated: {
        const sub = event.data as unknown as PaddleSubscriptionData
        const matched = await updateByPaddleSubscriptionId(sub.id, {
          plan: planFromItems(sub),
          status: mapPaddleStatus(sub.status),
          cancel_at_period_end: sub.scheduledChange?.action === 'cancel',
          ...periodDates(sub),
        })
        if (!matched) {
          // Late-arriving update before the created event landed — backfill.
          const userId = sub.customData?.omnis_user_id as string | undefined
          if (userId) {
            await upsertSubscriptionByUserId(userId, {
              plan: planFromItems(sub),
              status: mapPaddleStatus(sub.status),
              paddle_subscription_id: sub.id,
              paddle_customer_id: sub.customerId,
              cancel_at_period_end: sub.scheduledChange?.action === 'cancel',
              ...periodDates(sub),
            })
          } else {
            console.error(`No subscription matched paddle id ${sub.id} on update`)
          }
        }
        console.log(`Subscription ${sub.id} updated to ${sub.status}`)
        break
      }

      case EventName.SubscriptionCanceled: {
        const sub = event.data as unknown as PaddleSubscriptionData
        const matched = await updateByPaddleSubscriptionId(sub.id, {
          plan: 'free',
          status: 'canceled',
          cancel_at_period_end: false,
        })
        if (!matched) {
          console.error(`No subscription matched paddle id ${sub.id} on cancel`)
        }
        console.log(`Subscription ${sub.id} canceled`)
        break
      }

      default:
        console.log(`Unhandled Paddle event: ${event.eventType}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
