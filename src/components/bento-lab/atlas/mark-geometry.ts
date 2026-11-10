import { ZODIAC_SIGNS } from '@pleiad/engine/data/zodiac-signs'
import { SEALS } from '@pleiad/engine/data/seals'
import { CENTERS } from '@pleiad/engine/data/human-design-centers'
import { BODY_SCALE, bodyPoint, C, concentricPath, norm, polar, px, RING, sealAngle, skyAngle, spreadAngles, SQUARE, type Point, type View } from './geometry'
import { CENTER_POSITIONS, CHANNEL_PATHS, centerOutline, GATE_HALVES, midpointOf } from '@/components/human-design/bodygraph-layout'
import { loneGates, markKey, MARK_LAYER, seatsOf, type AtlasMarkRef } from '@/lib/atlas/marks'
import type { AtlasLayerId, PersonAtlas, SkyBody, SkyLayer } from '@/lib/atlas/types'

/**
 * Where each mark of the atlas sits, held once (docs/redesign/BENTO_SITE.md,
 * "Marks explain themselves"). The drawing places its glyphs with these
 * functions, and the targets, halo and card read the same places, so a mark
 * and its target cannot disagree. Pure; drawing units throughout.
 */

/** Drawn sizes of the marks, in drawing units. */
export const MARK_SIZE = Object.freeze({
  sign: 18,
  planet: 19,
  seal: 22,
  /** The disc behind the person's own seal, and the ring round an oracle seat, as radii. */
  litSeal: 22 * 0.85,
  seat: 22 * 0.72,
  /** The tone's bar width; its rows, dots and bars follow from it (maya-numeral.tsx). */
  toneWidth: 16,
  /** The ascendant line's stroke. */
  risingStroke: 1.5,
  /** A bodygraph lane's stroke, a channel's or a lone gate's half, in layout units before the body is scaled into the atlas. */
  channelStroke: 7,
  /** A centre's edge, in layout units; drawn with round joins, it paints half its width past the outline all round. */
  centreStroke: 2,
})

/** Least angle between neighbouring planet glyphs, in degrees. */
export const PLANET_GAP = 8

/**
 * The outline ring round the active mark stands this far off the mark: the
 * 2 px surface gap between overlapping marks, at the drawing's 640-unit
 * design size.
 */
export const HALO_GAP = 2

/** WCAG 2.5.8: a target is at least 24 CSS px across. */
export const TARGET_MIN_PX = 24

export interface PlanetPlacement {
  readonly body: SkyBody
  /** The body's true angle, where its lead line starts. */
  readonly truth: number
  /** The glyph's angle, spread so neighbours never overlap. */
  readonly shown: number
}

/** Each body at its true angle, its glyph spread from its neighbours. */
export function planetPlacements(sky: SkyLayer): readonly PlanetPlacement[] {
  const truths = sky.bodies.map((b) => skyAngle(b.longitude, sky.ascendant))
  const shown = spreadAngles(truths, PLANET_GAP)
  return sky.bodies.map((body, i) => ({ body, truth: truths[i], shown: shown[i] }))
}

export const planetPoint = (p: PlanetPlacement): Point => polar(RING.planetTrack, p.shown)

/** A sign's glyph, mid-sign on the sign track. */
export const signPoint = (signNumber: number, ascendant: number | null): Point =>
  polar(RING.signTrack, skyAngle((signNumber - 1) * 30 + 15, ascendant))

export const sealPoint = (seal: number, lit: number): Point => polar(RING.sealTrack, sealAngle(seal, lit))

/** The tone sits above the person's seal, just outside the Kin ring. */
export const TONE_POINT: Point = polar(RING.mayaOuter + 9, 90)

/** The ascendant line runs across the sky ring at nine o'clock; its label sits just below it. */
export const RISING_LINE: readonly [Point, Point] = [polar(RING.skyOuter, 180), polar(RING.mayaOuter, 180)]
export const RISING_LABEL: Point = polar(RING.arcTrack, 186)
const RISING_MIDDLE: Point = polar((RING.skyOuter + RING.mayaOuter) / 2, 180)

