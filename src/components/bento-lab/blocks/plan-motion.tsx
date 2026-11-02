'use client'

import { useRef, type ReactNode } from 'react'
import { m } from 'framer-motion'
import { useMotionAllowed, useReveal } from '../motion'
import { CURVE, DURATION, seconds, staggerStep } from '@/lib/design/motion-tokens'

/** How far a plan lifts under the pointer, and how far a press sinks it back, in pixels. */
const LIFT = Object.freeze({ hover: -4, press: 1 })
/** How far a ledger row rises as it arrives, in pixels. */
const ROW_RISE = 8

const quick = { duration: seconds(DURATION.quick), ease: CURVE.standard }

/**
 * A plan card that answers the pointer (storyboard 7): it lifts on hover with
 * its tinted shadow (`--lift`, read by the stylesheet) and sinks a pixel when
 * pressed. Motion owns the card's transform and `--lift`; nothing else
 * animates it.
 */
export function LiftCard({ className, labelledBy, children }: { readonly className: string; readonly labelledBy: string; readonly children: ReactNode }) {
  const allowed = useMotionAllowed()
  if (!allowed) {
    return (
      <article className={className} aria-labelledby={labelledBy}>
        {children}
      </article>
    )
  }
  return (
    <m.article
      className={className}
      aria-labelledby={labelledBy}
      initial={false}
      whileHover={{ y: LIFT.hover, '--lift': 1, transition: quick }}
      whileTap={{ y: LIFT.hover + LIFT.press, transition: { duration: seconds(DURATION.press), ease: CURVE.standard } }}
      transition={quick}
    >
      {children}
    </m.article>
  )
}

export interface LedgerRow {
  readonly key: string
  readonly cells: ReactNode
}

/**
 * Ledger rows that arrive one after another the first time the ledger comes
 * into view (storyboard 7): fade and a short rise, a stagger step apart. The
 * rows are in the markup from the start; only rows still out of sight wait.
 */
export function RevealRows({ rows }: { readonly rows: readonly LedgerRow[] }) {
  const ref = useRef<HTMLTableSectionElement>(null)
  const allowed = useMotionAllowed()
  const phase = useReveal(ref)
  const step = seconds(staggerStep(rows.length))
  const arrive = (i: number) =>
    phase === 'armed' ? { duration: 0 } : { duration: seconds(DURATION.settle), ease: CURVE.standard, delay: phase === 'shown' ? i * step : 0 }
  return (
    <tbody ref={ref}>
      {rows.map((row, i) =>
        allowed ? (
          <m.tr key={row.key} initial={false} animate={phase === 'armed' ? { opacity: 0, y: ROW_RISE } : { opacity: 1, y: 0 }} transition={arrive(i)}>
            {row.cells}
          </m.tr>
        ) : (
          <tr key={row.key}>{row.cells}</tr>
        ),
      )}
    </tbody>
  )
}
