import type { CSSProperties } from 'react'
import { mayDrawEdge } from '@pleiad/engine/services/rarity'
import s from './atlas.module.css'
import { C, labelWidth, PERSON_LABEL, TIE_LABEL } from './geometry'
import { AtlasLayers } from './person-atlas'
import { bowedCurve, TIE_LAYER, tieAnchor, tieStroke } from './tie-geometry'
import type { PairAtlas } from '@/lib/atlas/types'
import { centerName, type Tie } from '@/lib/relations/pair-ties'
import { tieName } from '@/lib/relations/tie-text'

const SIZE = C * 2
/** Space between the maps when they sit side by side, unless a caller sets its own. */
const GAP = 140
const LIFT_FIRST = 46
const LIFT_STEP = 38
const LABEL_H = TIE_LABEL.height
const NAME_BAND = 64

type Point = readonly [number, number]
type Side = 'a' | 'b'

interface Frame {
  readonly width: number
  readonly height: number
  /** The direction the two maps sit apart in: x side by side, y stacked. */
  readonly axis: 'x' | 'y'
  readonly a: Point
  readonly b: Point
  readonly bow: Point
  /** The maps' outer edge along `bow`: arcs lift from here, so they run outside both maps. */
  readonly clear: number
  readonly names: readonly [Point, Point]
}

/** Room the arcs need beyond the rings: the highest lift plus half a label. */
const reach = (ties: number): number => (ties === 0 ? 0 : LIFT_FIRST + (ties - 1) * LIFT_STEP + LABEL_H)

const landscape = (ties: number, gap: number): Frame => {
  const top = reach(ties)
  return {
    width: SIZE * 2 + gap,
    height: top + SIZE + NAME_BAND,
    axis: 'x',
    a: [0, top],
    b: [SIZE + gap, top],
    bow: [0, -1],
    clear: -top,
    names: [
      [C, top + SIZE + 34],
      [SIZE + gap + C, top + SIZE + 34],
    ],
  }
}

const portrait = (ties: number): Frame => ({
  width: SIZE + reach(ties),
  height: SIZE * 2 + GAP + NAME_BAND,
  axis: 'y',
  a: [0, 0],
  b: [0, SIZE + GAP],
  bow: [1, 0],
  clear: SIZE,
  names: [
    [C, SIZE + 30],
    [C, SIZE * 2 + GAP + 30],
  ],
})

const shift = ([x, y]: Point, [dx, dy]: Point): Point => [x + dx, y + dy]

function Arrow({ at, angle, layer }: { at: Point; angle: number; layer: string }) {
  return (
    <path
      d="M 0 0 L -14 -7 L -14 7 Z"
      transform={`translate(${at[0]} ${at[1]}) rotate(${angle})`}
      className={s.tieEnd}
      data-layer={layer}
      data-tie-end="to"
    />
  )
}

/**
 * Each tie carries hooks for an illustration: its rank (`data-tie`, rarest
 * first), the line (`pathLength` 1, so a draw-in is one dash), its two ends
 * and its label.
 */
function Ties({ pair, frame, ties }: { pair: PairAtlas; frame: Frame; ties: readonly Tie[] }) {
  return (
    <g>
      {ties.map((tie, i) => {
        const layer = TIE_LAYER[tie.system]
        const pa = shift(tieAnchor(tie, 'a', pair.a), frame.a)
        const pb = shift(tieAnchor(tie, 'b', pair.b), frame.b)
        const towardA = tie.acts?.on === pair.people[0].id
        const [from, to] = towardA ? [pb, pa] : [pa, pb]
        const curve = bowedCurve(from, to, frame.bow, LIFT_FIRST + i * LIFT_STEP, frame.clear)
        const stroke = tieStroke(tie.bits)
        const label = tieName(tie, centerName)
        const w = labelWidth(label)
        return (
          <g key={`${tie.system}-${tie.type}-${tie.channel ?? ''}-${i}`} opacity={stroke.opacity} data-tie={i}>
            <path d={curve.d} className={s.tie} data-layer={layer} strokeWidth={stroke.width} pathLength={1} data-tie-line="" />
            <circle cx={from[0]} cy={from[1]} r={6} className={s.tieEnd} data-layer={layer} data-tie-end="from" />
            {tie.acts ? (
              <Arrow at={to} angle={curve.endAngle} layer={layer} />
            ) : (
              <circle cx={to[0]} cy={to[1]} r={6} className={s.tieEnd} data-layer={layer} data-tie-end="to" />
            )}
            <g data-tie-label="">
              <rect x={curve.mid[0] - w / 2} y={curve.mid[1] - LABEL_H / 2} width={w} height={LABEL_H} rx={LABEL_H / 2} className={s.tieLabelBg} />
              <text x={curve.mid[0]} y={curve.mid[1]} className={s.tieLabel} style={{ fontSize: TIE_LABEL.fontSize }}>
                {label}
              </text>
            </g>
          </g>
        )
      })}
    </g>
  )
}

