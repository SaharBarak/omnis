/**
 * Billing Portal API
 * Creates a Paddle customer portal session for self-service management.
 *
 * USER context: reads the caller's own paddle_customer_id, scoped by
 * requireUserId().
 */

import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth-server'
import { handleApiError } from '@/lib/api/respond'
import { getSubscription } from '@/lib/db/repositories/subscriptions-repo'
import { createPortalSession } from '@/lib/services/billing'

export async function POST() {
  try {
    const userId = await requireUserId()

    // Get the caller's own subscription (for its Paddle customer id)
    const subscription = await getSubscription(userId)

    if (!subscription?.paddle_customer_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // Create Paddle customer portal session, scoped to the caller's subscription
    const { url } = await createPortalSession(
      subscription.paddle_customer_id,
      subscription.paddle_subscription_id
        ? [subscription.paddle_subscription_id]
        : []
    )

    return NextResponse.json({ url })
  } catch (error) {
    return handleApiError(error, 'POST /api/billing/portal')
  }
}
