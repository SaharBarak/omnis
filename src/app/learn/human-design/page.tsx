import { Metadata } from 'next'
import Link from 'next/link'
import { Header, Footer } from '@/components/landing'
import { DocLayout, DocHeader, DocSection, DocNav, DocStats, DocInfoBox, DocPullQuote } from '@/components/docs'
import { humanDesignDocs, docStructure } from '@/lib/docs/content'

export const metadata: Metadata = {
  title: 'Human Design Documentation',
  description: 'Complete guide to Human Design: Five Types, Inner Authority, Nine Centers, Profiles, Gates & Channels, and the Incarnation Cross.',
  keywords: 'human design guide, bodygraph, type, authority, strategy, generator, projector, manifestor, reflector, ra uru hu',
}

// Type colors
const typeColors: Record<string, { bg: string; border: string; text: string }> = {
  Generator: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-600 dark:text-orange-400' },
  'Manifesting Generator': { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-600 dark:text-orange-400' },
  Projector: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-600 dark:text-blue-400' },
  Manifestor: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-600 dark:text-red-400' },
  Reflector: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-600 dark:text-purple-400' },
}

export default function HumanDesignDocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <DocLayout
        sections={docStructure.sections}
        currentSection="human-design"
      >
        {/* Header */}
        <DocHeader
          badge="Human Design"
          title={humanDesignDocs.overview.title}
          subtitle={humanDesignDocs.overview.subtitle}
          badgeColor="secondary"
        />

        {/* Introduction with drop cap */}
        <section className="mb-12">
          <p className="doc-dropcap text-muted-foreground leading-relaxed text-lg">
            {humanDesignDocs.overview.introduction.trim()}
          </p>
        </section>

        {/* Pull Quote */}
        <DocPullQuote
          quote={humanDesignDocs.overview.quote.text}
          author={humanDesignDocs.overview.quote.author}
        />

        {/* Quick Stats */}
        <DocStats
          stats={[
            { value: '5', label: 'Energy Types' },
            { value: '9', label: 'Centers' },
            { value: '64', label: 'Gates' },
            { value: '36', label: 'Channels' },
          ]}
        />

        {/* The Five Types */}
        <DocSection id="hd-types" title={humanDesignDocs.types.title}>
          <p className="text-muted-foreground leading-relaxed mb-8">
            {humanDesignDocs.types.introduction}
          </p>

          <div className="space-y-4">
            {humanDesignDocs.types.typeDetails.map((type) => {
              const colors = typeColors[type.name] || typeColors.Generator
              return (
                <div
                  key={type.name}
                  className={`doc-card overflow-hidden ${colors.border}`}
                  style={{ borderLeftWidth: '4px' }}
                >
                  <div className={`px-6 py-4 ${colors.bg}`}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className={`font-heading text-xl ${colors.text}`}>{type.name}</h4>
                      <span className="text-sm text-muted-foreground">{type.percentage} of population</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid sm:grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Strategy</div>
                        <div className="font-medium text-foreground">{type.strategy}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Signature</div>
                        <div className="font-medium text-foreground">{type.signature}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Not-Self</div>
                        <div className="font-medium text-foreground">{type.notSelf}</div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{type.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </DocSection>

        {/* Inner Authority */}
        <DocSection id="hd-authority" title={humanDesignDocs.authority.title}>
          <p className="text-muted-foreground leading-relaxed mb-8">
            {humanDesignDocs.authority.introduction}
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            {humanDesignDocs.authority.authorities.map((auth) => (
              <div key={auth.name} className="doc-card p-5">
                <h4 className="font-heading text-lg text-foreground mb-2">{auth.name}</h4>
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{auth.description}</p>
                <div className="text-xs text-muted-foreground/70 italic">{auth.practice}</div>
              </div>
            ))}
          </div>
        </DocSection>

        {/* Nine Centers */}
        <DocSection id="hd-centers" title={humanDesignDocs.centers.title}>
          <p className="text-muted-foreground leading-relaxed mb-8">
            {humanDesignDocs.centers.introduction}
          </p>

          <div className="space-y-4">
            {humanDesignDocs.centers.centerDetails.map((center) => (
              <div key={center.name} className="doc-card p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">
                      {center.name === 'Head Center' ? '👁' :
                       center.name === 'Ajna Center' ? '💭' :
                       center.name === 'Throat Center' ? '🗣' :
                       center.name === 'G Center' ? '💛' :
                       center.name === 'Heart/Ego Center' ? '❤️' :
                       center.name === 'Solar Plexus Center' ? '🌊' :
                       center.name === 'Sacral Center' ? '🔥' :
                       center.name === 'Spleen Center' ? '⚡' :
                       '🌍'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-heading text-lg text-foreground">{center.name}</h4>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{center.location}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{center.function}</p>
                    <div className="grid sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-2 rounded-lg bg-green-500/5 border border-green-500/10">
                        <span className="text-green-600 dark:text-green-400 font-medium">Defined:</span>
                        <span className="text-muted-foreground ml-1">{center.defined}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-500/5 border border-slate-500/10">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Undefined:</span>
                        <span className="text-muted-foreground ml-1">{center.undefined}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DocSection>

        {/* 12 Profiles */}
        <DocSection id="hd-profile" title={humanDesignDocs.profile.title}>
          <p className="text-muted-foreground leading-relaxed mb-8">
            {humanDesignDocs.profile.introduction}
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {humanDesignDocs.profile.profiles.map((profile) => (
              <div key={profile.profile} className="doc-card p-4">
                <div className="font-heading text-lg text-foreground mb-1">{profile.profile}</div>
                <div className="text-sm text-secondary mb-2">{profile.name}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{profile.description}</p>
              </div>
            ))}
          </div>
        </DocSection>

        {/* Gates & Channels */}
        <DocSection id="hd-gates" title={humanDesignDocs.gates.title}>
          <DocInfoBox variant="secondary" title="The 64 Gates">
            <p className="leading-relaxed">{humanDesignDocs.gates.structure.trim()}</p>
          </DocInfoBox>
        </DocSection>

        {/* Incarnation Cross */}
        <DocSection id="hd-incarnation" title={humanDesignDocs.incarnationCross.title}>
          <p className="text-muted-foreground leading-relaxed mb-6">
            {humanDesignDocs.incarnationCross.introduction.trim()}
          </p>
        </DocSection>

        {/* The Experiment */}
        <DocSection id="hd-experiment" title={humanDesignDocs.experiment.title}>
          <DocInfoBox variant="default" title="Your Personal Experiment">
            <p className="leading-relaxed">{humanDesignDocs.experiment.content.trim()}</p>
          </DocInfoBox>
        </DocSection>

        {/* CTA */}
        <section className="doc-card p-8 sm:p-10 text-center mt-16">
          <h3 className="text-2xl font-heading text-foreground mb-4">Discover Your Design</h3>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Get your complete Human Design chart with Type, Authority, Profile, and Centers.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-secondary text-secondary-foreground font-medium hover:bg-secondary/90 transition-colors"
            >
              Get Your Chart
            </Link>
            <Link
              href="/learn/astrology"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl border border-border hover:bg-muted/50 transition-colors"
            >
              Explore Astrology
            </Link>
          </div>
        </section>

        {/* Navigation */}
        <DocNav
          prev={{ href: '/learn/dreamspell', title: 'Dreamspell' }}
          next={{ href: '/learn/astrology', title: 'Astrology' }}
        />
      </DocLayout>

      <Footer />
    </div>
  )
}
