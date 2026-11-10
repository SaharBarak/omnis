import { CENTER_POSITIONS, VIEW_HEIGHT, VIEW_WIDTH } from '@/components/human-design/bodygraph-layout'

/**
 * Atlas geometry, shared by the SVG and the HTML pins laid over it. Pure.
 * Rings are proportions of one radius, so the drawing scales as a unit.
 */

export const SIZE = 640
export const C = SIZE / 2

/** A drawing's view box, in drawing units: a person's atlas is the square, a pair its frame. */
export interface View {
  readonly width: number
  readonly height: number
}

export const SQUARE: View = Object.freeze({ width: SIZE, height: SIZE })
const R = C - 8

export const RING = {
  skyOuter: R,
  signTrack: R * 0.935,
  skyInner: R * 0.875,
  arcTrack: R * 0.85,
  planetTrack: R * 0.8,
  mayaOuter: R * 0.735,
  sealTrack: R * 0.675,
  mayaInner: R * 0.615,
  bodyRadius: R * 0.59,
} as const

export type Point = readonly [number, number]

const rad = (deg: number): number => (deg * Math.PI) / 180

/**
 * Coordinates are rounded to 1/100 px: server and browser trig can differ in
 * the last digit, and an unrounded value would fail hydration.
 */
export const px = (n: number): number => Math.round(n * 100) / 100

/** Screen point at radius r and angle deg (0 = 3 o'clock, counter-clockwise). */
export const polar = (r: number, deg: number): Point => [px(C + r * Math.cos(rad(deg))), px(C - r * Math.sin(rad(deg)))]

export const norm = (deg: number): number => ((deg % 360) + 360) % 360

/**
 * Tie labels on the relation drawings. The drawings set `fontSize` on the
 * text, so the pill behind it is sized from the same number: glyph count
 * times the font size times the average advance of a glyph in ems, which
 * covers Latin and Hebrew text set in the site faces.
 */
export const TIE_LABEL = Object.freeze({
  fontSize: 13,
  /** Average glyph advance, in ems. */
  advance: 0.56,
  padX: 10,
  height: 26,
})

/** A person's name and the line under it on the relation drawings; the drawings set these sizes on the text. */
export const PERSON_LABEL = Object.freeze({ name: 22, sub: 14 })

/** Combining marks (Hebrew points, accents) sit on the letter before them and take no width. */
const MARKS = /\p{M}/gu

/** Estimated width of a line of text set at `fontSize`, from its glyph count and the average advance. */
export const textWidth = (text: string, fontSize: number): number => px(Array.from(text.replace(MARKS, '')).length * fontSize * TIE_LABEL.advance)

/** Width of the pill behind a tie label. */
export const labelWidth = (label: string): number => px(textWidth(label, TIE_LABEL.fontSize) + 2 * TIE_LABEL.padX)

/** An axis-aligned box in drawing units. */
export interface Box {
  readonly x0: number
  readonly y0: number
  readonly x1: number
  readonly y1: number
}

/** How far a sampled outline may stray from the curve it follows, in drawing units: under a quarter of a pixel at the design size. */
const OUTLINE_TOLERANCE = 0.25

/**
 * The outline of a pill set in `box`: its long sides joined by half circles
 * as wide as the box is short, each sampled finely enough to stray from its
 * arc by no more than OUTLINE_TOLERANCE, clockwise from the top left.
 */
export function stadiumOutline({ x0, y0, x1, y1 }: Box): readonly Point[] {
  const r = Math.min(x1 - x0, y1 - y0) / 2
  const steps = Math.max(2, Math.ceil(Math.PI / (2 * Math.acos(Math.max(-1, 1 - OUTLINE_TOLERANCE / r)))))
  const cap = ([cx, cy]: Point, from: number): readonly Point[] =>
    Array.from({ length: steps + 1 }, (_, i): Point => {
      const angle = from + (Math.PI * i) / steps
      return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)]
    })
  return [...cap([x1 - r, y0 + r], -Math.PI / 2), ...cap([x0 + r, y0 + r], Math.PI / 2)]
}

