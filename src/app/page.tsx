import {
  NavV2,
  HeroV2,
  ThreadOfLight,
  StarParallax,
  Zone,
  ZoneLayers,
  ReadingCycler,
  PairScores,
  LibraryDemo,
  MapCenterpiece,
  CirclesDemo,
  ShareDemo,
  KnowledgeSearch,
  SigilBand,
  SocialProofV2,
  PricingV2,
  FaqV2,
  FooterV2,
  TodayBoard,
  PortalCta,
} from '@/components/landing-v2'
import { SYSTEM_FLAVORS, MURAL_GROUND } from '@/lib/design/system-flavors'
import { getTodayAcrossSystems, getFooterLiveLine } from '@/lib/today-board'
import { JsonLd, SITE_URL, organizationSchema } from '@/lib/seo/json-ld'
import { faqs } from '@/lib/data/faqs'

// Revalidate hourly so the today board and footer line stay current.
export const revalidate = 3600

const webAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Omnis',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web',
  description:
    'The living map of your people — everyone in your life read through Astrology, Dreamspell, Tzolkin, Human Design, and Kabbalah, with relationship and group dynamics across all five systems.',
  url: SITE_URL,
  offers: [
    {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free plan — your five-system reading and a small people library',
    },
    {
      '@type': 'Offer',
      price: '9',
      priceCurrency: 'USD',
      description: 'Complete plan — unlimited people, full map and group dynamics, AI interpretations',
    },
    {
      '@type': 'Offer',
      price: '29',
      priceCurrency: 'USD',
      description: 'Practitioner plan — collaborators, client maps, exports',
    },
  ],
  featureList: [
    'Living relationship map across five wisdom systems',
    'Five-system personal reading',
    'Persistent people library',
    'Group dynamics — layered or fused',
    'Shareable living map links',
    'Human Design Bodygraph',
    'Dreamspell Galactic Signature',
    'Astrology Natal Chart',
    'Tzolkin Sacred Calendar',
    'Kabbalah & Gematria',
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    ratingCount: '127',
  },
}

const webSiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Omnis',
  url: SITE_URL,
  description:
    'The living map of your people — five wisdom systems, one interface, remembered forever.',
  publisher: { '@id': `${SITE_URL}/#organization` },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/calculate?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

const orgSchema = {
  '@context': 'https://schema.org',
  ...organizationSchema,
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
}

