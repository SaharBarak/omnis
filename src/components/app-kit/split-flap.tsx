'use client'

/**
 * Split-flap board — the dashboard's one theatrical set piece, ported
 * from packages/mobile/src/components/today/board.tsx. Each value flips
 * in on rotateX with a deterministic per-index cascade (replay-stable),
 * mono tabular numerals in brand-bright. Reduced motion renders static.
 */

import { motion, useReducedMotion } from 'framer-motion'
import { EASE_OUT } from './motion'
import { Eyebrow } from './primitives'
import { cn } from '@/lib/utils'

/** Deterministic cascade delay (ms) — mobile board formula. */
function flapDelay(index: number): number {
  return index * 90 + (index % 3) * 8 + 15
}

export function FlapValue({
  value,
  index = 0,
  className,
}: {
  value: string
  index?: number
  className?: string
}) {
  const reduced = useReducedMotion()
  return (
    <span className={cn('inline-block', className)} style={{ perspective: 600 }}>
      <motion.span
        key={value}
        initial={reduced ? false : { rotateX: -85, opacity: 0 }}
        animate={{ rotateX: 0, opacity: 1 }}
        transition={{
          duration: 0.45,
          delay: flapDelay(index) / 1000,
          ease: EASE_OUT as [number, number, number, number],
        }}
        className="inline-block origin-top font-mono tracking-tight text-brand-bright [font-variant-numeric:tabular-nums]"
      >
        {value}
      </motion.span>
    </span>
  )
}

export interface FlapRow {
  readonly label: string
  readonly value: string
  /** Tap-through target — the row becomes a link (PRD: every card tappable). */
  readonly href?: string
}

/** Label/value rows separated by hairlines — the departures board. */
export function FlapBoard({
  rows,
  className,
}: {
  rows: readonly FlapRow[]
  className?: string
}) {
  return (
    <div className={cn('flex flex-col', className)}>
      {rows.map((row, i) => {
        const rowClass = cn(
          'flex items-baseline justify-between gap-6 py-3',
          i < rows.length - 1 && 'border-b border-white/[0.07]',
          row.href && 'transition-colors hover:bg-white/[0.03] active:scale-[0.99]'
        )
        const content = (
          <>
            <Eyebrow>{row.label}</Eyebrow>
            <FlapValue value={row.value} index={i} className="text-right text-sm md:text-base" />
          </>
        )
        return row.href ? (
          <a key={row.label} href={row.href} className={rowClass}>
            {content}
          </a>
        ) : (
          <div key={row.label} className={rowClass}>
            {content}
          </div>
        )
      })}
    </div>
  )
}
