'use client'

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'

// ============================================
// THREAD OF LIGHT — the Railway rail, reborn.
// A golden thread draws itself down the left edge as the page scrolls;
// the traveler glyph (comet-star) rides it. Desktop only, decorative.
// ============================================

export function ThreadOfLight() {
  const reducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24 })
  const travelerTop = useTransform(progress, (v) => `${6 + v * 86}%`)

  if (reducedMotion) return null

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed left-8 top-0 z-30 hidden h-full w-10 lg:block xl:left-14"
    >
      {/* The thread — grows with scroll */}
      <div className="absolute left-1/2 top-[6%] h-[86%] w-px -translate-x-1/2 bg-white/5" />
      <motion.div
        className="absolute left-1/2 top-[6%] w-px -translate-x-1/2 origin-top"
        style={{
          height: '86%',
          scaleY: progress,
          background:
            'linear-gradient(to bottom, #C9A22700, #C9A227cc 12%, #C9A227cc 88%, #C9A22700)',
          boxShadow: '0 0 12px #C9A22766',
        }}
      />

      {/* The traveler rides the thread — pure CSS comet (no blend-mode quirks) */}
      <motion.div
        className="absolute left-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2"
        style={{ top: travelerTop }}
      >
        <span
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'radial-gradient(circle, #FFF6D9 0%, #E7D08A 18%, #C9A22766 40%, transparent 70%)',
            filter: 'blur(0.5px)',
          }}
        />
        <span
          className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ backgroundColor: '#FFF6D9', boxShadow: '0 0 10px 3px #E7D08Acc' }}
        />
      </motion.div>
    </div>
  )
}
