/**
 * Billing Portal API
 * Creates a Stripe Billing Portal session for self-service management
 *
 * USER context: reads the caller's own stripe_customer_id, scoped by
 * requireUserId().
 */

import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth-server'
import { handleApiError } from '@/lib/api/respond'
import { getSubscription } from '@/lib/db/repositories/subscriptions-repo'
import { createBillingPortalSession } from '@/lib/services/billing'

export async function POST(request: Request) {
  try {
    const userId = await requireUserId()

    // Get the caller's own subscription (for its Stripe customer id)
    const subscription = await getSubscription(userId)

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // Get base URL for redirect
    const origin =
      request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000'

    // Create billing portal session (Stripe)
    const { url } = await createBillingPortalSession(
      subscription.stripe_customer_id,
      `${origin}/app/settings/billing`
    )

    return NextResponse.json({ url })
  } catch (error) {
    return handleApiError(error, 'POST /api/billing/portal')
  }
}