export interface PlacedMark<Ref = AtlasMarkRef> {
  readonly ref: Ref
  readonly key: string
  readonly layer: AtlasLayerId
  /** Where the card, the halo and the keyboard ring attach. */
  readonly anchor: Point
  /** The mark's drawn radius; for a line, half its stroke; for an area, how far its paint reaches across, which the card stands off. */
  readonly r: number
  /** A line mark's polylines; absent for a point or an area mark. */
  readonly lines?: readonly (readonly Point[])[]
  /** An area mark's shape; absent for a point or a line mark. */
  readonly area?: Area
}

export interface Area {
  /** The pointer inside it is on the mark. */
  readonly outline: readonly Point[]
  /** How far the mark paints past its outline: half its stroke. Its rings stand off the paint. */
  readonly paint: number
}

/** What a mark covers beyond its anchor: lines, an area, or neither for a point. */
type Extent = Pick<PlacedMark, 'lines' | 'area'>

const place = (ref: AtlasMarkRef, anchor: Point, r: number, extent: Extent = {}): PlacedMark => ({
  ref,
  key: markKey(ref),
  layer: MARK_LAYER[ref.kind],
  anchor,
  r,
  ...extent,
})

/**
 * The ring round the active mark, `HALO_GAP` off what is drawn and following
 * its shape: a circle round a point mark, the outline's concentric path round
 * an area mark. A line mark lights its own stroke instead and has none.
 */
export type Halo = { readonly circle: number } | { readonly path: string }

/** The path `gap` off what an area paints, following its outline. */
const aroundArea = ({ outline, paint }: Area, gap: number): string | null => concentricPath(outline, paint + gap)

export function haloOf(mark: PlacedMark<unknown>): Halo | null {
  if (mark.lines) return null
  if (!mark.area) return { circle: mark.r + HALO_GAP }
  const path = aroundArea(mark.area, HALO_GAP)
  return path ? { path } : null
}

/**
 * An area mark's keyboard focus ring, a surface gap off its halo, as a point
 * target's outline stands off its button. The target draws it on its own
 * focus, apart from the card and the layer's dimming. Point and line marks
 * keep their target's own outline, and have none.
 */
export const focusRingOf = (mark: PlacedMark<unknown>): string | null => (mark.area ? aroundArea(mark.area, 2 * HALO_GAP) : null)

const skyMarks = (sky: SkyLayer): readonly PlacedMark[] => [
  ...ZODIAC_SIGNS.map((sign) => place({ kind: 'sign', id: sign.id }, signPoint(sign.number, sky.ascendant), MARK_SIZE.sign / 2)),
  ...planetPlacements(sky).map((p) => place({ kind: 'planet', id: p.body.id }, planetPoint(p), MARK_SIZE.planet / 2)),
  ...(sky.ascendant !== null ? [place({ kind: 'rising' }, RISING_MIDDLE, MARK_SIZE.risingStroke / 2, { lines: [RISING_LINE] })] : []),
]

/** How a seal is drawn: the person's own on a disc, an oracle seat ringed, the rest as the glyph alone. */
export type SealStyle = 'own' | 'seat' | 'plain'

export const sealStyle = (seal: number, own: number, seats: ReadonlySet<number>): SealStyle =>
  seal === own ? 'own' : seats.has(seal) ? 'seat' : 'plain'

/** A seal's drawn radius: its disc, its seat ring, or its glyph. */
export const SEAL_RADIUS: Readonly<Record<SealStyle, number>> = {
  own: MARK_SIZE.litSeal,
  seat: MARK_SIZE.seat,
  plain: MARK_SIZE.seal / 2,
}

const kinMarks = (atlas: PersonAtlas): readonly PlacedMark[] => {
  const own = atlas.maya.seal.n
  const seats = seatsOf(atlas.maya)
  return [
    place({ kind: 'tone' }, TONE_POINT, MARK_SIZE.toneWidth / 2),
    ...SEALS.map((seal) => place({ kind: 'seal', n: seal.number }, sealPoint(seal.number, own), SEAL_RADIUS[sealStyle(seal.number, own, seats)])),
  ]
}

const toAtlas = (points: readonly Point[]): readonly Point[] => points.map(([x, y]) => bodyPoint(x, y))

/** How far an outline reaches across from its anchor, either way. */
const halfWidth = (outline: readonly Point[], [x]: Point): number => Math.max(...outline.map(([vx]) => Math.abs(vx - x)))

/** How far a centre paints past its outline, in drawing units. */
const CENTRE_PAINT = px((MARK_SIZE.centreStroke / 2) * BODY_SCALE)

