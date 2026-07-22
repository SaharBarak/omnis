import { Metadata } from 'next'

import {
  CARD,
  DocCta,
  DocHero,
  DocInfoBox,
  DocProse,
  DocPullQuote,
  DocSection,
  DocShell,
  DocStats,
  QuickAnswer,
} from '@/app/learn/_components/doc-shell'
import { SYSTEM_FLAVORS } from '@/lib/design/system-flavors'
import { humanDesignDocs } from '@/lib/docs/content'
import { JsonLd, SITE_URL, buildBreadcrumbs } from '@/lib/seo/json-ld'

export const revalidate = 3600

const FLAVOR = SYSTEM_FLAVORS.humanDesign
const ACCENT = FLAVOR.accent
const ACCENT_SOFT = FLAVOR.accentSoft

/** DocSection headings, in page order — feeds the DocShell table of contents. */
const TOC = [
  { id: 'hd-types', label: humanDesignDocs.types.title },
  { id: 'hd-authority', label: humanDesignDocs.authority.title },
  { id: 'hd-centers', label: humanDesignDocs.centers.title },
  { id: 'hd-profile', label: humanDesignDocs.profile.title },
  { id: 'hd-gates', label: humanDesignDocs.gates.title },
  { id: 'hd-incarnation', label: humanDesignDocs.incarnationCross.title },
  { id: 'hd-experiment', label: humanDesignDocs.experiment.title },
  { id: 'hd-faq', label: 'Frequently Asked Questions' },
] as const

export const metadata: Metadata = {
  title: 'Human Design Explained: Types, Strategy & Authority Guide',
  description: 'Complete guide to Human Design: the 5 Types (Generator, Projector, Manifestor, Manifesting Generator, Reflector), Inner Authority, 9 Centers, 12 Profiles, 64 Gates & 36 Channels.',
  keywords: 'human design explained, human design types, bodygraph, type, authority, strategy, generator, projector, manifestor, reflector, ra uru hu, free human design chart',
  alternates: {
    canonical: '/learn/human-design',
  },
  openGraph: {
    title: 'Human Design Explained: Types, Strategy & Authority Guide',
    description: 'Learn about the 5 Human Design Types, Strategy, Authority, Centers, and Profiles. Free comprehensive guide.',
    url: '/learn/human-design',
  },
}

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Human Design Explained: Types, Strategy & Authority Guide",
  "description": "Complete guide to Human Design: the 5 Types, Inner Authority, 9 Centers, 12 Profiles, 64 Gates & 36 Channels.",
  "author": { "@id": `${SITE_URL}/#organization` },
  "publisher": { "@id": `${SITE_URL}/#organization` },
  "datePublished": "2024-06-01",
  "dateModified": "2025-01-15",
  "keywords": ["human design", "bodygraph", "types", "authority", "strategy", "generator", "projector", "manifestor"],
  "mainEntityOfPage": `${SITE_URL}/learn/human-design`,
}

const courseSchema = {
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "Human Design: Types, Strategy & Authority Guide",
  "description": "Learn the Human Design system: 5 Types, Inner Authority, 9 Centers, Profiles, Gates & Channels.",
  "provider": { "@id": `${SITE_URL}/#organization` },
  "isAccessibleForFree": true,
  "url": `${SITE_URL}/learn/human-design`,
}

const breadcrumbSchema = buildBreadcrumbs([
  { name: 'Home', url: SITE_URL },
  { name: 'Learn', url: `${SITE_URL}/learn` },
  { name: 'Human Design', url: `${SITE_URL}/learn/human-design` },
])

const humanDesignFaqs = [
  {
    question: "What are the 5 Human Design types?",
    answer: "The 5 Human Design types are: Generator (37% of population, strategy: respond), Manifesting Generator (33%, strategy: respond then inform), Projector (20%, strategy: wait for invitation), Manifestor (8%, strategy: inform), and Reflector (1%, strategy: wait a lunar cycle). Your type determines your basic strategy for making decisions.",
  },
  {
    question: "How is a Human Design chart calculated?",
    answer: "A Human Design chart (Bodygraph) is calculated from your exact birth date, time, and location. It combines the I Ching, Kabbalah Tree of Life, Hindu Chakra system, and Western Astrology into a single diagram showing your 9 Centers, defined Channels, activated Gates, Type, Strategy, and Authority.",
  },
  {
    question: "What is Inner Authority in Human Design?",
    answer: "Inner Authority is your body's reliable decision-making mechanism. The main authorities are: Emotional (Solar Plexus, wait for clarity), Sacral (gut response, listen to uh-huh/uh-uh), Splenic (intuition, trust the moment), Ego/Heart (willpower, honor commitments), Self-Projected (identity, talk it out), and Lunar (Reflectors, wait 28 days).",
  },
]

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": humanDesignFaqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer,
    },
  })),
}