/** A w×h box centred on a point. */
export const boxAround = ([x, y]: Point, w: number, h: number): Box => ({ x0: x - w / 2, y0: y - h / 2, x1: x + w / 2, y1: y + h / 2 })

export const overlaps = (p: Box, q: Box): boolean => p.x0 < q.x1 && q.x0 < p.x1 && p.y0 < q.y1 && q.y0 < p.y1

/**
 * Where along the segment a→b a w×h label can sit without covering anything
 * in `blocked`: the clear point nearest `prefer` (0 at a, 1 at b), tried
 * every half label height along the segment. Null when no point is clear, so
 * the caller can leave the label to the table instead of drawing it over a
 * name.
 */
export function placeAlong(a: Point, b: Point, prefer: number, w: number, h: number, blocked: readonly Box[]): Point | null {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1])
  if (length === 0) return null
  const step = h / 2 / length
  const count = Math.floor(1 / step)
  const ts = Array.from({ length: count + 1 }, (_, i) => i * step).sort((p, q) => Math.abs(p - prefer) - Math.abs(q - prefer))
  for (const t of ts) {
    const point: Point = [px(a[0] + (b[0] - a[0]) * t), px(a[1] + (b[1] - a[1]) * t)]
    const box = boxAround(point, w, h)
    if (!blocked.some((other) => overlaps(box, other))) return point
  }
  return null
}

/** Sky: the ascendant (or 0° Aries without one) sits at 9 o'clock, longitude runs counter-clockwise. */
export const skyAngle = (longitude: number, ascendant: number | null): number => norm(180 + longitude - (ascendant ?? 0))

/** Maya: the person's seal at 12 o'clock, seals 1-20 running clockwise. */
export const sealAngle = (seal: number, lit: number): number => norm(90 - (seal - lit) * 18)

