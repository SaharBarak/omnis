import { Metadata } from 'next'
import { SEALS } from '@pleiad/engine/data/seals'
import { TONES } from '@pleiad/engine/data/tones'

import {
  CARD,
  DocCta,
  DocH3,
  DocHero,
  DocInfoBox,
  DocProse,
  DocPullQuote,
  DocSection,
  DocShell,
  DocStats,
  GlyphChip,
  QuickAnswer,
} from '@/app/learn/_components/doc-shell'
import { SYSTEM_FLAVORS } from '@/lib/design/system-flavors'
import { dreamspellDocs } from '@/lib/docs/content'
import { getSealGlyphPath, getToneGlyphPath, getHunabKuPath } from '@/lib/dreamspell-assets'
import { JsonLd, SITE_URL, buildBreadcrumbs } from '@/lib/seo/json-ld'

export const revalidate = 3600

const FLAVOR = SYSTEM_FLAVORS.dreamspell
const ACCENT = FLAVOR.accent
const ACCENT_SOFT = FLAVOR.accentSoft

/** DocSection headings, in page order — feeds the DocShell table of contents. */
const TOC = [
  { id: 'dreamspell-tzolkin', label: dreamspellDocs.tzolkin.title },
  { id: 'dreamspell-seals', label: dreamspellDocs.seals.title },
  { id: 'dreamspell-tones', label: dreamspellDocs.tones.title },
  { id: 'dreamspell-wavespells', label: dreamspellDocs.wavespells.title },
  { id: 'dreamspell-oracle', label: dreamspellDocs.oracle.title },
  { id: 'dreamspell-castles', label: dreamspellDocs.castles.title },
  { id: 'dreamspell-portals', label: dreamspellDocs.portalDays.title },
  { id: 'dreamspell-practice', label: dreamspellDocs.practicalUse.title },
  { id: 'dreamspell-faq', label: 'Frequently Asked Questions' },
] as const

export const metadata: Metadata = {
  title: 'What is Dreamspell? Complete Guide to the Galactic Calendar',
  description: 'Complete guide to the Dreamspell system by Jose Arguelles: 260-day Tzolkin cycle, 20 Solar Seals, 13 Galactic Tones, Wavespells, Oracle, and the Five Castles. Free educational resource.',
  keywords: 'what is dreamspell, dreamspell guide, galactic signature, kin, solar seals, galactic tones, wavespell, mayan calendar, 13:20, jose arguelles, dreamspell explained',
  alternates: {
    canonical: '/learn/dreamspell',
  },
  openGraph: {
    title: 'What is Dreamspell? Complete Guide to the Galactic Calendar',
    description: 'Learn the Dreamspell system: 260 Kin, 20 Solar Seals, 13 Galactic Tones, and the Oracle. Free guide.',
    url: '/learn/dreamspell',
  },
}

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "What is Dreamspell? Complete Guide to the Galactic Calendar",
  "description": "Complete guide to the Dreamspell system by Jose Arguelles: 260-day Tzolkin cycle, 20 Solar Seals, 13 Galactic Tones, Wavespells, Oracle, and the Five Castles.",
  "author": { "@id": `${SITE_URL}/#organization` },
  "publisher": { "@id": `${SITE_URL}/#organization` },
  "datePublished": "2024-06-01",
  "dateModified": "2025-01-15",
  "keywords": ["dreamspell", "galactic signature", "solar seals", "galactic tones", "jose arguelles", "mayan calendar"],
  "mainEntityOfPage": `${SITE_URL}/learn/dreamspell`,
}

const courseSchema = {
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "Dreamspell: Complete Guide to the Galactic Calendar",
  "description": "Learn the Dreamspell system: 260 Kin, 20 Solar Seals, 13 Galactic Tones, Wavespells, Oracle, and the Five Castles.",
  "provider": { "@id": `${SITE_URL}/#organization` },
  "isAccessibleForFree": true,
  "url": `${SITE_URL}/learn/dreamspell`,
}

const breadcrumbSchema = buildBreadcrumbs([
  { name: 'Home', url: SITE_URL },
  { name: 'Learn', url: `${SITE_URL}/learn` },
  { name: 'Dreamspell', url: `${SITE_URL}/learn/dreamspell` },
])

