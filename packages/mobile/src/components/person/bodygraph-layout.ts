// =============================================================================
// VERBATIM COPY — KEEP IN SYNC WITH THE WEB MODULE.
// Source: src/components/human-design/bodygraph-layout.ts (repo root).
// This is pure geometry (no DOM, no React) shared by the mobile bodygraph.
// Any change to the web layout must be mirrored here, and vice versa.
// =============================================================================

import type { CenterId } from '@pleiad/engine/types/human-design'
import { CHANNELS } from '@pleiad/engine/data/human-design-channels'

// =============================================================================
// SHARED BODYGRAPH GEOMETRY
// =============================================================================
// Single source of truth for the SVG anatomy used by BodygraphChart,
// CompositeBodygraphChart and PentaChart.
//
// This is a rigid template, authored in FINAL viewBox coordinates — the
// canonical bodygraph discipline (Jovian-style): channels are straight bars
// running gate-to-gate, every gate has one fixed mouth ON its center's edge,
// vertical bundles run in three lanes (x = 182 / 200 / 218), and the lateral
// triangles mirror each other. No post-hoc scaling: an earlier version
// stretched positions without stretching center sizes, which floated every
// channel mouth off its center's edge.
//
// Multi-channel gates (10, 20, 34, 57 of the integration bundle) share one
// mouth — their channels fan from a single gate node, as printed charts do.

export const VIEW_WIDTH = 400
export const VIEW_HEIGHT = 640

export interface CenterPosition {
  x: number
  y: number
  shape: 'triangle' | 'triangle-inv' | 'square' | 'diamond' | 'triangle-right' | 'triangle-left'
  size: number
}

/** Anatomical positions for each center. Spleen and solar mirror across x=200. */
export const CENTER_POSITIONS: Record<CenterId, CenterPosition> = {
  head:   { x: 200, y: 55,  shape: 'triangle',       size: 30 },
  ajna:   { x: 200, y: 145, shape: 'triangle-inv',   size: 30 },
  throat: { x: 200, y: 245, shape: 'square',          size: 28 },
  g:      { x: 200, y: 360, shape: 'diamond',         size: 32 },
  heart:  { x: 325, y: 315, shape: 'triangle-right',  size: 22 },
  spleen: { x: 60,  y: 450, shape: 'triangle-left',   size: 44 },
  sacral: { x: 200, y: 495, shape: 'square',          size: 28 },
  solar:  { x: 340, y: 450, shape: 'triangle-right',  size: 44 },
  root:   { x: 200, y: 585, shape: 'square',          size: 30 },
}

/** Colors for defined centers */
export const CENTER_COLORS: Record<CenterId, string> = {
  head:   '#F5C542',
  ajna:   '#5CB85C',
  throat: '#D4813B',
  g:      '#F5D442',
  heart:  '#E74C3C',
  spleen: '#C9822B',
  sacral: '#D44C3C',
  solar:  '#D4813B',
  root:   '#C9822B',
}

/** Soft fill used by the composite/penta charts' defined-center glow. */
export const CENTER_GLOW: Record<CenterId, string> = {
  head:   '#F5C54280',
  ajna:   '#5CB85C80',
  throat: '#D4813B80',
  g:      '#F5D44280',
  heart:  '#E74C3C80',
  spleen: '#C9822B80',
  sacral: '#D44C3C80',
  solar:  '#D4813B80',
  root:   '#C9822B80',
}

export function getCenterPath(pos: CenterPosition): string {
  const { x, y, shape, size } = pos
  switch (shape) {
    case 'triangle':
      return `M ${x} ${y - size} L ${x + size} ${y + size * 0.6} L ${x - size} ${y + size * 0.6} Z`
    case 'triangle-inv':
      return `M ${x} ${y + size} L ${x + size} ${y - size * 0.6} L ${x - size} ${y - size * 0.6} Z`
    case 'square':
      return `M ${x - size} ${y - size} L ${x + size} ${y - size} L ${x + size} ${y + size} L ${x - size} ${y + size} Z`
    case 'diamond':
      return `M ${x} ${y - size} L ${x + size} ${y} L ${x} ${y + size} L ${x - size} ${y} Z`
    case 'triangle-right':
      return `M ${x - size} ${y - size} L ${x + size} ${y} L ${x - size} ${y + size} Z`
    case 'triangle-left':
      return `M ${x + size} ${y - size} L ${x - size} ${y} L ${x + size} ${y + size} Z`
  }
}

