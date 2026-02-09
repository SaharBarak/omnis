'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { systemGradients, landingImages } from '@/lib/landing-images'

// ============================================
// SYSTEM DATA
// ============================================

const systems = [
  {
    name: 'Human Design',
    slug: 'human-design',
    subtitle: 'BODYGRAPH',
    description: 'Your energetic blueprint. Type, strategy, authority, and the full bodygraph — the synthesis of astrology, I\'Ching, Kabbalah, and the chakra system.',
    icon: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <circle cx="16" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1" />
        <circle cx="10" cy="18" r="3" fill="none" stroke="currentColor" strokeWidth="1" />
        <circle cx="22" cy="18" r="3" fill="none" stroke="currentColor" strokeWidth="1" />
        <circle cx="16" cy="26" r="3" fill="none" stroke="currentColor" strokeWidth="1" />
        <path d="M16 12v11M13 18h6" stroke="currentColor" strokeWidth="1" />
      </svg>
    ),
  },
  {
    name: 'Dreamspell',
    slug: 'dreamspell',
    subtitle: 'GALACTIC SIGNATURE',
    description: 'Your galactic signature. Kin, seal, tone, wavespell, castle, and complete oracle map in the synchronic order.',
    icon: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        <circle cx="16" cy="16" r="7" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.6" />
        <circle cx="16" cy="16" r="2.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: 'Astrology',
    slug: 'astrology',
    subtitle: 'NATAL CHART',
    description: 'Your celestial positions. Sun, Moon, Rising, and all planetary placements mapped at the moment of your birth.',
    icon: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <circle cx="16" cy="16" r="10" fill="none" stroke="currentColor" strokeWidth="1" />
        <path d="M16 6v4M16 22v4M6 16h4M22 16h4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <circle cx="16" cy="16" r="3" fill="currentColor" opacity="0.4" />
      </svg>
    ),
  },
  {
    name: 'Tzolkin',
    slug: 'tzolkin',
    subtitle: 'SACRED COUNT',
    description: 'The sacred count. The traditional Mayan 260-day calendar using the GMT correlation — an unbroken count spanning millennia.',
    icon: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <rect x="6" y="6" width="20" height="20" rx="1" fill="none" stroke="currentColor" strokeWidth="1" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        <circle cx="20" cy="12" r="1.5" fill="currentColor" />
        <circle cx="16" cy="16" r="1.5" fill="currentColor" />
        <circle cx="12" cy="20" r="1.5" fill="currentColor" />
        <circle cx="20" cy="20" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: 'Kabbalah',
    slug: 'gematria',
    subtitle: 'HEBREW TEACHINGS',
    description: 'The hidden structure of creation. Gematria calculations, Tree of Life correspondences, and the numerical wisdom behind Hebrew letters and words.',
    icon: (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <circle cx="16" cy="6" r="2.5" fill="none" stroke="currentColor" strokeWidth="1" />
        <circle cx="10" cy="14" r="2.5" fill="none" stroke="currentColor" strokeWidth="1" />
        <circle cx="22" cy="14" r="2.5" fill="none" stroke="currentColor" strokeWidth="1" />
        <circle cx="16" cy="22" r="2.5" fill="none" stroke="currentColor" strokeWidth="1" />
        <circle cx="10" cy="28" r="2.5" fill="none" stroke="currentColor" strokeWidth="1" />
        <circle cx="22" cy="28" r="2.5" fill="none" stroke="currentColor" strokeWidth="1" />
        <line x1="16" y1="8.5" x2="10" y2="11.5" stroke="currentColor" strokeWidth="0.7" />
        <line x1="16" y1="8.5" x2="22" y2="11.5" stroke="currentColor" strokeWidth="0.7" />
        <line x1="10" y1="16.5" x2="16" y2="19.5" stroke="currentColor" strokeWidth="0.7" />
        <line x1="22" y1="16.5" x2="16" y2="19.5" stroke="currentColor" strokeWidth="0.7" />
      </svg>
    ),
  },
]

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
    transition: { staggerChildren: 0.06 }
  }
}

// ============================================
// SYSTEMS SHOWCASE
// ============================================

export function SystemsShowcase() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { scrollXProgress } = useScroll({ container: scrollRef })
  const progressWidth = useTransform(scrollXProgress, [0, 1], ['0%', '100%'])

  return (
    <section className="py-28 lg:py-36 px-6 bg-muted/20">
      <div className="max-w-content mx-auto">
        {/* Section header */}
        <motion.div
          className="max-w-2xl mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
        >
          <motion.div
            className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground font-sans mb-4"
            variants={fadeIn}
            transition={{ duration: 0.3 }}
          >
            The systems
          </motion.div>

          <motion.h2
            className="text-3xl sm:text-4xl lg:text-5xl font-heading text-foreground mb-5 tracking-tight"
            variants={fadeIn}
            transition={{ duration: 0.3 }}
          >
            Five traditions. Calculated together.
          </motion.h2>

          <motion.p
            className="text-lg text-muted-foreground leading-relaxed"
            variants={fadeIn}
            transition={{ duration: 0.3 }}
          >
            Each system offers a different lens into your design. Omnis calculates all of them from your birth data.
          </motion.p>
        </motion.div>

        {/* Cards — horizontal scroll on mobile, grid on xl */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={staggerContainer}
        >
          {/* Mobile/tablet: horizontal scroll */}
          <div
            ref={scrollRef}
            className="xl:hidden overflow-x-auto flex gap-4 pb-4 snap-x snap-mandatory scroll-hide"
          >
            {systems.map((system, index) => (
              <motion.div
                key={system.slug}
                className="min-w-[280px] snap-start flex-shrink-0 border border-border bg-background hover:border-primary/30 transition-colors duration-200"
                variants={fadeIn}
                transition={{ duration: 0.3, delay: index * 0.06 }}
              >
                <SystemCard system={system} />
              </motion.div>
            ))}
          </div>

          {/* xl: locked 5-column grid */}
          <div className="hidden xl:grid grid-cols-5 gap-px bg-border">
            {systems.map((system, index) => (
              <motion.div
                key={system.slug}
                className="bg-background hover:bg-muted/30 transition-colors duration-200"
                variants={fadeIn}
                transition={{ duration: 0.3, delay: index * 0.06 }}
              >
                <SystemCard system={system} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Scroll progress indicator — mobile only */}
        <div className="xl:hidden mt-4">
          <div className="h-0.5 bg-border relative overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-primary"
              style={{ width: progressWidth }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// SYSTEM CARD
// ============================================

function SystemCard({ system }: { system: typeof systems[number] }) {
  const gradient = systemGradients[system.slug] || systemGradients.dreamspell

  return (
    <>
      {/* Gradient header with image overlay */}
      <div className="relative h-40 overflow-hidden" style={{ background: gradient }}>
        <img
          src={landingImages.systems[system.slug as keyof typeof landingImages.systems]}
          alt={system.name}
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <div className="absolute bottom-4 left-4 text-white/70 z-10">
          {system.icon}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-heading text-foreground">{system.name}</h3>
        <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-1 mb-3">
          {system.subtitle}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          {system.description}
        </p>
        <Link
          href={`/learn/${system.slug}`}
          className="text-sm text-primary hover:underline transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Explore &rarr;
        </Link>
      </div>
    </>
  )
}
