'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { getSealGlyphPath, getToneGlyphPath } from '@/lib/dreamspell-assets'

// ============================================
// READING CARD — light theme version
// ============================================

function ReadingCard() {
  return (
    <motion.div
      className="relative w-full max-w-sm animate-float"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="border border-border bg-card">
        <div className="relative overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-5 pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Sample Reading</span>
              <span className="text-xs font-mono text-muted-foreground">KIN 169</span>
            </div>
          </div>

          {/* Main display */}
          <div className="px-6 py-8 text-center">
            {/* Seal + Tone Glyphs — NOT inverted (dark glyphs on light bg) */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <motion.img
                src={getSealGlyphPath(9)}
                alt="Moon seal"
                className="w-16 h-16 object-contain opacity-80"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                transition={{ duration: 0.4, delay: 0.8 }}
              />
              <motion.img
                src={getToneGlyphPath(13)}
                alt="Tone 13"
                className="w-10 h-10 object-contain opacity-70"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                transition={{ duration: 0.4, delay: 0.95 }}
              />
            </div>
            <div className="text-6xl font-heading text-foreground/90 mb-2">169</div>
            <div className="text-xl font-heading text-foreground mb-2">Cosmic Moon</div>
            <p className="text-sm text-muted-foreground italic">
              &ldquo;I endure in order to purify&rdquo;
            </p>
          </div>

          {/* Divider */}
          <div className="mx-6 h-px bg-border" />

          {/* Data grid */}
          <div className="px-6 py-5 grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Type', value: 'Generator' },
              { label: 'Sun', value: 'Leo' },
              { label: 'Gematria', value: '144' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 1.1 + i * 0.1 }}
              >
                <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60 mb-1">{item.label}</div>
                <div className="text-sm font-medium text-foreground/80">{item.value}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================
// ANIMATION VARIANTS
// ============================================

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
}

// ============================================
// HERO
// ============================================

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })

  // Parallax transforms
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '15%'])
  const cardY = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])
  const cardScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95])

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center overflow-hidden bg-background pt-16 lg:pt-18"
    >
      {/* Content — fades and shifts on scroll */}
      <motion.div
        className="relative z-10 w-full max-w-content mx-auto px-6 py-20 lg:py-28"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-20 items-center">

          {/* Left column — Text */}
          <motion.div
            className="lg:col-span-7 space-y-8"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Label */}
            <motion.div
              className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground font-sans"
              variants={fadeIn}
              transition={{ duration: 0.3 }}
            >
              Your complete chart
            </motion.div>

            {/* Headline */}
            <motion.h1
              className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-heading text-foreground leading-[0.95] tracking-tight"
              variants={fadeIn}
              transition={{ duration: 0.4 }}
            >
              Every system.
              <br />
              <span className="text-muted-foreground/40">One view.</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              className="text-lg text-muted-foreground max-w-xl leading-relaxed"
              variants={fadeIn}
              transition={{ duration: 0.3 }}
            >
              Human Design bodygraph. Dreamspell oracle. Astrology natal chart. Tzolkin day sign. Hebrew gematria.{' '}
              <span className="text-foreground">Calculated from your birth data, displayed in a single professional interface.</span>
            </motion.p>

            {/* CTA */}
            <motion.div
              className="flex flex-col sm:flex-row items-start gap-3 pt-2"
              variants={fadeIn}
              transition={{ duration: 0.3 }}
            >
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8 h-12 text-base rounded-none transition-all duration-200 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                asChild
              >
                <Link href="/login">Get Your Chart</Link>
              </Button>
            </motion.div>

            {/* Trust line */}
            <motion.p
              className="text-sm text-muted-foreground"
              variants={fadeIn}
              transition={{ duration: 0.3 }}
            >
              Free to start. No credit card.
            </motion.p>

            {/* Stats */}
            <motion.div
              className="flex flex-wrap items-center gap-10 pt-8"
              variants={fadeIn}
              transition={{ duration: 0.3 }}
            >
              {[
                { value: '5', label: 'Systems' },
                { value: '<2s', label: 'calculation' },
                { value: 'AI', label: 'powered insights' },
              ].map((stat, i) => (
                <div key={stat.label} className="flex items-center gap-10">
                  <div>
                    <div className="text-2xl font-heading text-foreground">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                  {i < 2 && <div className="h-8 w-px bg-border" />}
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right column — Card with parallax */}
          <motion.div
            className="lg:col-span-5 flex justify-center lg:justify-end"
            style={{ y: cardY, scale: cardScale }}
          >
            <ReadingCard />
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}