// =============================================================================
// GATE MOUTHS — one fixed slot per gate, ON its center's edge.
// =============================================================================

export type Point = readonly [number, number]

/**
 * Every gate's mouth. Slots are spaced ≥12 units apart on shared edges so
 * r=6 chips never collide — no relaxation pass, no chips escaping shapes.
 *
 * Vertical lanes: x = 182 / 200 / 218 through head→ajna→throat→G→sacral→root.
 * Spleen right edge x = 104, solar left edge x = 296, seven slots each,
 * 12 apart, mirrored. Heart hangs off the G↔solar diagonal space.
 */
export const GATE_MOUTHS: Record<number, Point> = {
  // Head (bottom edge y=73)
  64: [182, 73], 61: [200, 73], 63: [218, 73],
  // Ajna (top edge y=127; lower slopes toward the vertex)
  47: [182, 127], 24: [200, 127], 4: [218, 127],
  17: [182, 146], 43: [200, 175], 11: [218, 146],
  // Throat (square 172..228 × 217..273)
  62: [182, 217], 23: [200, 217], 56: [218, 217],          // top
  16: [172, 234], 20: [172, 256],                           // left
  45: [228, 226], 35: [228, 242], 12: [228, 258],           // right
  31: [182, 273], 8: [200, 273], 33: [218, 273],            // bottom
  // G (diamond, vertices at (200,328) (232,360) (200,392) (168,360))
  7: [182, 346], 1: [200, 328], 13: [218, 346],             // upper
  10: [168, 360], 25: [232, 360],                           // side vertices
  15: [182, 374], 2: [200, 392], 46: [218, 374],            // lower
  // Heart (triangle-right at (325,315), left edge x=303)
  21: [303, 301], 51: [303, 315], 26: [303, 329], 40: [322, 328],
  // Spleen (right edge x=104, y 406..494 — seven slots, 12 apart)
  48: [104, 414], 57: [104, 426], 44: [104, 438], 50: [104, 450],
  32: [104, 462], 28: [104, 474], 18: [104, 486],
  // Solar (left edge x=296 — mirror of the spleen)
  36: [296, 414], 22: [296, 426], 37: [296, 438], 6: [296, 450],
  49: [296, 462], 55: [296, 474], 30: [296, 486],
  // Sacral (square 172..228 × 467..523)
  5: [182, 467], 14: [200, 467], 29: [218, 467],            // top
  34: [172, 483], 27: [172, 507],                           // left
  59: [228, 495],                                           // right
  42: [182, 523], 3: [200, 523], 9: [218, 523],             // bottom
  // Root (square 170..230 × 555..615)
  53: [182, 555], 60: [200, 555], 52: [218, 555],           // top
  54: [170, 565], 38: [170, 580], 58: [170, 595],           // left
  19: [230, 565], 39: [230, 580], 41: [230, 595],           // right
}

// =============================================================================
// CHANNEL LANES — straight gate-to-gate bars (one gentle bow where the
// integration bundle would otherwise overlap itself).
// =============================================================================

/**
 * Per-channel polyline, keyed by the engine channel id. The FIRST point is
 * the mouth of `gates[0]`, the LAST point the mouth of `gates[1]` (matching
 * the order in CHANNELS data). Two points = straight bar. Three points =
 * a single bowed curve (only 34-20, which must clear the 34-10 lane).
 */
