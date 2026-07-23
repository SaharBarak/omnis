import { Metadata } from 'next'
import Link from 'next/link'
import { NavV2, FooterV2, StarParallax, MuralBackdrop } from '@/components/landing-v2'
import { TYPE } from '@/lib/design/landing-tokens'
import { MURAL_GROUND } from '@/lib/design/system-flavors'
import { getTodayAcrossSystems, getFooterLiveLine } from '@/lib/today-board'
import { JsonLd, SITE_URL, organizationSchema, buildBreadcrumbs } from '@/lib/seo/json-ld'

// Revalidate hourly so the footer live line stays current (same as landing).
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'About Pleiad - Six Wisdom Systems, One Map',
  description: 'Pleiad makes Dreamspell, Tzolkin, Long Count, Human Design, Astrology, and Kabbalah accessible, accurate, and interconnected. Privacy-first and open.',
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'About Pleiad - Six Wisdom Systems, One Map',
    description: 'Our mission: making six ancient wisdom systems accessible, accurate, and interconnected.',
    url: '/about',
  },
}

const aboutOrgSchema = {
  "@context": "https://schema.org",
  ...organizationSchema,
  "description": "Pleiad unifies six ancient wisdom systems (Dreamspell, Tzolkin, Long Count, Human Design, Astrology, and Kabbalah) into one accessible platform for modern seekers.",
  "foundingDate": "2024",
  "knowsAbout": ["Dreamspell", "Human Design", "Astrology", "Kabbalah", "Gematria", "Tzolkin", "Mayan Calendar"],
}

const breadcrumbSchema = buildBreadcrumbs([
  { name: 'Home', url: SITE_URL },
  { name: 'About', url: `${SITE_URL}/about` },
])

const SYSTEMS = [
  {
    name: 'Dreamspell',
    body: 'A modern interpretation of the Mayan calendar, created by José Argüelles. As he taught: “Time is not money. Time is Art.” The 260-day Tzolkin cycle reveals your galactic signature, a combination of one of 20 Solar Seals and 13 Galactic Tones that describes your cosmic purpose.',
  },
  {
    name: 'Human Design',
    body: 'A synthesis of the I Ching, Kabbalah, Chakra system, Astrology, and Quantum Physics. Ra Uru Hu, who received the system, emphasized: “I am not the guru. I am a mechanic.” Your Bodygraph reveals your Type, Strategy, Authority, and the unique way you’re designed to operate in the world.',
  },
  {
    name: 'Tzolkin',
    body: 'The traditional 260-day Maya sacred count, still kept by daykeepers in the Guatemalan highlands. Your day sign and tone place a birth inside a living calendar that has run unbroken for over two thousand years.',
  },
  {
    name: 'Long Count',
    body: 'The Maya astronomical calendar that locates a date inside great cycles: baktun, katun, tun. Where the Tzolkin gives a birth its quality, the Long Count gives it an address in deep time.',
  },
  {
    name: 'Astrology',
    body: 'The ancient study of planetary positions and their influence on human life. Your natal chart maps the sky at the moment of your birth, revealing personality traits, life themes, and potential paths.',
  },
  {
    name: 'Kabbalah',
    body: 'The Hebrew tradition that reads letters as vehicles of creation. By calculating the gematria of your Hebrew name, where every letter carries a number, we uncover hidden meanings and connections in the language of numbers.',
  },
] as const

const VALUES = [
  {
    name: 'Accuracy',
    body: 'We use verified algorithms and authoritative sources for all calculations.',
  },
  {
    name: 'Accessibility',
    body: 'Complex systems should be understandable, not gatekept.',
  },
  {
    name: 'Integration',
    body: 'We seek the connections between systems, not divisions.',
  },
  {
    name: 'Privacy',
    body: 'Your birth data and insights remain yours. We never sell personal information.',
  },
] as const

export default function AboutPage() {
  const liveLine = getFooterLiveLine(getTodayAcrossSystems())

  return (
    <div className="min-h-[100dvh]" style={{ backgroundColor: MURAL_GROUND }}>
      <NavV2 />
      <JsonLd data={aboutOrgSchema} id="json-ld-organization" />
      <JsonLd data={breadcrumbSchema} id="json-ld-breadcrumbs" />

      <main className="relative overflow-hidden pb-24 pt-32 sm:pt-40">
        <StarParallax />

        {/* The traveler's star trail — screen-blended so only its light lands. */}
        <MuralBackdrop
          placement="halo-right"
          src="/images/redesign/motifs/traveler-glyph.webp"
          blend
          opacity={0.55}
          imgClassName="object-contain"
        />

        {/* Hero */}
        <section className="relative mx-auto max-w-content px-6 text-center">
          <p className={`${TYPE.eyebrow} text-brand`}>About</p>
          <h1 className={`${TYPE.hero} mx-auto mt-4 max-w-3xl`}>
            The living map of your people.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/70">
            Save someone once and read them across six systems, together.
          </p>
        </section>

        <div className="relative mx-auto mt-16 max-w-3xl px-6">
          {/* Mission */}
          <section>
            <h2 className={TYPE.section}>Our Mission</h2>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-white/70">
              <p>
                Pleiad is the living map of your people. You save a person once
                (a name, a birthday) and Pleiad reads them across six systems
                at once: Dreamspell, Tzolkin, Long Count, Human Design,
                Astrology, and Kabbalah. The systems aren&apos;t competing
                frameworks to choose between; they&apos;re lenses trained on the
                same people, and the map shows how those readings connect:
                between systems, and between the people you carry.
              </p>
              <p>
                Our mission is to make these systems accessible, accurate, and
                interconnected, so the relationships that matter to you can be
                read with the same care as the individuals in them.
              </p>
            </div>
          </section>

          {/* Systems — divide-y rows, not stacked cards. */}
          <section className="mt-20">
            <h2 className={TYPE.section}>The Systems We Work With</h2>
            <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
              {SYSTEMS.map(system => (
                <div key={system.name} className="py-6">
                  <h3 className={TYPE.h3}>{system.name}</h3>
                  <p className="mt-2 leading-relaxed text-white/70">{system.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Values — plain rows, no logo-as-bullet markers. */}
          <section className="mt-20">
            <h2 className={TYPE.section}>Our Values</h2>
            <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
              {VALUES.map(value => (
                <div key={value.name} className="flex flex-col gap-1 py-5 sm:flex-row sm:items-baseline sm:gap-6">
                  <h3 className={`${TYPE.h3} sm:w-36 sm:shrink-0`}>{value.name}</h3>
                  <p className="leading-relaxed text-white/70">{value.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="mt-20 text-center">
            <p className="text-lg text-white/70">
              Ready to start your map?
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/calculate"
                className="inline-flex items-center justify-center rounded-xl bg-brand px-6 py-3 font-medium text-white transition-colors hover:bg-brand-soft active:scale-[0.98]"
              >
                Calculate Your Kin
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 px-6 py-3 font-medium text-white/80 transition-colors hover:bg-white/5 active:scale-[0.98]"
              >
                Get Started Free
              </Link>
            </div>
          </section>
        </div>
      </main>
      <FooterV2 liveLine={liveLine} />
    </div>
  )
}
