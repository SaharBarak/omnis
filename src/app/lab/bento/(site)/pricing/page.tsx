import type { Metadata } from 'next'
import Link from 'next/link'
import { FaqList, PlanCards, PlanLedger } from '@/components/bento-lab/blocks'
import { Section, site } from '@/components/bento-lab/site'
import { BILLING_FAQ } from '@/lib/site/faq'
import { PLANS } from '@/lib/services/billing'
import { siteHref } from '@/lib/site/routes'

export const metadata: Metadata = { title: 'Pricing' }

/** T4 Pricing: plan cards, the entitlement ledger, billing questions. */
export default function PricingPage() {
  return (
    <>
      <Section
        as="h1"
        eyebrow="Pricing"
        title="Free while your map is small"
        lead={`The map, the pair page and the daily board work without an account. The free plan saves ${PLANS.free.limits.profiles} people. Pay when you keep more people than that, or want every layer on them.`}
      >
        <PlanCards />
        <p className={site.hint} style={{ marginTop: 16 }}>
          Plans are bought in the Pleiad app and billed by the App Store or Google Play.{' '}
          <Link href={siteHref('/map')} className={site.textLink}>
            Draw a map first
          </Link>
          .
        </p>
      </Section>
      <Section id="compare" eyebrow="Compare" title="What each plan opens" lead="Every row reads from the limits the app enforces.">
        <PlanLedger />
      </Section>
      <Section id="billing" eyebrow="Billing" title="Paying, cancelling, refunds">
        <FaqList items={BILLING_FAQ} />
      </Section>
    </>
  )
}
