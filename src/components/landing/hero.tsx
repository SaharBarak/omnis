'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

// Sample reading card - editorial, clean
function ReadingCard() {
  return (
    <div className="relative w-full max-w-sm">
      {/* Main card */}
      <div className="earth-card bg-card p-1">
        <div className="relative bg-background rounded-xl overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-5 pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">Sample Reading</span>
              <span className="text-xs font-mono text-primary">KIN 169</span>
            </div>
          </div>

          {/* Main display */}
          <div className="px-6 py-8 text-center">
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
            ].map((item) => (
              <div key={item.label}>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground/70 mb-1">{item.label}</div>
                <div className="text-sm font-medium text-foreground">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
}

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center bg-background">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 sacred-pattern opacity-30" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-24 pb-16">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">

          {/* Left column - Text */}
          <motion.div 
            className="lg:col-span-7 space-y-6"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Badge */}
            <motion.div className="earth-badge" variants={fadeInUp} transition={{ duration: 0.5 }}>
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Six systems. One place. No more tab chaos.</span>
            </motion.div>

            {/* Headline */}
            <motion.h1 
              className="text-4xl sm:text-5xl lg:text-6xl font-heading text-foreground leading-tight"
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
            >
              Time is Art.
              <br />
              <span className="text-earth-gradient">Know your place in it.</span>
            </motion.h1>

            {/* Description */}
            <motion.p 
              className="text-lg text-muted-foreground max-w-xl leading-relaxed"
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              Dreamspell, Tzolkin, Human Design, Astrology, Gematria, and Long Count.
              <span className="text-foreground"> Everything calculated. Everything in one view.</span>
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row items-start gap-3 pt-2"
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-7 h-12 text-base rounded-lg transition-colors"
                asChild
              >
                <Link href="#demo">
                  Calculate Your Kin
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-muted-foreground hover:text-foreground px-7 h-12 text-base rounded-lg border-border hover:border-primary/30 hover:bg-muted/30 transition-all"
                asChild
              >
                <Link href="/today">See Today&apos;s Galactic Signature</Link>
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div 
              className="flex flex-wrap items-center gap-8 pt-6"
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              <div>
                <div className="text-2xl font-heading text-primary">10,847+</div>
                <div className="text-xs text-muted-foreground">Profiles saved</div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <div className="text-2xl font-heading text-primary">6</div>
                <div className="text-xs text-muted-foreground">Systems calculated</div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <div className="text-2xl font-heading text-primary">&lt;2s</div>
                <div className="text-xs text-muted-foreground">Full calculation</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right column - Visual */}
          <motion.div 
            className="lg:col-span-5 flex justify-center lg:justify-end"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <ReadingCard />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
