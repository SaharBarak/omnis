'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MURAL_GROUND } from '@/lib/design/system-flavors'
import { DemoGraph } from './demo-graph'

// ============================================
// HERO — living sky mural + serif promise + live demo map.
// Spec: docs/redesign/HOMEPAGE_SPEC.md §1, MOTION_SPEC V1.
// ============================================

const easeOut = [0.4, 0, 0.2, 1] as const

export function HeroV2() {
  const reducedMotion = useReducedMotion()

  return (
    <section
      className="relative overflow-hidden pb-16 pt-36 md:pb-24 md:pt-44"
      style={{ backgroundColor: MURAL_GROUND }}
    >
      {/* Living sky — video with still fallback (MOTION_SPEC playback contract) */}
      <div aria-hidden className="absolute inset-0">
        {reducedMotion ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/images/redesign/mural/hero-sky.webp"
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <video
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster="/images/redesign/mural/hero-sky.webp"
          >
            <source src="/videos/redesign/hero-sky-loop.webm" type="video/webm" />
            <source src="/videos/redesign/hero-sky-loop.mp4" type="video/mp4" />
          </video>
        )}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, ${MURAL_GROUND}66 0%, ${MURAL_GROUND}22 35%, ${MURAL_GROUND} 96%)`,
          }}
        />
      </div>

      <div className="relative mx-auto max-w-content px-6 text-center">
        {/* Eyebrow */}
        <motion.p
          className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/55"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          Astrology · Dreamspell · Tzolkin · Human Design · Kabbalah
        </motion.p>

        {/* H1 */}
        <motion.h1
          className="mx-auto mt-6 max-w-4xl font-display text-5xl leading-[1.05] text-white md:text-7xl"
          initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, delay: 0.2, ease: easeOut }}
        >
          Map the people who shape your life.
        </motion.h1>

        {/* Sub */}
        <motion.p
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/70 md:text-xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: easeOut }}
        >
          Omnis reads every birth through five wisdom systems and draws the
          living map between them — family, friends, teams. Add a person once;
          the map remembers forever.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="mt-9 flex flex-wrap items-center justify-center gap-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: easeOut }}
        >
          <Button
            asChild
            size="lg"
            className="rounded-full bg-[#C9A227] px-8 text-base font-semibold text-[#0B0D16] hover:bg-[#E7D08A]"
          >
            <Link href="/login">
              Open your map
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-full border-white/25 bg-transparent px-8 text-base text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/calculate">Try one reading</Link>
          </Button>
        </motion.div>

        {/* Floating live map — overlaps the mural fold, Railway-canvas style */}
        <motion.div
          className="relative mx-auto mt-20 max-w-4xl rounded-2xl border border-white/10 bg-[#101423]/80 p-6 shadow-2xl backdrop-blur-sm md:p-10"
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.65, ease: easeOut }}
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/45">
              Your living map
            </span>
            <span className="font-mono text-xs text-white/45">8 people · 3 circles</span>
          </div>
          <DemoGraph />
        </motion.div>
      </div>
    </section>
  )
}
