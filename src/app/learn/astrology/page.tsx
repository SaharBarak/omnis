import { Metadata } from 'next'

import {
  CARD,
  DocCta,
  DocH3,
  DocHero,
  DocInfoBox,
  DocProse,
  DocSection,
  DocShell,
  DocStats,
  QuickAnswer,
} from '@/app/learn/_components/doc-shell'
import { COLORS } from '@/lib/design/landing-tokens'
import { SYSTEM_FLAVORS } from '@/lib/design/system-flavors'
import { astrologyDocs } from '@/lib/docs/content'
import { JsonLd, SITE_URL, buildBreadcrumbs } from '@/lib/seo/json-ld'

export const revalidate = 3600

const FLAVOR = SYSTEM_FLAVORS.astrology
const ACCENT = FLAVOR.accent
const ACCENT_SOFT = FLAVOR.accentSoft

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
  "description": "Learn Western Astrology: the Big Three, 12 Signs, Planets, Houses, and how to read a natal chart.",
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
    answer: "Your Sun sign represents your core identity and ego, who you are at your center. Your Moon sign reveals your emotional inner world and instincts. Your Rising sign (Ascendant) is the mask you wear and how others perceive you at first meeting. Together, these three form 'the Big Three', the foundation of your astrological profile.",
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

/** DocSection headings, in page order — feeds the DocShell table of contents. */
const TOC = [
  { id: 'astro-big-three', label: astrologyDocs.bigThree.title },
  { id: 'astro-signs', label: astrologyDocs.signs.title },
  { id: 'astro-planets', label: astrologyDocs.planets.title },
  { id: 'astro-houses', label: astrologyDocs.houses.title },
  { id: 'astro-aspects', label: astrologyDocs.aspects.title },
  { id: 'astro-interpretation', label: astrologyDocs.interpretation.title },
  { id: 'astro-faq', label: 'Frequently Asked Questions' },
] as const

// Aspect-nature tones from the design system's own tokens: the page's flavor
// accent for harmonious, the chrome brand violet for challenging, and neutral
// white steps for blending — no off-palette greens/reds.
const ASPECT_NATURE_TONES: Record<
  string,
  { border: string; chipBg: string; chipText: string }
> = {
  Harmonious: { border: ACCENT, chipBg: `${ACCENT}14`, chipText: ACCENT_SOFT },
  Challenging: {
    border: COLORS.brand,
    chipBg: `${COLORS.brand}14`,
    chipText: COLORS.brandSoft,
  },
}
const ASPECT_NATURE_NEUTRAL = {
  border: 'rgba(255,255,255,0.25)',
  chipBg: 'rgba(255,255,255,0.06)',
  chipText: 'rgba(255,255,255,0.6)',
}

// Element color utilities — dark-ground tints.
const elementColors: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  Fire: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', dot: 'bg-red-500' },
  Earth: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', dot: 'bg-green-500' },
  Air: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', dot: 'bg-cyan-500' },
  Water: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-500' },
}

