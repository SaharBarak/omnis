'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { SubscriptionStatus } from '@/components/billing/subscription-status'
import { UsageDisplay } from '@/components/billing/usage-display'
import { PricingCard, PRICING_PLANS } from '@/components/billing/pricing-card'
import { PlanTier } from '@/lib/services/billing'

interface SubscriptionData {
  plan: PlanTier
  planName: string
  status: string
  currentPeriodEnd?: string
  cancelAtPeriodEnd: boolean
  hasPaddleSubscription: boolean
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
  const searchParams = useSearchParams()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchSubscription = useCallback(async () => {
    try {
      const response = await fetch('/api/billing/subscription')
      if (response.ok) {
        const data = await response.json()
        setSubscription(data)
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

  // Handle URL params for success/cancel messages
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setMessage({ type: 'success', text: 'Your subscription has been updated successfully!' })
      // Refresh subscription data
      fetchSubscription()
    } else if (searchParams.get('canceled') === 'true') {
      setMessage({ type: 'error', text: 'Checkout was canceled. No charges were made.' })
    }
  }, [searchParams, fetchSubscription])

  const handleUpgrade = async (planId: string) => {
    setActionLoading(true)
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })

      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to create checkout session')
      }
    } catch (error) {
      console.error('Upgrade error:', error)
      setMessage({ type: 'error', text: 'Failed to start checkout. Please try again.' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleManageBilling = async () => {
    setActionLoading(true)
    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
      })

      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to open billing portal')
      }
    } catch (error) {
      console.error('Billing portal error:', error)
      setMessage({ type: 'error', text: 'Failed to open billing portal. Please try again.' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    setActionLoading(true)
    try {
      const response = await fetch('/api/billing/subscription', {
        method: 'DELETE',
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Your subscription will be canceled at the end of the billing period.' })
        fetchSubscription()
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to cancel subscription')
      }
    } catch (error) {
      console.error('Cancel error:', error)
      setMessage({ type: 'error', text: 'Failed to cancel subscription. Please try again.' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleReactivate = async () => {
    setActionLoading(true)
    try {
      const response = await fetch('/api/billing/subscription', {
        method: 'PATCH',
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Your subscription has been reactivated!' })
        fetchSubscription()
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to reactivate subscription')
      }
    } catch (error) {
      console.error('Reactivate error:', error)
      setMessage({ type: 'error', text: 'Failed to reactivate subscription. Please try again.' })
    } finally {
      setActionLoading(false)
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
          Manage your subscription and billing settings
        </p>
      </div>

      {/* Status Message */}
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

      {/* Current Subscription */}
      {subscription && (
        <SubscriptionStatus
          plan={subscription.plan}
          status={subscription.status}
          currentPeriodEnd={subscription.currentPeriodEnd}
          cancelAtPeriodEnd={subscription.cancelAtPeriodEnd}
          hasPaddleSubscription={subscription.hasPaddleSubscription}
          onManageBilling={subscription.hasPaddleSubscription ? handleManageBilling : undefined}
          onCancelSubscription={subscription.hasPaddleSubscription && !subscription.cancelAtPeriodEnd ? handleCancelSubscription : undefined}
          onReactivate={subscription.cancelAtPeriodEnd ? handleReactivate : undefined}
        />
      )}

      {/* Usage */}
      {subscription && (
        <div className="earth-card bg-card p-6">
          <h2 className="text-xl font-heading text-foreground mb-4">Usage This Month</h2>
          <UsageDisplay usage={subscription.usage} />
        </div>
      )}

      {/* Plan Comparison */}
      <div className="earth-card bg-card p-6">
        <h2 className="text-xl font-heading text-foreground mb-2">Available Plans</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Compare plans and upgrade anytime
        </p>
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {PRICING_PLANS.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              currentPlan={subscription?.plan}
              onSelect={handleUpgrade}
              loading={actionLoading}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
