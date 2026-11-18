'use client'

import { useLayoutEffect, type RefObject } from 'react'
import { LIFT_SCALE } from '@/lib/design/motion-tokens'

interface Box {
  readonly width: number
  readonly height: number
}

/**
 * The scale at which a figure fills a room without leaving it, and never
 * past one level of the type scale (`LIFT_SCALE`), so figures of different
 * sizes keep one voice in one room; 1 where either has no size yet.
 */
export const fitScale = (room: Box, figure: Box): number =>
  room.width > 0 && room.height > 0 && figure.width > 0 && figure.height > 0 ? Math.min(LIFT_SCALE, room.width / figure.width, room.height / figure.height) : 1

/**
 * Fits a figure to its room (BENTO_V2.md "The stage", Fit): writes the
 * scale as `--fit` on the figure whenever either box changes, read from
 * their layout sizes, which a transform never moves. The stylesheet applies
 * it; no size is written for any figure or window.
 */
export function useFit(room: RefObject<HTMLElement | null>, figure: RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    const box = room.current
    const el = figure.current
    if (!box || !el) return
    const fit = () => el.style.setProperty('--fit', String(fitScale({ width: box.clientWidth, height: box.clientHeight }, { width: el.offsetWidth, height: el.offsetHeight })))
    fit()
    if (typeof ResizeObserver !== 'function') return
    const watch = new ResizeObserver(fit)
    watch.observe(box)
    watch.observe(el)
    return () => watch.disconnect()
  }, [room, figure])
}
