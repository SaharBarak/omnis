import { Metadata } from 'next'
import Link from 'next/link'
import { Header, Footer } from '@/components/landing'
import { docStructure } from '@/lib/docs/content'

export const metadata: Metadata = {
  title: 'Knowledge Base - Omnis',
  description: 'Comprehensive documentation for Dreamspell, Human Design, Astrology, Gematria, and traditional Tzolkin. Free educational resources to understand your cosmic blueprint.',
  keywords: 'dreamspell documentation, human design guide, astrology tutorial, gematria learn, tzolkin calendar, symbolic systems',
}

// Section icons with enhanced styling
function SectionIcon({ icon, className }: { icon: string; className?: string }) {
  switch (icon) {
    case 'circles':
      return (
        <svg viewBox="0 0 48 48" className={className}>
          <circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2" />
          <circle cx="24" cy="24" r="12" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <circle cx="24" cy="24" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.8" />
          <circle cx="24" cy="24" r="2" fill="currentColor" />
        </svg>
      )
    case 'bodygraph':
      return (
        <svg viewBox="0 0 48 48" className={className}>
          <circle cx="24" cy="10" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="14" cy="24" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="34" cy="24" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="24" cy="38" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M24 15v19M18 24h12" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        </svg>
      )
    case 'zodiac':
      return (
        <svg viewBox="0 0 48 48" className={className}>
          <circle cx="24" cy="24" r="16" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
          <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.15" />
          <path d="M24 4v5M24 39v5M4 24h5M39 24h5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9.5 9.5l3.5 3.5M35 35l3.5 3.5M9.5 38.5l3.5-3.5M35 13l3.5-3.5" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          <circle cx="24" cy="24" r="4" fill="currentColor" opacity="0.3" />
        </svg>
      )
    case 'aleph':
      return (
        <svg viewBox="0 0 48 48" className={className}>
          <rect x="8" y="8" width="32" height="32" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <text x="24" y="32" textAnchor="middle" fontSize="20" fill="currentColor" fontFamily="serif">א</text>
        </svg>
      )
    case 'calendar':
      return (
        <svg viewBox="0 0 48 48" className={className}>
          <rect x="6" y="10" width="36" height="32" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M6 20h36" stroke="currentColor" strokeWidth="1.5" />
          <path d="M14 6v8M34 6v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="24" cy="30" r="4" fill="currentColor" opacity="0.5" />
        </svg>
      )
    case 'merge':
      return (
        <svg viewBox="0 0 48 48" className={className}>
          <path d="M12 12l12 12-12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M36 12l-12 12 12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      )
    default:
      return null
  }
}

// Section accent colors
const sectionColors: Record<string, { bg: string; text: string; border: string }> = {
  dreamspell: { bg: 'bg-red-500/8', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/20' },
  'human-design': { bg: 'bg-purple-500/8', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/20' },
  astrology: { bg: 'bg-amber-500/8', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20' },
  gematria: { bg: 'bg-indigo-500/8', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/20' },
  tzolkin: { bg: 'bg-emerald-500/8', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20' },
  integration: { bg: 'bg-primary/8', text: 'text-primary', border: 'border-primary/20' },
}

export default function LearnPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-16 sm:pt-24 pb-16">
        {/* Hero Section - Editorial style */}
        <section className="px-4 sm:px-6 mb-16 sm:mb-24">
          <div className="max-w-4xl mx-auto">
            {/* Decorative element */}
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Knowledge Base</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-heading text-foreground text-center leading-[1.1] tracking-tight mb-8">
              Learn the{' '}
              <span className="text-earth-gradient">Ancient</span>
              <br />
              <span className="text-earth-gradient">Wisdom</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground text-center max-w-2xl mx-auto leading-relaxed">
              Comprehensive documentation for the symbolic systems that reveal your cosmic blueprint.
              Written with respect for the lineages and designed for practical understanding.
            </p>
          </div>
        </section>

        {/* Main Sections Grid */}
        <section className="px-4 sm:px-6 mb-16 sm:mb-24">
          <div className="max-w-content mx-auto">
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {docStructure.sections.map((section, index) => {
                const colors = sectionColors[section.id] || sectionColors.integration

                return (
                  <Link
                    key={section.id}
                    href={`/learn/${section.id}`}
                    className="group relative"
                    style={{ animationDelay: `${index * 75}ms` }}
                  >
                    <div className={`relative overflow-hidden rounded-2xl border ${colors.border} ${colors.bg} p-6 sm:p-8 transition-all duration-300 hover:shadow-earth-lg hover:-translate-y-1`}>
                      {/* Background decoration */}
                      <div className="absolute -right-8 -top-8 w-32 h-32 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                        <SectionIcon icon={section.icon} className="w-full h-full" />
                      </div>

                      {/* Content */}
                      <div className="relative">
                        {/* Icon */}
                        <div className={`w-14 h-14 mb-5 ${colors.text}`}>
                          <SectionIcon icon={section.icon} className="w-full h-full" />
                        </div>

                        {/* Title */}
                        <h2 className="text-xl sm:text-2xl font-heading text-foreground mb-3 group-hover:text-primary transition-colors">
                          {section.title}
                        </h2>

                        {/* Description */}
                        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                          {section.description}
                        </p>

                        {/* Topics preview */}
                        <div className="flex flex-wrap gap-1.5 mb-5">
                          {section.topics.slice(0, 3).map((topic) => (
                            <span
                              key={topic.id}
                              className="px-2.5 py-1 text-xs rounded-md bg-background/50 text-muted-foreground"
                            >
                              {topic.title}
                            </span>
                          ))}
                          {section.topics.length > 3 && (
                            <span className="px-2.5 py-1 text-xs rounded-md bg-background/50 text-muted-foreground">
                              +{section.topics.length - 3}
                            </span>
                          )}
                        </div>

                        {/* Explore link */}
                        <div className={`flex items-center gap-2 text-sm font-medium ${colors.text} opacity-0 group-hover:opacity-100 transition-opacity`}>
                          <span>Explore Guide</span>
                          <svg viewBox="0 0 24 24" className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* Quotes Section - Editorial */}
        <section className="px-4 sm:px-6 mb-16 sm:mb-24">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
              {/* Argüelles Quote */}
              <div className="relative p-8 sm:p-10 rounded-2xl bg-card border border-border">
                <div className="absolute top-6 left-6 text-6xl font-heading text-primary/10">&ldquo;</div>
                <blockquote className="relative">
                  <p className="text-lg sm:text-xl font-heading text-foreground/90 italic leading-relaxed mb-6">
                    Who owns your time owns your mind. Own your own time and know your own mind.
                  </p>
                  <footer className="flex items-center gap-4">
                    <div className="w-12 h-px bg-primary/30" />
                    <div>
                      <cite className="not-italic font-medium text-foreground">José Argüelles</cite>
                      <p className="text-sm text-muted-foreground">Creator of Dreamspell</p>
                    </div>
                  </footer>
                </blockquote>
              </div>

              {/* Ra Uru Hu Quote */}
              <div className="relative p-8 sm:p-10 rounded-2xl bg-card border border-border">
                <div className="absolute top-6 left-6 text-6xl font-heading text-secondary/10">&ldquo;</div>
                <blockquote className="relative">
                  <p className="text-lg sm:text-xl font-heading text-foreground/90 italic leading-relaxed mb-6">
                    I am not the guru. I am a mechanic.
                  </p>
                  <footer className="flex items-center gap-4">
                    <div className="w-12 h-px bg-secondary/30" />
                    <div>
                      <cite className="not-italic font-medium text-foreground">Ra Uru Hu</cite>
                      <p className="text-sm text-muted-foreground">Founder of Human Design</p>
                    </div>
                  </footer>
                </blockquote>
              </div>
            </div>
          </div>
        </section>

        {/* Getting Started Guide */}
        <section className="px-4 sm:px-6 mb-16 sm:mb-24">
          <div className="max-w-4xl mx-auto">
            <div className="rounded-2xl bg-card border border-border overflow-hidden">
              {/* Header */}
              <div className="px-6 sm:px-8 py-6 border-b border-border bg-muted/30">
                <h2 className="text-2xl sm:text-3xl font-heading text-foreground">New Here?</h2>
                <p className="text-muted-foreground mt-2">
                  Choose your path based on what you&apos;re looking to explore.
                </p>
              </div>

              {/* Options Grid */}
              <div className="p-6 sm:p-8">
                <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
                  {/* Daily Practice */}
                  <div className="group p-5 rounded-xl border border-border bg-background hover:border-red-500/30 hover:bg-red-500/5 transition-all">
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="4" />
                        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                      </svg>
                    </div>
                    <h3 className="font-heading text-lg text-foreground mb-2">For Daily Practice</h3>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      Track daily energies and find your galactic signature with Dreamspell.
                    </p>
                    <Link href="/learn/dreamspell" className="inline-flex items-center gap-1 text-sm font-medium text-red-600 dark:text-red-400 group-hover:gap-2 transition-all">
                      Start with Dreamspell
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>

                  {/* Decision-Making */}
                  <div className="group p-5 rounded-xl border border-border bg-background hover:border-purple-500/30 hover:bg-purple-500/5 transition-all">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="5" r="2.5" />
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 7.5v1.5M8 20l4-5 4 5" />
                      </svg>
                    </div>
                    <h3 className="font-heading text-lg text-foreground mb-2">For Decision-Making</h3>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      Understand your strategy and inner authority with Human Design.
                    </p>
                    <Link href="/learn/human-design" className="inline-flex items-center gap-1 text-sm font-medium text-purple-600 dark:text-purple-400 group-hover:gap-2 transition-all">
                      Start with Human Design
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>

                  {/* Deep Analysis */}
                  <div className="group p-5 rounded-xl border border-border bg-background hover:border-amber-500/30 hover:bg-amber-500/5 transition-all">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
                      </svg>
                    </div>
                    <h3 className="font-heading text-lg text-foreground mb-2">For Deep Analysis</h3>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      Get the most detailed psychological portrait with Astrology.
                    </p>
                    <Link href="/learn/astrology" className="inline-flex items-center gap-1 text-sm font-medium text-amber-600 dark:text-amber-400 group-hover:gap-2 transition-all">
                      Start with Astrology
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="mb-8">
              <div className="w-16 h-px bg-primary/30 mx-auto mb-8" />
              <h2 className="text-2xl sm:text-3xl font-heading text-foreground mb-4">Ready to Explore?</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Calculate your signatures, create your profile, and see how all the systems connect.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link
                href="/calculate"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                Calculate Your Kin
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl border border-border hover:bg-muted/50 transition-colors"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
