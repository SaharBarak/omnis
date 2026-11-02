'use client'

import { useEffect, type RefObject } from 'react'
import { labRoot, motionAllowed, watchLabRoot } from './lab-state'
import { readPalette, type LabPalette } from './palette'

export type DrawFrame = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  seconds: number,
  palette: LabPalette,
) => void

interface LoopOptions {
  readonly fps?: number
  readonly dprCap?: number
}

/**
 * Drives one canvas: sizes it to its box at a capped device pixel ratio (and
 * again when that ratio changes), animates only while on screen and while the
 * lab's motion is allowed, and re-reads the palette when the theme flips.
 */
export function useCanvasLoop(
  ref: RefObject<HTMLCanvasElement | null>,
  draw: DrawFrame,
  { fps = 24, dprCap = 2 }: LoopOptions = {},
): void {
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const root = labRoot(canvas)
    const frameGap = 1000 / fps
    let palette = readPalette(root)
    let width = 0
    let height = 0
    let visible = false
    let raf = 0
    let lastFrame = 0
    let clock = 0
    let clockAt = performance.now()
    let dprQuery: MediaQueryList | null = null

    const advance = (now: number): void => {
      if (motionAllowed(root)) clock += (now - clockAt) / 1000
      clockAt = now
    }

    const paint = (): void => {
      if (width > 0 && height > 0) draw(ctx, width, height, clock, palette)
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
      const box = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap)
      width = box.width
      height = box.height
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
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
      palette = readPalette(root)
      sync()
    })

    sizeObserver.observe(canvas)
    viewObserver.observe(canvas)
    watchDpr()

    return () => {
      cancelAnimationFrame(raf)
      sizeObserver.disconnect()
      viewObserver.disconnect()
      stopWatching()
      dprQuery?.removeEventListener('change', onDprChange)
    }
  }, [ref, draw, fps, dprCap])
}
