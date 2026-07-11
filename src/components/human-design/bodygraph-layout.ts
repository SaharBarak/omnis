import type { CenterId } from '@pleiad/engine/types/human-design'
import { CHANNELS } from '@pleiad/engine/data/human-design-channels'

// =============================================================================
// SHARED BODYGRAPH GEOMETRY
// =============================================================================
// Single source of truth for the SVG anatomy used by BodygraphChart,
// CompositeBodygraphChart and PentaChart.
//
// Canonical bodygraph rule (matches Jovian-style charts): every one of the
// 36 channels gets its OWN lane. Parallel channels between the same pair of
// centers (head-ajna has three) never share a line, gates anchor at fixed
// slots on the center edges, and the integration bundle (10/20/34/57) routes
// LEFT of the G center. Each channel is split at its length midpoint into two
// gate-halves so hanging gates render as half-colored channels.

export const VIEW_WIDTH = 400
export const VIEW_HEIGHT = 560

export interface CenterPosition {
  x: number
  y: number
  shape: 'triangle' | 'triangle-inv' | 'square' | 'diamond' | 'triangle-right' | 'triangle-left'
  size: number
}

/** Anatomical positions for each center */
export const CENTER_POSITIONS: Record<CenterId, CenterPosition> = {
  head:   { x: 200, y: 45,  shape: 'triangle',       size: 30 },
  ajna:   { x: 200, y: 115, shape: 'triangle-inv',   size: 30 },
  throat: { x: 200, y: 192, shape: 'square',          size: 28 },
  g:      { x: 200, y: 282, shape: 'diamond',         size: 32 },
  heart:  { x: 300, y: 247, shape: 'triangle-right',  size: 20 },
  spleen: { x: 86,  y: 352, shape: 'triangle-left',   size: 34 },
  sacral: { x: 200, y: 388, shape: 'square',          size: 28 },
  solar:  { x: 314, y: 352, shape: 'triangle-right',  size: 34 },
  root:   { x: 200, y: 478, shape: 'square',          size: 30 },
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
// CHANNEL LANES
// =============================================================================

export type Point = readonly [number, number]

/**
 * Per-channel polyline, keyed by the engine channel id. The FIRST point is
 * the mouth of `gates[0]`, the LAST point the mouth of `gates[1]` (matching
 * the order in CHANNELS data). Interior points route around centers — most
 * notably the integration bundle bending left of the G diamond.
 */
export const CHANNEL_PATHS: Record<string, readonly Point[]> = {
  // Head ↔ Ajna — three parallel lanes
  '64-47': [[185, 63], [185, 97]],
  '61-24': [[200, 63], [200, 97]],
  '63-4':  [[215, 63], [215, 97]],

  // Ajna ↔ Throat — three parallel lanes
  '17-62': [[185, 121], [185, 164]],
  '43-23': [[200, 143], [200, 164]],
  '11-56': [[215, 121], [215, 164]],

  // G ↔ Throat — three lanes down the middle
  '7-31':  [[185, 266], [185, 220]],
  '1-8':   [[200, 250], [200, 220]],
  '13-33': [[215, 266], [215, 220]],

  // Integration bundle — routes LEFT of the G diamond
  '10-20': [[168, 282], [160, 240], [172, 198]],
  '57-20': [[120, 330], [140, 250], [172, 206]],
  '34-20': [[172, 368], [150, 330], [150, 244], [172, 214]],
  '57-10': [[120, 337], [168, 282]],
  '34-10': [[172, 374], [158, 328], [168, 282]],
  '34-57': [[172, 381], [120, 344]],

  // Throat ↔ right side
  '21-45': [[292, 233], [228, 198]],
  '35-36': [[228, 190], [262, 250], [280, 324]],
  '12-22': [[228, 204], [252, 262], [280, 332]],

  // Heart neighborhood
  '25-51': [[232, 282], [280, 251]],
  '26-44': [[287, 263], [240, 304], [200, 332], [120, 352]],
  '37-40': [[280, 346], [300, 257]],

  // G ↔ Sacral — three parallel lanes
  '5-15':  [[185, 360], [185, 299]],
  '14-2':  [[200, 360], [200, 314]],
  '29-46': [[215, 360], [215, 299]],

  // Sacral laterals
  '59-6':  [[228, 390], [280, 358]],
  '27-50': [[172, 400], [120, 360]],

  // Sacral ↔ Root — three parallel lanes
  '42-53': [[185, 416], [185, 448]],
  '3-60':  [[200, 416], [200, 448]],
  '9-52':  [[215, 416], [215, 448]],

  // Root ↔ Spleen — three parallel diagonals
  '54-32': [[170, 456], [120, 367]],
  '38-28': [[170, 470], [120, 374]],
  '58-18': [[170, 484], [120, 381]],

  // Root ↔ Solar — mirrored diagonals
  '49-19': [[280, 367], [230, 456]],
  '39-55': [[230, 470], [280, 374]],
  '41-30': [[230, 484], [280, 381]],

  // Spleen ↔ Throat
  '48-16': [[120, 323], [172, 172]],
}

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
  anchors: Record<number, Point>
  labels: Record<number, Point>
} {
  // Collect every channel mouth per gate; the gate anchor is their average
  // (multi-channel gates like 10/20/34/57 have several slots).
  const mouths = new Map<number, Point[]>()
  const gateCenter = new Map<number, CenterId>()

  for (const channel of CHANNELS) {
    const path = CHANNEL_PATHS[channel.id]
    if (!path) continue
    const [g0, g1] = channel.gates
    const [c0, c1] = channel.centers
    mouths.set(g0, [...(mouths.get(g0) ?? []), path[0]])
    mouths.set(g1, [...(mouths.get(g1) ?? []), path[path.length - 1]])
    gateCenter.set(g0, c0)
    gateCenter.set(g1, c1)
  }

  const anchors: Record<number, Point> = {}
  const labels: Record<number, Point> = {}
  for (const [gate, pts] of mouths) {
    const ax = pts.reduce((s, p) => s + p[0], 0) / pts.length
    const ay = pts.reduce((s, p) => s + p[1], 0) / pts.length
    anchors[gate] = [ax, ay]
    // Label sits just inside the center, pushed from the anchor toward the
    // center's centroid.
    const [cx, cy] = centerCentroid(gateCenter.get(gate)!)
    const dx = cx - ax
    const dy = cy - ay
    const d = Math.hypot(dx, dy) || 1
    const offset = 10
    labels[gate] = [ax + (dx / d) * offset, ay + (dy / d) * offset]
  }
  return { anchors, labels }
}

const GATE_GEOMETRY = buildGateGeometry()

/** Averaged channel-mouth position per gate (on the center's edge). */
export const GATE_ANCHORS: Record<number, Point> = GATE_GEOMETRY.anchors

/** Gate-number label position, just inside the owning center. */
export const GATE_LABELS: Record<number, Point> = GATE_GEOMETRY.labels

/** Get a point along the line between two centers, at a fraction t (0=center1, 1=center2) */
export function lerp(c1: CenterPosition, c2: CenterPosition, t: number): { x: number; y: number } {
  return {
    x: c1.x + (c2.x - c1.x) * t,
    y: c1.y + (c2.y - c1.y) * t,
  }
}