/** Half a bodygraph lane's stroke, in drawing units. */
const LANE_R = px((MARK_SIZE.channelStroke / 2) * BODY_SCALE)

const bodyMarks = (atlas: PersonAtlas): readonly PlacedMark[] => {
  const { body } = atlas
  if (!body) return []
  return [
    ...CENTERS.map((centre) => {
      const pos = CENTER_POSITIONS[centre.id]
      const anchor = bodyPoint(pos.x, pos.y)
      const outline = toAtlas(centerOutline(pos))
      return place({ kind: 'centre', id: centre.id }, anchor, px(halfWidth(outline, anchor) + CENTRE_PAINT), { area: { outline, paint: CENTRE_PAINT } })
    }),
    ...body.channels.flatMap((channel) => {
      const points = CHANNEL_PATHS[channel.id]
      if (!points) return []
      return [place({ kind: 'channel', id: channel.id }, bodyPoint(...midpointOf(points)), LANE_R, { lines: [toAtlas(points)] })]
    }),
    ...loneGates(body).flatMap((g) => {
      const halves = GATE_HALVES[g]
      if (!halves?.length) return []
      return [place({ kind: 'gate', n: g }, bodyPoint(...midpointOf(halves[0].shown)), LANE_R, { lines: halves.map((half) => toAtlas(half.points)) })]
    }),
  ]
}

const LAYER_ORDER: readonly AtlasLayerId[] = ['sky', 'maya', 'body', 'number']

/** Clockwise from twelve o'clock, in degrees. */
const clockwise = ([x, y]: Point): number => norm(90 - (Math.atan2(C - y, x - C) * 180) / Math.PI)

/** Reading order within a layer: rings from the outside in, each clockwise from twelve; the bodygraph top to bottom, then left to right. */
const readingKey = (m: PlacedMark): readonly number[] =>
  m.layer === 'body'
    ? [Math.round(m.anchor[1]), Math.round(m.anchor[0])]
    : [-Math.round(Math.hypot(m.anchor[0] - C, m.anchor[1] - C)), clockwise(m.anchor)]

const byReading = (a: PlacedMark, b: PlacedMark): number => {
  const layer = LAYER_ORDER.indexOf(a.layer) - LAYER_ORDER.indexOf(b.layer)
  if (layer !== 0) return layer
  const ka = readingKey(a)
  const kb = readingKey(b)
  return ka[0] - kb[0] || ka[1] - kb[1]
}

/** Every mark this atlas draws, in reading order. */
export function placeMarks(atlas: PersonAtlas): readonly PlacedMark[] {
  return [...skyMarks(atlas.sky), ...kinMarks(atlas), ...bodyMarks(atlas)].sort(byReading)
}

// ---------- reading the pointer ----------

const distToSegment = ([x, y]: Point, [x1, y1]: Point, [x2, y2]: Point): number => {
  const dx = x2 - x1
  const dy = y2 - y1
  const length2 = dx * dx + dy * dy
  const t = length2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / length2))
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy))
}

const distToLine = (p: Point, line: readonly Point[]): number =>
  line.slice(1).reduce((best, q, i) => Math.min(best, distToSegment(p, line[i], q)), Infinity)

/** Whether `p` lies inside a closed outline (even-odd rule). */
const insideOutline = ([x, y]: Point, outline: readonly Point[]): boolean =>
  outline.reduce((inside, [xi, yi], i) => {
    const [xj, yj] = outline.at(i - 1)!
    return yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi ? !inside : inside
  }, false)

const distTo = (m: PlacedMark<unknown>, p: Point): number =>
  m.lines
    ? m.lines.reduce((best, line) => Math.min(best, distToLine(p, line)), Infinity)
    : Math.hypot(p[0] - m.anchor[0], p[1] - m.anchor[1])

/** Halvings of a search along a ray: 32 leave it under a billionth of the drawing. */
const BISECTIONS = 32

/** How far `p` lies from an outline's edges. */
const distToOutline = (p: Point, outline: readonly Point[]): number => distToLine(p, [...outline, outline[0]])

/**
 * How far from its anchor, along the unit direction `dir`, a mark's halo
 * reaches: its radius and the gap for a point or a line, and for an area the
 * distance at which the ray leaves the outline by its paint and the gap. A
 * line that meets the mark ends there, so it touches the halo, not the glyph.
 */
