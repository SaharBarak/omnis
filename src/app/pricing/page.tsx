import { Metadata } from 'next';
import {
  JsonLd,
  SITE_URL,
  softwareApplicationSchema,
  buildBreadcrumbs,
} from '@/components/seo/json-ld';
import { NavV2, FooterV2, FaqV2, StarParallax } from '@/components/landing-v2';
import { FreeLead, PaidTiers, PlanLedger } from '@/components/pricing/pricing-sections';
import { TYPE } from '@/lib/design/landing-tokens';
import { MURAL_GROUND } from '@/lib/design/system-flavors';
import { getTodayAcrossSystems, getFooterLiveLine } from '@/lib/today-board';

// Revalidate hourly so the footer live line stays current (same as landing).
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Pleiad Pricing - Free Chart Calculator & Premium Plans',
  description: 'Free Dreamspell calculator, daily kin readings, and 3 profiles. Upgrade to Complete ($9/mo) for 25 people across all 6 systems, or Practitioner ($29/mo) for unlimited profiles and client tools.',
  alternates: {
    canonical: '/pricing',
  },
  openGraph: {
    title: 'Pleiad Pricing - Free Chart Calculator & Premium Plans',
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

export default function PricingPage() {
  const liveLine = getFooterLiveLine(getTodayAcrossSystems());

  return (
    <div className="min-h-[100dvh]" style={{ backgroundColor: MURAL_GROUND }}>
      <JsonLd data={pricingSchema} id="json-ld-product" />
      <JsonLd data={breadcrumbSchema} id="json-ld-breadcrumbs" />

      <NavV2 />

      <main className="relative overflow-hidden pb-24 pt-32 sm:pt-40">
        <StarParallax />

        {/* Hero — the free reading leads, not the signup wall. */}
        <section className="relative mx-auto max-w-content px-6 text-center">
          <p className={`${TYPE.eyebrow} text-brand`}>Pricing</p>
          <h1 className={`${TYPE.hero} mx-auto mt-4 max-w-3xl`}>
            Free while your map is small.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/70">
            One birthday gets you a full reading before you ever make an
            account. Pay only when your map holds more people than the free
            plan carries.
          </p>
        </section>

        <div className="relative">
          {/* Free tier — leads the page. */}
          <FreeLead />

          {/* Paid tiers — featured Complete column + Practitioner. */}
          <PaidTiers />

          {/* Entitlement ledger — mirrors billing.ts PLANS.limits. */}
          <PlanLedger />
        </div>

        {/* FAQ — shared with the landing page; free tier = 3 people is correct. */}
        <FaqV2 />
      </main>

      <FooterV2 liveLine={liveLine} />
    </div>
  );
}
