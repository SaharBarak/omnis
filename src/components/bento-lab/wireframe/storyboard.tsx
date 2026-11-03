import type { ReactNode } from 'react'
import s from './wireframe.module.css'

/**
 * Motion storyboards (docs/redesign/BENTO_MOTION.md "Storyboards"): a strip
 * of greyscale frames per section. Each frame names its moment, the engine
 * that moves what, and draws the movement as dashed arrows.
 */

export type Engine = 'GSAP' | 'anime.js' | 'Motion' | 'CSS' | 'still'

export const W = 320
export const H = 200

export interface StoryFrame {
  /** Scroll position ("scroll 40%") or time ("t = 900 ms"). */
  readonly at: string
  readonly engine: Engine
  readonly caption: string
  readonly draw: ReactNode
}

export interface StoryboardProps {
  readonly id: string
  readonly code: string
  readonly title: string
  readonly kind: string
  /** The section's composition, in one line. */
  readonly layout: string
  readonly frames: readonly StoryFrame[]
  /** What the reduced-motion reader sees instead. */
  readonly still: string
}

const ENGINE_MARK: Readonly<Record<Engine, ReactNode>> = {
  GSAP: <rect x={-4} y={-4} width={8} height={8} />,
  'anime.js': <circle r={4.5} />,
  Motion: <path d="M0 -5 L5 4 L-5 4 Z" />,
  CSS: <path d="M0 -5 L5 0 L0 5 L-5 0 Z" />,
  still: <path d="M-4 -4 L4 4 M4 -4 L-4 4" strokeWidth={1.6} />,
}

function EngineTag({ engine }: { readonly engine: Engine }) {
  return (
    <span className={s.engine}>
      <svg width={12} height={12} viewBox="-6 -6 12 12" aria-hidden className={s.engineMark}>
        {ENGINE_MARK[engine]}
      </svg>
      {engine}
    </span>
  )
}

export function Storyboard({ id, code, title, kind, layout, frames, still }: StoryboardProps) {
  return (
    <section id={id} className={s.figure} aria-labelledby={`${id}-title`}>
      <header className={s.head}>
        <span>
          <b id={`${id}-title`}>
            {code} · {title}
          </b>
        </span>
        <span>{kind}</span>
      </header>
      <p className={s.storyStill} style={{ margin: '0 0 12px' }}>
        <b>Layout:</b> {layout}
      </p>
      <ol className={s.story}>
        {frames.map((f, i) => (
          <li key={f.at} className={s.storyFrame}>
            <div className={s.storyTop}>
              <span className={s.storyN}>{i + 1}</span>
              <span>{f.at}</span>
              <EngineTag engine={f.engine} />
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className={s.storyCanvas} role="img" aria-label={f.caption}>
              <defs>
                <marker id={`${id}-arrow-${i}`} viewBox="0 0 8 8" refX={7} refY={4} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
                  <path d="M0 0 L8 4 L0 8 Z" className={s.storyArrowHead} />
                </marker>
              </defs>
              <g style={{ ['--arrow' as string]: `url(#${id}-arrow-${i})` }}>{f.draw}</g>
            </svg>
            <p className={s.storyCaption}>{f.caption}</p>
          </li>
        ))}
      </ol>
      <p className={s.storyStill}>
        <b>Reduced motion:</b> {still}
      </p>
    </section>
  )
}

/* ---------- drawing vocabulary, greyscale ---------- */

export type Pt = readonly [number, number]

