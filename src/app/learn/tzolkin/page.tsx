import { Metadata } from 'next'
import Link from 'next/link'
import { Header, Footer } from '@/components/landing'
import { DocLayout, DocHeader, DocSection, DocNav, DocStats, DocInfoBox } from '@/components/docs'
import { tzolkinDocs, docStructure } from '@/lib/docs/content'

export const metadata: Metadata = {
  title: 'Traditional Tzolkin Documentation',
  description: 'Learn about the Traditional Tzolkin - the living Maya calendar kept by daykeepers for over 2,500 years. Explore the 20 Nawales and 13 Numbers.',
  keywords: 'tzolkin, maya calendar, nawales, cholqij, traditional calendar, mayan daykeeper, indigenous wisdom',
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
        {/* Header */}
        <DocHeader
          badge="Traditional Tzolkin"
          title={tzolkinDocs.overview.title}
          subtitle={tzolkinDocs.overview.subtitle}
          badgeColor="accent"
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
            Omnis uses the Dreamspell system for daily calculations. Understanding both traditions
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
