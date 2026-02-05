import { PLAN_FEATURES } from '@/lib/stripe';
import { Check } from 'lucide-react';

export const metadata = {
  title: 'Pricing - Omnis',
  description: 'Choose the perfect plan for your needs',
};

function PricingCard({
  name,
  price,
  features,
  popular = false,
  cta = 'Get Started',
}: {
  name: string;
  price: number;
  features: readonly string[];
  popular?: boolean;
  cta?: string;
}) {
  return (
    <div
      className={`relative rounded-2xl border p-8 shadow-sm ${
        popular
          ? 'border-primary bg-primary/5 ring-2 ring-primary'
          : 'border-border bg-card'
      }`}
    >
      {popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-sm font-medium text-primary-foreground">
          Most Popular
        </span>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-semibold">{name}</h3>
        <div className="mt-4 flex items-baseline">
          <span className="text-4xl font-bold">
            {price === 0 ? 'Free' : `$${price}`}
          </span>
          {price > 0 && (
            <span className="ml-1 text-muted-foreground">/month</span>
          )}
        </div>
      </div>

      <ul className="mb-8 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <Check className="h-5 w-5 shrink-0 text-primary" />
            <span className="text-sm text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
          popular
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
        }`}
      >
        {cta}
      </button>
    </div>
  );
}

export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Choose the plan that&apos;s right for you. All plans include a 14-day
          free trial.
        </p>
      </div>

      <div className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-3">
        <PricingCard
          name={PLAN_FEATURES.FREE.name}
          price={PLAN_FEATURES.FREE.price}
          features={PLAN_FEATURES.FREE.features}
          cta="Start Free"
        />
        <PricingCard
          name={PLAN_FEATURES.PRO.name}
          price={PLAN_FEATURES.PRO.price}
          features={PLAN_FEATURES.PRO.features}
          popular
          cta="Start Free Trial"
        />
        <PricingCard
          name={PLAN_FEATURES.ENTERPRISE.name}
          price={PLAN_FEATURES.ENTERPRISE.price}
          features={PLAN_FEATURES.ENTERPRISE.features}
          cta="Contact Sales"
        />
      </div>

      <div className="mt-16 text-center">
        <p className="text-sm text-muted-foreground">
          All plans include SSL, 99.9% uptime SLA, and 24/7 monitoring.
          <br />
          Need a custom plan?{' '}
          <a href="/contact" className="text-primary hover:underline">
            Contact us
          </a>
        </p>
      </div>
    </div>
  );
}