export default function LandingPage() {
  const today = getTodayAcrossSystems()

  return (
    <div className="min-h-screen" style={{ backgroundColor: MURAL_GROUND }}>
      <JsonLd data={webAppSchema} id="json-ld-webapp" />
      <JsonLd data={webSiteSchema} id="json-ld-website" />
      <JsonLd data={orgSchema} id="json-ld-org" />
      <JsonLd data={faqSchema} id="json-ld-faq" />

      <StarParallax />
      <ThreadOfLight />
      <NavV2 />

      <main>
        {/* §1 Hero — the promise, with the live map */}
        <HeroV2 />

        {/* §2 Sigil band — breather */}
        <SigilBand />

        {/* §3 YOU — one birthday, five readings */}
        <Zone
          id="you"
          flavor={SYSTEM_FLAVORS.astrology}
          pill="Start with one birthday"
          heading="One birthday. Five complete readings."
          body="Your natal chart, galactic signature, day sign, bodygraph, and the number of your name — computed together, on one screen. Five systems that never met each other, reading the same moment: you."
          cta={{ label: 'Try it with your birthday', href: '/calculate' }}
          triad={[
            {
              title: 'Precise engines',
              text: 'Real ephemeris and Long Count math — the same calculations practitioners use.',
            },
            {
              title: 'Layered or side by side',
              text: 'Read one system at a time, or stack all five over the same birth.',
            },
            {
              title: 'Grounded AI',
              text: 'Interpretations cite the knowledge base — never freestyle mysticism.',
            },
          ]}
        >
          <ReadingCycler />
        </Zone>

        {/* §4 YOU + ONE — compact bridge */}
        <Zone
          id="pair"
          flavor={SYSTEM_FLAVORS.dreamspell}
          pill="Then add one more"
          heading="Two charts. One chemistry."
          body="Pick any two people and Omnis reads the bond five ways — synastry, kin resonance, type mechanics, name harmonics — then says it plainly: where you flow, where you grind, what the friction is for. Partners, siblings, cofounders, oldest friends."
          cta={{ label: 'Try compatibility', href: '/compatibility' }}
          compact
        >
          <PairScores />
        </Zone>

        {/* §5 YOUR PEOPLE, KEPT — persistence */}
        <Zone
          id="people"
          flavor={SYSTEM_FLAVORS.tzolkin}
          pill="Never ask twice"
          heading="Enter a birthday once."
          body="Everyone you chart joins your private library — birth time, place, name, all five readings, saved. The tenth time you check a friend's chart, you don't ask for their birth time again. You open Omnis."
          triad={[
            {
              title: 'Private by default',
              text: 'Owner-scoped, always. Your people are yours alone until you share.',
            },
            {
              title: 'Reusable everywhere',
              text: 'Any saved person drops into any map, group, or comparison instantly.',
            },
            {
              title: 'Synced across devices',
              text: 'Phone, tablet, desktop — the library follows you.',
            },
          ]}
        >
          <LibraryDemo />
        </Zone>

        {/* §6 THE MAP — centerpiece */}
        <Zone
          id="map"
          flavor={SYSTEM_FLAVORS.dreamspell}
          pill="The living map"
          heading="Your relationships become visible."
          body="Every saved person is a node. Omnis draws the lines — attraction, friction, resonance, completion — scored across all five systems, and every score opens into its evidence. Add twenty people and watch the geometry of your life appear."
          triad={[
            {
              title: 'Every bond, scored five ways',
              text: 'Synastry, kin, day signs, circuits, letters — one line holds them all.',
            },
            {
              title: 'Clusters and bridges',
              text: 'See who holds your circles together — and who connects worlds.',
            },
            {
              title: 'Tap any line to read why',
              text: 'No black boxes. Every score opens into the tradition behind it.',
            },
          ]}
        >
          <MapCenterpiece />
        </Zone>

        {/* §7 THE FIVE LAYERS — scroll-pinned signature set piece */}
        <ZoneLayers />

        {/* §8 YOUR CIRCLES — group dynamics */}
        <Zone
          id="circles"
          flavor={SYSTEM_FLAVORS.humanDesign}
          pill="Group dynamics"
          heading="Your family is not your team."
          body="Select any circle and read it whole. Each group runs on its own physics: who carries the energy, where it jams, who bridges the room, why this circle could only ever feel like this — and each layer names it differently."
          triad={[
            {
              title: 'Whole-group readings',
              text: 'Not just pairs — the room itself has a chart.',
            },
            {
              title: 'The mechanics, named',
              text: 'Electromagnetic pairs, missing centers, group kin — concrete, not vague.',
            },
            {
              title: 'Same person, different circle',
              text: 'Watch one person play a different role in every group they belong to.',
            },
          ]}
        >
          <CirclesDemo />
        </Zone>

        {/* §9 BEYOND YOU — gifting & collaboration */}
        <Zone
          id="give"
          flavor={SYSTEM_FLAVORS.gematria}
          pill="Made to be given"
          heading="Some maps are meant to be given."
          body="Build the map of your mother's family or your partner's team and send it as a living link — beautiful on any device, complete without an account wall. Invite collaborators into your own maps to explore alongside you."
          triad={[
            {
              title: 'Living links',
              text: 'Shared maps stay current — a gift that keeps updating.',
            },
            {
              title: 'Collaborators',
              text: 'Read-only or working — explore a map together.',
            },
            {
              title: 'The oldest gift',
              text: 'A reading has always been something you give someone you love.',
            },
          ]}
        >
          <ShareDemo />
        </Zone>

        {/* §10 KNOWLEDGE — trust layer */}
        <Zone
          id="knowledge"
          pill="The source layer"
          heading="Every line on the map has sources."
          body="Five deep, searchable guides — each written in the voice of its tradition. When a reading says Gate 34 or Kin 113, the source is one tap away."
          cta={{ label: 'Enter the library', href: '/learn' }}
          mural={false}
          accentOverride="#C9A227"
        >
          <KnowledgeSearch />
        </Zone>

        {/* §11 Social proof */}
        <SocialProofV2 />

        {/* §12 Today board — split-flap set piece */}
        <TodayBoard data={today} />

        {/* §13 Pricing */}
        <PricingV2 />

        {/* §14 FAQ */}
        <FaqV2 />

        {/* §15 Portal CTA */}
        <PortalCta />
      </main>

      {/* §16 Footer with live line */}
      <FooterV2 liveLine={getFooterLiveLine(today)} />
    </div>
  )
}
