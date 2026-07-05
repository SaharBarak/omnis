import { Metadata } from 'next'
import Link from 'next/link'
import { Header, Footer } from '@/components/landing'
import { DocLayout, DocHero, DocSection, DocNav, DocStats, DocInfoBox, DocPullQuote, QuickAnswer } from '@/components/docs'
import { astrologyDocs, docStructure } from '@/lib/docs/content'
import { JsonLd, SITE_URL, organizationSchema, buildBreadcrumbs } from '@/lib/seo/json-ld'

export const metadata: Metadata = {
  title: 'Western Astrology Guide: Zodiac Signs, Planets, Houses & Aspects',
  description: 'Complete guide to Western Astrology: the Big Three (Sun, Moon, Rising), all 12 Zodiac Signs, 10 Planets, 12 Houses, and major Aspects. Learn to read your natal chart.',
  keywords: 'astrology guide, zodiac signs, natal chart, planets, houses, aspects, sun sign, moon sign, rising sign, horoscope, what is a natal chart, birth chart reading',
  alternates: {
    canonical: '/learn/astrology',
  },
  openGraph: {
    title: 'Western Astrology Guide: Zodiac Signs, Planets, Houses & Aspects',
    description: 'Learn Western Astrology: 12 Zodiac Signs, Planets, Houses, and Aspects. Free comprehensive guide.',
    url: '/learn/astrology',
  },
}

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Western Astrology Guide: Zodiac Signs, Planets, Houses & Aspects",
  "description": "Complete guide to Western Astrology: the Big Three, all 12 Zodiac Signs, 10 Planets, 12 Houses, and major Aspects.",
  "author": { "@id": `${SITE_URL}/#organization` },
  "publisher": { "@id": `${SITE_URL}/#organization` },
  "datePublished": "2024-06-01",
  "dateModified": "2025-01-15",
  "keywords": ["astrology", "zodiac signs", "natal chart", "planets", "houses", "aspects", "sun moon rising"],
  "mainEntityOfPage": `${SITE_URL}/learn/astrology`,
}

const courseSchema = {
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "Western Astrology: Zodiac Signs, Planets, Houses & Aspects",
  "description": "Learn Western Astrology — the Big Three, 12 Signs, Planets, Houses, and how to read a natal chart.",
  "provider": { "@id": `${SITE_URL}/#organization` },
  "isAccessibleForFree": true,
  "url": `${SITE_URL}/learn/astrology`,
}

const breadcrumbSchema = buildBreadcrumbs([
  { name: 'Home', url: SITE_URL },
  { name: 'Learn', url: `${SITE_URL}/learn` },
  { name: 'Astrology', url: `${SITE_URL}/learn/astrology` },
])

const astrologyFaqs = [
  {
    question: "What is a natal chart?",
    answer: "A natal chart (birth chart) is a map of the sky at the exact moment and place of your birth. It shows the positions of the Sun, Moon, and planets across the 12 zodiac signs and 12 houses. Your natal chart reveals personality traits, life themes, challenges, and potential. You need your birth date, time, and location to generate an accurate chart.",
  },
  {
    question: "What are Sun, Moon, and Rising signs?",
    answer: "Your Sun sign represents your core identity and ego — who you are at your center. Your Moon sign reveals your emotional inner world and instincts. Your Rising sign (Ascendant) is the mask you wear and how others perceive you at first meeting. Together, these three form 'the Big Three' — the foundation of your astrological profile.",
  },
  {
    question: "How many zodiac signs are there?",
    answer: "There are 12 zodiac signs in Western Astrology: Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, and Pisces. They are grouped into four elements (Fire, Earth, Air, Water) and three modalities (Cardinal, Fixed, Mutable).",
  },
]

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": astrologyFaqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer,
    },
  })),
}

// Element color utilities
const elementColors: Record<string, { bg: string; border: string; text: string }> = {
  Fire: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-600 dark:text-red-400' },
  Earth: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-600 dark:text-green-400' },
  Air: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-600 dark:text-cyan-400' },
  Water: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-600 dark:text-blue-400' },
}

