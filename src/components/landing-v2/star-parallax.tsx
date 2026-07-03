'use client'

import { useMemo } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'

// ============================================
// STAR PARALLAX — two fixed star layers drifting at different rates
// (MOTION_SPEC global). Pointer-events-none, transform-only, GPU-cheap.
// Deterministic pseudo-random star field (no Math.random → SSR-safe).
// ============================================

function stars(seed: number, count: number): string {
  // Simple LCG so server and client render identical fields.
  let state = seed
  const next = () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
  const shadows: string[] = []
  for (let i = 0; i < count; i += 1) {
    const xPos = Math.round(next() * 2000)
    const yPos = Math.round(next() * 2000)
    const alpha = (0.2 + next() * 0.5).toFixed(2)
    shadows.push(`${xPos}px ${yPos}px rgba(255,255,255,${alpha})`)
  }
  return shadows.join(', ')
}

export function StarParallax() {
  const reducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const slow = useTransform(scrollYProgress, [0, 1], [0, -220])
  const fast = useTransform(scrollYProgress, [0, 1], [0, -520])

  const farStars = useMemo(() => stars(7, 90), [])
  const nearStars = useMemo(() => stars(23, 40), [])

  if (reducedMotion) return null

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <motion.div style={{ y: slow }} className="absolute inset-0">
        <span
          className="absolute h-px w-px rounded-full"
          style={{ boxShadow: farStars }}
        />
      </motion.div>
      <motion.div style={{ y: fast }} className="absolute inset-0">
        <span
          className="absolute h-[2px] w-[2px] rounded-full"
          style={{ boxShadow: nearStars }}
        />
      </motion.div>
    </div>
  )
}
