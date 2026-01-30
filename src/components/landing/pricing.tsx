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
    <section className="py-20 lg:py-28 px-6 bg-background" id="pricing">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-14">
          <div className="earth-badge inline-flex mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>Simple pricing. Cancel anytime.</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-heading text-foreground mb-4">
            <span className="text-earth-gradient">Pricing</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Free tier for casual use. Paid for full access and serious work.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`group relative ${plan.highlighted ? 'md:-mt-4 md:mb-4' : ''}`}
            >
              <div className={`relative h-full earth-card bg-card transition-all duration-300 p-6 lg:p-8 ${
                plan.highlighted
                  ? 'border-primary/30 shadow-earth-lg'
                  : 'hover:border-primary/20'
              }`}>
                {/* Popular badge */}
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="px-4 py-1.5 bg-primary text-primary-foreground text-xs uppercase tracking-wider font-medium rounded-full">
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Plan header */}
                <div className="text-center mb-6 pt-2">
                  <h3 className="text-xl font-heading text-foreground mb-3">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className={`text-4xl font-heading ${plan.highlighted ? 'text-primary' : 'text-foreground'}`}>
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                </div>

                {/* Divider */}
                <div className="earth-divider mb-6" />

                {/* Features */}
                <ul className="space-y-3 mb-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-primary/10 border border-primary/20">
                        <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Limitations (for free tier) */}
                {'limitations' in plan && plan.limitations && (
                  <ul className="space-y-2 mb-8 pt-3 border-t border-border/50">
                    {(plan.limitations as string[]).map((limitation, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-muted/50">
                          <svg className="w-3 h-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        <span className="text-sm text-muted-foreground/70">{limitation}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {!('limitations' in plan) && <div className="mb-8" />}

                {/* CTA */}
                <Button
                  className={`w-full h-11 rounded-lg font-medium transition-colors ${
                    plan.highlighted
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-foreground border border-border'
                  }`}
                  asChild
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap justify-center items-center gap-4 mt-12">
          {[
            'Secure data storage',
            'GDPR compliant',
            'Cancel with one click',
            'Export your data anytime',
          ].map((item) => (
            <div key={item} className="earth-badge">
              <span className="text-sm text-muted-foreground">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
