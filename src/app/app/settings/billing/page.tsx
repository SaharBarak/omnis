'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { SubscriptionStatus } from '@/components/billing/subscription-status'
import { UsageDisplay } from '@/components/billing/usage-display'
import { GetTheApp } from '@/components/billing/get-the-app'
import { useSubscription } from '@/lib/hooks/use-plan'
import { PageHeader } from '@/components/dashboard'
import { Eyebrow, Notice, SkeletonCard } from '@/components/app-kit'

/**
 * Billing settings.
 *
 * Read-only by design: paid plans are in-app purchases, so the App Store /
 * Google Play own checkout, renewal and cancellation. This page reports the
 * current entitlement, points upgrades at the app, and deep-links to the OS
 * subscription settings for anything else.
 */
export default function BillingPage() {
  const { subscription, loading } = useSubscription({ sync: true })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to open subscription settings')
      }
    } catch (error) {
      console.error('Manage subscription error:', error)
      setMessage({
        type: 'error',
        text: 'Could not open your subscription settings. You can also manage Pleiad from your device’s App Store or Google Play account.',
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="skeleton-shimmer mb-2 h-8 w-32 rounded" />
          <div className="skeleton-shimmer h-4 w-80 rounded" />
        </div>
        <SkeletonCard className="h-40" />
        <SkeletonCard className="h-48" />
        <SkeletonCard className="h-40" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        subtitle="Your plan and usage. Purchases are handled by the App Store and Google Play."
      />

      {message && (
        <Notice
          variant={message.type === 'success' ? 'success' : 'error'}
          action={
            <button
              type="button"
              onClick={() => setMessage(null)}
              aria-label="Dismiss message"
              className="rounded-lg p-1 text-white/50 transition-colors hover:text-white/90 active:scale-[0.98]"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          }
        >
          {message.text}
        </Notice>
      )}

      {subscription && (
        <SubscriptionStatus
          plan={subscription.plan}
          status={subscription.status}
          currentPeriodEnd={subscription.currentPeriodEnd}
          cancelAtPeriodEnd={subscription.cancelAtPeriodEnd}
          hasSubscription={subscription.hasSubscription}
          onManageSubscription={
            subscription.hasSubscription ? handleManageSubscription : undefined
          }
        />
      )}

      {subscription && (
        <div className="surface-card p-6">
          <div className="mb-5">
            <Eyebrow>Usage This Month</Eyebrow>
          </div>
          <UsageDisplay usage={subscription.usage} />
        </div>
      )}

      {subscription?.plan !== 'lifetime' && (
        <div className="surface-card p-6">
          <div className="mb-2">
            <Eyebrow>Upgrade</Eyebrow>
          </div>
          <p className="mb-4 text-sm text-white/50">
            Plans are purchased inside the Pleiad app. Your subscription unlocks
            here on the web automatically: same account, same map.
          </p>
          <GetTheApp />
        </div>
      )}
    </div>
  )
}
