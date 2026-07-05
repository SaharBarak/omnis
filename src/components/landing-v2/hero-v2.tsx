'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MURAL_GROUND } from '@/lib/design/system-flavors'
import { COLORS, TYPE } from '@/lib/design/landing-tokens'
import { AmbientVideo } from './ambient-video'
import { Magnetic } from './magnetic'
import { DemoGraph } from './demo-graph'

// ============================================
// HERO — Railway-pattern: the sky lives inside an inset, rounded panel
// (page ground stays visible around it); centered promise; the real
// product surface rises from the panel's bottom edge and gets cropped
// by it. Spec: docs/redesign/HOMEPAGE_SPEC.md §1, MOTION_SPEC V1.
// ============================================

const easeOut = [0.4, 0, 0.2, 1] as const

const SURFACE_TABS = ['Map', 'People', 'Circles', 'Boards'] as const

export function HeroV2() {
  return (
    <section className="relative px-3 pt-20 sm:px-5 md:pt-24">
      <div
        className="relative mx-auto flex min-h-[88dvh] max-w-[1400px] flex-col overflow-hidden rounded-[2rem] border border-white/10"
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
              background: `linear-gradient(to bottom, ${MURAL_GROUND}66 0%, ${MURAL_GROUND}22 45%, ${MURAL_GROUND}E6 100%)`,
            }}
          />
        </div>

        {/* The promise — centered, Railway-style */}
        <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-6 pt-24 text-center md:pt-32">
          <motion.p
            className={`${TYPE.eyebrow} text-white/50`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Astrology · Dreamspell · Tzolkin · Human Design · Kabbalah
          </motion.p>

          <motion.h1
            className={`${TYPE.hero} mt-6`}
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
            Five systems read every birth. One map holds every relationship.
            Add a person once; OmnisX remembers forever.
          </motion.p>

          <motion.div
            className="mt-9 flex flex-wrap items-center justify-center gap-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: easeOut }}
          >
            <Magnetic>
              <Button
                asChild
                size="lg"
                className="rounded-xl bg-brand px-8 text-base font-semibold text-white transition-transform hover:bg-brand-soft active:scale-[0.98]"
              >
                <Link href="/calculate">
                  Try a free reading
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </Magnetic>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-xl border-white/15 bg-surface/80 px-8 text-base text-white backdrop-blur-sm transition-transform hover:bg-surface-2 hover:text-white active:scale-[0.98]"
            >
              <Link href="/login">Open your map</Link>
            </Button>
          </motion.div>
        </div>

        {/* The product surface — rises from the panel floor, cropped by it */}
        <motion.div
          className="relative mx-auto mt-14 w-full max-w-4xl px-4 sm:px-6 md:mt-16"
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.55, ease: easeOut }}
        >
          <div className="overflow-hidden rounded-t-2xl border border-b-0 border-white/10 bg-surface/95 shadow-[0_-24px_80px_-32px_rgba(125,91,201,0.35)] backdrop-blur-sm">
            {/* Control chrome */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
              <div className="flex min-w-0 items-center gap-2 font-mono text-xs text-white/50">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: COLORS.brand }}
                />
                <span className="truncate">
                  omnisx <span className="text-white/25">/</span> your-map{' '}
                  <span className="text-white/25">/</span> home-circle
                </span>
              </div>
              <div className="hidden items-center gap-1 sm:flex">
                {SURFACE_TABS.map((tab, i) => (
                  <span
                    key={tab}
                    className={
                      i === 0
                        ? 'rounded-md bg-white/10 px-3 py-1 text-xs font-medium text-white'
                        : 'px-3 py-1 text-xs text-white/50'
                    }
                  >
                    {tab}
                  </span>
                ))}
              </div>
              <span className="font-mono text-xs text-white/50">
                8 people · 3 circles
              </span>
            </div>

            <div className="p-4 sm:p-6">
              <DemoGraph />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
