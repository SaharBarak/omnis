'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function CTA() {
  return (
    <section className="py-28 lg:py-36 px-6" style={{ background: 'hsl(230, 15%, 6%)' }}>
      <div className="max-w-3xl mx-auto text-center">
        {/* Label */}
        <div className="text-[11px] uppercase tracking-[0.15em] text-white/30 mb-6">
          Ready?
        </div>

        {/* Headline */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-heading text-white mb-5 leading-tight tracking-tight">
          Your complete chart
          <br />
          <span className="text-white/40">is waiting</span>
        </h2>

        {/* Description */}
        <p className="text-lg text-white/45 mb-10 max-w-lg mx-auto leading-relaxed">
          Human Design, Dreamspell, Astrology, Tzolkin, and Gematria. One profile. One view. Saved for reference.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8 h-12 text-base rounded-none transition-all duration-200 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            asChild
          >
            <Link href="/login">Get Your Chart</Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="text-white/60 hover:text-white px-8 h-12 text-base rounded-none border-white/15 hover:border-white/30 bg-transparent hover:bg-white/[0.03] transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            asChild
          >
            <Link href="/today">See Today&apos;s Kin</Link>
          </Button>
        </div>

        {/* Trust line */}
        <p className="text-sm text-white/30">
          Free to start. No credit card required.
        </p>
      </div>
    </section>
  )
}
