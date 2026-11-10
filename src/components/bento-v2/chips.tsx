'use client'

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { m } from 'framer-motion'
import f from './frame/frame.module.css'
import { useMotionAllowed } from '@/components/bento-lab/motion'

export interface ChipItem {
  readonly id: string
  readonly label: string
}

interface ChipsProps {
  readonly items: readonly ChipItem[]
  readonly value: number
  readonly onPick: (index: number) => void
  /** Accessible name of the group. */
  readonly label: string
  /** Unique per group on a page: the highlight glides between this group's chips only. */
  readonly group: string
  readonly solid?: boolean
  /** Cycle length in ms while auto-advancing: draws a progress track that restarts on each step. */
  readonly cycleMs?: number | null
  readonly className?: string
}

/**
 * Toggle chips with one highlight that glides to the pressed chip (Motion
 * `layoutId`), and an optional progress track while the group advances by
 * itself.
 */
export function Chips({ items, value, onPick, label, group, solid = false, cycleMs = null, className }: ChipsProps) {
  return (
    <div role="group" aria-label={label} className={[f.chips, className].filter(Boolean).join(' ')}>
      {items.map((item, index) => (
        <button key={item.id} type="button" aria-pressed={index === value} className={[f.chip, solid ? f.chipSolid : ''].join(' ')} onClick={() => onPick(index)}>
          {index === value ? <m.span layoutId={`${group}-chip`} className={f.chipHighlight} /> : null}
          <span>{item.label}</span>
        </button>
      ))}
      {cycleMs ? (
        <span className={f.track} aria-hidden>
          <i key={value} className={f.trackFill} style={{ '--cycle': `${cycleMs}ms` } as CSSProperties} />
        </span>
      ) : null}
    </div>
  )
}

/**
 * A group that advances by itself every `ms` while its root is in view, its
 * tab is shown and motion is allowed, and stops for good on the first hover,
 * focus or press inside it (BENTO_V2.md "Accessibility"; BENTO_MOTION.md
 * "Loops": a scripted loop stops on `visibilitychange`). Returns the index, a setter that
 * also stops the cycle, whether it is still cycling, and the root to watch.
 */
export function useCycle<T extends HTMLElement>(count: number, ms: number): readonly [index: number, pick: (index: number) => void, cycling: boolean, root: RefObject<T | null>] {
  const root = useRef<T | null>(null)
  const allowed = useMotionAllowed()
  const [index, setIndex] = useState(0)
  const [stopped, setStopped] = useState(false)
  const [visible, setVisible] = useState(false)
  const [shown, setShown] = useState(true)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const seen = new IntersectionObserver(([entry]) => setVisible(entry?.isIntersecting ?? false), { threshold: 0.35 })
    const stop = (): void => setStopped(true)
    const tab = (): void => setShown(document.visibilityState === 'visible')
    seen.observe(el)
    el.addEventListener('pointerenter', stop)
    el.addEventListener('focusin', stop)
    document.addEventListener('visibilitychange', tab)
    return () => {
      seen.disconnect()
      el.removeEventListener('pointerenter', stop)
      el.removeEventListener('focusin', stop)
      document.removeEventListener('visibilitychange', tab)
    }
  }, [])

  const cycling = allowed && visible && shown && !stopped && count > 1
  useEffect(() => {
    if (!cycling) return
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % count), ms)
    return () => window.clearInterval(timer)
  }, [cycling, count, ms])

  const pick = (next: number): void => {
    setStopped(true)
    setIndex(next)
  }
  return [index, pick, cycling, root] as const
}
