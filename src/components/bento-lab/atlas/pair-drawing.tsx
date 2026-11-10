import { useId, type CSSProperties } from 'react'
import s from './atlas.module.css'
import { PERSON_LABEL, TIE_LABEL, type Point } from './geometry'
import { HALO_GAP } from './mark-geometry'
import { pairLayout, PAIR_GAP, tieKey, type PairLayout } from './pair-layout'
import { AtlasLayers } from './person-atlas'
import { pairPerson, TIE_END, type PairSide } from './tie-geometry'
import type { PairAtlas } from '@/lib/atlas/types'

function Arrow({ at, angle, layer }: { at: Point; angle: number; layer: string }) {
  return (
    <path
      d={`M 0 0 L ${-TIE_END.arrowLength} ${-TIE_END.arrowHalf} L ${-TIE_END.arrowLength} ${TIE_END.arrowHalf} Z`}
      transform={`translate(${at[0]} ${at[1]}) rotate(${angle})`}
      className={s.tieEnd}
      data-layer={layer}
      data-tie-end="to"
    />
  )
}

/**
 * Each tie carries hooks for an illustration and for being read: its rank
 * (`data-tie`, rarest first) and its key (`data-tie-key`, its place in the
 * reading), the line (`pathLength` 1, so a draw-in is one dash), its two ends
 * and its label. Every label draws after every line, so the pill that
 * answers the pointer is the one on top. The keyed group owns the opacity
 * reading dims; the group inside it carries the tie's own.
 */
function Ties({ layout }: { layout: PairLayout }) {
  return (
    <g data-tie-art="">
      {layout.ties.map(({ tie, index, rank, layer, stroke, curve }) => {
        const [from, , , to] = curve.controls
        return (
          <g key={index} data-tie={rank} data-tie-key={tieKey(index)}>
            <g opacity={stroke.opacity}>
              <path
                d={curve.d}
                className={s.tie}
                data-layer={layer}
                strokeWidth={stroke.width}
                style={{ '--tie-lit': stroke.width + 2 * HALO_GAP } as CSSProperties}
                pathLength={1}
                data-tie-line=""
              />
              <circle cx={from[0]} cy={from[1]} r={TIE_END.dot} className={s.tieEnd} data-layer={layer} data-tie-end="from" />
              {tie.acts ? (
                <Arrow at={to} angle={curve.endAngle} layer={layer} />
              ) : (
                <circle cx={to[0]} cy={to[1]} r={TIE_END.dot} className={s.tieEnd} data-layer={layer} data-tie-end="to" />
              )}
            </g>
          </g>
        )
      })}
      {layout.ties.map(({ index, rank, stroke, curve, label: { text, box } }) => (
        <g key={index} data-tie={rank} data-tie-key={tieKey(index)}>
          <g opacity={stroke.opacity}>
            <g data-tie-label="">
              <rect x={box.x0} y={box.y0} width={box.x1 - box.x0} height={box.y1 - box.y0} rx={TIE_LABEL.height / 2} className={s.tieLabelBg} />
              <text x={curve.mid[0]} y={curve.mid[1]} className={s.tieLabel} style={{ fontSize: TIE_LABEL.fontSize }}>
                {text}
              </text>
            </g>
          </g>
        </g>
      ))}
    </g>
  )
}

function Person({ pair, layout, side }: { pair: PairAtlas; layout: PairLayout; side: PairSide }) {
  const [x, y] = layout.origins[side]
  return (
    <g transform={`translate(${x} ${y})`} data-person={side}>
      <AtlasLayers atlas={pair[side]} />
    </g>
  )
}

function Name({ pair, layout, side }: { pair: PairAtlas; layout: PairLayout; side: PairSide }) {
  const [x, y] = layout.names[side]
  return (
    <>
      <text x={x} y={y} className={s.personName} style={{ fontSize: PERSON_LABEL.name }}>
        {pairPerson(pair, side).name}
      </text>
      <text x={x} y={y + PERSON_LABEL.name} className={s.personSub} style={{ fontSize: PERSON_LABEL.sub }}>
        Kin {pair[side].maya.kin}, {pair[side].maya.title}
      </text>
    </>
  )
}

