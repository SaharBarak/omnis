'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

function generateStars(count: number): string {
  const stars: string[] = []
  for (let i = 0; i < count; i++) {
    const x = Math.random() * 100
    const y = Math.random() * 100
    const size = Math.random() * 2 + 0.5
    const opacity = Math.random() * 0.7 + 0.3
    stars.push(`${x}vw ${y}vh ${size}px rgba(255,255,255,${opacity})`)
  }
  return stars.join(', ')
}

function FloatingCard() {
  return (
    <div className="floating-card relative mx-auto max-w-sm">
      <div className="glass rounded-2xl p-6 border border-white/10 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-2xl">
            <svg viewBox="0 0 100 100" className="w-8 h-8">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent" />
              <circle cx="50" cy="30" r="8" fill="currentColor" className="text-accent" />
              <path d="M50 45 L35 70 L50 60 L65 70 Z" fill="currentColor" className="text-accent" />
            </svg>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Example Reading</div>
            <div className="font-semibold">Sarah K.</div>
          </div>
        </div>

        <div className="text-center mb-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Dreamspell Kin</div>
          <div className="kin-number text-3xl mb-1">169</div>
          <div className="font-semibold text-lg">Cosmic Moon</div>
        </div>

        <div className="flex justify-center gap-4 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Generator 4/6
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-400" />
            Leo Sun
          </span>
        </div>

        <div className="text-center text-sm text-muted-foreground italic">
          &ldquo;I endure in order to purify...&rdquo;
        </div>
      </div>
    </div>
  )
}

export function Hero() {
  const [stars, setStars] = useState('')

  useEffect(() => {
    setStars(generateStars(150))
  }, [])

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 py-20">
      {/* Starfield background */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-background via-background to-primary/5"
        aria-hidden="true"
      />
      <div
        className="stars absolute inset-0 pointer-events-none"
        style={{ boxShadow: stars }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="text-accent text-2xl">*</span>
          <span className="text-lg font-medium tracking-wider">OMNIS</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 leading-tight">
          <span className="block">Discover Your</span>
          <span className="text-gold-gradient">Cosmic Blueprint</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-muted-foreground mb-2">
          Dreamspell &middot; Human Design &middot; Astrology &middot; Gematria
        </p>

        {/* Value prop */}
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
          Finally, all your symbolic systems in one beautiful place.
          Know yourself deeper. Understand your relationships.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
          <Button
            size="lg"
            className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 cta-shimmer"
            asChild
          >
            <Link href="#demo">
              Start Your Free Reading
              <span className="ml-2">-&gt;</span>
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          No credit card &middot; Free forever tier
        </p>

        {/* Floating card preview */}
        <div className="mt-12 md:mt-16">
          <FloatingCard />
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="text-muted-foreground text-sm flex flex-col items-center gap-2">
            <span>Scroll to explore</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </div>

      <style jsx>{`
        .stars {
          animation: twinkle 4s ease-in-out infinite alternate;
        }

        @keyframes twinkle {
          0% { opacity: 0.7; }
          100% { opacity: 1; }
        }

        .floating-card {
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50% { transform: translateY(-15px) rotate(1deg); }
        }

        .cta-shimmer {
          position: relative;
          overflow: hidden;
        }

        .cta-shimmer::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
          animation: shimmer 3s infinite;
        }

        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
      `}</style>
    </section>
  )
}