const arcD = (cx: number, cy: number, r: number, from: number, to: number): string => {
  const p = (deg: number): Pt => [cx + r * Math.cos(((deg - 90) * Math.PI) / 180), cy + r * Math.sin(((deg - 90) * Math.PI) / 180)]
  const [x1, y1] = p(from)
  const [x2, y2] = p(to)
  const large = to - from > 180 ? 1 : 0
  return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`
}

/** A ring; `drawn` is the share already stroked (0..1), the rest dashed. */
export const Ring = ({ c = [160, 100] as Pt, r, drawn = 1, faint }: { c?: Pt; r: number; drawn?: number; faint?: boolean }) => (
  <g>
    <circle cx={c[0]} cy={c[1]} r={r} className={s.storyGhost} />
    {drawn > 0 && (drawn >= 1 ? <circle cx={c[0]} cy={c[1]} r={r} className={faint ? s.storyFaint : s.storyLine} /> : <path d={arcD(c[0], c[1], r, 0, drawn * 360)} className={s.storyLine} />)}
  </g>
)

/** Small marks around a ring: `count` of them, `shown` visible, the `lit` index ringed. */
export const Marks = ({ c = [160, 100] as Pt, r, count, shown = count, lit, size = 4 }: { c?: Pt; r: number; count: number; shown?: number; lit?: number; size?: number }) => (
  <g>
    {Array.from({ length: shown }, (_, i) => {
      const a = ((i / count) * 360 - 90) * (Math.PI / 180)
      const x = c[0] + r * Math.cos(a)
      const y = c[1] + r * Math.sin(a)
      return (
        <g key={i}>
          {i === lit && <circle cx={x} cy={y} r={size + 3} className={s.storyLine} />}
          <circle cx={x} cy={y} r={size / 2} className={s.storyDot} />
        </g>
      )
    })}
  </g>
)

export const Box = ({ x, y, w, h, label, dashed, solid }: { x: number; y: number; w: number; h: number; label?: string; dashed?: boolean; solid?: boolean }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={6} className={solid ? s.storySolid : dashed ? s.storyGhost : s.storyBox} />
    {label && (
      <text x={x + w / 2} y={y + h / 2 + 3} className={s.storyText}>
        {label}
      </text>
    )}
  </g>
)

export const Line = ({ a, b, dashed, bold }: { a: Pt; b: Pt; dashed?: boolean; bold?: boolean }) => (
  <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className={bold ? s.storyBold : dashed ? s.storyGhost : s.storyLine} />
)

export const Curve = ({ a, b, lift = 30, drawn = 1 }: { a: Pt; b: Pt; lift?: number; drawn?: number }) => {
  const mx = (a[0] + b[0]) / 2
  const my = (a[1] + b[1]) / 2 - lift
  return <path d={`M${a[0]} ${a[1]} Q${mx} ${my} ${b[0]} ${b[1]}`} className={s.storyBold} pathLength={1} strokeDasharray={`${drawn} 1`} />
}

/** The movement: a dashed arrow from a to b. */
export const Move = ({ a, b }: { a: Pt; b: Pt }) => (
  <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className={s.storyMove} style={{ markerEnd: 'var(--arrow)' }} />
)

/** A curved movement around a centre, for rotation. */
export const Turn = ({ c = [160, 100] as Pt, r, from, to }: { c?: Pt; r: number; from: number; to: number }) => (
  <path d={arcD(c[0], c[1], r, from, to)} className={s.storyMove} style={{ markerEnd: 'var(--arrow)' }} />
)

export const Note = ({ x, y, children, anchor = 'middle' }: { x: number; y: number; children: ReactNode; anchor?: 'start' | 'middle' | 'end' }) => (
  <text x={x} y={y} className={s.storyText} textAnchor={anchor}>
    {children}
  </text>
)

/** The viewport edge, for scenes that pin or fit the screen. */
export const Viewport = ({ label = 'viewport' }: { label?: string }) => (
  <g>
    <rect x={4} y={4} width={W - 8} height={H - 8} rx={8} className={s.storyViewport} />
    <text x={W - 10} y={16} className={s.storyText} textAnchor="end">
      {label}
    </text>
  </g>
)

/** A bodygraph silhouette: nine centres joined by channels; `filled` of them solid. */
export const Bodygraph = ({ c = [160, 100] as Pt, scale = 1, filled = 9, channels = 1 }: { c?: Pt; scale?: number; filled?: number; channels?: number }) => {
  const pts: readonly Pt[] = [[0, -52], [0, -34], [0, -14], [-22, 6], [22, 6], [0, 18], [-24, 34], [24, 34], [0, 50]]
  const at = ([x, y]: Pt): Pt => [c[0] + x * scale, c[1] + y * scale]
  const edges: readonly (readonly [number, number])[] = [[0, 1], [1, 2], [2, 5], [2, 3], [2, 4], [5, 6], [5, 7], [5, 8], [3, 6], [4, 7]]
  return (
    <g>
      {edges.map(([i, j], k) => {
        const [x1, y1] = at(pts[i])
        const [x2, y2] = at(pts[j])
        return <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} className={k / edges.length < channels ? s.storyBold : s.storyGhost} />
      })}
      {pts.map((p, i) => {
        const [x, y] = at(p)
        return <rect key={i} x={x - 5 * scale} y={y - 5 * scale} width={10 * scale} height={10 * scale} className={i < filled ? s.storySolid : s.storyBox} />
      })}
    </g>
  )
}

/** One map layer seen edge-on, for the exploded view: an ellipse with its name. */
export const Plate = ({ cy, label, lit, cx = 160, rx = 78 }: { cy: number; label?: string; lit?: boolean; cx?: number; rx?: number }) => (
  <g>
    <ellipse cx={cx} cy={cy} rx={rx} ry={rx * 0.24} className={lit ? s.storyBoldPlate : s.storyBox} />
    {label && (
      <text x={cx + rx + 6} y={cy + 3} className={s.storyText} textAnchor="start">
        {label}
      </text>
    )}
  </g>
)
