import { Metadata } from 'next'

import {
  CARD,
  DocCta,
  DocHero,
  DocInfoBox,
  DocProse,
  DocSection,
  DocShell,
  DocStats,
  QuickAnswer,
} from '@/app/learn/_components/doc-shell'
import { SYSTEM_FLAVORS } from '@/lib/design/system-flavors'
import { tzolkinDocs } from '@/lib/docs/content'
import { JsonLd, SITE_URL, buildBreadcrumbs } from '@/lib/seo/json-ld'

export const revalidate = 3600

const FLAVOR = SYSTEM_FLAVORS.tzolkin
const ACCENT = FLAVOR.accent
const ACCENT_SOFT = FLAVOR.accentSoft

/** DocSection headings, in page order — feeds the DocShell table of contents. */
const TOC = [
  { id: 'tz-differences', label: tzolkinDocs.differences.title },
  { id: 'tz-nawales', label: tzolkinDocs.nawales.title },
  { id: 'tz-numbers', label: tzolkinDocs.thirteenNumbers.title },
  { id: 'tz-ceremony', label: tzolkinDocs.ceremonialUse.title },
  { id: 'tz-long-count', label: 'The Long Count & Calendar Round' },
  { id: 'tz-faq', label: 'Frequently Asked Questions' },
] as const

export const metadata: Metadata = {
  title: 'Traditional Mayan Tzolkin Calendar: 20 Nawales & Sacred Count',
  description: 'Learn the Traditional Tzolkin: the living Maya sacred calendar kept by daykeepers for over 2,500 years. Explore the 20 Nawales, 13 Numbers, and how it differs from Dreamspell.',
  keywords: 'tzolkin, mayan calendar, maya calendar, nawales, cholqij, traditional calendar, mayan daykeeper, indigenous wisdom, what is the tzolkin, how old is the mayan calendar',
  alternates: {
    canonical: '/learn/tzolkin',
  },
  openGraph: {
    title: 'Traditional Mayan Tzolkin Calendar: 20 Nawales & Sacred Count',
    description: 'Explore the living Maya Tzolkin calendar: 20 Nawales, 13 Numbers, and 2,500+ years of tradition.',
    url: '/learn/tzolkin',
  },
}

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Traditional Mayan Tzolkin Calendar: 20 Nawales & Sacred Count",
  "description": "Learn the Traditional Tzolkin: the living Maya sacred calendar kept by daykeepers for over 2,500 years.",
  "author": { "@id": `${SITE_URL}/#organization` },
  "publisher": { "@id": `${SITE_URL}/#organization` },
  "datePublished": "2024-06-01",
  "dateModified": "2025-01-15",
  "keywords": ["tzolkin", "mayan calendar", "nawales", "cholqij", "maya daykeeper", "sacred calendar"],
  "mainEntityOfPage": `${SITE_URL}/learn/tzolkin`,
}

const courseSchema = {
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "Traditional Mayan Tzolkin Calendar: 20 Nawales & Sacred Count",
  "description": "Learn the Traditional Tzolkin: 20 Nawales, 13 Numbers, and 2,500+ years of living Maya tradition.",
  "provider": { "@id": `${SITE_URL}/#organization` },
  "isAccessibleForFree": true,
  "url": `${SITE_URL}/learn/tzolkin`,
}

const breadcrumbSchema = buildBreadcrumbs([
  { name: 'Home', url: SITE_URL },
  { name: 'Learn', url: `${SITE_URL}/learn` },
  { name: 'Tzolkin', url: `${SITE_URL}/learn/tzolkin` },
])

const tzolkinFaqs = [
  {
    question: "What is the Tzolkin?",
    answer: "The Tzolkin (Cholq'ij in K'iche' Maya) is the 260-day sacred calendar of the Maya civilization. It combines 20 day signs (Nawales) with 13 numbers to create a cycle of 260 unique days. Unlike the Dreamspell, the Tzolkin is an unbroken count maintained by Maya daykeepers for over 2,500 years and is still actively used today.",
  },
  {
    question: "What are Nawales?",
    answer: "Nawales are the 20 day signs of the traditional Tzolkin calendar. Each Nawal carries specific energies and meanings: for example, Imix (Crocodile/Earth) represents the primordial source, while Ajaw (Lord/Sun) represents light and wisdom. Nawales are associated with the four cardinal directions and rotate in a fixed sequence.",
  },
  {
    question: "How old is the Mayan calendar?",
    answer: "The Tzolkin sacred calendar has been kept continuously for over 2,500 years. Archaeological evidence dates the earliest Tzolkin use to around 500-600 BCE. Unlike modern reconstructions, the traditional count has never been interrupted: Maya daykeepers (Aj Q'ijab') have maintained the exact day count through generations to the present day.",
  },
]

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": tzolkinFaqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer,
    },
  })),
}

