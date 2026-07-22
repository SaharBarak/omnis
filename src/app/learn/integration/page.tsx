import { Metadata } from 'next'
import Link from 'next/link'

import {
  CARD,
  DocCta,
  DocHero,
  DocInfoBox,
  DocProse,
  DocPullQuote,
  DocSection,
  DocShell,
  QuickAnswer,
} from '@/app/learn/_components/doc-shell'
import { COLORS } from '@/lib/design/landing-tokens'
import { SYSTEM_FLAVORS } from '@/lib/design/system-flavors'
import { integrationDocs } from '@/lib/docs/content'
import { JsonLd, SITE_URL, buildBreadcrumbs } from '@/lib/seo/json-ld'

export const revalidate = 3600

// Integration has no zone on the mural — it braids the five threads, so the
// page accents with the chrome brand violet per the design contract.
const ACCENT = COLORS.brand
const ACCENT_SOFT = COLORS.brandSoft

export const metadata: Metadata = {
  title: 'How Dreamspell, Human Design & Astrology Connect: Integration Guide',
  description: 'Discover how Dreamspell, Human Design, Astrology, Kabbalah, and Tzolkin work together. Find correspondences between systems and build a unified daily practice.',
  keywords: 'system integration, dreamspell astrology connection, human design comparison, can I use multiple systems, how do wisdom systems connect, symbolic systems, holistic wisdom',
  alternates: {
    canonical: '/learn/integration',
  },
  openGraph: {
    title: 'How Dreamspell, Human Design & Astrology Connect: Integration Guide',
    description: 'Discover how five ancient wisdom systems connect and complement each other.',
    url: '/learn/integration',
  },
}

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "How Dreamspell, Human Design & Astrology Connect: Integration Guide",
  "description": "Discover how Dreamspell, Human Design, Astrology, Kabbalah, and Tzolkin work together.",
  "author": { "@id": `${SITE_URL}/#organization` },
  "publisher": { "@id": `${SITE_URL}/#organization` },
  "datePublished": "2024-06-01",
  "dateModified": "2025-01-15",
  "keywords": ["system integration", "dreamspell astrology", "human design comparison", "wisdom systems"],
  "mainEntityOfPage": `${SITE_URL}/learn/integration`,
}

const courseSchema = {
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "How Dreamspell, Human Design & Astrology Connect",
  "description": "Learn how five ancient wisdom systems connect and complement each other for a unified understanding.",
  "provider": { "@id": `${SITE_URL}/#organization` },
  "isAccessibleForFree": true,
  "url": `${SITE_URL}/learn/integration`,
}

const breadcrumbSchema = buildBreadcrumbs([
  { name: 'Home', url: SITE_URL },
  { name: 'Learn', url: `${SITE_URL}/learn` },
  { name: 'Integration', url: `${SITE_URL}/learn/integration` },
])

const integrationFaqs = [
  {
    question: "Can I use multiple wisdom systems at the same time?",
    answer: "Yes, that is exactly what Pleiad is designed for. Dreamspell, Human Design, Astrology, Kabbalah, and Tzolkin each illuminate different aspects of who you are. Rather than competing, they complement each other: Dreamspell reveals your timing and synchronicity, Human Design shows your strategy and authority, Astrology maps your psychological depth, and Kabbalah connects you to sacred tradition.",
  },
  {
    question: "How do these systems connect?",
    answer: "The systems share deep structural parallels. Human Design's Bodygraph is built directly on the Kabbalistic Tree of Life. Astrology's planets correspond to specific Sefirot in Kabbalah. The Dreamspell's 13 Tones mirror the 10 Sefirot plus 3 veils of Ein Sof. When multiple systems point to the same theme in your chart, it indicates a strongly emphasized quality in your design.",
  },
]

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": integrationFaqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer,
    },
  })),
}

/** DocSection headings, in page order — feeds the DocShell table of contents. */
const TOC = [
  { id: 'int-correspondences', label: integrationDocs.correspondences.title },
  { id: 'int-pattern', label: 'The Deeper Pattern' },
  { id: 'int-practice', label: integrationDocs.practicalIntegration.title },
  { id: 'int-agreement', label: 'When Systems Agree & Diverge' },
  { id: 'int-daily', label: 'A Daily Integration Practice' },
  { id: 'int-faq', label: 'Frequently Asked Questions' },
] as const

