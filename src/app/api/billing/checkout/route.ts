/**
 * Checkout Session API
 * Creates a Stripe Checkout session for subscription
 *
 * USER context: the checkout is created for the caller, scoped by their
 * authenticated session. The Stripe customer/subscription are keyed to the
 * caller's user id. Stripe calls are unchanged — only the auth source moved
 * off Supabase.
 */

import { NextResponse } from 'next/server'
import { getSession, UnauthorizedError } from '@/lib/auth-server'
import { handleApiError } from '@/lib/api/respond'
import { createCheckoutSession } from '@/lib/services/billing'

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

    if (!plan || !['complete', 'practitioner'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be "complete" or "practitioner"' },
        { status: 400 }
      )
    }

    // Get base URL for redirect
    const origin =
      request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000'

    // Create checkout session (Stripe) for the authenticated caller
    const { url } = await createCheckoutSession(
      user.id,
      user.email || '',
      plan as 'complete' | 'practitioner',
      `${origin}/app/settings/billing?success=true`,
      `${origin}/app/settings/billing?canceled=true`
    )

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
