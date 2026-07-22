'use client'

import { format } from 'date-fns'
import { AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Eyebrow, Notice } from '@/components/app-kit'
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

  const statusColor = status === 'active' ? 'text-secondary' :
                      status === 'trialing' ? 'text-primary' :
                      status === 'past_due' ? 'text-amber' : 'text-white/50'

  return (
    <div className="surface-card space-y-4 p-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <Eyebrow>Current Plan</Eyebrow>
          <div>
            <span className="font-display text-2xl font-medium text-white/90">
              {planInfo.name}
            </span>
            {planInfo.price > 0 && (
              <span className="ml-2 text-sm text-white/50">
                {plan === 'lifetime'
                  ? `$${planInfo.price} · paid once`
                  : `$${planInfo.price}/month`}
              </span>
            )}
          </div>
        </div>

        <div className={`flex items-center gap-1.5 ${statusColor}`}>
          <StatusIcon className="size-4" aria-hidden="true" />
          <span className="text-sm capitalize">{status}</span>
        </div>
      </div>

      {/* Cancellation Warning — resuming is done in the store, not here. */}
      {cancelAtPeriodEnd && periodEndDate && (
        <Notice variant="warning">
          Auto-renew is off. Your plan ends on{' '}
          {format(periodEndDate, 'MMMM d, yyyy')}, after which you&apos;ll move to
          the Free plan. You can turn renewal back on in your subscription
          settings.
        </Notice>
      )}

      {/* Trial Info */}
      {status === 'trialing' && periodEndDate && (
        <Notice variant="info">
          Your free trial ends on {format(periodEndDate, 'MMMM d, yyyy')}.
        </Notice>
      )}

      {/* Past Due Warning */}
      {status === 'past_due' && (
        <Notice variant="error">
          Your payment failed. Update your payment method in your subscription
          settings to keep your premium features.
        </Notice>
      )}

      {/* Lifetime Info — no renewal, no expiry, nothing to cancel */}
      {plan === 'lifetime' && (
        <p className="text-sm text-white/50">
          Founding Lifetime: yours forever. No renewals, no billing dates.
        </p>
      )}

      {/* Renewal Info */}
      {periodEndDate && status === 'active' && !cancelAtPeriodEnd && (
        <p className="text-sm text-white/50">
          Renews on {format(periodEndDate, 'MMMM d, yyyy')}
        </p>
      )}

      {hasSubscription && onManageSubscription && (
        <div className="flex flex-wrap items-center gap-3 border-t border-white/[0.07] pt-4">
          <Button
            variant="outline"
            className="rounded-xl active:scale-[0.98]"
            onClick={onManageSubscription}
          >
            Manage Subscription
          </Button>
          <p className="text-xs text-white/50">
            Billing, renewal and cancellation are handled by the App Store or
            Google Play.
          </p>
        </div>
      )}
    </div>
  )
}
