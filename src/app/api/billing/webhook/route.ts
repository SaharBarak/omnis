/**
 * Stripe Webhook Handler
 * Processes subscription lifecycle events from Stripe
 *
 * SYSTEM context: this route is authenticated by the verified Stripe signature,
 * NOT by a user session. It must NOT use requireUserId(). It writes subscription
 * state keyed off Stripe identifiers (customer/subscription id) or the user id
 * carried in verified checkout-session metadata, via the system-context repo
 * functions.
 *
 * Stripe event parsing + signature verification are unchanged; only the
 * datastore writes moved from Supabase to Mongoose.
 */

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { constructWebhookEvent, getPlanFromSubscription } from '@/lib/services/billing'
import {
  upsertSubscriptionByUserId,
  updateByStripeSubscriptionId,
} from '@/lib/db/repositories/subscriptions-repo'

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Verify and construct the event
    let event: Stripe.Event
    try {
      event = constructWebhookEvent(body, signature)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle successful checkout completion.
 * Upserts the subscription keyed by the user id from verified session metadata.
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.omnis_user_id
  const plan = session.metadata?.omnis_plan as 'complete' | 'practitioner'

  if (!userId || !plan) {
    console.error('Missing metadata in checkout session:', session.id)
    return
  }

  const subscriptionId = session.subscription as string
  const customerId = session.customer as string

  // Upsert subscription record (system context, keyed by user_id)
  await upsertSubscriptionByUserId(userId, {
    plan,
    status: 'active',
    stripe_subscription_id: subscriptionId,
    stripe_customer_id: customerId,
    current_period_start: new Date(),
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Will be updated by invoice.paid
  })

  console.log(`Checkout completed for user ${userId}, plan: ${plan}`)
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Extract subscription ID from invoice - cast to access subscription field
  const invoiceData = invoice as unknown as { subscription?: string | { id: string } | null }
  const subscriptionId = typeof invoiceData.subscription === 'string'
    ? invoiceData.subscription
    : invoiceData.subscription?.id

  if (!subscriptionId) {
    return // Not a subscription invoice
  }

  // Update subscription period (system context, keyed by stripe_subscription_id)
  const matched = await updateByStripeSubscriptionId(subscriptionId, {
    status: 'active',
    current_period_end: new Date((invoice.lines.data[0]?.period?.end || 0) * 1000),
  })

  if (!matched) {
    console.error(
      `No subscription matched stripe_subscription_id ${subscriptionId} on invoice paid`
    )
  }

  console.log(`Invoice paid for subscription ${subscriptionId}`)
}

/**
 * Handle failed invoice payment
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Extract subscription ID from invoice - cast to access subscription field
  const invoiceData = invoice as unknown as { subscription?: string | { id: string } | null }
  const subscriptionId = typeof invoiceData.subscription === 'string'
    ? invoiceData.subscription
    : invoiceData.subscription?.id

  if (!subscriptionId) {
    return
  }

  const matched = await updateByStripeSubscriptionId(subscriptionId, {
    status: 'past_due',
  })

  if (!matched) {
    console.error(
      `No subscription matched stripe_subscription_id ${subscriptionId} on payment failed`
    )
  }

  console.log(`Payment failed for subscription ${subscriptionId}`)
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const plan = getPlanFromSubscription(subscription)

  // Cast to access properties that might not be in type definitions
  const subData = subscription as unknown as {
    id: string
    status: string
    cancel_at_period_end: boolean
    current_period_start: number
    current_period_end: number
  }

  const matched = await updateByStripeSubscriptionId(subData.id, {
    plan,
    status:
      subData.status === 'active'
        ? 'active'
        : subData.status === 'trialing'
          ? 'trialing'
          : subData.status === 'past_due'
            ? 'past_due'
            : 'canceled',
    cancel_at_period_end: subData.cancel_at_period_end,
    current_period_start: new Date(subData.current_period_start * 1000),
    current_period_end: new Date(subData.current_period_end * 1000),
  })

  if (!matched) {
    console.error(`No subscription matched stripe_subscription_id ${subData.id}`)
  }

  console.log(`Subscription ${subData.id} updated to ${subData.status}`)
}

/**
 * Handle subscription deletion/cancellation
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const matched = await updateByStripeSubscriptionId(subscription.id, {
    plan: 'free',
    status: 'canceled',
    cancel_at_period_end: false,
  })

  if (!matched) {
    console.error(
      `No subscription matched stripe_subscription_id ${subscription.id} on deletion`
    )
  }

  console.log(`Subscription ${subscription.id} deleted/canceled`)
}