const dreamspellFaqs = [
  {
    question: "How do I find my Dreamspell Kin?",
    answer: "Enter your birth date into the free Pleiad Dreamspell calculator. The calculator will show your Kin number (1-260), Solar Seal, Galactic Tone, and your complete Oracle. No birth time is required, only your date of birth.",
  },
  {
    question: "What are the 20 Solar Seals?",
    answer: "The 20 Solar Seals are the archetypal energies of the Dreamspell system: Dragon, Wind, Night, Seed, Serpent, World-Bridger, Hand, Star, Moon, Dog, Monkey, Human, Skywalker, Wizard, Eagle, Warrior, Earth, Mirror, Storm, and Sun. Each seal belongs to one of four color families (Red, White, Blue, Yellow) representing initiation, refinement, transformation, and ripening.",
  },
  {
    question: "What is the difference between Dreamspell and Tzolkin?",
    answer: "Dreamspell is Jose Arguelles' modern system (1987) synchronized to July 26 with leap-day skipping. The Traditional Tzolkin is the ancient Maya count using the GMT correlation, an unbroken count spanning over 2,500 years. They produce different Kin numbers for the same date. Pleiad calculates both systems.",
  },
  {
    question: "What is a Wavespell?",
    answer: "A Wavespell is a 13-day cycle in the Dreamspell system. There are 20 Wavespells in the 260-day Tzolkin. Each Wavespell begins with Tone 1 (Magnetic) and ends with Tone 13 (Cosmic), creating a complete journey from purpose to transcendence.",
  },
]

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": dreamspellFaqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer,
    },
  })),
}

