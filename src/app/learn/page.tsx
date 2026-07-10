import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { NavV2, FooterV2, KnowledgeSearch, StarParallax } from '@/components/landing-v2'
import { TYPE } from '@/lib/design/landing-tokens'
import {
  DOC_FLAVORS,
  FLAVOR_DESCENT,
  MURAL_GROUND,
  SYSTEM_FLAVORS,
  type DocSectionId,
} from '@/lib/design/system-flavors'
import { docStructure } from '@/lib/docs/content'
import { getFooterLiveLine, getTodayAcrossSystems } from '@/lib/today-board'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Learn Ancient Wisdom Systems: Dreamspell, Human Design, Astrology & More',
  description: 'Free comprehensive guides to Dreamspell, Human Design, Western Astrology, Kabbalah & Gematria, and the traditional Mayan Tzolkin. Written with respect for the lineages.',
  keywords: 'dreamspell guide, human design guide, astrology tutorial, gematria learn, tzolkin calendar, kabbalah, symbolic systems, wisdom systems',
  alternates: {
    canonical: '/learn',
  },
  openGraph: {
    title: 'Learn Ancient Wisdom Systems: Dreamspell, Human Design, Astrology & More',
    description: 'Free comprehensive guides to six ancient wisdom systems. Learn about your cosmic blueprint.',
    url: '/learn',
  },
}

/** Portal order: the mural descent, then integration braids them together. */
const PORTAL_ORDER: readonly DocSectionId[] = [
  ...FLAVOR_DESCENT.map((key) => {
    const href = SYSTEM_FLAVORS[key].learnHref
    return href.replace('/learn/', '') as DocSectionId
  }),
  'integration',
]

