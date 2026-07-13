'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { SubscriptionStatus } from '@/components/billing/subscription-status'
import { UsageDisplay } from '@/components/billing/usage-display'
import { GetTheApp } from '@/components/billing/get-the-app'
import { PlanTier } from '@/lib/services/billing'

/**
 * Billing settings.
 *
 * Read-only by design: paid plans are in-app purchases, so the App Store /
 * Google Play own checkout, renewal and cancellation. This page reports the
 * current entitlement, points upgrades at the app, and deep-links to the OS
 * subscription settings for anything else.
 */
interface SubscriptionData {
  plan: PlanTier
  planName: string
  status: string
  currentPeriodEnd?: string
  cancelAtPeriodEnd: boolean
  hasSubscription: boolean
  usage: {
    profiles: { used: number; limit: number; percentage: number }
    aiInterpretations: { used: number; limit: number; percentage: number }
    boards: { used: number; limit: number; percentage: number }
  }
  features: {
    exports: boolean
    timeline: boolean
    relationships: boolean | string
    groupAnalysis: boolean
    apiAccess: boolean
  }
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchSubscription = useCallback(async () => {
    try {
      // refresh=1 re-syncs from the billing provider — a purchase made on the
      // phone moments ago may still be racing the webhook.
      const response = await fetch('/api/billing/subscription?refresh=1')
      if (response.ok) {
        setSubscription(await response.json())
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

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
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading text-foreground">Billing</h1>
        <p className="text-muted-foreground">
          Your plan and usage. Purchases are handled by the App Store and Google Play.
        </p>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <XCircle className="h-5 w-5" />
          )}
          <p>{message.text}</p>
          <button
            onClick={() => setMessage(null)}
            className="ml-auto text-current opacity-70 hover:opacity-100"
          >
            ×
          </button>
        </div>
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
        <div className="earth-card bg-card p-6">
          <h2 className="text-xl font-heading text-foreground mb-4">Usage This Month</h2>
          <UsageDisplay usage={subscription.usage} />
        </div>
      )}

      {subscription?.plan !== 'lifetime' && (
        <div className="earth-card bg-card p-6">
          <h2 className="text-xl font-heading text-foreground mb-2">Upgrade</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Plans are purchased inside the Pleiad app. Your subscription unlocks
            here on the web automatically — same account, same map.
          </p>
          <GetTheApp />
        </div>
      )}
    </div>
  )
}
