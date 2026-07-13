'use client'

import { format } from 'date-fns'
import { AlertCircle, CheckCircle, Clock, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PLANS, PlanTier } from '@/lib/services/billing'

/**
 * Current-plan panel.
 *
 * Paid access is an in-app purchase, so the App Store / Google Play own the
 * subscription lifecycle: we cannot cancel, resume, or change payment methods
 * from here. `onManageSubscription` deep-links to the OS subscription settings
 * (see POST /api/billing/portal); whatever the user does there flows back to us
 * through the billing webhook.
 */
interface SubscriptionStatusProps {
  plan: PlanTier
  status: string
  currentPeriodEnd?: string
  cancelAtPeriodEnd?: boolean
  hasSubscription?: boolean
  onManageSubscription?: () => void
}

export function SubscriptionStatus({
  plan,
  status,
  currentPeriodEnd,
  cancelAtPeriodEnd,
  hasSubscription,
  onManageSubscription,
}: SubscriptionStatusProps) {
  const planInfo = PLANS[plan]
  const periodEndDate = currentPeriodEnd ? new Date(currentPeriodEnd) : null

  const StatusIcon = status === 'active' ? CheckCircle :
                     status === 'trialing' ? Clock :
                     status === 'past_due' ? AlertCircle : AlertCircle

  const statusColor = status === 'active' ? 'text-green-500' :
                      status === 'trialing' ? 'text-blue-500' :
                      status === 'past_due' ? 'text-amber-500' : 'text-muted-foreground'

  return (
    <div className="earth-card bg-card p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </h3>
          <div className="mt-2">
            <span className="text-2xl font-bold">{planInfo.name}</span>
            {planInfo.price > 0 && (
              <span className="text-muted-foreground ml-2">
                {plan === 'lifetime'
                  ? `$${planInfo.price} · paid once`
                  : `$${planInfo.price}/month`}
              </span>
            )}
          </div>
        </div>

        <div className={`flex items-center gap-1 ${statusColor}`}>
          <StatusIcon className="h-4 w-4" />
          <span className="text-sm capitalize">{status}</span>
        </div>
      </div>

      {/* Cancellation Warning — resuming is done in the store, not here. */}
      {cancelAtPeriodEnd && periodEndDate && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Auto-renew is off. Your plan ends on{' '}
            {format(periodEndDate, 'MMMM d, yyyy')}, after which you&apos;ll move to
            the Free plan. You can turn renewal back on in your subscription
            settings.
          </p>
        </div>
      )}

      {/* Trial Info */}
      {status === 'trialing' && periodEndDate && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Your free trial ends on {format(periodEndDate, 'MMMM d, yyyy')}.
          </p>
        </div>
      )}

      {/* Past Due Warning */}
      {status === 'past_due' && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p className="text-sm text-red-600 dark:text-red-400">
            Your payment failed. Update your payment method in your subscription
            settings to keep your premium features.
          </p>
        </div>
      )}

      {/* Lifetime Info — no renewal, no expiry, nothing to cancel */}
      {plan === 'lifetime' && (
        <p className="text-sm text-muted-foreground">
          Founding Lifetime — yours forever. No renewals, no billing dates.
        </p>
      )}

      {/* Renewal Info */}
      {periodEndDate && status === 'active' && !cancelAtPeriodEnd && (
        <p className="text-sm text-muted-foreground">
          Renews on {format(periodEndDate, 'MMMM d, yyyy')}
        </p>
      )}

      {hasSubscription && onManageSubscription && (
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t">
          <Button variant="outline" onClick={onManageSubscription}>
            Manage Subscription
          </Button>
          <p className="text-xs text-muted-foreground">
            Billing, renewal and cancellation are handled by the App Store or
            Google Play.
          </p>
        </div>
      )}
    </div>
  )
}
