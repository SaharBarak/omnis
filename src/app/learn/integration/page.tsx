import { Metadata } from 'next'
import Link from 'next/link'
import { Header, Footer } from '@/components/landing'
import { DocLayout, DocHero, DocSection, DocNav, DocInfoBox, DocPullQuote, QuickAnswer } from '@/components/docs'
import { integrationDocs, docStructure } from '@/lib/docs/content'
import { JsonLd, SITE_URL, organizationSchema, buildBreadcrumbs } from '@/lib/seo/json-ld'

export const metadata: Metadata = {
  title: 'How Dreamspell, Human Design & Astrology Connect: Integration Guide',
  description: 'Discover how Dreamspell, Human Design, Astrology, Kabbalah, and Tzolkin work together. Find correspondences between systems and build a unified daily practice.',
  keywords: 'system integration, dreamspell astrology connection, human design comparison, can I use multiple systems, how do wisdom systems connect, symbolic systems, holistic wisdom',
  alternates: {
    canonical: 'https://omnis.app/learn/integration',
  },
  openGraph: {
    title: 'How Dreamspell, Human Design & Astrology Connect: Integration Guide',
    description: 'Discover how five ancient wisdom systems connect and complement each other.',
    url: 'https://omnis.app/learn/integration',
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
    answer: "Yes — that is exactly what Omnis is designed for. Dreamspell, Human Design, Astrology, Kabbalah, and Tzolkin each illuminate different aspects of who you are. Rather than competing, they complement each other: Dreamspell reveals your timing and synchronicity, Human Design shows your strategy and authority, Astrology maps your psychological depth, and Kabbalah connects you to sacred tradition.",
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

// System colors for the five lenses
const systemColors: Record<string, { bg: string; text: string; icon: string }> = {
  Dreamspell: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', icon: '🌀' },
  'Human Design': { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', icon: '◇' },
  Astrology: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', icon: '☉' },
  Gematria: { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', icon: 'א' },
}

export default function IntegrationDocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <DocLayout
        sections={docStructure.sections}
        currentSection="integration"
      >
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
          answer="Yes. Each system illuminates a different facet of who you are: Dreamspell reveals your timing and cosmic purpose, Human Design shows your decision-making strategy and energy type, Astrology maps your psychological depth and life transits, and Kabbalah connects you to sacred numerology. When multiple systems agree on a theme, it signals a core quality in your design. Omnis calculates all five systems from a single birth date."
        />

        {/* Introduction with drop cap */}
        <section className="mb-12">
          <p className="doc-dropcap text-muted-foreground leading-relaxed text-lg">
            {integrationDocs.introduction.trim()}
          </p>
        </section>

        {/* Pull Quote */}
        <DocPullQuote
          quote="We are the universe knowing itself through time."
          author="The shared insight of all these systems"
        />

        {/* The Five Lenses Visual */}
        <section className="mb-16">
          <div className="doc-card p-8">
            <h3 className="text-center font-heading text-xl text-foreground mb-8">The Five Lenses</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <Link href="/learn/dreamspell" className="flex flex-col items-center gap-3 p-5 rounded-xl hover:bg-muted/50 transition-all hover:shadow-earth group">
                <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-7 h-7 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="12" cy="12" r="8" opacity="0.5" />
                  </svg>
                </div>
                <span className="font-heading text-foreground group-hover:text-primary transition-colors">Dreamspell</span>
                <span className="text-xs text-muted-foreground text-center">Timing & Synchronicity</span>
              </Link>
              <Link href="/learn/human-design" className="flex flex-col items-center gap-3 p-5 rounded-xl hover:bg-muted/50 transition-all hover:shadow-earth group">
                <div className="w-14 h-14 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-7 h-7 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="5" r="2" />
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 7v2M8 20l4-5 4 5" />
                  </svg>
                </div>
                <span className="font-heading text-foreground group-hover:text-primary transition-colors">Human Design</span>
                <span className="text-xs text-muted-foreground text-center">Strategy & Authority</span>
              </Link>
              <Link href="/learn/astrology" className="flex flex-col items-center gap-3 p-5 rounded-xl hover:bg-muted/50 transition-all hover:shadow-earth group">
                <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-7 h-7 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                  </svg>
                </div>
                <span className="font-heading text-foreground group-hover:text-primary transition-colors">Astrology</span>
                <span className="text-xs text-muted-foreground text-center">Depth & Timing</span>
              </Link>
              <Link href="/learn/gematria" className="flex flex-col items-center gap-3 p-5 rounded-xl hover:bg-muted/50 transition-all hover:shadow-earth group">
                <div className="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center">
                  <span className="text-2xl font-serif text-indigo-600 dark:text-indigo-400">א</span>
                </div>
                <span className="font-heading text-foreground group-hover:text-primary transition-colors">Gematria</span>
                <span className="text-xs text-muted-foreground text-center">Name & Number</span>
              </Link>
              <Link href="/learn/tzolkin" className="flex flex-col items-center gap-3 p-5 rounded-xl hover:bg-muted/50 transition-all hover:shadow-earth group col-span-2 sm:col-span-1">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-7 h-7 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                    <path d="M4 9h16M9 4v16" />
                  </svg>
                </div>
                <span className="font-heading text-foreground group-hover:text-primary transition-colors">Tzolkin</span>
                <span className="text-xs text-muted-foreground text-center">Living Tradition</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Points of Correspondence */}
        <DocSection id="int-correspondences" title={integrationDocs.correspondences.title}>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Each theme in human experience can be viewed through multiple symbolic lenses. Here are key areas where the systems offer parallel insights.
          </p>

          <div className="space-y-6">
            {integrationDocs.correspondences.connections.map((connection) => (
              <div key={connection.theme} className="doc-card overflow-hidden">
                <div className="bg-muted/50 px-6 py-4 border-b border-border">
                  <h4 className="font-heading text-lg text-foreground">{connection.theme}</h4>
                </div>
                <div className="p-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {connection.systems.map((item) => {
                      const colors = systemColors[item.system] || systemColors.Astrology
                      return (
                        <div key={item.system} className="flex items-start gap-4">
                          <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
                            item.system === 'Astrology' ? 'bg-amber-500' :
                            item.system === 'Dreamspell' ? 'bg-red-500' :
                            item.system === 'Human Design' ? 'bg-purple-500' :
                            'bg-indigo-500'
                          }`} />
                          <div>
                            <div className={`text-sm font-medium ${colors.text}`}>{item.system}</div>
                            <div className="text-sm text-muted-foreground">{item.concept}</div>
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
          <p className="text-muted-foreground leading-relaxed mb-8">
            Beyond specific correspondences, all these systems share a fundamental understanding:
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="doc-card p-6" style={{ borderLeftWidth: '4px', borderLeftColor: '#E94E77' }}>
              <h4 className="font-heading text-lg text-foreground mb-3">Time is Not Linear</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Astrology maps planetary cycles, Dreamspell encodes galactic time, Tzolkin tracks sacred day counts.
                Each system reveals that time has quality, not just quantity.
              </p>
            </div>
            <div className="doc-card p-6" style={{ borderLeftWidth: '4px', borderLeftColor: '#8B5CF6' }}>
              <h4 className="font-heading text-lg text-foreground mb-3">You Are Encoded</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your birth moment captured a unique configuration. Human Design calls it imprinting, Astrology calls it the natal chart.
                You carry cosmic information in your being.
              </p>
            </div>
            <div className="doc-card p-6" style={{ borderLeftWidth: '4px', borderLeftColor: '#6366F1' }}>
              <h4 className="font-heading text-lg text-foreground mb-3">Language Creates Reality</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Gematria reveals meaning in Hebrew letters, Dreamspell speaks of plasma and kin.
                The words we use shape what we can perceive.
              </p>
            </div>
            <div className="doc-card p-6" style={{ borderLeftWidth: '4px', borderLeftColor: '#F59E0B' }}>
              <h4 className="font-heading text-lg text-foreground mb-3">Maps Are Not Territory</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                No system captures the full mystery of who you are. Each offers a useful map.
                The terrain is your lived experience.
              </p>
            </div>
          </div>
        </DocSection>

        {/* Practical Integration */}
        <DocSection id="int-practice" title={integrationDocs.practicalIntegration.title}>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Working with multiple systems can be enriching or overwhelming. Here are guidelines for meaningful integration:
          </p>

          <div className="space-y-3">
            {integrationDocs.practicalIntegration.guidelines.map((guideline, index) => (
              <div key={index} className="doc-card p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-heading text-primary flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-muted-foreground pt-2 leading-relaxed">{guideline}</p>
              </div>
            ))}
          </div>
        </DocSection>

        {/* Agreement vs Divergence */}
        <DocSection id="int-agreement" title="When Systems Agree & Diverge">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="doc-card p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <h4 className="font-heading text-lg text-foreground">When They Agree</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                When multiple systems point to the same theme, pay attention. This suggests a strongly emphasized quality in your design.
              </p>
              <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                <p className="text-sm text-muted-foreground italic leading-relaxed">
                  Example: If your Astrology shows strong Mercury, you&apos;re a Communicator type in Human Design, and your Dreamspell seal is White Wind—communication is clearly central to your path.
                </p>
              </div>
            </div>

            <div className="doc-card p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 12h8M12 8v8" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </div>
                <h4 className="font-heading text-lg text-foreground">When They Diverge</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Apparent contradictions often reveal complexity. You are multidimensional—different systems may illuminate different facets.
              </p>
              <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
                <p className="text-sm text-muted-foreground italic leading-relaxed">
                  Example: If Astrology shows you as introverted (Cancer Sun) but Human Design shows you as a Projector waiting to be recognized, the interplay reveals how your inner nature meets your outer strategy.
                </p>
              </div>
            </div>
          </div>
        </DocSection>

        {/* Daily Practice */}
        <DocSection id="int-daily" title="A Daily Integration Practice">
          <p className="text-muted-foreground leading-relaxed mb-8">
            Here&apos;s a simple way to work with multiple systems daily:
          </p>

          <div className="doc-card p-6">
            <div className="space-y-5">
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-2xl flex-shrink-0">
                  ☀️
                </div>
                <div>
                  <div className="font-heading text-foreground mb-1">Morning: Set the Day</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Check your Dreamspell kin for today&apos;s energy. Note the wavespell theme. Set an intention aligned with this frequency.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center text-2xl flex-shrink-0">
                  🌙
                </div>
                <div>
                  <div className="font-heading text-foreground mb-1">Throughout: Trust Your Strategy</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Use your Human Design strategy and authority for decisions. Generators: respond. Projectors: wait for invitations. Manifestors: inform.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-2xl flex-shrink-0">
                  ✨
                </div>
                <div>
                  <div className="font-heading text-foreground mb-1">Weekly: Observe Transits</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Note significant astrological transits affecting your chart. Moon phases, Mercury retrograde, and outer planet movements all shape the collective field.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-2xl flex-shrink-0">
                  📖
                </div>
                <div>
                  <div className="font-heading text-foreground mb-1">Ongoing: Contemplate Your Name</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    If you have a Hebrew name, meditate on its gematria value. What words share your number? What connections emerge?
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DocSection>

        {/* FAQ */}
        <DocSection id="int-faq" title="Frequently Asked Questions">
          <div className="space-y-4">
            {integrationFaqs.map((faq, i) => (
              <div key={i} className="doc-card p-5">
                <h4 className="font-heading text-lg text-foreground mb-2">{faq.question}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </DocSection>

        {/* Omnis Info Box */}
        <section className="mb-12">
          <DocInfoBox variant="secondary" title="Omnis Does This For You">
            <p className="leading-relaxed">
              This is why Omnis exists—to calculate your data across all systems and surface the patterns,
              so you can focus on living your design rather than computing it. Enter your birth data once,
              and let the synthesis emerge.
            </p>
          </DocInfoBox>
        </section>

        {/* CTA */}
        <section className="doc-card p-8 sm:p-10 text-center mt-16">
          <h3 className="text-2xl font-heading text-foreground mb-4">See Your Full Picture</h3>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Enter your birth data to receive your unified reading across all systems.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Get Your Reading
            </Link>
            <Link
              href="/learn"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl border border-border hover:bg-muted/50 transition-colors"
            >
              Explore All Guides
            </Link>
          </div>
        </section>

        {/* Navigation */}
        <DocNav
          prev={{ href: '/learn/tzolkin', title: 'Traditional Tzolkin' }}
        />
      </DocLayout>

      <Footer />
    </div>
  )
}
