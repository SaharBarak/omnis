import { Metadata } from 'next'
import Link from 'next/link'
import { Header, Footer } from '@/components/landing'
import { DocLayout, DocHero, DocSection, DocNav, DocStats, DocInfoBox, DocPullQuote, QuickAnswer } from '@/components/docs'
import { dreamspellDocs, docStructure } from '@/lib/docs/content'
import { SEALS } from '@/lib/data/seals'
import { TONES } from '@/lib/data/tones'
import { getSealGlyphPath, getToneGlyphPath, getHunabKuPath } from '@/lib/dreamspell-assets'
import { JsonLd, SITE_URL, organizationSchema, buildBreadcrumbs } from '@/lib/seo/json-ld'

export const metadata: Metadata = {
  title: 'What is Dreamspell? Complete Guide to the Galactic Calendar',
  description: 'Complete guide to the Dreamspell system by Jose Arguelles: 260-day Tzolkin cycle, 20 Solar Seals, 13 Galactic Tones, Wavespells, Oracle, and the Five Castles. Free educational resource.',
  keywords: 'what is dreamspell, dreamspell guide, galactic signature, kin, solar seals, galactic tones, wavespell, mayan calendar, 13:20, jose arguelles, dreamspell explained',
  alternates: {
    canonical: 'https://omnis.app/learn/dreamspell',
  },
  openGraph: {
    title: 'What is Dreamspell? Complete Guide to the Galactic Calendar',
    description: 'Learn the Dreamspell system: 260 Kin, 20 Solar Seals, 13 Galactic Tones, and the Oracle. Free guide.',
    url: 'https://omnis.app/learn/dreamspell',
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
  "description": "Learn the Dreamspell system — 260 Kin, 20 Solar Seals, 13 Galactic Tones, Wavespells, Oracle, and the Five Castles.",
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
    answer: "Enter your birth date into the Omnis Dreamspell calculator at omnis.app/calculate. The calculator will show your Kin number (1-260), Solar Seal, Galactic Tone, and your complete Oracle. No birth time is required — only your date of birth.",
  },
  {
    question: "What are the 20 Solar Seals?",
    answer: "The 20 Solar Seals are the archetypal energies of the Dreamspell system: Dragon, Wind, Night, Seed, Serpent, World-Bridger, Hand, Star, Moon, Dog, Monkey, Human, Skywalker, Wizard, Eagle, Warrior, Earth, Mirror, Storm, and Sun. Each seal belongs to one of four color families (Red, White, Blue, Yellow) representing initiation, refinement, transformation, and ripening.",
  },
  {
    question: "What is the difference between Dreamspell and Tzolkin?",
    answer: "Dreamspell is Jose Arguelles' modern system (1987) synchronized to July 26 with leap-day skipping. The Traditional Tzolkin is the ancient Maya count using the GMT correlation — an unbroken count spanning over 2,500 years. They produce different Kin numbers for the same date. Omnis calculates both systems.",
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

// Color utilities
function getSealColorClasses(color: string) {
  switch (color) {
    case 'red': return { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-600 dark:text-red-400' }
    case 'white': return { bg: 'bg-slate-100/50 dark:bg-slate-800/30', border: 'border-slate-300/30', text: 'text-slate-700 dark:text-slate-300' }
    case 'blue': return { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-600 dark:text-blue-400' }
    case 'yellow': return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-600 dark:text-yellow-500' }
    default: return { bg: 'bg-muted', border: 'border-border', text: 'text-foreground' }
  }
}

export default function DreamspellDocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <DocLayout
        sections={docStructure.sections}
        currentSection="dreamspell"
      >
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
          answer="Dreamspell is a modern calendar system created by Jose Arguelles in 1987, based on the ancient Maya Tzolkin. It maps a 260-day cycle of 20 Solar Seals and 13 Galactic Tones to reveal your galactic signature — a unique archetype describing your cosmic purpose. Enter your birth date at omnis.app/calculate to find your Kin."
        />

        {/* Hunab Ku accent */}
        <div className="flex justify-center mb-8">
          <img src={getHunabKuPath()} alt="Hunab Ku" className="w-24 h-24 opacity-60" />
        </div>

        {/* Introduction with drop cap */}
        <section className="mb-12">
          <p className="doc-dropcap text-muted-foreground leading-relaxed text-lg">
            {dreamspellDocs.overview.introduction.trim()}
          </p>
        </section>

        {/* Pull Quote */}
        <DocPullQuote
          quote={dreamspellDocs.overview.quote.text}
          author={dreamspellDocs.overview.quote.author}
        />

        {/* Quick Stats */}
        <DocStats
          stats={[
            { value: '260', label: 'Kin in Cycle' },
            { value: '20', label: 'Solar Seals' },
            { value: '13', label: 'Galactic Tones' },
            { value: '5', label: 'Castles' },
          ]}
        />

        {/* 260-Day Tzolkin */}
        <DocSection id="dreamspell-tzolkin" title={dreamspellDocs.tzolkin.title}>
          <p className="text-muted-foreground leading-relaxed mb-8">
            {dreamspellDocs.tzolkin.content.trim()}
          </p>

          <div className="doc-card">
            <div className="doc-card-header">
              <h4 className="font-heading text-lg text-foreground">Key Terms</h4>
            </div>
            <div className="doc-card-body">
              <div className="grid sm:grid-cols-2 gap-4">
                {dreamspellDocs.tzolkin.structure.map((item) => (
                  <div key={item.term} className="p-4 rounded-xl bg-muted/30">
                    <div className="font-medium text-foreground mb-1">{item.term}</div>
                    <div className="text-sm text-muted-foreground leading-relaxed">{item.definition}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DocSection>

        {/* 20 Solar Seals */}
        <DocSection id="dreamspell-seals" title={dreamspellDocs.seals.title}>
          <p className="text-muted-foreground leading-relaxed mb-8">
            {dreamspellDocs.seals.introduction}
          </p>

          {/* Color Families */}
          <h3 id="seals-colors" className="doc-h3">Color Families</h3>
          <div className="grid sm:grid-cols-2 gap-4 mb-10">
            {dreamspellDocs.seals.colorFamilies.map((family) => {
              const colors = getSealColorClasses(family.color.toLowerCase())
              return (
                <div
                  key={family.color}
                  className={`p-5 rounded-xl border ${colors.border} ${colors.bg}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-5 h-5 rounded-full ${
                      family.color === 'Red' ? 'bg-red-500' :
                      family.color === 'White' ? 'bg-slate-200 dark:bg-slate-400' :
                      family.color === 'Blue' ? 'bg-blue-500' :
                      'bg-yellow-500'
                    }`} />
                    <span className="font-heading text-lg text-foreground">{family.color}</span>
                    <span className="text-sm text-muted-foreground">&bull; {family.direction}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                    <span className="font-medium text-foreground">{family.function}:</span> {family.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {family.seals.map((seal) => (
                      <span key={seal} className="text-xs px-2.5 py-1 rounded-md bg-background/60 text-muted-foreground">
                        {seal}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* All 20 Seals Grid - with glyph images */}
          <h3 id="seals-list" className="doc-h3">The 20 Seals</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {SEALS.map((seal) => {
              const colors = getSealColorClasses(seal.color)
              return (
                <div
                  key={seal.number}
                  className={`p-4 rounded-xl border text-center transition-all hover:shadow-earth ${colors.border} ${colors.bg}`}
                >
                  <img
                    src={getSealGlyphPath(seal.number)}
                    alt={seal.english}
                    className="w-12 h-12 mx-auto mb-2 object-contain"
                  />
                  <div className={`text-lg font-heading mb-0.5 ${colors.text}`}>{seal.number}</div>
                  <div className="text-sm font-medium text-foreground">{seal.english}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{seal.hebrew}</div>
                </div>
              )
            })}
          </div>
        </DocSection>

        {/* 13 Galactic Tones - with tone images */}
        <DocSection id="dreamspell-tones" title={dreamspellDocs.tones.title}>
          <p className="text-muted-foreground leading-relaxed mb-8">
            {dreamspellDocs.tones.introduction}
          </p>

          <div className="space-y-3">
            {TONES.map((tone) => {
              const toneDoc = dreamspellDocs.tones.toneDetails.find(t => t.number === tone.number)
              return (
                <div
                  key={tone.number}
                  className="doc-card p-5 flex items-start gap-5"
                >
                  <img
                    src={getToneGlyphPath(tone.number)}
                    alt={`Tone ${tone.number}`}
                    className="w-12 h-12 object-contain flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <span className="font-heading text-lg text-foreground">{tone.name}</span>
                      <span className="text-sm text-muted-foreground">({tone.nameHebrew})</span>
                      <span className="text-xs font-mono text-primary">Tone {tone.number}</span>
                    </div>
                    {toneDoc && (
                      <>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-2">
                          <span><span className="font-medium text-foreground">Action:</span> {toneDoc.action}</span>
                          <span><span className="font-medium text-foreground">Power:</span> {toneDoc.power}</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{toneDoc.description}</p>
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
          <p className="text-muted-foreground leading-relaxed mb-8">
            {dreamspellDocs.wavespells.content.trim()}
          </p>

          <div className="doc-card">
            <div className="doc-card-header">
              <h4 className="font-heading text-lg text-foreground">The 13-Day Journey</h4>
            </div>
            <div className="doc-card-body p-0">
              <div className="divide-y divide-border">
                {dreamspellDocs.wavespells.structure.map((day) => (
                  <div key={day.day} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                    <img
                      src={getToneGlyphPath(day.day)}
                      alt={`Tone ${day.day}`}
                      className="w-8 h-8 object-contain flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-foreground">{day.tone}</span>
                      <span className="text-muted-foreground"> &bull; {day.phase}</span>
                    </div>
                    <div className="text-sm text-muted-foreground hidden md:block max-w-[200px] text-right">
                      {day.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DocSection>

        {/* The Oracle */}
        <DocSection id="dreamspell-oracle" title={dreamspellDocs.oracle.title}>
          <p className="text-muted-foreground leading-relaxed mb-8">
            {dreamspellDocs.oracle.content}
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dreamspellDocs.oracle.positions.map((pos) => (
              <div
                key={pos.name}
                className="doc-card p-5"
                style={{ borderLeftWidth: '4px', borderLeftColor: pos.color }}
              >
                <h4 className="font-heading text-lg mb-2" style={{ color: pos.color }}>
                  {pos.name}
                </h4>
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{pos.description}</p>
                <div className="text-xs text-muted-foreground/70 italic">{pos.calculation}</div>
              </div>
            ))}
          </div>
        </DocSection>

        {/* Five Castles */}
        <DocSection id="dreamspell-castles" title={dreamspellDocs.castles.title}>
          <p className="text-muted-foreground leading-relaxed mb-8">
            {dreamspellDocs.castles.content}
          </p>

          <div className="space-y-4">
            {dreamspellDocs.castles.castleDetails.map((castle) => (
              <div
                key={castle.name}
                className="doc-card p-6"
                style={{ borderLeftWidth: '4px', borderLeftColor: castle.color }}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h4 className="font-heading text-lg text-foreground">{castle.name}</h4>
                  <span className="text-sm text-muted-foreground whitespace-nowrap px-3 py-1 rounded-full bg-muted/50">
                    Days {castle.days}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  <span className="font-medium text-foreground">{castle.function}:</span> {castle.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {castle.wavespells.map((ws) => (
                    <span key={ws} className="text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground">
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
          <DocInfoBox variant="primary" title="Galactic Activation Portals">
            <p className="leading-relaxed">
              {dreamspellDocs.portalDays.content.trim()}
            </p>
          </DocInfoBox>
        </DocSection>

        {/* Daily Practice */}
        <DocSection id="dreamspell-practice" title={dreamspellDocs.practicalUse.title}>
          <div className="space-y-4">
            {dreamspellDocs.practicalUse.tips.map((tip, i) => (
              <div key={i} className="doc-card p-5">
                <h4 className="font-heading text-lg text-foreground mb-2">{tip.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{tip.description}</p>
              </div>
            ))}
          </div>
        </DocSection>

        {/* FAQ */}
        <DocSection id="dreamspell-faq" title="Frequently Asked Questions">
          <div className="space-y-4">
            {dreamspellFaqs.map((faq, i) => (
              <div key={i} className="doc-card p-5">
                <h4 className="font-heading text-lg text-foreground mb-2">{faq.question}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </DocSection>

        {/* CTA */}
        <section className="doc-card p-8 sm:p-10 text-center mt-16">
          <h3 className="text-2xl font-heading text-foreground mb-4">Ready to Find Your Galactic Signature?</h3>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Calculate your personal Kin and discover your place in the cosmic pattern.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/calculate"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Calculate Your Kin
            </Link>
            <Link
              href="/today"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl border border-border hover:bg-muted/50 transition-colors"
            >
              See Today&apos;s Energy
            </Link>
          </div>
        </section>

        {/* Navigation */}
        <DocNav
          next={{ href: '/learn/human-design', title: 'Human Design' }}
        />
      </DocLayout>

      <Footer />
    </div>
  )
}