// Seal color-family tints on the dark ground.
function getSealColorClasses(color: string) {
  switch (color) {
    case 'red': return { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400' }
    case 'white': return { bg: 'bg-white/5', border: 'border-white/20', text: 'text-white/80' }
    case 'blue': return { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' }
    case 'yellow': return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400' }
    default: return { bg: 'bg-white/5', border: 'border-white/10', text: 'text-white/70' }
  }
}

export default function DreamspellDocsPage() {
  return (
    <DocShell section="dreamspell" toc={TOC}>
      <JsonLd data={articleSchema} id="json-ld-article" />
      <JsonLd data={courseSchema} id="json-ld-course" />
      <JsonLd data={breadcrumbSchema} id="json-ld-breadcrumbs" />
      <JsonLd data={faqSchema} id="json-ld-faq" />

      {/* Header */}
      <DocHero
        section="dreamspell"
        title={dreamspellDocs.overview.title}
        subtitle={dreamspellDocs.overview.subtitle}
      />

      <QuickAnswer
        question="What is Dreamspell?"
        answer="Dreamspell is a modern calendar system created by Jose Arguelles in 1987, based on the ancient Maya Tzolkin. It maps a 260-day cycle of 20 Solar Seals and 13 Galactic Tones to reveal your galactic signature, a unique archetype describing your cosmic purpose. Enter your birth date in the Pleiad calculator to find your Kin, no birth time needed."
        accent={ACCENT}
        accentSoft={ACCENT_SOFT}
      />

      {/* Hunab Ku accent — chipped so the glyph never sits naked on the ground. */}
      <div className="mb-8 flex justify-center">
        <GlyphChip accent={ACCENT} className="p-4">
          <img src={getHunabKuPath()} alt="Hunab Ku" className="h-20 w-20 object-contain opacity-80" />
        </GlyphChip>
      </div>

      {/* Introduction */}
      <section className="mb-12">
        <DocProse content={dreamspellDocs.overview.introduction} />
      </section>

      {/* Pull Quote */}
      <DocPullQuote
        quote={dreamspellDocs.overview.quote.text}
        author={dreamspellDocs.overview.quote.author}
        accent={ACCENT}
      />

      {/* Quick Stats */}
      <DocStats
        stats={[
          { value: '260', label: 'Kin in Cycle' },
          { value: '20', label: 'Solar Seals' },
          { value: '13', label: 'Galactic Tones' },
          { value: '5', label: 'Castles' },
        ]}
        accentSoft={ACCENT_SOFT}
      />

      {/* 260-Day Tzolkin */}
      <DocSection id="dreamspell-tzolkin" title={dreamspellDocs.tzolkin.title}>
        <DocProse className="mb-8" content={dreamspellDocs.tzolkin.content} />

        <div className={`${CARD} p-6`}>
          <h4 className="mb-4 font-display text-lg text-white">Key Terms</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            {dreamspellDocs.tzolkin.structure.map((item) => (
              <div key={item.term} className="rounded-xl bg-surface-2 p-4">
                <div className="mb-1 font-medium text-white">{item.term}</div>
                <div className="text-sm leading-relaxed text-white/70">{item.definition}</div>
              </div>
            ))}
          </div>
        </div>
      </DocSection>

      {/* 20 Solar Seals */}
      <DocSection id="dreamspell-seals" title={dreamspellDocs.seals.title}>
        <DocProse className="mb-8" content={dreamspellDocs.seals.introduction} />

        {/* Color Families */}
        <DocH3 id="seals-colors">Color Families</DocH3>
        <div className="mb-10 grid gap-4 sm:grid-cols-2">
          {dreamspellDocs.seals.colorFamilies.map((family) => {
            const colors = getSealColorClasses(family.color.toLowerCase())
            return (
              <div
                key={family.color}
                className={`rounded-2xl border p-5 ${colors.border} ${colors.bg}`}
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className={`h-5 w-5 rounded-full ${
                    family.color === 'Red' ? 'bg-red-500' :
                    family.color === 'White' ? 'bg-slate-300' :
                    family.color === 'Blue' ? 'bg-blue-500' :
                    'bg-yellow-500'
                  }`} />
                  <span className="font-display text-lg text-white">{family.color}</span>
                  <span className="text-sm text-white/50">&bull; {family.direction}</span>
                </div>
                <p className="mb-3 text-sm leading-relaxed text-white/70">
                  <span className="font-medium text-white">{family.function}:</span> {family.description}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {family.seals.map((seal) => (
                    <span key={seal} className="rounded-md bg-white/5 px-2.5 py-1 text-xs text-white/50">
                      {seal}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* All 20 Seals Grid - with glyph images */}
        <DocH3 id="seals-list">The 20 Seals</DocH3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {SEALS.map((seal) => {
            const colors = getSealColorClasses(seal.color)
            return (
              <div
                key={seal.number}
                className={`rounded-2xl border p-4 text-center transition-colors ${colors.border} ${colors.bg}`}
              >
                <img
                  src={getSealGlyphPath(seal.number)}
                  alt={seal.english}
                  className="mx-auto mb-2 h-12 w-12 object-contain"
                />
                <div className={`mb-0.5 font-display text-lg ${colors.text}`}>{seal.number}</div>
                <div className="text-sm font-medium text-white">{seal.english}</div>
                <div className="mt-0.5 text-xs text-white/50">{seal.mayan}</div>
              </div>
            )
          })}
        </div>
      </DocSection>

      {/* 13 Galactic Tones - with tone images */}
      <DocSection id="dreamspell-tones" title={dreamspellDocs.tones.title}>
        <DocProse className="mb-8" content={dreamspellDocs.tones.introduction} />

        <div className="space-y-3">
          {TONES.map((tone) => {
            const toneDoc = dreamspellDocs.tones.toneDetails.find(t => t.number === tone.number)
            return (
              <div
                key={tone.number}
                className={`${CARD} flex items-start gap-5 p-5`}
              >
                <GlyphChip accent={ACCENT}>
                  <img
                    src={getToneGlyphPath(tone.number)}
                    alt={`Tone ${tone.number}`}
                    className="h-10 w-10 object-contain"
                  />
                </GlyphChip>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <span className="font-display text-lg text-white">{tone.name}</span>
                    <span className="font-mono text-xs" style={{ color: ACCENT_SOFT }}>Tone {tone.number}</span>
                  </div>
                  {toneDoc && (
                    <>
                      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/50">
                        <span><span className="font-medium text-white">Action:</span> {toneDoc.action}</span>
                        <span><span className="font-medium text-white">Power:</span> {toneDoc.power}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-white/70">{toneDoc.description}</p>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </DocSection>

      {/* Wavespells */}
      <DocSection id="dreamspell-wavespells" title={dreamspellDocs.wavespells.title}>
        <DocProse className="mb-8" content={dreamspellDocs.wavespells.content} />

        <div className={`${CARD} overflow-hidden`}>
          <div className="border-b border-white/10 px-6 py-4">
            <h4 className="font-display text-lg text-white">The 13-Day Journey</h4>
          </div>
          <div className="divide-y divide-white/10">
            {dreamspellDocs.wavespells.structure.map((day) => (
              <div key={day.day} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/5">
                <GlyphChip accent={ACCENT} className="p-1">
                  <img
                    src={getToneGlyphPath(day.day)}
                    alt={`Tone ${day.day}`}
                    className="h-7 w-7 object-contain"
                  />
                </GlyphChip>
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-white">{day.tone}</span>
                  <span className="text-white/50"> &bull; {day.phase}</span>
                </div>
                <div className="hidden max-w-[200px] text-right text-sm text-white/50 md:block">
                  {day.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DocSection>

      {/* The Oracle */}
      <DocSection id="dreamspell-oracle" title={dreamspellDocs.oracle.title}>
        <DocProse className="mb-8" content={dreamspellDocs.oracle.content} />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dreamspellDocs.oracle.positions.map((pos) => (
            <div
              key={pos.name}
              className={`${CARD} p-5`}
              style={{ borderLeftWidth: '4px', borderLeftColor: pos.color }}
            >
              <h4 className="mb-2 font-display text-lg" style={{ color: pos.color }}>
                {pos.name}
              </h4>
              <p className="mb-3 text-sm leading-relaxed text-white/70">{pos.description}</p>
              <div className="text-xs italic text-white/40">{pos.calculation}</div>
            </div>
          ))}
        </div>
      </DocSection>

      {/* Five Castles */}
      <DocSection id="dreamspell-castles" title={dreamspellDocs.castles.title}>
        <DocProse className="mb-8" content={dreamspellDocs.castles.content} />

        <div className="space-y-4">
          {dreamspellDocs.castles.castleDetails.map((castle) => (
            <div
              key={castle.name}
              className={`${CARD} p-6`}
              style={{ borderLeftWidth: '4px', borderLeftColor: castle.color }}
            >
              <div className="mb-3 flex items-start justify-between gap-4">
                <h4 className="font-display text-lg text-white">{castle.name}</h4>
                <span className="whitespace-nowrap rounded-full bg-white/5 px-3 py-1 text-sm text-white/50">
                  Days {castle.days}
                </span>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-white/70">
                <span className="font-medium text-white">{castle.function}:</span> {castle.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {castle.wavespells.map((ws) => (
                  <span key={ws} className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white/50">
                    {ws} Wavespell
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DocSection>

      {/* Portal Days */}
      <DocSection id="dreamspell-portals" title={dreamspellDocs.portalDays.title}>
        <DocInfoBox title="Galactic Activation Portals" accent={ACCENT} accentSoft={ACCENT_SOFT}>
          <DocProse variant="inherit" content={dreamspellDocs.portalDays.content} />
        </DocInfoBox>
      </DocSection>

      {/* Daily Practice */}
      <DocSection id="dreamspell-practice" title={dreamspellDocs.practicalUse.title}>
        <div className="space-y-4">
          {dreamspellDocs.practicalUse.tips.map((tip, i) => (
            <div key={i} className={`${CARD} p-5`}>
              <h4 className="mb-2 font-display text-lg text-white">{tip.title}</h4>
              <p className="text-sm leading-relaxed text-white/70">{tip.description}</p>
            </div>
          ))}
        </div>
      </DocSection>

      {/* FAQ */}
      <DocSection id="dreamspell-faq" title="Frequently Asked Questions">
        <div className="space-y-4">
          {dreamspellFaqs.map((faq, i) => (
            <div key={i} className={`${CARD} p-5`}>
              <h4 className="mb-2 font-display text-lg text-white">{faq.question}</h4>
              <p className="text-sm leading-relaxed text-white/70">{faq.answer}</p>
            </div>
          ))}
        </div>
      </DocSection>

      {/* CTA */}
      <DocCta
        title="Ready to Find Your Galactic Signature?"
        body="Calculate your personal Kin and discover your place in the cosmic pattern."
        primary={{ href: '/calculate', label: 'Start with your birthday' }}
        secondary={{ href: '/today', label: "See today's energy" }}
      />
    </DocShell>
  )
}