// Direction colors — dark-ground tints.
const directionColors: Record<string, { bg: string; text: string }> = {
  East: { bg: 'bg-red-500/10', text: 'text-red-400' },
  North: { bg: 'bg-white/10', text: 'text-white/80' },
  West: { bg: 'bg-white/5', text: 'text-white' },
  South: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
}

export default function TzolkinDocsPage() {
  return (
    <DocShell section="tzolkin" toc={TOC}>
      <JsonLd data={articleSchema} id="json-ld-article" />
      <JsonLd data={courseSchema} id="json-ld-course" />
      <JsonLd data={breadcrumbSchema} id="json-ld-breadcrumbs" />
      <JsonLd data={faqSchema} id="json-ld-faq" />

      {/* Header */}
      <DocHero
        section="tzolkin"
        title={tzolkinDocs.overview.title}
        subtitle={tzolkinDocs.overview.subtitle}
      />

      <QuickAnswer
        question="What is the Tzolkin?"
        answer="The Tzolkin is the 260-day sacred calendar of the Maya civilization, combining 20 day signs (Nawales) with 13 numbers. It has been kept continuously by Maya daykeepers for over 2,500 years and is still actively used in Guatemala and southern Mexico today. Unlike the modern Dreamspell system, the Tzolkin is an unbroken traditional count."
        accent={ACCENT}
        accentSoft={ACCENT_SOFT}
      />

      {/* Introduction */}
      <section className="mb-12">
        <DocProse content={tzolkinDocs.overview.introduction} />
      </section>

      {/* Living Tradition Notice */}
      <section className="mb-12">
        <DocInfoBox title="Living Tradition" accent={ACCENT} accentSoft={ACCENT_SOFT}>
          <p className="leading-relaxed">
            The Traditional Tzolkin is not a historical artifact: it is actively kept by Maya daykeepers today.
            This documentation is educational and respectful of the living tradition. For authentic guidance,
            seek out Maya elders and Aj Q&apos;ijab&apos; (daykeepers).
          </p>
        </DocInfoBox>
      </section>

      {/* Quick Stats */}
      <DocStats
        stats={[
          { value: '260', label: 'Day Cycle' },
          { value: '20', label: 'Nawales' },
          { value: '13', label: 'Numbers' },
          { value: '2,500+', label: 'Years Kept' },
        ]}
        accentSoft={ACCENT_SOFT}
      />

      {/* Tzolkin vs Dreamspell */}
      <DocSection id="tz-differences" title={tzolkinDocs.differences.title}>
        <p className="mb-8 text-lg leading-relaxed text-white/70">
          Understanding the differences between the traditional Tzolkin and Dreamspell helps appreciate both systems.
        </p>

        <div className={`${CARD} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] text-sm">
              <thead>
                <tr className="bg-white/5">
                  <th className="border-b border-white/10 px-5 py-4 text-left font-display text-white">Aspect</th>
                  <th className="border-b border-white/10 px-5 py-4 text-left font-display text-white">Traditional Tzolkin</th>
                  <th className="border-b border-white/10 px-5 py-4 text-left font-display text-white">Dreamspell</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {tzolkinDocs.differences.comparison.map((row, i) => (
                  <tr key={row.aspect} className={i % 2 === 0 ? '' : 'bg-white/[0.02]'}>
                    <td className="px-5 py-4 font-medium text-white">{row.aspect}</td>
                    <td className="px-5 py-4 text-white/70">{row.tzolkin}</td>
                    <td className="px-5 py-4 text-white/70">{row.dreamspell}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </DocSection>

      {/* 20 Nawales */}
      <DocSection id="tz-nawales" title={tzolkinDocs.nawales.title}>
        <DocProse className="mb-8" content={tzolkinDocs.nawales.introduction} />

        <div className="space-y-3">
          {tzolkinDocs.nawales.dayNames.map((nawal) => {
            const colors = directionColors[nawal.direction] || directionColors.East
            return (
              <div key={nawal.number} className={`${CARD} p-5`}>
                <div className="flex items-start gap-5">
                  <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl font-display text-xl ${colors.bg} ${colors.text}`}>
                    {nawal.number}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <span className="font-display text-lg text-white">{nawal.yucatec}</span>
                      <span className="text-white/50">/ {nawal.kiche}</span>
                      <span className={`rounded-lg px-2.5 py-1 text-xs ${colors.bg} ${colors.text}`}>
                        {nawal.direction}
                      </span>
                    </div>
                    <div className="mb-2 text-sm font-medium" style={{ color: ACCENT_SOFT }}>{nawal.meaning}</div>
                    <p className="text-sm leading-relaxed text-white/70">{nawal.quality}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </DocSection>

      {/* 13 Numbers */}
      <DocSection id="tz-numbers" title={tzolkinDocs.thirteenNumbers.title}>
        <div className={`${CARD} p-6`}>
          <p className="whitespace-pre-line leading-relaxed text-white/70">
            {tzolkinDocs.thirteenNumbers.content.trim()}
          </p>
        </div>
      </DocSection>

      {/* Ceremonial Use */}
      <DocSection id="tz-ceremony" title={tzolkinDocs.ceremonialUse.title}>
        <div className={`${CARD} p-6`}>
          <DocProse
            variant="inherit"
            className="leading-relaxed text-white/70"
            content={tzolkinDocs.ceremonialUse.content}
          />
        </div>
      </DocSection>

      {/* Long Count & Calendar Round */}
      <DocSection id="tz-long-count" title="The Long Count & Calendar Round">
        <p className="mb-6 text-lg leading-relaxed text-white/70">
          The Tzolkin is one wheel in a larger Maya calendrical machine. The{' '}
          <strong className="text-white">Long Count</strong> tracks absolute time: a positional
          count of days since the era date (August 11, 3114 BCE in the GMT correlation), written as
          baktun.katun.tun.winal.kin, five places counting 144,000 / 7,200 / 360 / 20 / 1 days.
          It is the count carved on the great stelae, and the one that completed its 13th baktun
          in December 2012.
        </p>
        <p className="mb-8 text-lg leading-relaxed text-white/70">
          Alongside it runs the <strong className="text-white">Haab</strong>, the 365-day solar
          year of eighteen 20-day months plus the five days of Wayeb&apos;. The Tzolkin and Haab mesh
          like gears into the <strong className="text-white">Calendar Round</strong>, a 52-year
          cycle (18,980 days) after which the same Tzolkin day and Haab date pair recurs.
        </p>
        <DocInfoBox title="In Pleiad" accent={ACCENT} accentSoft={ACCENT_SOFT}>
          <p className="leading-relaxed">
            Every profile&apos;s birth date is located in all of these counts: the traditional Tzolkin
            day, the Haab date, and the full Long Count, computed with the GMT correlation (584,283)
            and shown alongside the modern Dreamspell signature, so you can compare the counts for
            anyone on your map.
          </p>
        </DocInfoBox>
      </DocSection>

      {/* FAQ */}
      <DocSection id="tz-faq" title="Frequently Asked Questions">
        <div className="space-y-4">
          {tzolkinFaqs.map((faq, i) => (
            <div key={i} className={`${CARD} p-5`}>
              <h4 className="mb-2 font-display text-lg text-white">{faq.question}</h4>
              <p className="text-sm leading-relaxed text-white/70">{faq.answer}</p>
            </div>
          ))}
        </div>
      </DocSection>

      {/* Cultural Respect Note */}
      <section className="mb-12">
        <DocInfoBox title="Cultural Respect" accent={ACCENT} accentSoft={ACCENT_SOFT}>
          <p className="leading-relaxed">
            The Tzolkin is a sacred, living tradition of the Maya peoples. While this documentation provides
            educational information, it cannot replace the depth of traditional teaching passed down through
            generations. If you feel called to work deeply with the Tzolkin, consider seeking out authentic
            Maya teachers and approaching this wisdom with humility and respect.
          </p>
        </DocInfoBox>
      </section>

      {/* CTA */}
      <DocCta
        title="Explore Both Perspectives"
        body="Pleiad calculates both counts side by side, the traditional Tzolkin (GMT correlation) and the modern Dreamspell, for every person you chart. Understanding both traditions enriches your practice with deeper context."
        primary={{ href: '/learn/dreamspell', label: 'Explore Dreamspell' }}
        secondary={{ href: '/learn/integration', label: 'How the systems integrate' }}
      />
    </DocShell>
  )
}
