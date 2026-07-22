'use client'

/**
 * App motion vocabulary — one contract for every authed surface.
 *
 * Mirrors the landing (src/components/landing-v2) and mobile
 * (packages/mobile/src/theme/tokens.ts) systems: easeOut cubic-bezier
 * entrances, SPRING {stiffness 100, damping 20}, and the rule that
 * NOTHING BOUNCES. All decorative motion must respect reduced motion —
 * use `useReducedMotion()` from framer-motion at call sites.
 */

import { useEffect, useRef, useState } from 'react'
import { animate, useInView, useReducedMotion } from 'framer-motion'
import type { Transition, Variants } from 'framer-motion'

/** The landing's standard easing (globals.css transition-smooth). */
export const EASE_OUT: [number, number, number, number] = [0.4, 0, 0.2, 1]

/** The one sanctioned spring. Weighty, no overshoot theatrics. */
export const SPRING: Transition = { type: 'spring', stiffness: 100, damping: 20 }

/** Standard in-view entrance — fade up 16px, 0.5s. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE_OUT as [number, number, number, number] },
  },
}

/** Parent container that staggers `fadeUp` children 60ms apart. */
export const staggerParent: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

/** Viewport contract for whileInView entrances (landing convention). */
export const VIEWPORT_ONCE = { once: true, margin: '-80px' } as const

/**
 * Count a number up from 0 on first in-view (mobile use-count-up port).
 * Returns [ref, displayedValue]. Reduced motion lands instantly.
 */
export function useCountUp(target: number, durationMs = 900) {
  const ref = useRef<HTMLElement | null>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const reduced = useReducedMotion()
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduced) {
      setValue(target)
      return
    }
    const controls = animate(0, target, {
      duration: durationMs / 1000,
      ease: EASE_OUT as [number, number, number, number],
      onUpdate: (v) => setValue(Math.round(v)),
    })
    return () => controls.stop()
  }, [inView, target, durationMs, reduced])

  return [ref, value] as const
}
