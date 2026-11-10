import type { CSSProperties } from 'react'
import b from './blocks.module.css'
import { GlyphMark } from '../glyph-mark'
import type { DayArt } from '@/lib/today-figures'

/** Drawings for the day board (TodayBoard). Pure markup: the final frame; board.tsx animates it. */

/** Radius of the Moon's disc in its -50..50 view box. */
export const MOON_R = 44

const round = (n: number): number => Math.round(n * 100) / 100

/**
 * The lit part of the Moon at a Sun–Moon elongation in degrees: the bright
 * limb (right while waxing, left while waning) closed by the terminator, a
 * half-ellipse whose width is |cos| of the elongation.
 */
export function moonPath(angle: number, r: number = MOON_R): string {
  const a = ((angle % 360) + 360) % 360
  const cos = Math.cos((a * Math.PI) / 180)
  const waxing = a <= 180
  const limb = waxing ? 1 : 0
  const terminator = waxing === cos > 0 ? 0 : 1
  return `M0 ${-r}A${r} ${r} 0 0 ${limb} 0 ${r}A${round(Math.abs(cos) * r)} ${r} 0 0 ${terminator} 0 ${-r}Z`
}

/** Elongation the Moon's fill starts from: new Moon on the side the light grows from. */
export const moonStart = (angle: number): number => (angle <= 180 ? 0 : 360)

const PLACE = 5

/** A bar-and-dot numeral, dots over bars, a shell for zero; sits on the bottom of its box. */
export function BarDot({ n, className }: { readonly n: number; readonly className?: string }) {
  const bars = Math.floor(n / PLACE)
  const dots = n % PLACE
  return (
    <svg viewBox="0 0 20 22" className={className} aria-hidden>
      {n === 0 && (
        <g className={b.shell}>
          <ellipse cx={10} cy={17} rx={8} ry={4.2} />
          <path d="M4.5 17.5Q10 13.8 15.5 17.5" />
        </g>
      )}
      {Array.from({ length: bars }, (_, i) => (
        <rect key={`b${i}`} x={1} y={22 - (i + 1) * PLACE + 1} width={18} height={3} rx={1.5} />
      ))}
      {Array.from({ length: dots }, (_, i) => (
        <circle key={`d${i}`} cx={10 + (i - (dots - 1) / 2) * 4.2} cy={22 - bars * PLACE - 2.6} r={1.8} />
      ))}
    </svg>
  )
}

function Seal({ art }: { art: Extract<DayArt, { kind: 'seal' }> }) {
  const step = 360 / art.seats
  return (
    <span className={b.seal}>
      <span className={b.sealRing} data-turn={(art.seat - 1) * step}>
        <svg viewBox="-50 -50 100 100">
          <circle r={46} className={b.ringLine} />
          {Array.from({ length: art.seats }, (_, i) => i + 1).map((seat) => (
            <line
              key={seat}
              x1={0}
              y1={-46}
              x2={0}
              y2={seat === art.seat ? -34 : -41}
              transform={`rotate(${(seat - art.seat) * step})`}
              className={seat === art.seat ? b.tickLit : b.tick}
            />
          ))}
        </svg>
      </span>
      <GlyphMark src={art.src} className={b.sealMark} />
      <BarDot n={art.tone} className={b.sealTone} />
    </span>
  )
}

function Moon({ angle }: { angle: number }) {
  return (
    <svg viewBox="-50 -50 100 100" className={b.moon}>
      <circle r={MOON_R} className={b.moonDark} />
      <path d={moonPath(angle)} className={b.moonLit} data-moon={angle} />
      <circle r={MOON_R} className={b.moonRim} />
    </svg>
  )
}

function Hexagram({ lines, active }: { lines: readonly boolean[]; active: number }) {
  const topFirst = lines.map((yang, i) => ({ yang, n: i + 1 })).reverse()
  return (
    <span className={b.hexagram}>
      {topFirst.map(({ yang, n }) => (
        <span key={n} className={b.hexLine} data-hex-line={n} data-active={n === active || undefined}>
          <span className={b.seg} />
          {!yang && <span className={b.seg} />}
        </span>
      ))}
    </span>
  )
}

const ELEMENT_RING = 34

function Elements({ order, lit }: { order: readonly string[]; lit: string }) {
  const seat = (i: number): readonly [number, number] => {
    const a = ((i / order.length) * 360 - 90) * (Math.PI / 180)
    return [round(Math.cos(a) * ELEMENT_RING), round(Math.sin(a) * ELEMENT_RING)]
  }
  return (
    <svg viewBox="-50 -50 100 100" className={b.elements}>
      <polygon points={order.map((_, i) => seat(i).join(',')).join(' ')} className={b.elementPath} />
      {order.map((element, i) => {
        const [x, y] = seat(i)
        const on = element === lit
        return (
          <circle
            key={element}
            cx={x}
            cy={y}
            r={on ? 11 : 5}
            className={on ? b.elementLit : b.element}
            style={{ '--el': `var(--el-${element.toLowerCase()})` } as CSSProperties}
          />
        )
      })}
    </svg>
  )
}

/** The drawing for one tile, aria-hidden: the tile's text says the same thing. */
export function DayArtwork({ art }: { readonly art: DayArt }) {
  switch (art.kind) {
    case 'seal':
      return <Seal art={art} />
    case 'glyph':
      return <GlyphMark src={art.src} className={b.signMark} />
    case 'moon':
      return <Moon angle={art.angle} />
    case 'hexagram':
      return <Hexagram lines={art.lines} active={art.active} />
    case 'script':
      return (
        <span lang={art.lang} dir="rtl" className={b.script}>
          {art.text}
        </span>
      )
    case 'bars':
      return (
        <span className={b.places}>
          {art.places.map((n, i) => (
            <BarDot key={i} n={n} className={b.place} />
          ))}
        </span>
      )
    case 'elements':
      return <Elements order={art.order} lit={art.lit} />
  }
}

/** The colour a tile takes from its art, when the art carries its own (an element). */
export const artTint = (art: DayArt | undefined): string | undefined =>
  art?.kind === 'elements' ? `var(--el-${art.lit.toLowerCase()})` : undefined
