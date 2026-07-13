/**
 * Subscription API
 * Get the current user's subscription details and usage.
 *
 * USER context: operates on the caller's own subscription, scoped by
 * requireUserId().
 *
 * Read-only. Paid access is an in-app purchase, so the store owns the
 * lifecycle: cancelling and resuming happen in the OS subscription settings
 * (see POST /api/billing/portal for the deep link), and the resulting state
 * flows back through the billing webhook.
 */

import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth-server'
import { handleApiError } from '@/lib/api/respond'
import { resyncSubscriptionIfStale } from '@/lib/services/subscription-sync'
import { getUsageSummary } from '@/lib/services/usage'
import { PLANS } from '@/lib/services/billing'

export async function GET(request: Request) {
  try {
    const userId = await requireUserId()

    // Re-sync from the provider when forced (?refresh=1 — e.g. right after an
    // in-app purchase, racing the webhook) or when the local row is stale.
    // Falls back to cached state if the provider is unreachable.
    const force = new URL(request.url).searchParams.get('refresh') === '1'
    const subscription = await resyncSubscriptionIfStale(userId, { force })

    const usage = await getUsageSummary(userId)

    const response = {
      plan: subscription?.plan || 'free',
      planName: PLANS[(subscription?.plan as keyof typeof PLANS) || 'free'].name,
      status: subscription?.status || 'active',
      currentPeriodEnd: subscription?.current_period_end,
      cancelAtPeriodEnd: subscription?.cancel_at_period_end || false,
      hasSubscription: !!subscription?.billing_subscription_id,
      usage: usage.usage,
      features: usage.features,
    }

    return NextResponse.json(response)
  } catch (error) {
    return handleApiError(error, 'GET /api/billing/subscription')
  }
}