export default function AstrologyDocsPage() {
  return (
    <DocShell section="astrology" toc={TOC}>
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
        accent={ACCENT}
        accentSoft={ACCENT_SOFT}
      />

      {/* Introduction */}
      <section className="mb-12">
        <DocProse content={astrologyDocs.overview.introduction} />
      </section>

      {/* Quick Stats */}
      <DocStats
        stats={[
          { value: '12', label: 'Zodiac Signs' },
          { value: '10', label: 'Planets' },
          { value: '12', label: 'Houses' },
          { value: '5', label: 'Major Aspects' },
        ]}
        accentSoft={ACCENT_SOFT}
      />

      {/* The Big Three */}
      <DocSection id="astro-big-three" title={astrologyDocs.bigThree.title}>
        <DocProse className="mb-8" content={astrologyDocs.bigThree.introduction} />

        <div className="space-y-4">
          {astrologyDocs.bigThree.placements.map((placement) => (
            <div
              key={placement.name}
              className={`${CARD} p-6`}
              style={{ borderLeftWidth: '4px', borderLeftColor: ACCENT }}
            >
              <h4 className="mb-2 font-display text-xl text-white">{placement.name}</h4>
              <div className="mb-2 text-sm font-medium" style={{ color: ACCENT_SOFT }}>
                {placement.represents}
              </div>
              <div className="mb-4 text-sm italic text-white/50">&quot;{placement.question}&quot;</div>
              <DocProse
                variant="inherit"
                className="leading-relaxed text-white/70"
                content={placement.description}
              />
            </div>
          ))}
        </div>
      </DocSection>

      {/* 12 Zodiac Signs */}
      <DocSection id="astro-signs" title={astrologyDocs.signs.title}>
        <DocProse className="mb-8" content={astrologyDocs.signs.introduction} />

        {/* Elements */}
        <DocH3>The Four Elements</DocH3>
        <div className="mb-10 grid gap-4 sm:grid-cols-2">
          {astrologyDocs.signs.elements.map((element) => {
            const colors = elementColors[element.name] || elementColors.Fire
            return (
              <div
                key={element.name}
                className={`rounded-2xl border p-5 ${colors.border} ${colors.bg}`}
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className={`h-4 w-4 rounded-full ${colors.dot}`} />
                  <span className={`font-display text-lg ${colors.text}`}>{element.name}</span>
                </div>
                <div className="mb-3 text-sm text-white/50">
                  {element.signs.join(' • ')}
                </div>
                <p className="mb-2 text-sm text-white/70">
                  <span className="font-medium text-white">Qualities:</span> {element.qualities}
                </p>
                <p className="text-sm text-white/70">
                  <span className="font-medium text-white">Shadow:</span> {element.shadow}
                </p>
              </div>
            )
          })}
        </div>

        {/* Modalities */}
        <DocH3>The Three Modalities</DocH3>
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {astrologyDocs.signs.modalities.map((modality) => (
            <div key={modality.name} className={`${CARD} p-5`}>
              <h4 className="mb-2 font-display text-lg text-white">{modality.name}</h4>
              <div className="mb-3 text-xs" style={{ color: ACCENT_SOFT }}>
                {modality.signs.join(' • ')}
              </div>
              <p className="text-sm text-white/70">{modality.quality}</p>
            </div>
          ))}
        </div>

        {/* All 12 Signs */}
        <DocH3>The 12 Signs</DocH3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {astrologyDocs.signs.signDetails.map((sign) => {
            const element = astrologyDocs.signs.elements.find(e => e.signs.includes(sign.sign))
            const colors = elementColors[element?.name || 'Fire']
            return (
              <div
                key={sign.sign}
                className={`rounded-2xl border p-4 transition-colors ${colors.border} ${colors.bg}`}
              >
                <div className="mb-2 flex items-center gap-2">
                  {/* U+FE0E forces text presentation so glyphs never render as emoji. */}
                  <span className="text-2xl">{sign.symbol}{'\uFE0E'}</span>
                  <span className={`font-medium ${colors.text}`}>{sign.sign}</span>
                </div>
                <div className="mb-2 text-xs text-white/50">{sign.dates}</div>
                <div className="text-xs text-white/40">Ruler: {sign.ruler}</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {sign.keywords.slice(0, 2).map((kw) => (
                    <span key={kw} className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-white/50">{kw}</span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </DocSection>

      {/* Planets */}
      <DocSection id="astro-planets" title={astrologyDocs.planets.title}>
        <DocProse className="mb-8" content={astrologyDocs.planets.introduction} />

        {/* Planet Categories */}
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {astrologyDocs.planets.categories.map((cat) => (
            <div key={cat.name} className="rounded-2xl border border-white/10 bg-surface-2 p-4">
              <div className="mb-1 font-display text-white">{cat.name}</div>
              <div className="mb-2 text-xs text-white/50">{cat.description}</div>
              <div className="text-xs font-medium" style={{ color: ACCENT_SOFT }}>
                {cat.planets.join(' • ')}
              </div>
            </div>
          ))}
        </div>

        {/* All Planets */}
        <div className="space-y-3">
          {astrologyDocs.planets.planetDetails.map((planet) => (
            <div key={planet.name} className={`${CARD} flex items-start gap-5 p-5`}>
              <div
                className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl text-3xl"
                style={{ backgroundColor: `${ACCENT}1A` }}
              >
                {/* U+FE0E forces text presentation so glyphs never render as emoji. */}
                {planet.symbol}{'\uFE0E'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <span className="font-display text-lg text-white">{planet.name}</span>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/50">Cycle: {planet.cycle}</span>
                </div>
                <p className="mb-3 text-sm leading-relaxed text-white/70">{planet.function}</p>
                <div className="flex flex-wrap gap-1.5">
                  {planet.keywords.map((kw) => (
                    <span key={kw} className="rounded-lg bg-white/5 px-2.5 py-1 text-xs text-white/50">{kw}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </DocSection>

      {/* Houses */}
      <DocSection id="astro-houses" title={astrologyDocs.houses.title}>
        <DocProse className="mb-8" content={astrologyDocs.houses.introduction} />

        <div className="grid gap-4 sm:grid-cols-2">
          {astrologyDocs.houses.houseDetails.map((house) => (
            <div key={house.number} className={`${CARD} p-5`}>
              <div className="mb-3 flex items-center gap-4">
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-display text-lg"
                  style={{ backgroundColor: `${ACCENT}1A`, color: ACCENT_SOFT }}
                >
                  {house.number}
                </div>
                <div>
                  <span className="font-display text-white">{house.name}</span>
                  <span className="ml-2 text-sm text-white/50">({house.sign})</span>
                </div>
              </div>
              <p className="mb-3 text-sm leading-relaxed text-white/70">{house.themes}</p>
              <div className="flex flex-wrap gap-1.5">
                {house.keywords.map((kw) => (
                  <span key={kw} className="rounded-lg bg-white/5 px-2 py-0.5 text-xs text-white/50">{kw}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DocSection>

      {/* Aspects */}
      <DocSection id="astro-aspects" title={astrologyDocs.aspects.title}>
        <DocProse className="mb-8" content={astrologyDocs.aspects.introduction} />

        <DocH3>Major Aspects</DocH3>
        <div className="mb-10 space-y-4">
          {astrologyDocs.aspects.majorAspects.map((aspect) => {
            const tone = ASPECT_NATURE_TONES[aspect.nature] ?? ASPECT_NATURE_NEUTRAL
            return (
            <div
              key={aspect.name}
              className={`${CARD} p-5`}
              style={{ borderLeftWidth: '4px', borderLeftColor: tone.border }}
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  {/* U+FE0E forces text presentation so glyphs never render as emoji. */}
                  <span className="text-2xl">{aspect.symbol}{'\uFE0E'}</span>
                  <span className="font-display text-lg text-white">{aspect.name}</span>
                  <span className="text-sm text-white/50">({aspect.angle})</span>
                </div>
                <span
                  className="rounded-full px-3 py-1 text-xs"
                  style={{ backgroundColor: tone.chipBg, color: tone.chipText }}
                >
                  {aspect.nature}
                </span>
              </div>
              <p className="mb-2 text-sm leading-relaxed text-white/70">{aspect.description}</p>
              <div className="font-mono text-xs text-white/40">Orb: {aspect.orb}</div>
            </div>
            )
          })}
        </div>

        <DocH3>Minor Aspects</DocH3>
        <div className="grid gap-3 sm:grid-cols-2">
          {astrologyDocs.aspects.minorAspects.map((aspect) => (
            <div key={aspect.name} className="rounded-2xl border border-white/10 bg-surface-2 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-white">{aspect.name}</span>
                <span className="font-mono text-xs text-white/40">{aspect.angle}</span>
              </div>
              <p className="text-sm text-white/70">{aspect.description}</p>
            </div>
          ))}
        </div>
      </DocSection>

      {/* Chart Interpretation */}
      <DocSection id="astro-interpretation" title={astrologyDocs.interpretation.title}>
        <div className={`${CARD} p-6`}>
          <h4 className="mb-6 font-display text-lg text-white">Steps to Read Your Chart</h4>
          <div className="space-y-4">
            {astrologyDocs.interpretation.steps.map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-display text-sm"
                  style={{ backgroundColor: `${ACCENT}1A`, color: ACCENT_SOFT }}
                >
                  {item.step}
                </div>
                <div className="pt-1">
                  <div className="mb-1 font-medium text-white">{item.title}</div>
                  <p className="text-sm leading-relaxed text-white/70">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DocSection>

      {/* Birth Time Info Box */}
      <section className="mb-12">
        <DocInfoBox title="Birth Time Matters" accent={ACCENT} accentSoft={ACCENT_SOFT}>
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
            <div key={i} className={`${CARD} p-5`}>
              <h4 className="mb-2 font-display text-lg text-white">{faq.question}</h4>
              <p className="text-sm leading-relaxed text-white/70">{faq.answer}</p>
            </div>
          ))}
        </div>
      </DocSection>

      {/* CTA */}
      <DocCta
        title="Explore Your Chart"
        body="Enter your birth data to see your natal chart with all planetary placements."
        primary={{ href: '/calculate', label: 'Start with your birthday' }}
        secondary={{ href: '/learn/gematria', label: 'Explore Kabbalah' }}
      />
    </DocShell>
  )
}
