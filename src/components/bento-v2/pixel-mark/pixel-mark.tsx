'use client'

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import s from './pixel-mark.module.css'
import { GLINT_HZ, SQUARE, drawMark, flightsOf, restAlpha, type MarkColours, type Placement } from './pixel-draw'
import { labRoot, motionAllowed, paintRoot } from '@/components/bento-lab/lab-state'
import { parseHex, type LabPalette } from '@/components/bento-lab/palette'
import { useCanvasLoop } from '@/components/bento-lab/use-canvas-loop'
import { MARK_PARTS, MARK_VARS, type MarkPart } from '@/lib/brand/mark'
import { PIXEL_LANTERN } from '@/lib/brand/pixel-lantern.gen'
import { V2_MOTION } from '@/lib/design/v2-scenes'

/** Named inputs to the assembly; each scene owns one, and the mark draws their product (BENTO_V2.md "Pixel mark"). */
export type MarkChannel = 'scroll'

export interface PixelMarkHandle {
  /** Sets a channel, 0 scattered to 1 whole. */
  set(channel: MarkChannel, value: number): void
  /** Returns a channel to rest, whole. */
  clear(channel: MarkChannel): void
}

interface PixelMarkProps {
  /** Places the Lantern: a class on the spot the mark fills, positioned by the caller's stylesheet. Without it the canvas is dust alone. */
  readonly spot?: string
  readonly dust?: boolean
  /** Assemble on mount. The server's whole mark is then kept for readers without scripts, so the assembly never hides a mark already seen. */
  readonly intro?: boolean
  readonly className?: string
}

const colourCache = new WeakMap<LabPalette, MarkColours>()
const FLIGHTS = flightsOf(PIXEL_LANTERN)
const GUTTER = (1 - SQUARE) / 2

/** The mark's paint in the theme `palette` was read in; read once per palette. */
function coloursOf(canvas: HTMLCanvasElement, palette: LabPalette): MarkColours {
  const cached = colourCache.get(palette)
  if (cached) return cached
  const css = getComputedStyle(paintRoot(canvas))
  const token = (name: string) => parseHex(css.getPropertyValue(name))
  const parts = Object.fromEntries(MARK_PARTS.map((part) => [part, token(MARK_VARS[part])])) as Record<MarkPart, LabPalette['ink']>
  const colours: MarkColours = { ...parts, dust: token('--lab-line'), glint: palette.ink }
  colourCache.set(palette, colours)
  return colours
}

/** The spot's box in the canvas's CSS pixels, with any scale on a shared ancestor (a plate opening) taken out. */
const placementOf = (spot: HTMLElement | null, canvas: HTMLCanvasElement): Placement | null => {
  if (!spot) return null
  const a = spot.getBoundingClientRect()
  const b = canvas.getBoundingClientRect()
  const scale = canvas.clientWidth > 0 && b.width > 0 ? b.width / canvas.clientWidth : 1
  return { x: (a.left - b.left) / scale, y: (a.top - b.top) / scale, width: a.width / scale, height: a.height / scale }
}

/**
 * The pixel Lantern. The server draws its cells as an SVG inside the spot,
 * so the mark is whole before any script; after hydration a canvas over the
 * whole box takes over: dust on the mark's grid, the mark assembling on load
 * when asked and following its channels. A frame with nothing changed paints
 * nothing. Decorative: the name is in the text beside it.
 */
export const PixelMark = forwardRef<PixelMarkHandle, PixelMarkProps>(function PixelMark({ spot, dust = true, intro = false, className }, handle) {
  const canvas = useRef<HTMLCanvasElement | null>(null)
  const spotRef = useRef<HTMLDivElement | null>(null)
  const channels = useRef(new Map<MarkChannel, number>())
  const born = useRef<number | null>(null)
  const place = useRef<Placement | null>(null)
  const last = useRef('')
  const paintedOnce = useRef(false)
  const [painted, setPainted] = useState(false)
  const hasMark = spot !== undefined

  useImperativeHandle(handle, () => ({
    set: (channel, value) => void channels.current.set(channel, value),
    clear: (channel) => void channels.current.delete(channel),
  }))

  useEffect(() => {
    const el = canvas.current
    if (intro && el && motionAllowed(labRoot(el))) born.current = performance.now()
  }, [intro])

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number, seconds: number, palette: LabPalette, fresh: boolean) => {
      if (fresh) place.current = placementOf(spotRef.current, ctx.canvas)
      const allowed = motionAllowed(labRoot(ctx.canvas))
      const since = born.current === null || !allowed ? Infinity : performance.now() - born.current
      const introShare = Math.min(1, since / V2_MOTION.introMs)
      const assemble = allowed ? [...channels.current.values()].reduce((product, value) => product * value, introShare) : 1
      const key = `${assemble.toFixed(3)}|${Math.floor(seconds * GLINT_HZ)}`
      if (!fresh && key === last.current) return
      last.current = key
      drawMark(ctx, width, height, {
        mark: hasMark ? PIXEL_LANTERN : null,
        colours: coloursOf(ctx.canvas, palette),
        place: place.current,
        assemble,
        seconds,
        dust,
        fieldRows: PIXEL_LANTERN.rows,
      })
      if (!paintedOnce.current) {
        paintedOnce.current = true
        setPainted(true)
      }
    },
    [hasMark, dust],
  )

  useCanvasLoop(canvas, draw, { fps: 60, follow: spotRef })

  return (
    <div className={[s.box, className].filter(Boolean).join(' ')} aria-hidden>
      {hasMark ? (
        <div ref={spotRef} className={[s.spot, spot].join(' ')}>
          {painted ? null : (
            <svg className={[s.fallback, intro ? s.introFallback : ''].join(' ')} viewBox={`0 0 ${PIXEL_LANTERN.cols} ${PIXEL_LANTERN.rows}`} preserveAspectRatio="xMidYMid meet">
              {PIXEL_LANTERN.cells.map((cell, i) => (
                <rect
                  key={`${cell.col}-${cell.row}`}
                  x={cell.col + GUTTER}
                  y={cell.row + GUTTER}
                  width={SQUARE}
                  height={SQUARE}
                  fill={`var(${MARK_VARS[cell.part]})`}
                  fillOpacity={restAlpha(FLIGHTS[i]?.shade ?? 1, cell.cover)}
                />
              ))}
            </svg>
          )}
        </div>
      ) : null}
      <canvas ref={canvas} className={s.canvas} />
    </div>
  )
})