function Person({ pair, frame, side }: { pair: PairAtlas; frame: Frame; side: Side }) {
  const at = side === 'a' ? frame.a : frame.b
  return (
    <g transform={`translate(${at[0]} ${at[1]})`}>
      <AtlasLayers atlas={side === 'a' ? pair.a : pair.b} />
    </g>
  )
}

function Name({ pair, frame, side }: { pair: PairAtlas; frame: Frame; side: Side }) {
  const [x, y] = side === 'a' ? frame.names[0] : frame.names[1]
  const atlas = side === 'a' ? pair.a : pair.b
  return (
    <>
      <text x={x} y={y} className={s.personName} style={{ fontSize: PERSON_LABEL.name }}>
        {pair.people[side === 'a' ? 0 : 1].name}
      </text>
      <text x={x} y={y + PERSON_LABEL.name} className={s.personSub} style={{ fontSize: PERSON_LABEL.sub }}>
        Kin {atlas.maya.kin}, {atlas.maya.title}
      </text>
    </>
  )
}

interface FrameProps {
  readonly pair: PairAtlas
  readonly frame: Frame
  readonly ties: readonly Tie[]
  readonly label: string
  readonly describedBy?: string
}

function Frame({ pair, frame, ties, label, describedBy }: FrameProps) {
  return (
    <svg viewBox={`0 0 ${frame.width} ${frame.height}`} role="img" aria-label={label} aria-describedby={describedBy}>
      <Person pair={pair} frame={frame} side="a" />
      <Person pair={pair} frame={frame} side="b" />
      <Ties pair={pair} frame={frame} ties={ties} />
      <Name pair={pair} frame={frame} side="a" />
      <Name pair={pair} frame={frame} side="b" />
    </svg>
  )
}

/**
 * The same frame as three stacked layers sharing one view box: each person
 * (map and name), then the ties on top. The pair's sequence moves the layers
 * as whole boxes, so the drawing is composited, never repainted, while it moves.
 */
function LayeredFrame({ pair, frame, ties, label, describedBy }: FrameProps) {
  const box = `0 0 ${frame.width} ${frame.height}`
  return (
    <div
      className={s.pairStack}
      data-pair-stack=""
      data-axis={frame.axis}
      style={{ '--pair-w': frame.width, '--pair-h': frame.height } as CSSProperties}
    >
      {(['a', 'b'] as const).map((side) => (
        <svg key={side} viewBox={box} aria-hidden data-side={side}>
          <Person pair={pair} frame={frame} side={side} />
          <Name pair={pair} frame={frame} side={side} />
        </svg>
      ))}
      <svg viewBox={box} role="img" aria-label={label} aria-describedby={describedBy} data-ties="">
        <Ties pair={pair} frame={frame} ties={ties} />
      </svg>
    </div>
  )
}

export interface PairDrawingProps {
  readonly pair: PairAtlas
  readonly describedBy?: string
  readonly className?: string
  /** Space between the maps when they sit side by side, in drawing units. */
  readonly gap?: number
  /** Draw each person and the ties on their own stacked layer, for a scene that moves them. */
  readonly layered?: boolean
}

/**
 * Two atlases with a line for every selective or rare tie the engine found,
 * drawn between the exact marks it names. Wide screens set the people side by
 * side; narrow screens stack them.
 */
export function PairDrawing({ pair, describedBy, className, gap = GAP, layered = false }: PairDrawingProps) {
  const drawn = pair.reading.ties.filter((t) => mayDrawEdge(t.baseRate))
  const label = `${pair.people[0].name} and ${pair.people[1].name}: ${drawn.length} ${drawn.length === 1 ? 'tie' : 'ties'} rare enough to draw`
  const Draw = layered ? LayeredFrame : Frame
  return (
    <div className={[s.relation, s.tokens, className].filter(Boolean).join(' ')}>
      <div className={s.landscape} data-orient="landscape">
        <Draw pair={pair} frame={landscape(drawn.length, gap)} ties={drawn} label={label} describedBy={describedBy} />
      </div>
      <div className={s.portrait} data-orient="portrait">
        <Draw pair={pair} frame={portrait(drawn.length)} ties={drawn} label={label} describedBy={describedBy} />
      </div>
    </div>
  )
}
