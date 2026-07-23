import type { Metadata } from 'next'
import {
  NavV2,
  HeroV2,
  StarParallax,
  Zone,
  PeopleAtlas,
  RelationshipCallouts,
  ReadingCycler,
  CirclesDemo,
  PricingV2,
  FaqV2,
  FooterV2,
  DownloadCta,
  PortalCta,
} from '@/components/landing-v2'
import { SYSTEM_FLAVORS, MURAL_GROUND } from '@/lib/design/system-flavors'
import {
  buildHomepageDemo,
  buildCallouts,
  buildEgoStar,
  buildReadingTabs,
  buildCircles,
} from '@/lib/data/homepage-demo'
import { getTodayAcrossSystems, getFooterLiveLine } from '@/lib/today-board'
import {
  JsonLd,
  organizationSchema,
  webSiteSchema,
  softwareApplicationSchema,
  buildFaqPage,
} from '@/components/seo/json-ld'
import { homeFaqs } from '@/lib/data/faqs'

// Revalidate hourly so the footer live line stays current.
export const revalidate = 3600

export const metadata: Metadata = {
  title: {
    absolute: 'Pleiad - The Living Map of Your People | 6 Wisdom Systems',
  },
  description:
    'Enter one birthday and read it through Astrology, Dreamspell, Human Design, and Hebrew Gematria at once. Save your people and map every relationship.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Pleiad - The Living Map of Your People',
    description:
      'Everyone in your life, read through six wisdom systems at once, and remembered forever. Free six-system reading from one birthday.',
    url: '/',
  },
}

const orgSchema = {
  '@context': 'https://schema.org',
  ...organizationSchema,
}

// Schema mirrors the questions actually rendered on this page (homeFaqs) —
// the full plan/data set is rendered and marked up on /pricing instead.
const faqSchema = buildFaqPage(homeFaqs)

export default function LandingPage() {
  const today = getTodayAcrossSystems()

  // The homepage's product proof. Every chart and every relationship rendered
  // below is computed here by the real engine — nothing is mocked or drawn by
  // hand. See src/lib/data/homepage-demo.ts and docs/redesign/HOMEPAGE_REDESIGN.md.
  const demo = buildHomepageDemo()
  const callouts = buildCallouts(demo.people, demo.pairs)
  const star = buildEgoStar(demo.people, demo.charts, demo.pairs)
  const readingTabs = buildReadingTabs(demo.charts)
  const circles = buildCircles(demo.people, demo.charts)

  return (
    <div className="min-h-screen overflow-x-clip" style={{ backgroundColor: MURAL_GROUND }}>
      <JsonLd data={softwareApplicationSchema} id="json-ld-webapp" />
      <JsonLd data={webSiteSchema} id="json-ld-website" />
      <JsonLd data={orgSchema} id="json-ld-org" />
      <JsonLd data={faqSchema} id="json-ld-faq" />

      <StarParallax />
      <NavV2 />

      <main>
        {/* §1 Hero — the promise, with the live map */}
        <HeroV2 star={star} />

        {/* §2 YOUR READING — one birthday, six systems, the primary conversion */}
        <Zone
          lean="right"
          id="you"
          flavor={SYSTEM_FLAVORS.astrology}
          pill="Start with one birthday"
          heading="One birthday. Six complete readings."
          body="Your natal chart, galactic signature, day sign, Long Count date, bodygraph, and the number of your name, computed together, on one screen. Six systems that never met each other, reading the same moment: you."
          cta={{ label: 'Start with your birthday', href: '/calculate' }}
          triad={[
            {
              title: 'Precise engines',
              text: 'Real ephemeris and Long Count math, the same calculations practitioners use.',
            },
            {
              title: 'Grounded AI',
              text: 'Every interpretation cites a searchable knowledge base, never freestyle mysticism.',
            },
          ]}
        >
          <ReadingCycler tabs={readingTabs} />
        </Zone>

        {/* §3 THE PEOPLE ATLAS — the product, shown: pick a person, page their
            real charts, open Connections to see every named tie. */}
        <PeopleAtlas people={demo.people} charts={demo.charts} pairs={demo.pairs} />

        {/* §4 NAMED RELATIONSHIPS — each card is a tie the engine actually found */}
        <RelationshipCallouts callouts={callouts} />

        {/* §5 YOUR CIRCLES — group dynamics */}
        <Zone
          lean="right"
          id="circles"
          flavor={SYSTEM_FLAVORS.humanDesign}
          pill="Group dynamics"
          heading="Your family is not your team."
          body="Select any circle and read it whole. Each group runs on its own physics: who carries the energy, where it jams, who bridges the room, why this circle could only ever feel like this, and each layer names it differently."
          cta={{ label: 'Start with your birthday', href: '/calculate' }}
        >
          <CirclesDemo circles={circles} />
        </Zone>

        {/* §6 Pricing */}
        <PricingV2 />

        {/* §6.5 Download / waitlist — pricing says plans are bought in the app,
            so the "get the app + join for daily kins" beat follows it. */}
        <DownloadCta />

        {/* §7 FAQ — acquisition questions only; the plan/accuracy/data set
            lives on /pricing and is linked, not repeated. */}
        <FaqV2
          items={homeFaqs}
          more={{
            label: 'Questions about plans, accuracy, or your data: read the pricing FAQ',
            href: '/pricing#faq',
          }}
        />

        {/* §8 Portal CTA */}
        <PortalCta />
      </main>

      {/* §9 Footer with live line */}
      <FooterV2 liveLine={getFooterLiveLine(today)} />
    </div>
  )
}
