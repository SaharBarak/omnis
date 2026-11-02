import { mayDrawEdge } from '@pleiad/engine/services/rarity'
import s from './atlas.module.css'
import { boxAround, labelWidth, PERSON_LABEL, placeAlong, px, textWidth, TIE_LABEL, type Box } from './geometry'
import { TIE_LAYER, tieStroke } from './tie-geometry'
import type { CircleAtlas } from '@/lib/atlas/types'
import { centerName, type Tie } from '@/lib/relations/pair-ties'
import { tieName } from '@/lib/relations/tie-text'

const W = 960
const H = 780
const RADIUS = 300
/** Where along an edge its label would rather sit, from the hub end: clear of the hub's own crowd. */
const LABEL_AT = 0.45
const NODE_R = 40
const GLYPH = 34
/** A person's two lines under the disc: baseline offset from the disc's edge, and size. The text takes its size from here. */
const NAME = Object.freeze({ line: 24, size: PERSON_LABEL.name })
const SUB = Object.freeze({ line: 44, size: PERSON_LABEL.sub })

/** Room the full frame keeps round the ring for names; a fitted frame keeps the same. */
const MARGIN = Object.freeze({ x: W / 2 - RADIUS, y: H / 2 - RADIUS })

type Point = readonly [number, number]

const place = (x: number, y: number): Point => [px(W / 2 + x * RADIUS), px(H / 2 + y * RADIUS)]

/** The full frame, or the frame cropped to where the people sit with the same margin for names. */
const viewBox = (seats: readonly Point[], fit: boolean): string => {
  if (!fit || seats.length === 0) return `0 0 ${W} ${H}`
  const xs = seats.map(([x]) => x)
  const ys = seats.map(([, y]) => y)
  const x0 = Math.min(...xs) - MARGIN.x
  const y0 = Math.min(...ys) - MARGIN.y
  return `${px(x0)} ${px(y0)} ${px(Math.max(...xs) + MARGIN.x - x0)} ${px(Math.max(...ys) + MARGIN.y - y0)}`
}

/** What a person keeps clear: the disc, and the two lines of words under it. */
const personBoxes = (point: Point, name: string, sub: string): readonly Box[] => {
  const [x, y] = point
  const words = Math.max(textWidth(name, NAME.size), textWidth(sub, SUB.size))
  return [
    boxAround(point, NODE_R * 2, NODE_R * 2),
    { x0: x - words / 2, y0: y + NODE_R + NAME.line - NAME.size, x1: x + words / 2, y1: y + NODE_R + SUB.line + SUB.size / 3 },
  ]
}

/** A seat's two lines of words: the name and, under it, the kin title. */
export interface SeatLabel {
  readonly name: string
  readonly sub: string
}

/**
 * How many people a circle seats: the hub, and as many around the ring as
 * the widest pair of lines fits along its circumference without touching.
 * Two seats on the ring sit at its top and bottom (layoutCircle starts at
 * -90°), so their lines never meet: the ring always holds two, and a circle
 * is never less than three people.
 */
export function circleSeats(labels: readonly SeatLabel[]): number {
  const widest = Math.max(NODE_R * 2, ...labels.map((l) => Math.max(textWidth(l.name, NAME.size), textWidth(l.sub, SUB.size))))
  return 1 + Math.max(2, Math.floor((2 * Math.PI * RADIUS) / widest))
}

interface PlacedLabel {
  readonly at: Point
  readonly w: number
  readonly text: string
}

/**
 * Labels for the rarest tier's lines, rarest first: each slides along its
 * line to the clear point nearest its preferred spot, clear of every person
 * and of the labels already placed. A label with no clear point is left to
 * the table.
 */
function placeLabels(
  edges: readonly { readonly key: string; readonly bits: number; readonly a: Point; readonly b: Point; readonly tie: Tie; readonly hubEdge: boolean }[],
  people: readonly { readonly point: Point; readonly name: string; readonly sub: string }[],
): ReadonlyMap<string, PlacedLabel> {
  const blocked: Box[] = people.flatMap((p) => personBoxes(p.point, p.name, p.sub))
  const placed = new Map<string, PlacedLabel>()
  for (const e of [...edges].filter((edge) => edge.tie.tier === 'T3').sort((p, q) => q.tie.bits - p.tie.bits)) {
    const text = tieName(e.tie, centerName)
    const w = labelWidth(text)
    const at = placeAlong(e.a, e.b, e.hubEdge ? LABEL_AT : 0.5, w, TIE_LABEL.height, blocked)
    if (!at) continue
    blocked.push(boxAround(at, w, TIE_LABEL.height))
    placed.set(e.key, { at, w, text })
  }
  return placed
}

