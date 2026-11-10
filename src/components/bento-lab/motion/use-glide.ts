'use client'

import { useLayoutEffect, useRef, type RefObject } from 'react'
import { release } from './inline-style'
import { useMotionAllowed } from './use-motion-allowed'
import { CURVE, DURATION } from '@/lib/design/motion-tokens'

/** What a glide borrows from each element, returned when it lands or is torn down. */
const GLIDE_STYLES = ['transform'] as const

export interface GlidePoint {
  readonly id: string
  /** Position as a share of the container, 0..1 on each axis. */
  readonly x: number
  readonly y: number
}

/**
 * Glides each `[data-glide="<id>"]` child of `rootRef` from its previous spot
 * to its new one when `points` change (storyboard H, "new date"). Set back
 * before paint with a transform, then anime.js returns it home; layout stays
 * where React put it.
 */
export function useGlide(rootRef: RefObject<HTMLElement | null>, points: readonly GlidePoint[]): void {
  const allowed = useMotionAllowed()
  const previous = useRef<ReadonlyMap<string, GlidePoint>>(new Map())
  const key = points.map((p) => `${p.id}:${p.x.toFixed(4)},${p.y.toFixed(4)}`).join('|')
  useLayoutEffect(() => {
    const before = previous.current
    previous.current = new Map(points.map((p) => [p.id, p]))
    const root = rootRef.current
    if (!allowed || !root) return
    // Layout size, not the drawn rect: the offsets are set in the root's own pixels, which a zoom or a transform on an ancestor rescales.
    const width = root.clientWidth
    const height = root.clientHeight
    const moves = points.flatMap((p) => {
      const from = before.get(p.id)
      const el = root.querySelector<HTMLElement>(`[data-glide="${p.id}"]`)
      if (!from || !el) return []
      const dx = (from.x - p.x) * width
      const dy = (from.y - p.y) * height
      return Math.hypot(dx, dy) < 0.5 ? [] : [{ el, dx, dy }]
    })
    if (moves.length === 0) return
    for (const { el, dx, dy } of moves) el.style.transform = `translate(${dx}px, ${dy}px)`
    let disposed = false
    const stops: (() => void)[] = []
    void import('animejs').then(({ animate, cubicBezier }) => {
      if (disposed) return
      for (const { el, dx, dy } of moves) {
        const a = animate(el, {
          x: [dx, 0],
          y: [dy, 0],
          duration: DURATION.settle,
          ease: cubicBezier(...CURVE.emphasized),
          onComplete: () => release(el, GLIDE_STYLES),
        })
        stops.push(() => a.revert())
      }
    })
    return () => {
      disposed = true
      stops.forEach((stop) => stop())
      for (const { el } of moves) release(el, GLIDE_STYLES)
    }
    // `key` stands for `points`; it changes exactly when a position does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, allowed, rootRef])
}
