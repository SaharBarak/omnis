/**
 * Subscription API
 * Get current user's subscription details and usage
 *
 * USER context: every handler operates on the caller's own subscription,
 * scoped by requireUserId(). The subscription row must belong to the caller.
 */

import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth-server'
import { handleApiError } from '@/lib/api/respond'
import {
  getSubscription,
  updateSubscriptionForUser,
} from '@/lib/db/repositories/subscriptions-repo'
import { getUsageSummary } from '@/lib/services/usage'
import { PLANS } from '@/lib/services/billing'

export async function GET() {
  try {
    const userId = await requireUserId()

    // Get the caller's own subscription
    const subscription = await getSubscription(userId)

    // Get usage summary
    const usage = await getUsageSummary(userId)

    // Build response
    const response = {
      plan: subscription?.plan || 'free',
      planName: PLANS[(subscription?.plan as keyof typeof PLANS) || 'free'].name,
      status: subscription?.status || 'active',
      currentPeriodEnd: subscription?.current_period_end,
      cancelAtPeriodEnd: subscription?.cancel_at_period_end || false,
      hasStripeSubscription: !!subscription?.stripe_subscription_id,
      usage: usage.usage,
      features: usage.features,
    }

    return NextResponse.json(response)
  } catch (error) {
    return handleApiError(error, 'GET /api/billing/subscription')
  }
}

export async function DELETE() {
  try {
    const userId = await requireUserId()

    // Get the caller's own subscription
    const subscription = await getSubscription(userId)

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription to cancel' },
        { status: 404 }
      )
    }

    // Import dynamically to avoid issues
    const { cancelSubscription } = await import('@/lib/services/billing')

    // Cancel at period end (Stripe)
    await cancelSubscription(subscription.stripe_subscription_id)

    // Update local record (owner-scoped)
    await updateSubscriptionForUser(userId, { cancel_at_period_end: true })

    return NextResponse.json({
      success: true,
      message: 'Subscription will be canceled at period end',
    })
  } catch (error) {
    return handleApiError(error, 'DELETE /api/billing/subscription')
  }
}

export async function PATCH() {
  try {
    const userId = await requireUserId()

    // Get the caller's own subscription
    const subscription = await getSubscription(userId)

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      )
    }

    if (!subscription.cancel_at_period_end) {
      return NextResponse.json(
        { error: 'Subscription is not scheduled for cancellation' },
        { status: 400 }
      )
    }

    // Reactivate subscription (Stripe)
    const { reactivateSubscription } = await import('@/lib/services/billing')
    await reactivateSubscription(subscription.stripe_subscription_id)

    // Update local record (owner-scoped)
    await updateSubscriptionForUser(userId, { cancel_at_period_end: false })

    return NextResponse.json({ success: true, message: 'Subscription reactivated' })
  } catch (error) {
    return handleApiError(error, 'PATCH /api/billing/subscription')
  }
}