export interface CircleDrawingProps {
  readonly circle: CircleAtlas
  readonly describedBy?: string
  readonly className?: string
  /** Add the hub's sonar ring: invisible at rest, for an illustration to send outward once. */
  readonly sonar?: boolean
  /** Crop the frame to where the people sit, so a group pulled in toward its hub fills a wide figure. */
  readonly fit?: boolean
}

/**
 * A group laid out by tie weight. Each line is the rarest drawable tie in
 * that pair; pairs with only common ties get no line. People and lines carry
 * hooks for an illustration (`data-node`, `data-edge` with the pair's bits,
 * `pathLength` 1 on each line).
 */
export function CircleDrawing({ circle, describedBy, className, sonar = false, fit = false }: CircleDrawingProps) {
  const at = new Map(circle.circle.nodes.map((n) => [n.id, place(n.x, n.y)]))
  const hub = at.get(circle.circle.hub) ?? place(0, 0)
  const edges = circle.circle.pairs.flatMap((p) => {
    const top = p.ties.find((t) => mayDrawEdge(t.baseRate))
    const a = at.get(p.a)
    const b = at.get(p.b)
    if (!top || !a || !b) return []
    const [near, far] = p.b === circle.circle.hub ? [b, a] : [a, b]
    return [{ key: `${p.a}-${p.b}`, bits: p.bits, a: near, b: far, tie: top, hubEdge: p.a === circle.circle.hub || p.b === circle.circle.hub }]
  })
  const labels = placeLabels(edges, circle.people.map((p) => ({ point: at.get(p.id) ?? place(0, 0), name: p.name, sub: p.maya.title })))
  return (
    <div className={[s.relation, s.tokens, className].filter(Boolean).join(' ')}>
      <svg
        viewBox={viewBox([...at.values()], fit)}
        role="img"
        aria-label={`${circle.people.length} people, ${edges.length} pairs with a tie rare enough to draw`}
        aria-describedby={describedBy}
      >
        {sonar && <circle cx={hub[0]} cy={hub[1]} r={NODE_R} className={s.sonar} data-sonar="" aria-hidden />}
        {edges.map((e) => {
          const stroke = tieStroke(e.tie.bits)
          const placed = labels.get(e.key)
          return (
            <g key={e.key} opacity={stroke.opacity} data-edge={e.key} data-bits={e.bits}>
              <line
                x1={e.a[0]}
                y1={e.a[1]}
                x2={e.b[0]}
                y2={e.b[1]}
                className={s.tie}
                data-layer={TIE_LAYER[e.tie.system]}
                strokeWidth={stroke.width}
                pathLength={1}
                data-edge-line=""
              />
              {placed && (
                <g data-edge-label="">
                  <rect
                    x={px(placed.at[0] - placed.w / 2)}
                    y={placed.at[1] - TIE_LABEL.height / 2}
                    width={placed.w}
                    height={TIE_LABEL.height}
                    rx={TIE_LABEL.height / 2}
                    className={s.tieLabelBg}
                  />
                  <text x={placed.at[0]} y={placed.at[1]} className={s.tieLabel} style={{ fontSize: TIE_LABEL.fontSize }}>
                    {placed.text}
                  </text>
                </g>
              )}
            </g>
          )
        })}
        {circle.people.map((p) => {
          const [x, y] = at.get(p.id) ?? place(0, 0)
          const isHub = p.id === circle.circle.hub
          return (
            <g key={p.id} data-node={p.id} data-hub={isHub ? '' : undefined}>
              <circle cx={x} cy={y} r={NODE_R} className={`${s.node} ${isHub ? s.nodeHub : ''}`} />
              <image href={p.maya.seal.src} x={x - GLYPH / 2} y={y - GLYPH / 2} width={GLYPH} height={GLYPH} className={s.glyph} />
              <text x={x} y={y + NODE_R + NAME.line} className={s.personName} style={{ fontSize: NAME.size }}>
                {p.name}
              </text>
              <text x={x} y={y + NODE_R + SUB.line} className={s.personSub} style={{ fontSize: SUB.size }}>
                {p.maya.title}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