export function standoff(mark: PlacedMark<unknown>, dir: Point): number {
  if (!mark.area) return mark.r + HALO_GAP
  const { outline, paint } = mark.area
  const at = (t: number): Point => [mark.anchor[0] + dir[0] * t, mark.anchor[1] + dir[1] * t]
  const clear = (t: number): boolean => !insideOutline(at(t), outline) && distToOutline(at(t), outline) >= paint + HALO_GAP
  const beyond = Math.max(...outline.map(([x, y]) => Math.hypot(x - mark.anchor[0], y - mark.anchor[1]))) + paint + HALO_GAP
  const halve = ([near, far]: readonly [number, number]): readonly [number, number] => {
    const t = (near + far) / 2
    return clear(t) ? [near, t] : [t, far]
  }
  return Array.from({ length: BISECTIONS }).reduce<readonly [number, number]>(halve, [0, beyond])[1]
}

/** A 2×2 linear map: a ring group's live turn, as the browser reports it (`matrix(a, b, c, d, …)`). */
export type Linear = readonly [number, number, number, number]

/** Undoes a linear map about the drawing's centre. */
export const undo = ([a, b, c, d]: Linear, [x, y]: Point): Point => {
  const det = a * d - b * c
  const u = x - C
  const v = y - C
  return [C + (d * u - c * v) / det, C + (-b * u + a * v) / det]
}

export interface Probe {
  /** The pointer in drawing units, with the zoom undone. */
  readonly point: Point
  /** Half the least target, in drawing units at the current size. */
  readonly reach: number
  /** Each ring's live turn; a ring at rest is absent. */
  readonly turns?: Partial<Readonly<Record<AtlasLayerId, Linear>>>
}

/**
 * The mark the pointer is on. A point mark the pointer is inside, or an
 * area mark whose outline holds it, wins over everything, so a line through
 * a glyph or a centre never takes it. Failing that, of the marks within
 * their reach (for a point the larger of its own radius and half the least
 * target, for an area half the least target about its anchor, since its
 * outline is its own extent), the one whose distance is the smallest share
 * of its reach wins; a point mark wins a tie with a line, then reading order
 * decides.
 */
export function hitMark<Ref>(marks: readonly PlacedMark<Ref>[], probe: Probe): PlacedMark<Ref> | null {
  let best: { mark: PlacedMark<Ref>; inside: boolean; score: number } | null = null
  for (const mark of marks) {
    const turn = probe.turns?.[mark.layer]
    const p = turn ? undo(turn, probe.point) : probe.point
    const reach = Math.max(mark.area ? 0 : mark.r, probe.reach)
    const d = distTo(mark, p)
    const inside = mark.area ? insideOutline(p, mark.area.outline) : !mark.lines && d <= mark.r
    if (!inside && d > reach) continue
    const score = d / reach
    const better =
      !best ||
      (inside && !best.inside) ||
      (inside === best.inside && (score < best.score - 1e-9 || (Math.abs(score - best.score) <= 1e-9 && !mark.lines && best.mark.lines)))
    if (better) best = { mark, inside, score }
  }
  return best?.mark ?? null
}

/** Whether a mark's anchor shows inside the view at `zoom` about the view's centre. */
export const inView = (mark: PlacedMark<unknown>, zoom: number, view: View = SQUARE): boolean =>
  [view.width, view.height].every((extent, axis) => {
    const shown = extent / 2 + (mark.anchor[axis] - extent / 2) * zoom
    return shown >= 0 && shown <= extent
  })

export interface DrawingBox {
  readonly left: number
  readonly top: number
  readonly width: number
}

/** A client point in drawing units: the box scaled to the view, then the zoom about the view's centre undone. */
export const toDrawing = ([x, y]: Point, box: DrawingBox, zoom: number, view: View = SQUARE): Point => {
  const s = view.width / box.width
  const [cx, cy] = [view.width / 2, view.height / 2]
  return [cx + ((x - box.left) * s - cx) / zoom, cy + ((y - box.top) * s - cy) / zoom]
}

/** Half the least target, in drawing units, for a drawing `width` px wide at `zoom`. */
export const reachFor = (width: number, zoom: number, view: View = SQUARE): number => ((TARGET_MIN_PX / 2) * view.width) / width / zoom
