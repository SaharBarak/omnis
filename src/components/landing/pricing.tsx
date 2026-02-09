'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Try Omnis with limited access',
    features: [
      '1 profile only (yourself)',
      'Dreamspell calculation only',
      'Basic daily kin (no interpretations)',
      'No exports or sharing',
    ],
    limitations: [
      'No AI interpretations',
      'No timeline features',
      'No relationship analysis',
    ],
    cta: 'Start Free',
    href: '/login',
    highlighted: false,
  },
  {
    name: 'Complete',
    price: '$9',
    period: '/month',
    description: 'Full access for personal use',
    features: [
      'Up to 10 profiles',
      'All 6 systems: Dreamspell, Tzolkin, Long Count, Human Design, Astrology, Gematria',
      'Complete oracle maps & wavespells',
      'Personal timeline with galactic returns',
      '30 AI interpretations/month',
      'Export to PDF',
      'Basic relationship compatibility',
    ],
    cta: 'Try 7 Days Free',
    href: '/login?plan=complete',
    highlighted: true,
  },
  {
    name: 'Practitioner',
    price: '$29',
    period: '/month',
    description: 'For professionals & serious enthusiasts',
    features: [
      'Unlimited profiles',
      'Everything in Complete',
      'Unlimited AI interpretations',
      'Group dynamics analysis',
      'Advanced relationship matrix',
      'Oracle connection mapping',
      'Priority support',
    ],
    cta: 'Start 14-Day Trial',
    href: '/login?plan=practitioner',
    highlighted: false,
  },
]

export function Pricing() {
  return (
    <section className="py-28 lg:py-36 px-6 bg-background" id="pricing">
      <div className="max-w-content mx-auto">
        {/* Section header */}
        <div className="mb-16">
          <div className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-4">
            Simple pricing. Cancel anytime.
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading text-foreground mb-4 tracking-tight">
            Pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            Free tier for casual use. Paid for full access and serious work.
          </p>
        </div>

        {/* Pricing cards — flat grid */}
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-card border border-border rounded-lg p-6 lg:p-8 ${
                plan.highlighted ? 'bg-muted/20' : ''
              }`}
            >
              {/* Popular badge */}
              {plan.highlighted && (
                <div className="absolute top-0 right-0">
                  <div className="px-3 py-1 bg-primary text-primary-foreground text-[10px] uppercase tracking-[0.15em] font-medium">
                    Most Popular
                  </div>
                </div>
              )}

              {/* Plan header */}
              <div className="mb-6 pt-2">
                <h3 className="text-lg font-heading text-foreground mb-3">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-heading text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </div>

              {/* Divider */}
              <div className="h-px bg-border mb-6" />

              {/* Features */}
              <ul className="space-y-3 mb-4">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-foreground/40 mt-1 text-xs">+</span>
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Limitations (for free tier) */}
              {'limitations' in plan && plan.limitations && (
                <ul className="space-y-2 mb-8 pt-3 border-t border-border/50">
                  {(plan.limitations as string[]).map((limitation, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-muted-foreground/40 mt-1 text-xs">&ndash;</span>
                      <span className="text-sm text-muted-foreground/70">{limitation}</span>
                    </li>
                  ))}
                </ul>
              )}

              {!('limitations' in plan) && <div className="mb-8" />}

              {/* CTA */}
              <Button
                className={`w-full h-11 rounded-lg font-medium transition-all duration-200 ${
                  plan.highlighted
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                    : 'bg-foreground/5 hover:bg-foreground/10 text-foreground border border-border'
                }`}
                asChild
              >
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap justify-center items-center gap-6 mt-12">
          {[
            'Secure data storage',
            'GDPR compliant',
            'Cancel with one click',
            'Export your data anytime',
          ].map((item) => (
            <span key={item} className="text-sm text-muted-foreground">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
