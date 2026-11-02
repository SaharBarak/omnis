'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import b from './blocks.module.css'
import { artTint, DayArtwork, moonPath, moonStart } from './board-art'
import kit from '../kit.module.css'
import { Rolling, useIllustration, useReveal, type RevealPhase, type RollDirection } from '../motion'
import type { DayFace, TodayFigures } from '@/lib/today-figures'
import { CURVE, DURATION, STAGGER, staggerStep } from '@/lib/design/motion-tokens'
import type { SystemKey } from '@/lib/system-preferences'
import type { TodayAcrossSystems } from '@/lib/today-board'
import { TODAY_ROWS, todayRows, type TodayRowValue } from '@/lib/today-rows'

/** The map layer each calendar reads, so a row takes its layer's colour (BENTO_MOTION.md "Palette"). */
const ROW_LAYER: Partial<Readonly<Record<SystemKey, string>>> = {
  dreamspell: 'var(--layer-kin)',
  longcount: 'var(--layer-kin)',
  astrology: 'var(--layer-sky)',
  sidereal: 'var(--layer-sky)',
  moon: 'var(--layer-sky)',
  panchang: 'var(--layer-sky)',
  humandesign: 'var(--layer-body)',
  hebrew: 'var(--layer-number)',
}

type TileShape = 'feature' | 'wide'

/** Rows whose drawing needs more room than one cell. */
const ROW_SHAPE: Partial<Readonly<Record<keyof TodayAcrossSystems, TileShape>>> = {
  kin: 'feature',
  longCount: 'wide',
}

/** The board's columns below and above its container breakpoint (blocks.module.css reads them). */
const COLUMNS = Object.freeze({ narrow: 2, wide: 4 })

/** Cells a tile covers: a feature is two columns, and two rows once the board is wide. */
const cellsOf = (shape: TileShape | undefined, columns: number): number => {
  if (shape === 'feature') return columns === COLUMNS.wide ? 4 : 2
  return shape === 'wide' ? 2 : 1
}

/** How many columns the last tile spans so the board's last row has no gap. */
const lastSpan = (shapes: readonly (TileShape | undefined)[], columns: number): number => {
  const used = shapes.reduce((sum, shape) => sum + cellsOf(shape, columns), 0)
  const last = shapes[shapes.length - 1]
  const own = last === undefined ? 1 : Math.min(cellsOf(last, columns), columns)
  return own + ((columns - (used % columns)) % columns)
}

const SYSTEM_OF = new Map(TODAY_ROWS.map((row) => [row.field, row.system]))