export default function AstrologyDocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <DocLayout
        sections={docStructure.sections}
        currentSection="astrology"
      >
        <JsonLd data={articleSchema} id="json-ld-article" />
        <JsonLd data={courseSchema} id="json-ld-course" />
        <JsonLd data={breadcrumbSchema} id="json-ld-breadcrumbs" />
        <JsonLd data={faqSchema} id="json-ld-faq" />

        {/* Header */}
        <DocHero
          section="astrology"
          title={astrologyDocs.overview.title}
          subtitle={astrologyDocs.overview.subtitle}
        />

        <QuickAnswer
          question="What is Western Astrology?"
          answer="Western Astrology is the study of how planetary positions at the time of your birth influence your personality and life path. Your natal chart maps the Sun, Moon, and 8 planets across 12 zodiac signs and 12 houses, revealing your core identity (Sun sign), emotional nature (Moon sign), and outward persona (Rising sign). No birth time? You can still analyze your planetary signs and aspects."
        />

        {/* Introduction with drop cap */}
        <section className="mb-12">
          <p className="doc-dropcap text-muted-foreground leading-relaxed text-lg">
            {astrologyDocs.overview.introduction.trim()}
          </p>
        </section>

        {/* Quick Stats */}
        <DocStats
          stats={[
            { value: '12', label: 'Zodiac Signs' },
            { value: '10', label: 'Planets' },
            { value: '12', label: 'Houses' },
            { value: '5', label: 'Major Aspects' },
          ]}
        />

        {/* The Big Three */}
        <DocSection id="astro-big-three" title={astrologyDocs.bigThree.title}>
          <p className="text-muted-foreground leading-relaxed mb-8">
            {astrologyDocs.bigThree.introduction}
          </p>

          <div className="space-y-4">
            {astrologyDocs.bigThree.placements.map((placement) => (
              <div
                key={placement.name}
                className="doc-card p-6"
                style={{ borderLeftWidth: '4px', borderLeftColor: '#f59e0b' }}
              >
                <h4 className="font-heading text-xl text-foreground mb-2">{placement.name}</h4>
                <div className="text-sm text-amber-600 dark:text-amber-400 font-medium mb-2">{placement.represents}</div>
                <div className="text-sm text-muted-foreground italic mb-4">&quot;{placement.question}&quot;</div>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {placement.description.trim()}
                </p>
              </div>
            ))}
          </div>
        </DocSection>

        {/* 12 Zodiac Signs */}
        <DocSection id="astro-signs" title={astrologyDocs.signs.title}>
          <p className="text-muted-foreground leading-relaxed mb-8">
            {astrologyDocs.signs.introduction}
          </p>

          {/* Elements */}
          <h3 className="doc-h3">The Four Elements</h3>
          <div className="grid sm:grid-cols-2 gap-4 mb-10">
            {astrologyDocs.signs.elements.map((element) => {
              const colors = elementColors[element.name] || elementColors.Fire
              return (
                <div
                  key={element.name}
                  className={`p-5 rounded-xl border ${colors.border} ${colors.bg}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-4 h-4 rounded-full ${
                      element.name === 'Fire' ? 'bg-red-500' :
                      element.name === 'Earth' ? 'bg-green-500' :
                      element.name === 'Air' ? 'bg-cyan-500' :
                      'bg-blue-500'
                    }`} />
                    <span className={`font-heading text-lg ${colors.text}`}>{element.name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    {element.signs.join(' • ')}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    <span className="font-medium text-foreground">Qualities:</span> {element.qualities}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Shadow:</span> {element.shadow}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Modalities */}
          <h3 className="doc-h3">The Three Modalities</h3>
          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            {astrologyDocs.signs.modalities.map((modality) => (
              <div key={modality.name} className="doc-card p-5">
                <h4 className="font-heading text-lg text-foreground mb-2">{modality.name}</h4>
                <div className="text-xs text-amber-600 dark:text-amber-400 mb-3">
                  {modality.signs.join(' • ')}
                </div>
                <p className="text-sm text-muted-foreground">{modality.quality}</p>
              </div>
            ))}
          </div>

          {/* All 12 Signs */}
          <h3 className="doc-h3">The 12 Signs</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {astrologyDocs.signs.signDetails.map((sign) => {
              const element = astrologyDocs.signs.elements.find(e => e.signs.includes(sign.sign))
              const colors = elementColors[element?.name || 'Fire']
              return (
                <div
                  key={sign.sign}
                  className={`p-4 rounded-xl border transition-all hover:shadow-earth ${colors.border} ${colors.bg}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{sign.symbol}</span>
                    <span className={`font-medium ${colors.text}`}>{sign.sign}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">{sign.dates}</div>
                  <div className="text-xs text-muted-foreground/80">Ruler: {sign.ruler}</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {sign.keywords.slice(0, 2).map((kw) => (
                      <span key={kw} className="text-xs px-1.5 py-0.5 rounded bg-background/60 text-muted-foreground">{kw}</span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </DocSection>

        {/* Planets */}
        <DocSection id="astro-planets" title={astrologyDocs.planets.title}>
          <p className="text-muted-foreground leading-relaxed mb-8">
            {astrologyDocs.planets.introduction}
          </p>

          {/* Planet Categories */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {astrologyDocs.planets.categories.map((cat) => (
              <div key={cat.name} className="p-4 rounded-xl bg-muted/30 border border-border">
                <div className="font-heading text-foreground mb-1">{cat.name}</div>
                <div className="text-xs text-muted-foreground mb-2">{cat.description}</div>
                <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">{cat.planets.join(' • ')}</div>
              </div>
            ))}
          </div>

          {/* All Planets */}
          <div className="space-y-3">
            {astrologyDocs.planets.planetDetails.map((planet) => (
              <div key={planet.name} className="doc-card p-5 flex items-start gap-5">
                <div className="w-14 h-14 rounded-xl bg-amber-500/10 flex items-center justify-center text-3xl flex-shrink-0">
                  {planet.symbol}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <span className="font-heading text-lg text-foreground">{planet.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Cycle: {planet.cycle}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{planet.function}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {planet.keywords.map((kw) => (
                      <span key={kw} className="text-xs px-2.5 py-1 rounded-lg bg-muted text-muted-foreground">{kw}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DocSection>

        {/* Houses */}
        <DocSection id="astro-houses" title={astrologyDocs.houses.title}>
          <p className="text-muted-foreground leading-relaxed mb-8">
            {astrologyDocs.houses.introduction}
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            {astrologyDocs.houses.houseDetails.map((house) => (
              <div key={house.number} className="doc-card p-5">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-lg font-heading text-amber-600 dark:text-amber-400 flex-shrink-0">
                    {house.number}
                  </div>
                  <div>
                    <span className="font-heading text-foreground">{house.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">({house.sign})</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{house.themes}</p>
                <div className="flex flex-wrap gap-1.5">
                  {house.keywords.map((kw) => (
                    <span key={kw} className="text-xs px-2 py-0.5 rounded-lg bg-muted text-muted-foreground">{kw}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DocSection>

        {/* Aspects */}
        <DocSection id="astro-aspects" title={astrologyDocs.aspects.title}>
          <p className="text-muted-foreground leading-relaxed mb-8">
            {astrologyDocs.aspects.introduction}
          </p>

          <h3 className="doc-h3">Major Aspects</h3>
          <div className="space-y-4 mb-10">
            {astrologyDocs.aspects.majorAspects.map((aspect) => (
              <div
                key={aspect.name}
                className="doc-card p-5"
                style={{
                  borderLeftWidth: '4px',
                  borderLeftColor: aspect.nature === 'Harmonious' ? '#22c55e' :
                                   aspect.nature === 'Challenging' ? '#ef4444' : '#eab308'
                }}
              >
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{aspect.symbol}</span>
                    <span className="font-heading text-lg text-foreground">{aspect.name}</span>
                    <span className="text-sm text-muted-foreground">({aspect.angle})</span>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full ${
                    aspect.nature === 'Harmonious' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                    aspect.nature === 'Challenging' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                    'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {aspect.nature}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2 leading-relaxed">{aspect.description}</p>
                <div className="text-xs text-muted-foreground/70">Orb: {aspect.orb}</div>
              </div>
            ))}
          </div>

          <h3 className="doc-h3">Minor Aspects</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {astrologyDocs.aspects.minorAspects.map((aspect) => (
              <div key={aspect.name} className="p-4 rounded-xl bg-muted/30 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-foreground">{aspect.name}</span>
                  <span className="text-xs text-muted-foreground">{aspect.angle}</span>
                </div>
                <p className="text-sm text-muted-foreground">{aspect.description}</p>
              </div>
            ))}
          </div>
        </DocSection>

        {/* Chart Interpretation */}
        <DocSection id="astro-interpretation" title={astrologyDocs.interpretation.title}>
          <div className="doc-card p-6">
            <h4 className="font-heading text-lg text-foreground mb-6">Steps to Read Your Chart</h4>
            <div className="space-y-4">
              {astrologyDocs.interpretation.steps.map((item) => (
                <div key={item.step} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-sm font-heading text-amber-600 dark:text-amber-400 flex-shrink-0">
                    {item.step}
                  </div>
                  <div className="pt-1">
                    <div className="font-medium text-foreground mb-1">{item.title}</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DocSection>

        {/* Birth Time Info Box */}
        <section className="mb-12">
          <DocInfoBox variant="accent" title="Birth Time Matters">
            <p className="leading-relaxed">
              Your Rising sign and house placements require accurate birth time. Without it, you can still
              analyze planetary signs and aspects, but the chart will be incomplete. For the most accurate
              reading, get your birth time from your birth certificate.
            </p>
          </DocInfoBox>
        </section>

        {/* FAQ */}
        <DocSection id="astro-faq" title="Frequently Asked Questions">
          <div className="space-y-4">
            {astrologyFaqs.map((faq, i) => (
              <div key={i} className="doc-card p-5">
                <h4 className="font-heading text-lg text-foreground mb-2">{faq.question}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </DocSection>

        {/* CTA */}
        <section className="doc-card p-8 sm:p-10 text-center mt-16">
          <h3 className="text-2xl font-heading text-foreground mb-4">Explore Your Chart</h3>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Create your profile to see your natal chart with all planetary placements.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-amber-600 text-white font-medium hover:bg-amber-600/90 transition-colors"
            >
              View Your Chart
            </Link>
            <Link
              href="/learn/gematria"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl border border-border hover:bg-muted/50 transition-colors"
            >
              Explore Gematria
            </Link>
          </div>
        </section>

        {/* Navigation */}
        <DocNav
          prev={{ href: '/learn/human-design', title: 'Human Design' }}
          next={{ href: '/learn/gematria', title: 'Gematria' }}
        />
      </DocLayout>

      <Footer />
    </div>
  )
}
