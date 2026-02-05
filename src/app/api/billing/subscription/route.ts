/**
 * Subscription API
 * Get current user's subscription details and usage
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUsageSummary } from '@/lib/services/usage'
import { PLANS } from '@/lib/services/billing'

export async function GET() {
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

    // Get subscription from database
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Get usage summary
    const usage = await getUsageSummary(user.id)

    // Build response
    const response = {
      plan: subscription?.plan || 'free',
      planName: PLANS[subscription?.plan as keyof typeof PLANS || 'free'].name,
      status: subscription?.status || 'active',
      currentPeriodEnd: subscription?.current_period_end,
      cancelAtPeriodEnd: subscription?.cancel_at_period_end || false,
      hasStripeSubscription: !!subscription?.stripe_subscription_id,
      usage: usage.usage,
      features: usage.features,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Subscription fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
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

    // Get subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', user.id)
      .single()

    if (subError || !subscription?.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription to cancel' },
        { status: 404 }
      )
    }

    // Import dynamically to avoid issues
    const { cancelSubscription } = await import('@/lib/services/billing')
    
    // Cancel at period end
    await cancelSubscription(subscription.stripe_subscription_id)

    // Update local record
    await supabase
      .from('subscriptions')
      .update({ cancel_at_period_end: true })
      .eq('user_id', user.id)

    return NextResponse.json({ success: true, message: 'Subscription will be canceled at period end' })
  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}

export async function PATCH() {
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

    // Get subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id, cancel_at_period_end')
      .eq('user_id', user.id)
      .single()

    if (subError || !subscription?.stripe_subscription_id) {
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

    // Reactivate subscription
    const { reactivateSubscription } = await import('@/lib/services/billing')
    await reactivateSubscription(subscription.stripe_subscription_id)

    // Update local record
    await supabase
      .from('subscriptions')
      .update({ cancel_at_period_end: false })
      .eq('user_id', user.id)

    return NextResponse.json({ success: true, message: 'Subscription reactivated' })
  } catch (error) {
    console.error('Reactivate subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to reactivate subscription' },
      { status: 500 }
    )
  }
}