/** How many tiles have rolled in: all at rest, none while armed, one more every stagger step once shown. */
function useRolledIn(phase: RevealPhase, count: number): number {
  const [rolled, setRolled] = useState(0)
  useEffect(() => {
    if (phase !== 'shown') return
    const step = staggerStep(count)
    const timers = Array.from({ length: count }, (_, i) => window.setTimeout(() => setRolled(i + 1), i * step))
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [phase, count])
  if (phase === 'rest') return count
  return phase === 'armed' ? 0 : rolled
}

/**
 * A value that rolls in like an odometer. The plain copy holds the layout and
 * is what assistive tech reads; the rolling copy over it is hidden from it, so
 * a blank roll never empties the board for anyone.
 */
function Value({ text, on, direction, className }: { text: string; on: boolean; direction: RollDirection; className: string }) {
  return (
    <span className={`${b.value} ${className}`}>
      <span className={b.ghost}>{text}</span>
      <span className={b.roller} aria-hidden>
        <Rolling value={on ? text : ''} direction={direction} />
      </span>
    </span>
  )
}

/**
 * How the board's day has moved: which way the last step went (a later day
 * rolls up, an earlier one down) and how many steps there have been, so each
 * new day plays the drawings again.
 */
function useDaySteps(day: string | undefined): { readonly direction: RollDirection; readonly steps: number } {
  const [seen, setSeen] = useState({ day, direction: 'up' as RollDirection, steps: 0 })
  if (seen.day !== day) {
    setSeen({ day, direction: day !== undefined && seen.day !== undefined && day < seen.day ? 'down' : 'up', steps: seen.steps + 1 })
  }
  return seen
}

function Tile({ row, face, on, direction, last }: { row: TodayRowValue; face: DayFace | undefined; on: boolean; direction: RollDirection; last?: CSSProperties }) {
  const system = SYSTEM_OF.get(row.field)
  const tint = artTint(face?.art) ?? (system && ROW_LAYER[system]) ?? 'var(--lab-text-2)'
  return (
    <div
      className={b.tile}
      data-field={row.field}
      data-art={face?.art.kind}
      data-shape={face ? ROW_SHAPE[row.field] : undefined}
      data-last={last ? '' : undefined}
      style={{ '--tile': tint, ...last } as CSSProperties}
    >
      <dt className={b.tileLabel}>
        <span className={b.tileDot} aria-hidden />
        {row.label}
      </dt>
      <dd className={b.tileBody}>
        {face && (
          <span className={b.art} aria-hidden>
            <DayArtwork art={face.art} />
          </span>
        )}
        <span className={b.face}>
          <Value text={face?.big ?? row.value} on={on} direction={direction} className={face ? b.big : b.plain} />
          {face && <span className={b.small}>{face.small}</span>}
          {face?.note && <span className={b.note}>{face.note}</span>}
        </span>
      </dd>
    </div>
  )
}

/**
 * Today across the calendars as a board of tiles (storyboard 5, "Every day").
 * Rows, labels and the on/off rule come from today-rows.ts; `figures`
 * (`todayFigures`, src/lib/today-figures.ts) gives each row its drawing. Entering view, the values
 * roll in one tile after another (Motion), then the kin ring turns to the
 * day's seal, the Moon fills to its phase and the hexagram builds from the
 * bottom (anime.js). When `day` steps to another day, the values roll the
 * way the day moved and the drawings play again. Server markup is the
 * finished board.
 */
export function TodayBoard({
  board,
  day,
  limit,
  enabled,
  figures,
}: {
  readonly board: TodayAcrossSystems
  /** The ISO day `board` was computed for. */
  readonly day?: string
  readonly limit?: number
  readonly enabled?: Partial<Readonly<Record<SystemKey, boolean>>>
  readonly figures?: TodayFigures
}) {
  const rows = todayRows(board, enabled).slice(0, limit)
  const ref = useRef<HTMLDListElement>(null)
  const phase = useReveal(ref)
  const rolled = useRolledIn(phase, rows.length)
  const { direction, steps } = useDaySteps(day)
  /** True once every tile has rolled in, so a later day's drawings start without waiting on the roll-in. */
  const settled = useRef(false)
  useEffect(() => {
    settled.current = rolled === rows.length
  }, [rolled, rows.length])

  useIllustration(
    ref,
    ({ anime, root, ease }) => {
      // An entrance plays once, on entering view; a new day plays the drawings again wherever the board is.
      if (phase === 'rest' && steps === 0) return
      const ring = root.querySelector<HTMLElement>('[data-turn]')
      const moon = root.querySelector<SVGPathElement>('[data-moon]')
      const lines = Array.from(root.querySelectorAll<HTMLElement>('[data-hex-line]'))
      const angle = Number(moon?.dataset.moon ?? 0)
      const start = moonStart(angle)
      if (ring) anime.utils.set(ring, { rotate: Number(ring.dataset.turn ?? 0) })
      if (lines.length > 0) anime.utils.set(lines, { scaleX: 0 })
      moon?.setAttribute('d', moonPath(start))
      // From the data, not a captured path: by cleanup React may already have committed a newer day.
      const restore = () => {
        if (moon) moon.setAttribute('d', moonPath(Number(moon.dataset.moon ?? 0)))
      }
      if (phase === 'armed') return restore
      const delay = settled.current || phase === 'rest' ? DURATION.quick : staggerStep(rows.length) * (rows.length - 1) + DURATION.quick
      if (ring) anime.animate(ring, { rotate: 0, duration: DURATION.draw, delay, ease: ease(CURVE.emphasized) })
      if (moon) {
        const sweep = { angle: start }
        anime.animate(sweep, { angle, duration: DURATION.draw, delay, ease: ease(CURVE.standard), onUpdate: () => moon.setAttribute('d', moonPath(sweep.angle)) })
      }
      if (lines.length > 0) {
        anime.animate(lines, { scaleX: 1, duration: DURATION.settle, delay: anime.stagger(STAGGER.step, { from: 'last', start: delay }), ease: ease(CURVE.standard) })
      }
      return restore
    },
    [phase, rows.length, steps],
  )

  const shapes = rows.map((row) => (figures?.[row.field] ? ROW_SHAPE[row.field] : undefined))
  const last = { '--span-narrow': lastSpan(shapes, COLUMNS.narrow), '--span-wide': lastSpan(shapes, COLUMNS.wide) } as CSSProperties
  return (
    <div className={`${b.boardWrap} ${kit.contours}`}>
      <dl ref={ref} className={b.board} style={{ '--cols-narrow': COLUMNS.narrow, '--cols-wide': COLUMNS.wide } as CSSProperties}>
        {rows.map((row, i) => (
          <Tile key={row.field} row={row} face={figures?.[row.field]} on={i < rolled} direction={direction} last={i === rows.length - 1 ? last : undefined} />
        ))}
      </dl>
    </div>
  )
}
