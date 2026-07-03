'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MURAL_GROUND } from '@/lib/design/system-flavors'
import { TYPE } from '@/lib/design/landing-tokens'
import { AmbientVideo } from './ambient-video'
import { DemoGraph } from './demo-graph'

// ============================================
// HERO — living sky mural, split composition (taste-audit A1):
// promise left, the live map right, above the fold.
// Spec: docs/redesign/HOMEPAGE_SPEC.md §1, MOTION_SPEC V1.
// ============================================

const easeOut = [0.4, 0, 0.2, 1] as const

export function HeroV2() {
  return (
    <section
      className="relative flex min-h-[100dvh] items-center overflow-hidden pb-16 pt-28 md:pt-24"
      style={{ backgroundColor: MURAL_GROUND }}
    >
      {/* Living sky — video with still fallback (MOTION_SPEC playback contract) */}
      <div aria-hidden className="absolute inset-0">
        <AmbientVideo
          webmSrc="/videos/redesign/hero-sky-loop.webm"
          mp4Src="/videos/redesign/hero-sky-loop.mp4"
          poster="/images/redesign/mural/hero-sky.webp"
          className="h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, ${MURAL_GROUND}55 0%, ${MURAL_GROUND}22 40%, ${MURAL_GROUND} 96%)`,
          }}
        />
      </div>

      <div className="relative mx-auto grid w-full max-w-content items-center gap-14 px-6 lg:grid-cols-[3fr_2fr] lg:gap-10">
        {/* The promise — left */}
        <div className="text-left">
          <motion.p
            className={`${TYPE.eyebrow} text-white/50`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Astrology · Dreamspell · Tzolkin · Human Design · Kabbalah
          </motion.p>

          <motion.h1
            className={`${TYPE.hero} mt-6 max-w-2xl`}
            initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.2, ease: easeOut }}
          >
            Map the people who shape your life.
          </motion.h1>

          <motion.p
            className="mt-6 max-w-xl text-lg leading-relaxed text-white/70 md:text-xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease: easeOut }}
          >
            Omnis reads every birth through five wisdom systems and draws the
            living map between them — family, friends, teams. Add a person
            once; the map remembers forever.
          </motion.p>

          <motion.div
            className="mt-9 flex flex-wrap items-center gap-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: easeOut }}
          >
            <Button
              asChild
              size="lg"
              className="rounded-full bg-gold px-8 text-base font-semibold text-ground transition-transform hover:bg-gold-soft active:scale-[0.98]"
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
              className="rounded-full border-white/25 bg-transparent px-8 text-base text-white transition-transform hover:bg-white/10 hover:text-white active:scale-[0.98]"
            >
              <Link href="/calculate">Try one reading</Link>
            </Button>
          </motion.div>
        </div>

        {/* The living map — right, above the fold */}
        <motion.div
          className="relative rounded-2xl border border-white/10 bg-surface/80 p-5 shadow-2xl backdrop-blur-sm md:p-7"
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.55, ease: easeOut }}
        >
          <div className="mb-4 flex items-center justify-between">
            <span className={`${TYPE.eyebrow} text-white/50`}>Your living map</span>
            <span className="font-mono text-xs text-white/50">8 people · 3 circles</span>
          </div>
          <DemoGraph />
        </motion.div>
      </div>
    </section>
  )
}
