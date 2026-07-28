import type { Metadata } from 'next'
import {
  NavV2,
  HeroV2,
  HowItWorksV2,
  StarParallax,
  Zone,
  PeopleAtlas,
  RelationshipCallouts,
  CouplesMap,
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
  buildRelationshipField,
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
    absolute: 'Pleiad — Six Symbolic Profiles, One People Map',
  },
  description:
    'Save the people in your life, read each person through six symbolic systems, compare pairs, and explore group patterns. Start with a free Dreamspell reading.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Pleiad — See Your People Through Six Symbolic Systems',
    description:
      'Calculate and save symbolic profiles, compare two people, and explore group patterns. Start with a free Dreamspell reading.',
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
  const field = buildRelationshipField(demo.people, demo.charts, demo.pairs)
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
        <HeroV2 field={field} />

        <HowItWorksV2 />

        {/* §2 YOUR READING — one birthday, six systems, the primary conversion */}
        <Zone
          lean="right"
          id="you"
          flavor={SYSTEM_FLAVORS.astrology}
          pill="Your six-system profile"
          heading="Six readings for each person. One place to read them together."
          body="A birth date starts Dreamspell, Tzolkin, and Long Count. Add an exact birth time and place for a full natal chart and Human Design bodygraph. Add a Hebrew name for Hebrew Gematria. Begin with what you know and complete the profile later."
          cta={{ label: 'Try a free Dreamspell reading', href: '/calculate' }}
          triad={[
            {
              title: 'Start with what you have',
              text: 'A birth date is enough for the free reading; time, place, and a Hebrew name add the deeper layers.',
            },
            {
              title: 'Calculated, not generated',
              text: 'Charts and compatibility results come from deterministic calculation engines. AI interpretation is optional.',
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

        {/* §4b THE COUPLE MAP — two people, four oracle seats each, one bond
            read across dreamspell, astrology, Human Design, and the moon */}
        <Zone
          lean="left"
          id="couples"
          flavor={SYSTEM_FLAVORS.dreamspell}
          pill="The couple map"
          heading="Two charts. Four oracle seats each. See who sits where."
          body="Every Dreamspell chart carries a guide, an analog, an antipode, and an occult seat. Put two people side by side and Pleiad lights up the seats they actually occupy in each other's oracle — then reads the same bond through synastry, Human Design types, and the moons they were born under."
          cta={{ label: 'Map your own pair', href: '/app' }}
        >
          <CouplesMap />
        </Zone>

        {/* §5 YOUR CIRCLES — group dynamics */}
        <Zone
          lean="right"
          id="circles"
          flavor={SYSTEM_FLAVORS.humanDesign}
          pill="Group dynamics"
          heading="Read the group, not just the people."
          body="Group analysis combines pair compatibility, Dreamspell and Tzolkin distributions, and Human Design composite patterns when enough complete charts are present. Compare a family, team, or friend circle without flattening everyone into one score."
          cta={{ label: 'See group plans', href: '/pricing' }}
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
