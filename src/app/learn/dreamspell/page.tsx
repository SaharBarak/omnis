import { Metadata } from 'next'
import Link from 'next/link'
import { Header, Footer } from '@/components/landing'
import { DocLayout, DocHeader, DocSection, DocNav, DocStats, DocInfoBox, DocPullQuote } from '@/components/docs'
import { dreamspellDocs, docStructure } from '@/lib/docs/content'
import { SEALS } from '@/lib/data/seals'
import { TONES } from '@/lib/data/tones'

export const metadata: Metadata = {
  title: 'Dreamspell Documentation',
  description: 'Complete guide to the Dreamspell system: 260 Kin cycle, 20 Solar Seals, 13 Galactic Tones, Wavespells, Oracle, and the Five Castles.',
  keywords: 'dreamspell guide, galactic signature, kin, solar seals, galactic tones, wavespell, mayan calendar, 13:20, josé argüelles',
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
        {/* Header */}
        <DocHeader
          badge="Dreamspell"
          title={dreamspellDocs.overview.title}
          subtitle={dreamspellDocs.overview.subtitle}
          badgeColor="primary"
        />

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
                    <span className="text-sm text-muted-foreground">• {family.direction}</span>
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

          {/* All 20 Seals Grid */}
          <h3 id="seals-list" className="doc-h3">The 20 Seals</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {SEALS.map((seal) => {
              const colors = getSealColorClasses(seal.color)
              return (
                <div
                  key={seal.number}
                  className={`p-4 rounded-xl border text-center transition-all hover:shadow-earth ${colors.border} ${colors.bg}`}
                >
                  <div className={`text-2xl font-heading mb-1 ${colors.text}`}>{seal.number}</div>
                  <div className="text-sm font-medium text-foreground">{seal.english}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{seal.hebrew}</div>
                </div>
              )
            })}
          </div>
        </DocSection>

        {/* 13 Galactic Tones */}
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
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center font-heading text-xl text-primary flex-shrink-0">
                    {tone.number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <span className="font-heading text-lg text-foreground">{tone.name}</span>
                      <span className="text-sm text-muted-foreground">({tone.nameHebrew})</span>
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
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary flex-shrink-0">
                      {day.day}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-foreground">{day.tone}</span>
                      <span className="text-muted-foreground"> • {day.phase}</span>
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
