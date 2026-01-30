'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function CTA() {
  return (
    <section className="py-20 lg:py-28 px-6 bg-background">
      <div className="max-w-3xl mx-auto text-center">
        {/* Badge */}
        <div className="earth-badge inline-flex mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          <span>One place for all your calculations</span>
        </div>

        {/* Headline */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading text-foreground mb-5 leading-tight">
          Stop switching between
          <br />
          <span className="text-earth-gradient">four different websites</span>
        </h2>

        {/* Description */}
        <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto leading-relaxed">
          Dreamspell, Tzolkin, Human Design, Astrology, Gematria, and Long Count. Calculated correctly. Displayed together. Saved for reference.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8 h-12 text-base rounded-lg transition-colors"
            asChild
          >
            <Link href="/login">
              <span className="flex items-center gap-2">
                Create Free Account
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="text-muted-foreground hover:text-foreground px-8 h-12 text-base rounded-lg border-border hover:border-primary/30 hover:bg-muted/30 transition-all"
            asChild
          >
            <Link href="/today">See Today&apos;s Kin</Link>
          </Button>
        </div>

        {/* Trust line */}
        <p className="text-sm text-muted-foreground">
          Free tier available. No credit card required.
        </p>
      </div>
    </section>
  )
}