const RAW_CHANNEL_PATHS: Record<string, readonly Point[]> = {
  // Head ↔ Ajna — three parallel lanes
  '64-47': [GATE_MOUTHS[64], GATE_MOUTHS[47]],
  '61-24': [GATE_MOUTHS[61], GATE_MOUTHS[24]],
  '63-4':  [GATE_MOUTHS[63], GATE_MOUTHS[4]],

  // Ajna ↔ Throat
  '17-62': [GATE_MOUTHS[17], GATE_MOUTHS[62]],
  '43-23': [GATE_MOUTHS[43], GATE_MOUTHS[23]],
  '11-56': [GATE_MOUTHS[11], GATE_MOUTHS[56]],

  // G ↔ Throat
  '7-31':  [GATE_MOUTHS[7], GATE_MOUTHS[31]],
  '1-8':   [GATE_MOUTHS[1], GATE_MOUTHS[8]],
  '13-33': [GATE_MOUTHS[13], GATE_MOUTHS[33]],

  // Integration bundle — straight fans from shared gate nodes; 34-20 bows
  // left so it never merges with 34-10 / 10-20.
  '10-20': [GATE_MOUTHS[10], GATE_MOUTHS[20]],
  '57-20': [GATE_MOUTHS[57], GATE_MOUTHS[20]],
  '34-20': [GATE_MOUTHS[34], [152, 368], GATE_MOUTHS[20]],
  '57-10': [GATE_MOUTHS[57], GATE_MOUTHS[10]],
  '34-10': [GATE_MOUTHS[34], GATE_MOUTHS[10]],
  '34-57': [GATE_MOUTHS[34], GATE_MOUTHS[57]],

  // Throat ↔ right side
  '21-45': [GATE_MOUTHS[21], GATE_MOUTHS[45]],
  '35-36': [GATE_MOUTHS[35], GATE_MOUTHS[36]],
  '12-22': [GATE_MOUTHS[12], GATE_MOUTHS[22]],

  // Heart neighborhood
  '25-51': [GATE_MOUTHS[25], GATE_MOUTHS[51]],
  // Bows under the G diamond — the straight chord clips its bottom corner.
  '26-44': [GATE_MOUTHS[26], [206, 406], GATE_MOUTHS[44]],
  '37-40': [GATE_MOUTHS[37], GATE_MOUTHS[40]],

  // G ↔ Sacral — three parallel lanes
  '5-15':  [GATE_MOUTHS[5], GATE_MOUTHS[15]],
  '14-2':  [GATE_MOUTHS[14], GATE_MOUTHS[2]],
  '29-46': [GATE_MOUTHS[29], GATE_MOUTHS[46]],

  // Sacral laterals
  '59-6':  [GATE_MOUTHS[59], GATE_MOUTHS[6]],
  '27-50': [GATE_MOUTHS[27], GATE_MOUTHS[50]],

  // Sacral ↔ Root — three parallel lanes
  '42-53': [GATE_MOUTHS[42], GATE_MOUTHS[53]],
  '3-60':  [GATE_MOUTHS[3], GATE_MOUTHS[60]],
  '9-52':  [GATE_MOUTHS[9], GATE_MOUTHS[52]],

  // Root ↔ Spleen — three parallel diagonals
  '54-32': [GATE_MOUTHS[54], GATE_MOUTHS[32]],
  '38-28': [GATE_MOUTHS[38], GATE_MOUTHS[28]],
  '58-18': [GATE_MOUTHS[58], GATE_MOUTHS[18]],

  // Root ↔ Solar — mirrored diagonals
  '49-19': [GATE_MOUTHS[49], GATE_MOUTHS[19]],
  '39-55': [GATE_MOUTHS[39], GATE_MOUTHS[55]],
  '41-30': [GATE_MOUTHS[41], GATE_MOUTHS[30]],

  // Spleen ↔ Throat
  '48-16': [GATE_MOUTHS[48], GATE_MOUTHS[16]],
}

/**
 * Sample a centripetal Catmull-Rom spline (α=0.5) through a polyline's
 * points. Only bowed channels (3+ points) curve; straight bars pass through
 * untouched. Centripetal parameterization never overshoots or loops around
 * unevenly spaced knots — the uniform variant did both. Endpoints exact.
 */
function smoothPolyline(points: readonly Point[], samplesPerSegment = 16): readonly Point[] {
  if (points.length <= 2) return points

  const alpha = 0.5
  const knot = (a: Point, b: Point, t: number) => t + Math.hypot(b[0] - a[0], b[1] - a[1]) ** alpha

  const out: Point[] = [points[0]]
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]

    const t0 = 0
    const t1 = knot(p0, p1, t0) || 1e-3
    const t2 = knot(p1, p2, t1)
    const t3 = knot(p2, p3, t2) || t2 + 1e-3

    for (let s = 1; s <= samplesPerSegment; s++) {
      const t = t1 + ((t2 - t1) * s) / samplesPerSegment
      const a1 = interp(p0, p1, t0, t1, t)
      const a2 = interp(p1, p2, t1, t2, t)
      const a3 = interp(p2, p3, t2, t3, t)
      const b1 = interp2(a1, a2, t0, t2, t)
      const b2 = interp2(a2, a3, t1, t3, t)
      out.push(interp2(b1, b2, t1, t2, t))
    }
  }
  return out
}

