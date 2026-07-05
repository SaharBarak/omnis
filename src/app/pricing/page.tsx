import { Metadata } from 'next';
import { PLAN_FEATURES } from '@/lib/plans';
import { Check } from 'lucide-react';
import {
  JsonLd,
  SITE_URL,
  softwareApplicationSchema,
  buildBreadcrumbs,
} from '@/components/seo/json-ld';
import { PageBreadcrumbs } from '@/components/ui/page-breadcrumbs';

export const metadata: Metadata = {
  title: 'OmnisX Pricing - Free Chart Calculator & Premium Plans',
  description: 'Free Dreamspell calculator, daily kin readings, and 1 profile. Upgrade to Complete ($9/mo) for all 6 systems or Practitioner ($29/mo) for unlimited profiles and client tools.',
  alternates: {
    canonical: '/pricing',
  },
  openGraph: {
    title: 'OmnisX Pricing - Free Chart Calculator & Premium Plans',
    description: 'Free plan with Dreamspell calculator. Complete ($9/mo) and Practitioner ($29/mo) plans available.',
    url: '/pricing',
  },
};

// Shared product entity — offers stay in sync with the plans marketed
// on the landing page (Free / Complete $9 / Practitioner $29).
const pricingSchema = {
  ...softwareApplicationSchema,
  url: `${SITE_URL}/pricing`,
};

const breadcrumbSchema = buildBreadcrumbs([
  { name: 'Home', url: SITE_URL },
  { name: 'Pricing', url: `${SITE_URL}/pricing` },
]);

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
      <JsonLd data={pricingSchema} id="json-ld-product" />
      <JsonLd data={breadcrumbSchema} id="json-ld-breadcrumbs" />
      <PageBreadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Pricing' }]} />
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
