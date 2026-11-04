'use client'

import { useState } from 'react'
import { AnimatePresence, m, type Variants } from 'framer-motion'
import styles from './motion.module.css'
import kit from '../kit.module.css'
import { useMotionAllowed } from './use-motion-allowed'
import { CURVE, DURATION, seconds } from '@/lib/design/motion-tokens'

export type RollDirection = 'up' | 'down'

/**
 * The odometer's three places, by direction. Variants rather than inline
 * targets, because a leaving value keeps the props it last rendered with:
 * only `custom` on AnimatePresence tells it which way the new value came.
 */
const ROLL: Variants = {
  enter: (up: boolean) => ({ y: up ? '100%' : '-100%', opacity: 0 }),
  settled: { y: '0%', opacity: 1 },
  leave: (up: boolean) => ({ y: up ? '-100%' : '100%', opacity: 0 }),
}

/**
 * A value that rolls to its next value like an odometer (storyboards H and
 * Every day): up when it grows, down when it shrinks. Text has no order of
 * its own, so it rolls up unless `direction` says which way its source moved
 * (the next day up, the previous day down). Assistive tech reads one plain
 * copy; the moving copies are hidden from it.
 */
export function Rolling({ value, direction, className }: { readonly value: string | number; readonly direction?: RollDirection; readonly className?: string }) {
  const allowed = useMotionAllowed()
  const [shown, setShown] = useState({ value, up: true })
  if (shown.value !== value) {
    const grew = typeof value === 'number' && typeof shown.value === 'number' ? value >= shown.value : direction !== 'down'
    setShown({ value, up: grew })
  }
  const { up } = shown
  if (!allowed) return <span className={className}>{value}</span>
  return (
    <span className={[styles.roll, className].filter(Boolean).join(' ')}>
      <span className={kit.srOnly}>{value}</span>
      <AnimatePresence initial={false} custom={up}>
        <m.span
          key={String(value)}
          className={styles.rollValue}
          aria-hidden
          custom={up}
          variants={ROLL}
          initial="enter"
          animate="settled"
          exit="leave"
          transition={{ duration: seconds(DURATION.quick), ease: CURVE.standard }}
        >
          {value}
        </m.span>
      </AnimatePresence>
    </span>
  )
}