function interp(pa: Point, pb: Point, ta: number, tb: number, t: number): Point {
  if (tb === ta) return pa
  const u = (t - ta) / (tb - ta)
  return [pa[0] + (pb[0] - pa[0]) * u, pa[1] + (pb[1] - pa[1]) * u]
}

const interp2 = interp

/** Channel lanes — straight bars, spline-sampled only where a bow exists. */
export const CHANNEL_PATHS: Record<string, readonly Point[]> = Object.fromEntries(
  Object.entries(RAW_CHANNEL_PATHS).map(([id, pts]) => [id, smoothPolyline(pts)]),
)

/** SVG path string for a channel polyline. */
export function pointsToPath(points: readonly Point[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ')
}

function segmentLength(a: Point, b: Point): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1])
}

/**
 * Split a polyline at its length midpoint into two halves. The first half
 * starts at points[0] (gates[0]'s mouth), the second ENDS at the last point
 * (gates[1]'s mouth) — so each half belongs to one gate of the channel.
 */
export function splitPolyline(points: readonly Point[]): [Point[], Point[]] {
  const total = points.reduce(
    (sum, p, i) => (i === 0 ? 0 : sum + segmentLength(points[i - 1], p)),
    0
  )
  const half = total / 2

  const first: Point[] = [points[0]]
  let walked = 0
  for (let i = 1; i < points.length; i++) {
    const seg = segmentLength(points[i - 1], points[i])
    if (walked + seg >= half) {
      const t = (half - walked) / seg
      const mid: Point = [
        points[i - 1][0] + (points[i][0] - points[i - 1][0]) * t,
        points[i - 1][1] + (points[i][1] - points[i - 1][1]) * t,
      ]
      first.push(mid)
      const second: Point[] = [mid, ...points.slice(i)]
      return [first, second]
    }
    first.push(points[i])
    walked += seg
  }
  // Degenerate (zero length) — both halves collapse to the endpoints.
  return [first, [points[points.length - 1]]]
}

// =============================================================================
// GATE ANCHORS + LABELS
// =============================================================================

function centerCentroid(id: CenterId): Point {
  const c = CENTER_POSITIONS[id]
  return [c.x, c.y]
}

function buildGateGeometry(): {
  labels: Record<number, Point>
  centers: Record<number, CenterId>
} {
  const gateCenter = new Map<number, CenterId>()
  for (const channel of CHANNELS) {
    const [g0, g1] = channel.gates
    const [c0, c1] = channel.centers
    gateCenter.set(g0, c0)
    gateCenter.set(g1, c1)
  }

  // Every gate mark (chip or number) sits a fixed step INSIDE the center from
  // its mouth, toward the centroid — chips replace numbers in place, always.
  const labels: Record<number, Point> = {}
  for (const [gateStr, mouth] of Object.entries(GATE_MOUTHS)) {
    const gate = Number(gateStr)
    const centerId = gateCenter.get(gate)
    if (!centerId) continue
    const [cx, cy] = centerCentroid(centerId)
    const dx = cx - mouth[0]
    const dy = cy - mouth[1]
    const d = Math.hypot(dx, dy) || 1
    const inset = 9
    labels[gate] = [mouth[0] + (dx / d) * inset, mouth[1] + (dy / d) * inset]
  }
  return { labels, centers: Object.fromEntries(gateCenter) as Record<number, CenterId> }
}

const GATE_GEOMETRY = buildGateGeometry()

/** Fixed channel-mouth position per gate (on the center's edge). */
export const GATE_ANCHORS: Record<number, Point> = GATE_MOUTHS

/** Gate mark position — a fixed step inside the owning center from the mouth. */
export const GATE_LABELS: Record<number, Point> = GATE_GEOMETRY.labels

/** Which center each gate belongs to — lets renderers adapt text to the fill. */
export const GATE_CENTER: Record<number, CenterId> = GATE_GEOMETRY.centers

/** Get a point along the line between two centers, at a fraction t (0=center1, 1=center2) */
export function lerp(c1: CenterPosition, c2: CenterPosition, t: number): { x: number; y: number } {
  return {
    x: c1.x + (c2.x - c1.x) * t,
    y: c1.y + (c2.y - c1.y) * t,
  }
}
