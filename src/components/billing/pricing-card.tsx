'use client'

import { useState } from 'react'
import { Check, Sparkles, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface PricingPlan {
  id: 'free' | 'explorer' | 'complete' | 'practitioner'
  name: string
  description: string
  price: number
  priceILS: number
  features: string[]
  highlighted?: boolean
  badge?: string
}

interface PricingCardProps {
  plan: PricingPlan
  currentPlan?: string
  onSelect?: (planId: string) => Promise<void>
  loading?: boolean
}

export function PricingCard({ plan, currentPlan, onSelect, loading }: PricingCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isCurrentPlan = currentPlan === plan.id
  // Founding Lifetime holders keep Complete-tier entitlements forever and the
  // sync layer treats lifetime as sticky, so no subscription purchase can
  // apply to them — disable all cards rather than sell a no-op.
  const hasLifetime = currentPlan === 'lifetime'
  const isPlanDisabled = isCurrentPlan || plan.id === 'free' || hasLifetime

  const handleSelect = async () => {
    if (isPlanDisabled || !onSelect) return
    setIsLoading(true)
    try {
      await onSelect(plan.id)
    } finally {
      setIsLoading(false)
    }
  }

  const Icon = plan.id === 'practitioner' ? Crown : Sparkles

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl border p-6 shadow-sm transition-all',
        plan.highlighted
          ? 'border-primary bg-primary/5 shadow-lg scale-105'
          : 'border-border bg-card hover:border-primary/50',
        isCurrentPlan && 'ring-2 ring-primary'
      )}
    >
      {/* Badge */}
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
            {plan.badge}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={cn(
            'h-5 w-5',
            plan.id === 'practitioner' ? 'text-amber-500' : 'text-primary'
          )} />
          <h3 className="text-xl font-heading font-semibold">{plan.name}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{plan.description}</p>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold">${plan.price}</span>
          {plan.price > 0 && (
            <span className="text-muted-foreground">/month</span>
          )}
        </div>
        {plan.price > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            ≈ ₪{plan.priceILS}/month
          </p>
        )}
      </div>

      {/* Features */}
      <ul className="flex-1 space-y-3 mb-6">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Button
        onClick={handleSelect}
        disabled={isPlanDisabled || isLoading || loading}
        variant={plan.highlighted ? 'default' : 'outline'}
        className={cn(
          'w-full',
          plan.highlighted && 'bg-primary hover:bg-primary/90'
        )}
      >
        {isLoading || loading ? (
          'Loading...'
        ) : isCurrentPlan ? (
          'Current Plan'
        ) : hasLifetime ? (
          plan.id === 'practitioner'
            ? 'Not available on Lifetime'
            : 'Included in Lifetime'
        ) : plan.id === 'free' ? (
          'Free Forever'
        ) : (
          `Upgrade to ${plan.name}`
        )}
      </Button>

      {plan.price > 0 && !isCurrentPlan && (
        <p className="text-xs text-center text-muted-foreground mt-2">
          7-day free trial included
        </p>
      )}
    </div>
  )
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Get started with basic features',
    price: 0,
    priceILS: 0,
    features: [
      '1 profile (yourself)',
      'Dreamspell system only',
      'Basic calculations',
      'Community support',
    ],
  },
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Every system, a few people, no AI',
    price: 5,
    priceILS: 18,
    features: [
      'Up to 5 people',
      'All 6 symbolic systems',
      '2 boards',
      'Timeline view',
    ],
  },
  {
    id: 'complete',
    name: 'Complete',
    description: 'Everything you need for personal growth',
    price: 9,
    priceILS: 33,
    highlighted: true,
    badge: 'Most Popular',
    features: [
      'Up to 10 profiles',
      'All 6 symbolic systems',
      '30 AI interpretations/month',
      'Export to PDF',
      'Shareable links',
      'Full timeline access',
      'Basic relationship analysis',
      'Email support',
    ],
  },
  {
    id: 'practitioner',
    name: 'Practitioner',
    description: 'For professionals and power users',
    price: 29,
    priceILS: 107,
    features: [
      'Unlimited profiles',
      'All 6 symbolic systems',
      'Unlimited AI interpretations',
      'Advanced relationship matrix',
      'Group dynamics analysis',
      'API access',
      'Password-protected sharing',
      'Analytics dashboard',
      'Priority support',
    ],
  },
]
