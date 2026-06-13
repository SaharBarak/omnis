'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { CreditCard, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { PLANS, PlanTier } from '@/lib/services/billing'

interface SubscriptionStatusProps {
  plan: PlanTier
  status: string
  currentPeriodEnd?: string
  cancelAtPeriodEnd?: boolean
  hasPaddleSubscription?: boolean
  onManageBilling?: () => void
  onCancelSubscription?: () => Promise<void>
  onReactivate?: () => Promise<void>
}

export function SubscriptionStatus({
  plan,
  status,
  currentPeriodEnd,
  cancelAtPeriodEnd,
  hasPaddleSubscription,
  onManageBilling,
  onCancelSubscription,
  onReactivate,
}: SubscriptionStatusProps) {
  const [canceling, setCanceling] = useState(false)
  const [reactivating, setReactivating] = useState(false)

  const planInfo = PLANS[plan]
  const periodEndDate = currentPeriodEnd ? new Date(currentPeriodEnd) : null
  
  const StatusIcon = status === 'active' ? CheckCircle : 
                     status === 'trialing' ? Clock :
                     status === 'past_due' ? AlertCircle : AlertCircle

  const statusColor = status === 'active' ? 'text-green-500' :
                      status === 'trialing' ? 'text-blue-500' :
                      status === 'past_due' ? 'text-amber-500' : 'text-muted-foreground'

  const handleCancel = async () => {
    if (!onCancelSubscription) return
    setCanceling(true)
    try {
      await onCancelSubscription()
    } finally {
      setCanceling(false)
    }
  }

  const handleReactivate = async () => {
    if (!onReactivate) return
    setReactivating(true)
    try {
      await onReactivate()
    } finally {
      setReactivating(false)
    }
  }

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
                ${planInfo.price}/month
              </span>
            )}
          </div>
        </div>
        
        <div className={`flex items-center gap-1 ${statusColor}`}>
          <StatusIcon className="h-4 w-4" />
          <span className="text-sm capitalize">{status}</span>
        </div>
      </div>

      {/* Cancellation Warning */}
      {cancelAtPeriodEnd && periodEndDate && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Your subscription will be canceled on {format(periodEndDate, 'MMMM d, yyyy')}. 
            You&apos;ll be downgraded to the Free plan after this date.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={handleReactivate}
            disabled={reactivating}
          >
            {reactivating ? 'Reactivating...' : 'Keep My Subscription'}
          </Button>
        </div>
      )}

      {/* Trial Info */}
      {status === 'trialing' && periodEndDate && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Your free trial ends on {format(periodEndDate, 'MMMM d, yyyy')}.
            Add a payment method to continue after the trial.
          </p>
        </div>
      )}

      {/* Past Due Warning */}
      {status === 'past_due' && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p className="text-sm text-red-600 dark:text-red-400">
            Your payment failed. Please update your payment method to continue using premium features.
          </p>
        </div>
      )}

      {/* Renewal Info */}
      {periodEndDate && status === 'active' && !cancelAtPeriodEnd && (
        <p className="text-sm text-muted-foreground">
          Next billing date: {format(periodEndDate, 'MMMM d, yyyy')}
        </p>
      )}

      {/* Actions */}
      {hasPaddleSubscription && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {onManageBilling && (
            <Button variant="outline" onClick={onManageBilling}>
              Manage Billing
            </Button>
          )}
          
          {!cancelAtPeriodEnd && onCancelSubscription && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="text-destructive hover:text-destructive">
                  Cancel Subscription
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You&apos;ll continue to have access until {periodEndDate ? format(periodEndDate, 'MMMM d, yyyy') : 'the end of your billing period'}. 
                    After that, you&apos;ll be downgraded to the Free plan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancel}
                    disabled={canceling}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {canceling ? 'Canceling...' : 'Yes, Cancel'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}
    </div>
  )
}
