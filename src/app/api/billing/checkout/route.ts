/**
 * Checkout Session API
 * Creates a Stripe Checkout session for subscription
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/services/billing'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
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
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Create checkout session
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
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