function PortalRow({ section }: { readonly section: DocSectionId }) {
  const flavor = DOC_FLAVORS[section]
  const doc = docStructure.sections.find((s) => s.id === section)
  if (!doc) return null

  return (
    <Link
      href={`/learn/${section}`}
      className="group grid items-center gap-6 py-8 transition-colors active:scale-[0.98] sm:grid-cols-[1fr_auto] sm:py-10"
    >
      <div className="min-w-0">
        <span
          className={`${TYPE.eyebrow} inline-flex items-center gap-2`}
          style={{ color: flavor.accentSoft }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: flavor.accent }}
          />
          {flavor.name}
        </span>

        <h2 className="mt-3 font-display text-2xl tracking-tight text-white transition-colors md:text-3xl">
          {doc.title}
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/50">
          {doc.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
          {doc.topics.slice(0, 4).map((topic) => (
            <span key={topic.id} className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/35">
              {topic.title}
            </span>
          ))}
          {doc.topics.length > 4 && (
            <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/35">
              +{doc.topics.length - 4} more
            </span>
          )}
        </div>

        <p className="mt-4 font-mono text-xs leading-relaxed text-white/35">
          {flavor.lineage}
        </p>
      </div>

      <div
        className="relative hidden h-24 w-72 shrink-0 overflow-hidden rounded-xl border border-white/10 opacity-70 transition-opacity duration-300 group-hover:opacity-100 sm:block"
        style={{ backgroundColor: MURAL_GROUND }}
      >
        <Image
          src={flavor.bannerSrc}
          alt=""
          fill
          sizes="288px"
          className="object-cover object-right"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, ${MURAL_GROUND} 0%, transparent 60%)`,
          }}
        />
        <span
          className="absolute bottom-3 left-4 inline-flex items-center gap-1.5 text-sm font-medium transition-transform duration-300 group-hover:translate-x-1"
          style={{ color: flavor.accentSoft }}
        >
          Open guide
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  )
}

const STARTING_POINTS = [
  {
    section: 'dreamspell' as const,
    title: 'For daily practice',
    body: 'Track daily energies and find your galactic signature with Dreamspell.',
    cta: 'Start with Dreamspell',
  },
  {
    section: 'human-design' as const,
    title: 'For decision-making',
    body: 'Understand your strategy and inner authority with Human Design.',
    cta: 'Start with Human Design',
  },
  {
    section: 'astrology' as const,
    title: 'For deep analysis',
    body: 'Get the most detailed psychological portrait with Astrology.',
    cta: 'Start with Astrology',
  },
]

export default function LearnPage() {
  const liveLine = getFooterLiveLine(getTodayAcrossSystems())

  return (
    <div className="min-h-[100dvh]" style={{ backgroundColor: MURAL_GROUND }}>
      <NavV2 />

      <main className="relative overflow-hidden pb-24 pt-32 sm:pt-40">
        <StarParallax />

        {/* Hero — knowledge search is the surface, not a card grid. */}
        <section className="relative mx-auto max-w-content px-6">
          <p className={`${TYPE.eyebrow} text-brand`}>Knowledge base</p>
          <h1 className={`${TYPE.hero} mt-4 max-w-3xl`}>
            The sources behind every reading.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
            Five guides — Astrology, Dreamspell, the Tzolkin &amp; Long Count,
            Human Design, Kabbalah — written with respect for the lineages.
            When Pleiad tells you something about a person, this is where it
            learned it.
          </p>

          <div className="mt-10 max-w-2xl [&>div]:mx-0">
            <KnowledgeSearch />
          </div>
        </section>

        {/* Five flavored portals + integration — stacked rows, not cards. */}
        <section className="relative mx-auto mt-20 max-w-content px-6 sm:mt-28">
          <div className="divide-y divide-white/10 border-y border-white/10">
            {PORTAL_ORDER.map((section) => (
              <PortalRow key={section} section={section} />
            ))}
          </div>
        </section>

        {/* Voices of the lineages. */}
        <section className="relative mx-auto mt-20 max-w-content px-6 sm:mt-28">
          <div className="grid gap-6 md:grid-cols-2">
            <figure className="rounded-2xl border border-white/10 bg-surface p-8 sm:p-10">
              <blockquote className="text-xl leading-relaxed text-white/90 sm:text-2xl">
                &ldquo;Who owns your time owns your mind. Own your own time and
                know your own mind.&rdquo;
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-4">
                <span className="h-px w-10 bg-brand/40" />
                <span>
                  <cite className="not-italic font-medium text-white/70">José Argüelles</cite>
                  <span className="block text-sm text-white/35">Creator of Dreamspell</span>
                </span>
              </figcaption>
            </figure>

            <figure className="rounded-2xl border border-white/10 bg-surface p-8 sm:p-10">
              <blockquote className="text-xl leading-relaxed text-white/90 sm:text-2xl">
                &ldquo;I am not the guru. I am a mechanic.&rdquo;
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-4">
                <span className="h-px w-10 bg-brand/40" />
                <span>
                  <cite className="not-italic font-medium text-white/70">Ra Uru Hu</cite>
                  <span className="block text-sm text-white/35">Founder of Human Design</span>
                </span>
              </figcaption>
            </figure>
          </div>
        </section>

        {/* Starting points — divide-y rows per the zone grammar. */}
        <section className="relative mx-auto mt-20 max-w-content px-6 sm:mt-28">
          <h2 className={TYPE.section}>New here?</h2>
          <p className="mt-3 max-w-xl text-white/50">
            Choose a door based on what you&apos;re looking to explore.
          </p>

          <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
            {STARTING_POINTS.map((point) => {
              const flavor = DOC_FLAVORS[point.section]
              return (
                <Link
                  key={point.section}
                  href={`/learn/${point.section}`}
                  className="group flex flex-col gap-2 py-6 active:scale-[0.98] sm:flex-row sm:items-baseline sm:gap-8"
                >
                  <span className="w-48 shrink-0 font-display text-lg text-white">
                    {point.title}
                  </span>
                  <span className="flex-1 text-sm leading-relaxed text-white/50">
                    {point.body}
                  </span>
                  <span
                    className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium transition-transform duration-300 group-hover:translate-x-1"
                    style={{ color: flavor.accentSoft }}
                  >
                    {point.cta}
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>
              )
            })}
          </div>
        </section>

        {/* CTA — from the sources to the map. */}
        <section className="relative mx-auto mt-24 max-w-content px-6 sm:mt-32">
          <div className="max-w-2xl">
            <h2 className={TYPE.section}>Now read a person, not a page.</h2>
            <p className="mt-4 max-w-xl text-white/50">
              The guides explain the systems. The product reads your people
              through all six at once — and remembers every birthday forever.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/calculate"
                className="inline-flex items-center justify-center rounded-xl bg-brand px-8 py-4 font-medium text-white transition-colors hover:bg-brand-soft active:scale-[0.98]"
              >
                Calculate your signatures
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 px-8 py-4 font-medium text-white/70 transition-colors hover:border-white/30 hover:text-white active:scale-[0.98]"
              >
                Create a free account
              </Link>
            </div>
          </div>
        </section>
      </main>

      <FooterV2 liveLine={liveLine} />
    </div>
  )
}
