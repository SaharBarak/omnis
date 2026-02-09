'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { getSealGlyphPath, getToneGlyphPath, getHunabKuPath } from '@/lib/dreamspell-assets'

// Sample reading card — clean, elevated
function ReadingCard() {
  return (
    <motion.div
      className="relative w-full max-w-sm"
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="surface-card bg-card p-1 hover-lift">
        <div className="relative bg-background rounded-xl overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-5 pb-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">Sample Reading</span>
              <span className="text-xs font-mono text-primary">KIN 169</span>
            </div>
          </div>

          {/* Main display */}
          <div className="px-6 py-8 text-center">
            {/* Seal + Tone Glyphs */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <motion.img
                src={getSealGlyphPath(9)}
                alt="Moon seal"
                className="w-16 h-16 object-contain"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              />
              <motion.img
                src={getToneGlyphPath(13)}
                alt="Tone 13"
                className="w-10 h-10 object-contain"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.85 }}
              />
            </div>
            <div className="text-6xl font-heading text-primary mb-2">169</div>
            <div className="text-xl font-heading text-foreground mb-2">Cosmic Moon</div>
            <p className="text-sm text-muted-foreground italic">
              &ldquo;I endure in order to purify&rdquo;
            </p>
          </div>

          {/* Divider */}
          <div className="mx-6 earth-divider" />

          {/* Data grid */}
          <div className="px-6 py-5 grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Type', value: 'Generator' },
              { label: 'Sun', value: 'Leo' },
              { label: 'Gematria', value: '144' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 1.0 + i * 0.1 }}
              >
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground/70 mb-1">{item.label}</div>
                <div className="text-sm font-medium text-foreground">{item.value}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 }
  }
}

export function Hero() {
  return (
    <section className="relative min-h-[92vh] flex items-center bg-background overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 sacred-pattern opacity-40" />

      {/* Hunab Ku watermark — slow breathe animation */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-[0.025] pointer-events-none">
        <motion.img
          src={getHunabKuPath()}
          alt=""
          className="w-[600px] h-[600px]"
          aria-hidden="true"
          animate={{ scale: [1, 1.04, 1], opacity: [0.025, 0.035, 0.025] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-content mx-auto px-6 pt-28 pb-20">
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-20 items-center">

          {/* Left column — Text */}
          <motion.div
            className="lg:col-span-7 space-y-7"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Badge */}
            <motion.div className="earth-badge" variants={fadeInUp} transition={{ duration: 0.4 }}>
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-gentle-pulse" />
              <span>Six systems. One place. No more tab chaos.</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              className="text-4xl sm:text-5xl lg:text-6xl font-heading text-foreground leading-tight"
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              Time is Art.
              <br />
              <span className="text-earth-gradient">Know your place in it.</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              className="text-lg text-muted-foreground max-w-xl leading-relaxed"
              variants={fadeInUp}
              transition={{ duration: 0.4 }}
            >
              Dreamspell, Tzolkin, Human Design, Astrology, Gematria, and Long Count.
              <span className="text-foreground font-medium"> Everything calculated. Everything in one view.</span>
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row items-start gap-3 pt-2"
              variants={fadeInUp}
              transition={{ duration: 0.4 }}
            >
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8 h-12 text-base rounded-lg transition-all duration-200 hover:shadow-float active:scale-[0.98]"
                asChild
              >
                <Link href="#demo">
                  Calculate Your Kin
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-muted-foreground hover:text-foreground px-8 h-12 text-base rounded-lg border-border hover:border-primary/20 hover:bg-primary/[0.03] transition-all duration-200"
                asChild
              >
                <Link href="/today">See Today&apos;s Galactic Signature</Link>
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="flex flex-wrap items-center gap-10 pt-8"
              variants={fadeInUp}
              transition={{ duration: 0.4 }}
            >
              {[
                { value: '10,847+', label: 'Profiles saved' },
                { value: '6', label: 'Systems calculated' },
                { value: '<2s', label: 'Full calculation' },
              ].map((stat, i) => (
                <div key={stat.label} className="flex items-center gap-10">
                  <div>
                    <div className="text-2xl font-heading text-primary">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                  {i < 2 && <div className="h-8 w-px bg-border" />}
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right column — Visual */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <ReadingCard />
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  )
}
