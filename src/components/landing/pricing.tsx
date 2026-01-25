import Link from 'next/link'
import { Button } from '@/components/ui/button'

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Get started with the basics',
    features: [
      'Save 5 people',
      'Dreamspell calculations',
      'Tzolkin calculations',
      'Basic mantras',
    ],
    cta: 'Start Free',
    href: '/login',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$9',
    period: '/month',
    description: 'For serious seekers',
    features: [
      'Unlimited people',
      'All 6 systems (Dreamspell, Tzolkin, Astrology, Human Design, Gematria, Long Count)',
      'Oracle maps & wavespells',
      'Canvas board editor',
      'PDF & image export',
      'Shareable links',
    ],
    cta: 'Start Pro',
    href: '/login?plan=pro',
    highlighted: true,
  },
  {
    name: 'Team',
    price: '$29',
    period: '/month',
    description: 'For facilitators & coaches',
    features: [
      'Everything in Pro',
      '50 people capacity',
      'Group analysis',
      'Compatibility matrix',
      'Team collaboration',
      'Priority support',
    ],
    cta: 'Contact Us',
    href: '/login?plan=team',
    highlighted: false,
  },
]

export function Pricing() {
  return (
    <section className="py-20 px-4 bg-card/30" id="pricing">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Simple <span className="text-gold-gradient">Pricing</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Start free, upgrade when you need more. No hidden fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-6 ${
                plan.highlighted
                  ? 'bg-gradient-to-b from-primary/20 to-accent/10 border-2 border-accent/50 shadow-lg shadow-accent/10'
                  : 'bg-card border border-border'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-full">
                  Most Popular
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${
                  plan.highlighted
                    ? 'bg-accent hover:bg-accent/90 text-accent-foreground'
                    : ''
                }`}
                variant={plan.highlighted ? 'default' : 'outline'}
                asChild
              >
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
