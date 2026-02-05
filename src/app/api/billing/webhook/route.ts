/**
 * Stripe Webhook Handler
 * Processes subscription lifecycle events from Stripe
 */

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { constructWebhookEvent, getPlanFromSubscription } from '@/lib/services/billing'

// Use service role for webhook handler (bypasses RLS)
// Lazy initialization to avoid build-time errors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabaseAdmin: ReturnType<typeof createClient<any>> | null = null
function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _supabaseAdmin = createClient<any>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _supabaseAdmin
}

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
 * Handle successful checkout completion
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

  // Upsert subscription record
  const { error } = await getSupabaseAdmin()
    .from('subscriptions')
    .upsert({
      user_id: userId,
      plan,
      status: 'active',
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: customerId,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Will be updated by invoice.paid
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    })

  if (error) {
    console.error('Error upserting subscription:', error)
    throw error
  }

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

  // Update subscription period
  const { error } = await getSupabaseAdmin()
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_end: new Date((invoice.lines.data[0]?.period?.end || 0) * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId)

  if (error) {
    console.error('Error updating subscription on invoice paid:', error)
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

  const { error } = await getSupabaseAdmin()
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId)

  if (error) {
    console.error('Error updating subscription on payment failed:', error)
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
  
  const { error } = await getSupabaseAdmin()
    .from('subscriptions')
    .update({
      plan,
      status: subData.status === 'active' ? 'active' : 
              subData.status === 'trialing' ? 'trialing' : 
              subData.status === 'past_due' ? 'past_due' : 'canceled',
      cancel_at_period_end: subData.cancel_at_period_end,
      current_period_start: new Date(subData.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subData.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subData.id)

  if (error) {
    console.error('Error updating subscription:', error)
  }

  console.log(`Subscription ${subData.id} updated to ${subData.status}`)
}

/**
 * Handle subscription deletion/cancellation
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { error } = await getSupabaseAdmin()
    .from('subscriptions')
    .update({
      plan: 'free',
      status: 'canceled',
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error handling subscription deletion:', error)
  }

  console.log(`Subscription ${subscription.id} deleted/canceled`)
}
