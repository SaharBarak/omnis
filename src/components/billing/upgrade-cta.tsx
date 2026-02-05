'use client'

import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PricingCard, PRICING_PLANS } from './pricing-card'

interface UpgradeCTAProps {
  feature: string
  currentPlan?: string
  variant?: 'inline' | 'modal' | 'banner'
  onClose?: () => void
}

export function UpgradeCTA({ feature, currentPlan = 'free', variant = 'inline', onClose }: UpgradeCTAProps) {
  const [isOpen, setIsOpen] = useState(variant === 'modal')
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async (planId: string) => {
    setLoading(true)
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
      alert('Failed to start checkout. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (variant === 'banner') {
    return (
      <div className="relative bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              Upgrade to unlock {feature}
            </p>
            <p className="text-xs text-muted-foreground">
              Get access to all features with Complete plan
            </p>
          </div>
          <Button size="sm" onClick={() => setIsOpen(true)}>
            Upgrade
          </Button>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Choose Your Plan</DialogTitle>
              <DialogDescription>
                Select the plan that best fits your needs
              </DialogDescription>
            </DialogHeader>
            <div className="grid md:grid-cols-3 gap-4 py-4">
              {PRICING_PLANS.map((plan) => (
                <PricingCard
                  key={plan.id}
                  plan={plan}
                  currentPlan={currentPlan}
                  onSelect={handleUpgrade}
                  loading={loading}
                />
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  if (variant === 'modal') {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open)
        if (!open && onClose) onClose()
      }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Upgrade to Access {feature}</DialogTitle>
            <DialogDescription>
              This feature requires an upgraded plan. Choose the plan that works best for you.
            </DialogDescription>
          </DialogHeader>
          <div className="grid md:grid-cols-3 gap-4 py-4">
            {PRICING_PLANS.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                currentPlan={currentPlan}
                onSelect={handleUpgrade}
                loading={loading}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Inline variant
  return (
    <div className="border border-dashed border-primary/50 rounded-lg p-6 text-center bg-primary/5">
      <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
      <h3 className="font-semibold mb-1">Unlock {feature}</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Upgrade to Complete or Practitioner to access this feature
      </p>
      <Button onClick={() => handleUpgrade('complete')} disabled={loading}>
        {loading ? 'Loading...' : 'Upgrade Now'}
      </Button>
    </div>
  )
}