// System accents for the correspondence rows — each system speaks in its own
// flavor tokens (system-flavors.ts), not leftover palette classes. accentSoft
// is used for text/dots: it reads on the near-black ground.
const SYSTEM_ACCENTS: Record<string, string> = {
  Dreamspell: SYSTEM_FLAVORS.dreamspell.accentSoft,
  'Human Design': SYSTEM_FLAVORS.humanDesign.accentSoft,
  Astrology: SYSTEM_FLAVORS.astrology.accentSoft,
  Kabbalah: SYSTEM_FLAVORS.gematria.accentSoft,
}

const LENSES = [
  {
    href: '/learn/dreamspell',
    name: 'Dreamspell',
    caption: 'Timing & Synchronicity',
    flavor: SYSTEM_FLAVORS.dreamspell,
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="4" />
        <circle cx="12" cy="12" r="8" opacity="0.5" />
      </svg>
    ),
  },
  {
    href: '/learn/human-design',
    name: 'Human Design',
    caption: 'Strategy & Authority',
    flavor: SYSTEM_FLAVORS.humanDesign,
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="5" r="2" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 7v2M8 20l4-5 4 5" />
      </svg>
    ),
  },
  {
    href: '/learn/astrology',
    name: 'Astrology',
    caption: 'Depth & Timing',
    flavor: SYSTEM_FLAVORS.astrology,
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
      </svg>
    ),
  },
  {
    href: '/learn/gematria',
    name: 'Kabbalah',
    caption: 'Name & Number',
    flavor: SYSTEM_FLAVORS.gematria,
    icon: <span className="font-serif text-2xl">א</span>,
  },
  {
    href: '/learn/tzolkin',
    name: 'Tzolkin',
    caption: 'Living Tradition',
    flavor: SYSTEM_FLAVORS.tzolkin,
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M4 9h16M9 4v16" />
      </svg>
    ),
  },
] as const

// Daily-practice steps — same stroke-icon grammar as LENSES (24 viewBox,
// fill none, currentColor stroke), tinted per step.
const DAILY_PRACTICE = [
  {
    title: 'Morning: Set the Day',
    body: 'Check your Dreamspell kin for today’s energy. Note the wavespell theme. Set an intention aligned with this frequency.',
    flavor: SYSTEM_FLAVORS.dreamspell,
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" />
      </svg>
    ),
  },
  {
    title: 'Throughout: Trust Your Strategy',
    body: 'Use your Human Design strategy and authority for decisions. Generators: respond. Projectors: wait for invitations. Manifestors: inform.',
    flavor: SYSTEM_FLAVORS.humanDesign,
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" />
      </svg>
    ),
  },
  {
    title: 'Weekly: Observe Transits',
    body: 'Note significant astrological transits affecting your chart. Moon phases, Mercury retrograde, and outer planet movements all shape the collective field.',
    flavor: SYSTEM_FLAVORS.astrology,
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z" />
      </svg>
    ),
  },
  {
    title: 'Ongoing: Contemplate Your Name',
    body: 'If you have a Hebrew name, meditate on its gematria value. What words share your number? What connections emerge?',
    flavor: SYSTEM_FLAVORS.gematria,
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      </svg>
    ),
  },
] as const

