/**
 * Checkout API
 * Creates a hosted Paddle checkout transaction for a subscription.
 *
 * USER context: the checkout is created for the caller, scoped by their
 * authenticated session. The Paddle customer is keyed to the caller's user id.
 */

import { NextResponse } from 'next/server'
import { getSession, UnauthorizedError } from '@/lib/auth-server'
import { handleApiError } from '@/lib/api/respond'
import { createCheckoutTransaction, isPaidPlanTier } from '@/lib/services/billing'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    const user = session?.user
    if (!user) {
      throw new UnauthorizedError()
    }

    // Parse request body
    const body = await request.json()
    const { plan } = body

    if (!isPaidPlanTier(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be "explorer", "complete" or "practitioner"' },
        { status: 400 }
      )
    }

    // Create hosted Paddle checkout for the authenticated caller.
    // The post-checkout return URL is configured in Paddle's checkout settings.
    const { url } = await createCheckoutTransaction(user.id, user.email || '', plan)

    if (!url) {
      throw new Error('Failed to create checkout session')
    }

    return NextResponse.json({ url })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return handleApiError(error, 'POST /api/billing/checkout')
    }
    console.error('Checkout error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create checkout session',
      },
      { status: 500 }
    )
  }
}