// Type colors — dark-ground tints.
const typeColors: Record<string, { bg: string; border: string; text: string }> = {
  Generator: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400' },
  'Manifesting Generator': { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400' },
  Projector: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' },
  Manifestor: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400' },
  Reflector: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
}

// Center glyphs echo the Bodygraph geometry — same stroke grammar as the
// /learn/integration LENSES icons (24 viewBox, no fill, currentColor stroke).
const CENTER_ICON_PATHS: Record<string, string> = {
  'Head Center': 'M12 5l7 12H5z',
  'Ajna Center': 'M5 7h14l-7 12z',
  'Throat Center': 'M6 6h12v12H6z',
  'G Center': 'M12 4l8 8-8 8-8-8z',
  'Heart/Ego Center': 'M7 9l10 2.5-7 5.5z',
  'Solar Plexus Center': 'M7 5l12 7-12 7z',
  'Sacral Center': 'M6 6h12v12H6z M12 10v4',
  'Spleen Center': 'M17 5L5 12l12 7z',
  'Root Center': 'M6 6h12v12H6z M9 14h6',
}

function CenterIcon({ name }: { readonly name: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden
    >
      <path d={CENTER_ICON_PATHS[name] ?? CENTER_ICON_PATHS['G Center']} />
    </svg>
  )
}

export default function HumanDesignDocsPage() {
  return (
    <DocShell section="human-design" toc={TOC}>
      <JsonLd data={articleSchema} id="json-ld-article" />
      <JsonLd data={courseSchema} id="json-ld-course" />
      <JsonLd data={breadcrumbSchema} id="json-ld-breadcrumbs" />
      <JsonLd data={faqSchema} id="json-ld-faq" />

      {/* Header */}
      <DocHero
        section="human-design"
        title={humanDesignDocs.overview.title}
        subtitle={humanDesignDocs.overview.subtitle}
      />

      <QuickAnswer
        question="What is Human Design?"
        answer="Human Design is a system combining the I Ching, Kabbalah, Hindu Chakras, and Astrology into a single Bodygraph chart. Calculated from your birth date, time, and place, it reveals your Type (how you exchange energy), Strategy (how to make decisions), and Authority (your body's decision-making mechanism). There are 5 Types: Generator, Manifesting Generator, Projector, Manifestor, and Reflector."
        accent={ACCENT}
        accentSoft={ACCENT_SOFT}
      />

      {/* Introduction */}
      <section className="mb-12">
        <DocProse content={humanDesignDocs.overview.introduction} />
      </section>

      {/* Pull Quote */}
      <DocPullQuote
        quote={humanDesignDocs.overview.quote.text}
        author={humanDesignDocs.overview.quote.author}
        accent={ACCENT}
      />

      {/* Quick Stats */}
      <DocStats
        stats={[
          { value: '5', label: 'Energy Types' },
          { value: '9', label: 'Centers' },
          { value: '64', label: 'Gates' },
          { value: '36', label: 'Channels' },
        ]}
        accentSoft={ACCENT_SOFT}
      />

      {/* The Five Types */}
      <DocSection id="hd-types" title={humanDesignDocs.types.title}>
        <DocProse className="mb-8" content={humanDesignDocs.types.introduction} />

        <div className="space-y-4">
          {humanDesignDocs.types.typeDetails.map((type) => {
            const colors = typeColors[type.name] || typeColors.Generator
            return (
              <div
                key={type.name}
                className={`${CARD} overflow-hidden ${colors.border}`}
                style={{ borderLeftWidth: '4px' }}
              >
                <div className={`px-6 py-4 ${colors.bg}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className={`font-display text-xl ${colors.text}`}>{type.name}</h4>
                    <span className="text-sm text-white/50">{type.percentage} of population</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-4 grid gap-4 sm:grid-cols-3">
                    <div>
                      <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.15em] text-white/40">Strategy</div>
                      <div className="font-medium text-white">{type.strategy}</div>
                    </div>
                    <div>
                      <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.15em] text-white/40">Signature</div>
                      <div className="font-medium text-white">{type.signature}</div>
                    </div>
                    <div>
                      <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.15em] text-white/40">Not-Self</div>
                      <div className="font-medium text-white">{type.notSelf}</div>
                    </div>
                  </div>
                  <DocProse variant="small" content={type.description} />
                </div>
              </div>
            )
          })}
        </div>
      </DocSection>

      {/* Inner Authority */}
      <DocSection id="hd-authority" title={humanDesignDocs.authority.title}>
        <DocProse className="mb-8" content={humanDesignDocs.authority.introduction} />

        <div className="grid gap-4 sm:grid-cols-2">
          {humanDesignDocs.authority.authorities.map((auth) => (
            <div key={auth.name} className={`${CARD} p-5`}>
              <h4 className="mb-2 font-display text-lg text-white">{auth.name}</h4>
              <DocProse variant="small" className="mb-3" content={auth.description} />
              <div className="text-xs italic text-white/40">{auth.practice}</div>
            </div>
          ))}
        </div>
      </DocSection>

      {/* Nine Centers */}
      <DocSection id="hd-centers" title={humanDesignDocs.centers.title}>
        <DocProse className="mb-8" content={humanDesignDocs.centers.introduction} />

        <div className="space-y-4">
          {humanDesignDocs.centers.centerDetails.map((center) => (
            <div key={center.name} className={`${CARD} p-5`}>
              <div className="flex items-start gap-4">
                <div
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${ACCENT}14`, color: ACCENT_SOFT }}
                >
                  <CenterIcon name={center.name} />
                </div>
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <h4 className="font-display text-lg text-white">{center.name}</h4>
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/50">{center.location}</span>
                  </div>
                  <p className="mb-3 text-sm leading-relaxed text-white/70">{center.function}</p>
                  <div className="grid gap-3 text-xs sm:grid-cols-2">
                    <div className="rounded-lg border border-green-500/10 bg-green-500/5 p-2">
                      <span className="font-medium text-green-400">Defined:</span>
                      <span className="ml-1 text-white/60">{center.defined}</span>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                      <span className="font-medium text-white/70">Undefined:</span>
                      <span className="ml-1 text-white/60">{center.undefined}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DocSection>

      {/* 12 Profiles */}
      <DocSection id="hd-profile" title={humanDesignDocs.profile.title}>
        <DocProse className="mb-8" content={humanDesignDocs.profile.introduction} />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {humanDesignDocs.profile.profiles.map((profile) => (
            <div key={profile.profile} className={`${CARD} p-4`}>
              <div className="mb-1 font-display text-lg text-white">{profile.profile}</div>
              <div className="mb-2 text-sm" style={{ color: ACCENT_SOFT }}>{profile.name}</div>
              <p className="text-xs leading-relaxed text-white/50">{profile.description}</p>
            </div>
          ))}
        </div>
      </DocSection>

      {/* Gates & Channels */}
      <DocSection id="hd-gates" title={humanDesignDocs.gates.title}>
        <DocInfoBox title="The 64 Gates" accent={ACCENT} accentSoft={ACCENT_SOFT}>
          <DocProse variant="inherit" content={humanDesignDocs.gates.structure} />
        </DocInfoBox>
      </DocSection>

      {/* Incarnation Cross */}
      <DocSection id="hd-incarnation" title={humanDesignDocs.incarnationCross.title}>
        <DocProse className="mb-6" content={humanDesignDocs.incarnationCross.introduction} />
      </DocSection>

      {/* The Experiment */}
      <DocSection id="hd-experiment" title={humanDesignDocs.experiment.title}>
        <DocInfoBox title="Your Personal Experiment" accent={ACCENT} accentSoft={ACCENT_SOFT}>
          <DocProse variant="inherit" content={humanDesignDocs.experiment.content} />
        </DocInfoBox>
      </DocSection>

      {/* FAQ */}
      <DocSection id="hd-faq" title="Frequently Asked Questions">
        <div className="space-y-4">
          {humanDesignFaqs.map((faq, i) => (
            <div key={i} className={`${CARD} p-5`}>
              <h4 className="mb-2 font-display text-lg text-white">{faq.question}</h4>
              <p className="text-sm leading-relaxed text-white/70">{faq.answer}</p>
            </div>
          ))}
        </div>
      </DocSection>

      {/* CTA */}
      <DocCta
        title="Discover Your Design"
        body="Get your complete Human Design chart with Type, Authority, Profile, and Centers."
        primary={{ href: '/calculate', label: 'Start with your birthday' }}
        secondary={{ href: '/learn/astrology', label: 'Explore Astrology' }}
      />
    </DocShell>
  )
}
