import { Metadata } from 'next'
import Link from 'next/link'
import { Header, Footer } from '@/components/landing'
import { DocLayout, DocHeader, DocSection, DocNav, DocStats, DocInfoBox, DocPullQuote } from '@/components/docs'
import { gematriaDocs, docStructure } from '@/lib/docs/content'

export const metadata: Metadata = {
  title: 'Gematria Documentation',
  description: 'Complete guide to Gematria: Hebrew letter numerology, calculation methods, significant numbers, and Kabbalistic context.',
  keywords: 'gematria guide, hebrew numerology, kabbalah, hebrew letters, mispar, jewish mysticism, name analysis',
}

export default function GematriaDocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <DocLayout
        sections={docStructure.sections}
        currentSection="gematria"
      >
        {/* Header */}
        <DocHeader
          badge="Gematria"
          title={gematriaDocs.overview.title}
          subtitle={gematriaDocs.overview.subtitle}
          badgeColor="primary"
        />

        {/* Introduction */}
        <section className="mb-12">
          <p className="doc-dropcap text-muted-foreground leading-relaxed text-lg">
            {gematriaDocs.overview.introduction.trim()}
          </p>
        </section>

        {/* Quick Stats */}
        <DocStats
          stats={[
            { value: '22', label: 'Hebrew Letters' },
            { value: '5', label: 'Final Forms' },
            { value: '7+', label: 'Methods' },
            { value: '∞', label: 'Connections' },
          ]}
        />

        {/* 22 Hebrew Letters */}
        <DocSection id="gem-letters" title={gematriaDocs.hebrewAlphabet.title}>
          <p className="text-muted-foreground leading-relaxed mb-8">
            {gematriaDocs.hebrewAlphabet.introduction.trim()}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
            {gematriaDocs.hebrewAlphabet.letters.map((item) => (
              <div key={item.name} className="doc-card p-4 hover:shadow-earth transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl font-serif">{item.letter}</span>
                  <span className="text-lg font-heading text-indigo-600 dark:text-indigo-400">{item.value}</span>
                </div>
                <div className="text-sm font-medium text-foreground">{item.name}</div>
                <div className="text-xs text-muted-foreground">{item.meaning}</div>
                {item.element && (
                  <div className="text-xs text-secondary mt-1">Element: {item.element}</div>
                )}
                {item.planet && (
                  <div className="text-xs text-secondary mt-1">Planet: {item.planet}</div>
                )}
              </div>
            ))}
          </div>

          {/* Final Forms */}
          <h3 className="doc-h3">Final Letter Forms (Sofit)</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Five letters have special forms when they appear at the end of a word.
          </p>
          <div className="flex flex-wrap gap-3">
            {gematriaDocs.hebrewAlphabet.finalForms.map((item) => (
              <div key={item.name} className="px-4 py-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
                <span className="text-2xl font-serif mr-3">{item.letter}</span>
                <span className="text-sm text-muted-foreground">{item.name}</span>
                <span className="text-sm text-indigo-600 dark:text-indigo-400 ml-2">= {item.value}</span>
              </div>
            ))}
          </div>
        </DocSection>

        {/* Calculation Methods */}
        <DocSection id="gem-methods" title={gematriaDocs.methods.title}>
          <p className="text-muted-foreground leading-relaxed mb-8">
            {gematriaDocs.methods.introduction}
          </p>

          <div className="space-y-4">
            {gematriaDocs.methods.methodDetails.map((method) => (
              <div key={method.name} className="doc-card p-5">
                <h4 className="font-heading text-lg text-foreground mb-2">{method.name}</h4>
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{method.description}</p>
                <div className="p-3 rounded-lg bg-muted/50 font-mono text-sm text-muted-foreground mb-2">
                  {method.example}
                </div>
                <div className="text-xs text-secondary">Use: {method.use}</div>
              </div>
            ))}
          </div>
        </DocSection>

        {/* Significant Numbers */}
        <DocSection id="gem-numbers" title={gematriaDocs.significantNumbers.title}>
          <div className="grid sm:grid-cols-2 gap-4">
            {gematriaDocs.significantNumbers.numbers.map((item) => (
              <div
                key={item.value}
                className="doc-card p-5"
                style={{ borderLeftWidth: '4px', borderLeftColor: '#6366f1' }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl font-heading text-indigo-600 dark:text-indigo-400">{item.value}</span>
                  <span className="text-xl font-serif">{item.hebrew}</span>
                  <span className="text-sm text-secondary">{item.meaning}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.significance}</p>
              </div>
            ))}
          </div>
        </DocSection>

        {/* Working with Your Name */}
        <DocSection id="gem-practice" title={gematriaDocs.practicalApplication.title}>
          <p className="text-muted-foreground leading-relaxed mb-8">
            {gematriaDocs.practicalApplication.content.trim()}
          </p>

          <div className="doc-card p-6 mb-6">
            <h4 className="font-heading text-lg text-foreground mb-4">How to Calculate</h4>
            <div className="space-y-3">
              {gematriaDocs.practicalApplication.steps.map((item) => (
                <div key={item.step} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-sm font-medium text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                    {item.step}
                  </div>
                  <span className="text-sm text-muted-foreground pt-1">{item.instruction}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-xl bg-muted/30 border border-border">
            <h4 className="font-medium text-foreground mb-2">Example: דָּוִד (David)</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {gematriaDocs.practicalApplication.example.trim()}
            </p>
          </div>
        </DocSection>

        {/* Kabbalistic Context */}
        <DocSection id="gem-kabbalah" title={gematriaDocs.kabbalisticContext.title}>
          <p className="text-muted-foreground leading-relaxed mb-8">
            {gematriaDocs.kabbalisticContext.content.trim()}
          </p>

          <h3 className="doc-h3">The Ten Sefirot</h3>
          <p className="text-sm text-muted-foreground mb-4">
            The Sefirot are the ten divine attributes through which God manifests in creation.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {gematriaDocs.kabbalisticContext.sefirot.map((s) => (
              <div key={s.number} className="p-4 rounded-xl bg-muted/30 border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    {s.number}
                  </div>
                  <span className="font-medium text-foreground">{s.name}</span>
                  <span className="text-xs text-secondary">({s.meaning})</span>
                </div>
                <p className="text-xs text-muted-foreground pl-8">{s.description}</p>
              </div>
            ))}
          </div>
        </DocSection>

        {/* Tip */}
        <section className="mb-12">
          <DocInfoBox variant="secondary" title="Hebrew Name Tip">
            <p className="leading-relaxed">
              If you have a Hebrew name, enter it in your Omnis profile to see its gematria value and
              discover words and phrases that share your number. If you don&apos;t have a Hebrew name,
              you can transliterate your English name, though the connections may be less meaningful.
            </p>
          </DocInfoBox>
        </section>

        {/* CTA */}
        <section className="doc-card p-8 sm:p-10 text-center mt-16">
          <h3 className="text-2xl font-heading text-foreground mb-4">Calculate Your Name</h3>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Enter your Hebrew name in your profile to discover its numerical signature.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-600/90 transition-colors"
            >
              Calculate Gematria
            </Link>
            <Link
              href="/learn/tzolkin"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl border border-border hover:bg-muted/50 transition-colors"
            >
              Traditional Tzolkin
            </Link>
          </div>
        </section>

        {/* Navigation */}
        <DocNav
          prev={{ href: '/learn/astrology', title: 'Astrology' }}
          next={{ href: '/learn/tzolkin', title: 'Traditional Tzolkin' }}
        />
      </DocLayout>

      <Footer />
    </div>
  )
}