export default function IntegrationDocsPage() {
  return (
    <DocShell section="integration" toc={TOC}>
      <JsonLd data={articleSchema} id="json-ld-article" />
      <JsonLd data={courseSchema} id="json-ld-course" />
      <JsonLd data={breadcrumbSchema} id="json-ld-breadcrumbs" />
      <JsonLd data={faqSchema} id="json-ld-faq" />

      {/* Header */}
      <DocHero
        section="integration"
        title={integrationDocs.title}
        subtitle={integrationDocs.subtitle}
      />

      <QuickAnswer
        question="Can I use Dreamspell, Human Design, and Astrology together?"
        answer="Yes. Each system illuminates a different facet of who you are: Dreamspell reveals your timing and cosmic purpose, the traditional Tzolkin grounds you in the living Maya count, Human Design shows your decision-making strategy and energy type, Astrology maps your psychological depth and life transits, and Kabbalah reads the numbers hidden in your name. When multiple systems agree on a theme, it signals a core quality in your design. Pleiad computes every lens from one profile (birth date, time, place, and name, entered once) for every person on your map."
        accent={ACCENT}
        accentSoft={ACCENT_SOFT}
      />

      {/* Introduction */}
      <section className="mb-12">
        <DocProse content={integrationDocs.introduction} />
      </section>

      {/* Pull Quote */}
      <DocPullQuote
        quote="We are the universe knowing itself through time."
        author="The shared insight of all these systems"
        accent={ACCENT}
      />

      {/* The Five Lenses Visual */}
      <section className="mb-16">
        <div className={`${CARD} p-8`}>
          <h3 className="mb-8 text-center font-display text-xl text-white">The Five Lenses</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {LENSES.map((lens, i) => (
              <Link
                key={lens.name}
                href={lens.href}
                className={`group flex flex-col items-center gap-3 rounded-xl p-5 transition-colors hover:bg-white/5 active:scale-[0.98] ${
                  i === LENSES.length - 1 ? 'col-span-2 sm:col-span-1' : ''
                }`}
              >
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: `${lens.flavor.accent}14`,
                    color: lens.flavor.accentSoft,
                  }}
                >
                  {lens.icon}
                </div>
                <span className="font-display text-white transition-colors group-hover:text-brand-soft">
                  {lens.name}
                </span>
                <span className="text-center text-xs text-white/50">{lens.caption}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Points of Correspondence */}
      <DocSection id="int-correspondences" title={integrationDocs.correspondences.title}>
        <p className="mb-8 text-lg leading-relaxed text-white/70">
          Each theme in human experience can be viewed through multiple symbolic lenses. Here are key areas where the systems offer parallel insights.
        </p>

        <div className="space-y-6">
          {integrationDocs.correspondences.connections.map((connection) => (
            <div key={connection.theme} className={`${CARD} overflow-hidden`}>
              <div className="border-b border-white/10 bg-white/5 px-6 py-4">
                <h4 className="font-display text-lg text-white">{connection.theme}</h4>
              </div>
              <div className="p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  {connection.systems.map((item) => {
                    const accent = SYSTEM_ACCENTS[item.system] ?? ACCENT_SOFT
                    return (
                      <div key={item.system} className="flex items-start gap-4">
                        <div
                          className="mt-1.5 h-3 w-3 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: accent }}
                        />
                        <div>
                          <div className="text-sm font-medium" style={{ color: accent }}>
                            {item.system}
                          </div>
                          <div className="text-sm text-white/70">{item.concept}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </DocSection>

      {/* The Deeper Pattern */}
      <DocSection id="int-pattern" title="The Deeper Pattern">
        <p className="mb-8 text-lg leading-relaxed text-white/70">
          Beyond specific correspondences, all these systems share a fundamental understanding:
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div
            className={`${CARD} p-6`}
            style={{ borderLeftWidth: '4px', borderLeftColor: SYSTEM_FLAVORS.dreamspell.accent }}
          >
            <h4 className="mb-3 font-display text-lg text-white">Time is Not Linear</h4>
            <p className="text-sm leading-relaxed text-white/70">
              Astrology maps planetary cycles, Dreamspell encodes galactic time, Tzolkin tracks sacred day counts.
              Each system reveals that time has quality, not just quantity.
            </p>
          </div>
          <div
            className={`${CARD} p-6`}
            style={{ borderLeftWidth: '4px', borderLeftColor: SYSTEM_FLAVORS.humanDesign.accent }}
          >
            <h4 className="mb-3 font-display text-lg text-white">You Are Encoded</h4>
            <p className="text-sm leading-relaxed text-white/70">
              Your birth moment captured a unique configuration. Human Design calls it imprinting, Astrology calls it the natal chart.
              You carry cosmic information in your being.
            </p>
          </div>
          <div
            className={`${CARD} p-6`}
            style={{ borderLeftWidth: '4px', borderLeftColor: SYSTEM_FLAVORS.gematria.accent }}
          >
            <h4 className="mb-3 font-display text-lg text-white">Language Creates Reality</h4>
            <p className="text-sm leading-relaxed text-white/70">
              Gematria reveals meaning in Hebrew letters, Dreamspell speaks of plasma and kin.
              The words we use shape what we can perceive.
            </p>
          </div>
          <div
            className={`${CARD} p-6`}
            style={{ borderLeftWidth: '4px', borderLeftColor: SYSTEM_FLAVORS.astrology.accent }}
          >
            <h4 className="mb-3 font-display text-lg text-white">Maps Are Not Territory</h4>
            <p className="text-sm leading-relaxed text-white/70">
              No system captures the full mystery of who you are. Each offers a useful map.
              The terrain is your lived experience.
            </p>
          </div>
        </div>
      </DocSection>

      {/* Practical Integration */}
      <DocSection id="int-practice" title={integrationDocs.practicalIntegration.title}>
        <p className="mb-8 text-lg leading-relaxed text-white/70">
          Working with multiple systems can be enriching or overwhelming. Here are guidelines for meaningful integration:
        </p>

        <div className="space-y-3">
          {integrationDocs.practicalIntegration.guidelines.map((guideline, index) => (
            <div key={index} className={`${CARD} flex items-start gap-4 p-5`}>
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-display text-sm"
                style={{ backgroundColor: `${ACCENT}1A`, color: ACCENT_SOFT }}
              >
                {index + 1}
              </div>
              <p className="pt-2 leading-relaxed text-white/70">{guideline}</p>
            </div>
          ))}
        </div>
      </DocSection>

      {/* Agreement vs Divergence */}
      <DocSection id="int-agreement" title="When Systems Agree & Diverge">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className={`${CARD} p-6`}>
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h4 className="font-display text-lg text-white">When They Agree</h4>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-white/70">
              When multiple systems point to the same theme, pay attention. This suggests a strongly emphasized quality in your design.
            </p>
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
              <p className="text-sm italic leading-relaxed text-white/60">
                Example: If your Astrology shows strong Mercury, you&apos;re a Communicator type in Human Design, and your Dreamspell seal is White Wind, communication is clearly central to your path.
              </p>
            </div>
          </div>

          <div className={`${CARD} p-6`}>
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10">
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 12h8M12 8v8" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <h4 className="font-display text-lg text-white">When They Diverge</h4>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-white/70">
              Apparent contradictions often reveal complexity. You are multidimensional: different systems may illuminate different facets.
            </p>
            <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
              <p className="text-sm italic leading-relaxed text-white/60">
                Example: If Astrology shows you as introverted (Cancer Sun) but Human Design shows you as a Projector waiting to be recognized, the interplay reveals how your inner nature meets your outer strategy.
              </p>
            </div>
          </div>
        </div>
      </DocSection>

      {/* Daily Practice */}
      <DocSection id="int-daily" title="A Daily Integration Practice">
        <p className="mb-8 text-lg leading-relaxed text-white/70">
          Here&apos;s a simple way to work with multiple systems daily:
        </p>

        <div className={`${CARD} p-6`}>
          <div className="space-y-5">
            {DAILY_PRACTICE.map((step) => (
              <div key={step.title} className="flex items-start gap-5">
                <div
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `${step.flavor.accent}14`,
                    color: step.flavor.accentSoft,
                  }}
                >
                  {step.icon}
                </div>
                <div>
                  <div className="mb-1 font-display text-white">{step.title}</div>
                  <p className="text-sm leading-relaxed text-white/70">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DocSection>

      {/* FAQ */}
      <DocSection id="int-faq" title="Frequently Asked Questions">
        <div className="space-y-4">
          {integrationFaqs.map((faq, i) => (
            <div key={i} className={`${CARD} p-5`}>
              <h4 className="mb-2 font-display text-lg text-white">{faq.question}</h4>
              <p className="text-sm leading-relaxed text-white/70">{faq.answer}</p>
            </div>
          ))}
        </div>
      </DocSection>

      {/* Pleiad Info Box */}
      <section className="mb-12">
        <DocInfoBox title="Pleiad Does This For You" accent={ACCENT} accentSoft={ACCENT_SOFT}>
          <p className="leading-relaxed">
            This is why Pleiad exists: to calculate your data across all systems and surface the patterns,
            so you can focus on living your design rather than computing it. Enter a birth once and it is
            remembered forever: every person you chart becomes a node on your map, ready for any new
            reading, comparison, or group.
          </p>
        </DocInfoBox>
      </section>

      {/* CTA */}
      <DocCta
        title="See Your Full Picture"
        body="Enter your birth data for a unified reading across every system, then add the people around you and watch the map take shape."
        primary={{ href: '/calculate', label: 'Start with your birthday' }}
        secondary={{ href: '/learn', label: 'Explore all guides' }}
      />
    </DocShell>
  )
}