/**
 * Each drawn tie's current (BENTO_SITE.md, "Ties explain themselves"): a
 * short dash that runs its line from the end it leaves, rarer ties brighter.
 * Its own layer, out of the reading order and paint contained, so its
 * repaint stays off the maps, and masked out of the labels it passes. The
 * stylesheet runs it only while motion is allowed, the draw-in has landed
 * and the drawing is in view.
 */
export function PairCurrents({ layout }: { layout: PairLayout }) {
  const mask = useId()
  const { width, height } = layout.view
  return (
    <svg className={s.currents} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">
      <mask id={mask}>
        <rect width={width} height={height} fill="white" />
        {layout.ties.map(({ index, label: { box } }) => (
          <rect key={index} x={box.x0} y={box.y0} width={box.x1 - box.x0} height={box.y1 - box.y0} rx={TIE_LABEL.height / 2} fill="black" />
        ))}
      </mask>
      <g mask={`url(#${mask})`}>
        {layout.ties.map(({ index, curve, stroke }) => (
          <path
            key={index}
            d={curve.d}
            pathLength={1}
            className={s.current}
            data-tie-key={tieKey(index)}
            style={{ '--current-ink': stroke.opacity, '--current-width': stroke.width } as CSSProperties}
          />
        ))}
      </g>
    </svg>
  )
}

export interface FrameProps {
  readonly pair: PairAtlas
  readonly layout: PairLayout
  readonly label: string
  readonly describedBy?: string
}

const viewBox = ({ view }: PairLayout): string => `0 0 ${view.width} ${view.height}`

/** One orientation of the drawing, drawn whole: both maps, the ties over them, the names. */
export function PairFrameArt({ pair, layout, label, describedBy }: FrameProps) {
  return (
    <svg viewBox={viewBox(layout)} role="img" aria-label={label} aria-describedby={describedBy}>
      <Person pair={pair} layout={layout} side="a" />
      <Person pair={pair} layout={layout} side="b" />
      <Ties layout={layout} />
      <Name pair={pair} layout={layout} side="a" />
      <Name pair={pair} layout={layout} side="b" />
    </svg>
  )
}

/**
 * The same frame as three stacked layers sharing one view box: each person
 * (map and name), then the ties on top. The pair's sequence moves the layers
 * as whole boxes, so the drawing is composited, never repainted, while it moves.
 */
function LayeredFrame({ pair, layout, label, describedBy }: FrameProps) {
  const box = viewBox(layout)
  return (
    <div
      className={s.pairStack}
      data-pair-stack=""
      data-axis={layout.axis}
      style={{ '--pair-w': layout.view.width, '--pair-h': layout.view.height } as CSSProperties}
    >
      {(['a', 'b'] as const).map((side) => (
        <svg key={side} viewBox={box} aria-hidden data-side={side}>
          <Person pair={pair} layout={layout} side={side} />
          <Name pair={pair} layout={layout} side={side} />
        </svg>
      ))}
      <svg viewBox={box} role="img" aria-label={label} aria-describedby={describedBy} data-ties="">
        <Ties layout={layout} />
      </svg>
    </div>
  )
}

/** The drawing's name: who, and how many ties it draws. */
export const pairLabel = (pair: PairAtlas, layout: PairLayout): string => {
  const count = layout.ties.length
  return `${pair.people[0].name} and ${pair.people[1].name}: ${count} ${count === 1 ? 'tie' : 'ties'} rare enough to draw`
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
export function PairDrawing({ pair, describedBy, className, gap = PAIR_GAP, layered = false }: PairDrawingProps) {
  const wide = pairLayout(pair, 'landscape', gap)
  const label = pairLabel(pair, wide)
  const Draw = layered ? LayeredFrame : PairFrameArt
  return (
    <div className={[s.relation, s.tokens, className].filter(Boolean).join(' ')}>
      <div className={s.landscape} data-orient="landscape">
        <Draw pair={pair} layout={wide} label={label} describedBy={describedBy} />
      </div>
      <div className={s.portrait} data-orient="portrait">
        <Draw pair={pair} layout={pairLayout(pair, 'portrait')} label={label} describedBy={describedBy} />
      </div>
    </div>
  )
}
