/**
 * Billing Portal API
 * Returns the deep link where the caller manages or cancels their purchase.
 *
 * Paid access is an in-app purchase, so the store owns the subscription
 * lifecycle — this resolves to the OS subscription-management screen
 * (RevenueCat's `management_url`), not a hosted vendor portal. Any change the
 * user makes there flows back through the billing webhook.
 *
 * USER context: scoped by requireUserId(); a caller can only ever resolve their
 * own management URL.
 */

import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth-server'
import { handleApiError } from '@/lib/api/respond'
import { getBillingProvider } from '@/lib/services/billing-provider'

export async function POST() {
  try {
    const userId = await requireUserId()

    const provider = await getBillingProvider()
    const url = await provider.getManagementUrl(userId)

    if (!url) {
      // No store purchase to manage (free user, or the purchase was made on a
      // platform that does not expose a management URL).
      return NextResponse.json(
        { error: 'No manageable subscription found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ url })
  } catch (error) {
    return handleApiError(error, 'POST /api/billing/portal')
  }
}
