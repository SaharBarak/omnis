'use client'

import { useCallback, useEffect, useRef, type RefObject } from 'react'
import { labRoot, motionAllowed, paintRoot, watchLabRoot } from './lab-state'
import { readPalette, type LabPalette } from './palette'

export type DrawFrame = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  seconds: number,
  palette: LabPalette,
  /** True when the canvas was just cleared (sized) or the palette changed: a draw that skips unchanged frames must paint this one. */
  fresh: boolean,
) => void

interface LoopOptions {
  readonly fps?: number
  readonly dprCap?: number
  /** An element whose box the drawing depends on (a spot it fits into): when it resizes, the next frame is fresh. */
  readonly follow?: RefObject<Element | null>
}

/**
 * Drives one canvas: sizes it to its box at a capped device pixel ratio (and
 * again when that ratio changes, or when the element it follows resizes), animates only while on screen and while the
 * lab's motion is allowed, and re-reads the palette when the theme flips.
 * Returns a repaint: one frame painted now where no loop is running (off
 * screen, or motion off), for a drawing whose input changed without a frame
 * to carry it.
 */
export function useCanvasLoop(
  ref: RefObject<HTMLCanvasElement | null>,
  draw: DrawFrame,
  { fps = 24, dprCap = 2, follow }: LoopOptions = {},
): () => void {
  const repaint = useRef<() => void>(() => {})
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const root = labRoot(canvas)
    const scope = paintRoot(canvas)
    const frameGap = 1000 / fps
    let palette = readPalette(scope)
    let width = 0
    let height = 0
    let visible = false
    let raf = 0
    let lastFrame = 0
    let clock = 0
    let clockAt = performance.now()
    let dprQuery: MediaQueryList | null = null
    let fresh = true

    const advance = (now: number): void => {
      if (motionAllowed(root)) clock += (now - clockAt) / 1000
      clockAt = now
    }

    const paint = (): void => {
      if (width <= 0 || height <= 0) return
      draw(ctx, width, height, clock, palette, fresh)
      fresh = false
    }

    const loop = (now: number): void => {
      raf = requestAnimationFrame(loop)
      if (now - lastFrame < frameGap) return
      lastFrame = now
      advance(now)
      paint()
    }

    const sync = (): void => {
      cancelAnimationFrame(raf)
      raf = 0
      advance(performance.now())
      if (visible && motionAllowed(root)) raf = requestAnimationFrame(loop)
      else paint()
    }

    const resize = (): void => {
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap)
      /* The layout box, not the painted one: a scale on an ancestor (a plate opening) must not shrink the bitmap. */
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      fresh = true
      paint()
    }

    const watchDpr = (): void => {
      dprQuery?.removeEventListener('change', onDprChange)
      dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`)
      dprQuery.addEventListener('change', onDprChange)
    }
    function onDprChange(): void {
      resize()
      watchDpr()
    }

    const sizeObserver = new ResizeObserver(resize)
    const viewObserver = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false
      sync()
    })
    const stopWatching = watchLabRoot(root, () => {
      palette = readPalette(scope)
      fresh = true
      sync()
    })

    repaint.current = () => {
      if (raf === 0) paint()
    }

    sizeObserver.observe(canvas)
    if (follow?.current) sizeObserver.observe(follow.current)
    viewObserver.observe(canvas)
    watchDpr()

    return () => {
      repaint.current = () => {}
      cancelAnimationFrame(raf)
      sizeObserver.disconnect()
      viewObserver.disconnect()
      stopWatching()
      dprQuery?.removeEventListener('change', onDprChange)
    }
  }, [ref, draw, fps, dprCap, follow])
  return useCallback(() => repaint.current(), [])
}
