import { Metadata } from 'next'
import Link from 'next/link'
import { Header, Footer } from '@/components/landing'
import { DocLayout, DocHero, DocSection, DocNav, DocStats, DocInfoBox, QuickAnswer } from '@/components/docs'
import { tzolkinDocs, docStructure } from '@/lib/docs/content'
import { JsonLd, SITE_URL, organizationSchema, buildBreadcrumbs } from '@/lib/seo/json-ld'

export const metadata: Metadata = {
  title: 'Traditional Mayan Tzolkin Calendar: 20 Nawales & Sacred Count',
  description: 'Learn the Traditional Tzolkin — the living Maya sacred calendar kept by daykeepers for over 2,500 years. Explore the 20 Nawales, 13 Numbers, and how it differs from Dreamspell.',
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
  "description": "Learn the Traditional Tzolkin — the living Maya sacred calendar kept by daykeepers for over 2,500 years.",
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
  "description": "Learn the Traditional Tzolkin — 20 Nawales, 13 Numbers, and 2,500+ years of living Maya tradition.",
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
    answer: "Nawales are the 20 day signs of the traditional Tzolkin calendar. Each Nawal carries specific energies and meanings — for example, Imix (Crocodile/Earth) represents the primordial source, while Ajaw (Lord/Sun) represents light and wisdom. Nawales are associated with the four cardinal directions and rotate in a fixed sequence.",
  },
  {
    question: "How old is the Mayan calendar?",
    answer: "The Tzolkin sacred calendar has been kept continuously for over 2,500 years. Archaeological evidence dates the earliest Tzolkin use to around 500-600 BCE. Unlike modern reconstructions, the traditional count has never been interrupted — Maya daykeepers (Aj Q'ijab') have maintained the exact day count through generations to the present day.",
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

// Direction colors
const directionColors: Record<string, { bg: string; text: string }> = {
  East: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400' },
  North: { bg: 'bg-slate-100 dark:bg-slate-800/30', text: 'text-slate-700 dark:text-slate-300' },
  West: { bg: 'bg-slate-900/10 dark:bg-slate-100/10', text: 'text-slate-900 dark:text-slate-100' },
  South: { bg: 'bg-yellow-500/10', text: 'text-yellow-600 dark:text-yellow-500' },
}

export default function TzolkinDocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <DocLayout
        sections={docStructure.sections}
        currentSection="tzolkin"
      >
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
        />

        {/* Introduction with drop cap */}
        <section className="mb-12">
          <p className="doc-dropcap text-muted-foreground leading-relaxed text-lg">
            {tzolkinDocs.overview.introduction.trim()}
          </p>
        </section>

        {/* Living Tradition Notice */}
        <section className="mb-12">
          <DocInfoBox variant="accent" title="Living Tradition">
            <p className="leading-relaxed">
              The Traditional Tzolkin is not a historical artifact—it is actively kept by Maya daykeepers today.
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
        />

        {/* Tzolkin vs Dreamspell */}
        <DocSection id="tz-differences" title={tzolkinDocs.differences.title}>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Understanding the differences between the traditional Tzolkin and Dreamspell helps appreciate both systems.
          </p>

          <div className="doc-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left py-4 px-5 font-heading text-foreground border-b border-border">Aspect</th>
                    <th className="text-left py-4 px-5 font-heading text-foreground border-b border-border">Traditional Tzolkin</th>
                    <th className="text-left py-4 px-5 font-heading text-foreground border-b border-border">Dreamspell</th>
                  </tr>
                </thead>
                <tbody>
                  {tzolkinDocs.differences.comparison.map((row, i) => (
                    <tr key={row.aspect} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                      <td className="py-4 px-5 font-medium text-foreground border-b border-border/50">{row.aspect}</td>
                      <td className="py-4 px-5 text-muted-foreground border-b border-border/50">{row.tzolkin}</td>
                      <td className="py-4 px-5 text-muted-foreground border-b border-border/50">{row.dreamspell}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </DocSection>

        {/* 20 Nawales */}
        <DocSection id="tz-nawales" title={tzolkinDocs.nawales.title}>
          <p className="text-muted-foreground leading-relaxed mb-8">
            {tzolkinDocs.nawales.introduction}
          </p>

          <div className="space-y-3">
            {tzolkinDocs.nawales.dayNames.map((nawal) => {
              const colors = directionColors[nawal.direction] || directionColors.East
              return (
                <div key={nawal.number} className="doc-card p-5">
                  <div className="flex items-start gap-5">
                    <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center text-xl font-heading ${colors.text} flex-shrink-0`}>
                      {nawal.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="font-heading text-lg text-foreground">{nawal.yucatec}</span>
                        <span className="text-muted-foreground">/ {nawal.kiche}</span>
                        <span className={`text-xs px-2.5 py-1 rounded-lg ${colors.bg} ${colors.text}`}>
                          {nawal.direction}
                        </span>
                      </div>
                      <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-2">{nawal.meaning}</div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{nawal.quality}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </DocSection>

        {/* 13 Numbers */}
        <DocSection id="tz-numbers" title={tzolkinDocs.thirteenNumbers.title}>
          <div className="doc-card p-6">
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {tzolkinDocs.thirteenNumbers.content.trim()}
            </p>
          </div>
        </DocSection>

        {/* Ceremonial Use */}
        <DocSection id="tz-ceremony" title={tzolkinDocs.ceremonialUse.title}>
          <div className="doc-card p-6">
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {tzolkinDocs.ceremonialUse.content.trim()}
            </p>
          </div>
        </DocSection>

        {/* Long Count & Calendar Round */}
        <DocSection id="tz-long-count" title="The Long Count & Calendar Round">
          <p className="text-muted-foreground leading-relaxed mb-6">
            The Tzolkin is one wheel in a larger Maya calendrical machine. The{' '}
            <strong className="text-foreground">Long Count</strong> tracks absolute time: a positional
            count of days since the era date (August 11, 3114 BCE in the GMT correlation), written as
            baktun.katun.tun.winal.kin — five places counting 144,000 / 7,200 / 360 / 20 / 1 days.
            It is the count carved on the great stelae, and the one that completed its 13th baktun
            in December 2012.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Alongside it runs the <strong className="text-foreground">Haab</strong>, the 365-day solar
            year of eighteen 20-day months plus the five days of Wayeb&apos;. The Tzolkin and Haab mesh
            like gears into the <strong className="text-foreground">Calendar Round</strong> — a 52-year
            cycle (18,980 days) after which the same Tzolkin day and Haab date pair recurs.
          </p>
          <DocInfoBox variant="primary" title="In Pleiad">
            <p className="leading-relaxed">
              Every profile&apos;s birth date is located in all of these counts: the traditional Tzolkin
              day, the Haab date, and the full Long Count — computed with the GMT correlation (584,283)
              and shown alongside the modern Dreamspell signature, so you can compare the counts for
              anyone on your map.
            </p>
          </DocInfoBox>
        </DocSection>

        {/* FAQ */}
        <DocSection id="tz-faq" title="Frequently Asked Questions">
          <div className="space-y-4">
            {tzolkinFaqs.map((faq, i) => (
              <div key={i} className="doc-card p-5">
                <h4 className="font-heading text-lg text-foreground mb-2">{faq.question}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </DocSection>

        {/* Cultural Respect Note */}
        <section className="mb-12">
          <DocInfoBox variant="secondary" title="Cultural Respect">
            <p className="leading-relaxed">
              The Tzolkin is a sacred, living tradition of the Maya peoples. While this documentation provides
              educational information, it cannot replace the depth of traditional teaching passed down through
              generations. If you feel called to work deeply with the Tzolkin, consider seeking out authentic
              Maya teachers and approaching this wisdom with humility and respect.
            </p>
          </DocInfoBox>
        </section>

        {/* CTA */}
        <section className="doc-card p-8 sm:p-10 text-center mt-16">
          <h3 className="text-2xl font-heading text-foreground mb-4">Explore Both Perspectives</h3>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Pleiad calculates both counts side by side — the traditional Tzolkin (GMT correlation)
            and the modern Dreamspell — for every person you chart. Understanding both traditions
            enriches your practice with deeper context.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/learn/dreamspell"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-600/90 transition-colors"
            >
              Explore Dreamspell
            </Link>
            <Link
              href="/learn/integration"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl border border-border hover:bg-muted/50 transition-colors"
            >
              System Integration
            </Link>
          </div>
        </section>

        {/* Navigation */}
        <DocNav
          prev={{ href: '/learn/gematria', title: 'Gematria' }}
          next={{ href: '/learn/integration', title: 'System Integration' }}
        />
      </DocLayout>

      <Footer />
    </div>
  )
}