/** SVG arc path along radius r from angle a to b, taking the short way round. */
export const arcPath = (r: number, a: number, b: number): string => {
  const sweep = ((norm(b - a) + 180) % 360) - 180
  const [x1, y1] = polar(r, a)
  const [x2, y2] = polar(r, a + sweep)
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 ${sweep > 0 ? 0 : 1} ${x2.toFixed(2)} ${y2.toFixed(2)}`
}

/** Twice the signed area `a`, `b`, `c` turn through: its sign is the way the path turns at `b`. */
const turn = ([ax, ay]: Point, [bx, by]: Point, [cx, cy]: Point): number => (bx - ax) * (cy - by) - (by - ay) * (cx - bx)

/**
 * The closed path `gap` outside a convex outline, in either winding: each
 * edge moved out along its normal, each corner rounded about its vertex at
 * radius `gap`. Every point of it stands `gap` off the outline, so it is
 * concentric with the shape it wraps (BENTO_TYPE.md: a ring follows the
 * shape it wraps), as a circle `gap` wider is with a disc. A repeated point
 * is one corner; an outline with no area, or one that turns both ways, has
 * no such path, and gives null.
 */
export function concentricPath(outline: readonly Point[], gap: number): string | null {
  const corners = outline.filter((p, i) => p[0] !== outline.at(i - 1)![0] || p[1] !== outline.at(i - 1)![1])
  const next = (i: number): Point => corners[(i + 1) % corners.length]
  const turns = corners.map((p, i) => turn(p, next(i), next(i + 1)))
  const winding = Math.sign(turns.reduce((sum, t) => sum + t, 0))
  if (corners.length < 3 || winding === 0 || turns.some((t) => t * winding < 0)) return null
  const normals = corners.map(([x0, y0], i): Point => {
    const [x1, y1] = next(i)
    const length = Math.hypot(x1 - x0, y1 - y0)
    return [(winding * (y1 - y0)) / length, (winding * (x0 - x1)) / length]
  })
  const off = ([x, y]: Point, [nx, ny]: Point): string => `${px(x + nx * gap)} ${px(y + ny * gap)}`
  const sweep = winding > 0 ? 1 : 0
  const sides = corners.map((vertex, i) => `A ${gap} ${gap} 0 0 ${sweep} ${off(vertex, normals[i])} L ${off(next(i), normals[i])}`)
  return `M ${off(corners[0], normals.at(-1)!)} ${sides.join(' ')} Z`
}

interface Cluster {
  readonly items: readonly { readonly a: number; readonly i: number }[]
  readonly first: number
  readonly last: number
}

const layCluster = (items: Cluster['items'], gap: number): Cluster => {
  const mean = items.reduce((sum, it) => sum + it.a, 0) / items.length
  const first = mean - ((items.length - 1) * gap) / 2
  return { items, first, last: first + (items.length - 1) * gap }
}

/**
 * Spread angles so neighbours sit at least `gap` degrees apart, each cluster
 * centred on its own mean. The circle is cut at its widest empty gap, so a
 * cluster across 0° stays whole. Returns display angles in input order.
 */
export function spreadAngles(angles: readonly number[], gap: number): number[] {
  if (angles.length < 2) return angles.map(norm)
  const sorted = angles.map((a, i) => ({ a: norm(a), i })).sort((x, y) => x.a - y.a || x.i - y.i)
  const widest = sorted.reduce(
    (best, it, k) => {
      const next = sorted[(k + 1) % sorted.length]
      const span = norm(next.a - it.a) || (sorted.length === 1 ? 360 : 0)
      return span > best.span ? { k: (k + 1) % sorted.length, span } : best
    },
    { k: 0, span: -1 },
  )
  const start = sorted[widest.k].a
  const line = [...sorted.slice(widest.k), ...sorted.slice(0, widest.k)].map((it) => ({ a: start + norm(it.a - start), i: it.i }))

  let clusters: Cluster[] = line.map((it) => layCluster([it], gap))
  for (let merged = true; merged; ) {
    merged = false
    const next: Cluster[] = []
    for (const cluster of clusters) {
      const prev = next.at(-1)
      if (prev && prev.last + gap > cluster.first + 1e-9) {
        next[next.length - 1] = layCluster([...prev.items, ...cluster.items], gap)
        merged = true
      } else {
        next.push(cluster)
      }
    }
    clusters = next
  }

  const out = new Array<number>(angles.length)
  for (const cluster of clusters) {
    cluster.items.forEach((it, k) => {
      out[it.i] = norm(cluster.first + k * gap)
    })
  }
  return out
}

/** Furthest point of the bodygraph from its own middle, read from the layout. */
const BODY_EXTENT = Math.max(
  ...Object.values(CENTER_POSITIONS).map((p) => Math.hypot(p.x - VIEW_WIDTH / 2, p.y - VIEW_HEIGHT / 2) + p.size),
)

export const BODY_SCALE = RING.bodyRadius / BODY_EXTENT

/** Places bodygraph layout coordinates into the atlas. */
export const bodyTransform = `translate(${px(C - (VIEW_WIDTH / 2) * BODY_SCALE)} ${px(C - (VIEW_HEIGHT / 2) * BODY_SCALE)}) scale(${BODY_SCALE.toFixed(5)})`

export const bodyPoint = (x: number, y: number): Point => [
  px(C + (x - VIEW_WIDTH / 2) * BODY_SCALE),
  px(C + (y - VIEW_HEIGHT / 2) * BODY_SCALE),
]

/** A point as percentages of the drawing's box, for HTML laid over the SVG. */
export const percent = ([x, y]: Point, view: View = SQUARE): { readonly left: string; readonly top: string } => ({
  left: `${((x / view.width) * 100).toFixed(3)}%`,
  top: `${((y / view.height) * 100).toFixed(3)}%`,
})
