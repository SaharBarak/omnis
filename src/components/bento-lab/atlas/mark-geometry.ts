import { ZODIAC_SIGNS } from '@pleiad/engine/data/zodiac-signs'
import { SEALS } from '@pleiad/engine/data/seals'
import { CENTERS } from '@pleiad/engine/data/human-design-centers'
import { BODY_SCALE, bodyPoint, C, norm, polar, px, RING, sealAngle, SIZE, skyAngle, spreadAngles, type Point } from './geometry'
import { CENTER_POSITIONS, CHANNEL_PATHS, GATE_MOUTHS, splitPolyline } from '@/components/human-design/bodygraph-layout'
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
  /** The tone's bars: width and the pitch between rows. */
  toneWidth: 16,
  toneStep: 4,
  /** The ascendant line's stroke. */
  risingStroke: 1.5,
  /** Bodygraph strokes and dots, in layout units before the body is scaled into the atlas. */
  channelStroke: 7,
  gateDot: 5,
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

export interface PlacedMark {
  readonly ref: AtlasMarkRef
  readonly key: string
  readonly layer: AtlasLayerId
  /** Where the card, the halo and the keyboard ring attach. */
  readonly anchor: Point
  /** The mark's drawn radius; for a line, half its stroke. */
  readonly r: number
  /** A line mark's polyline; absent for a point mark. */
  readonly path?: readonly Point[]
}

const place = (ref: AtlasMarkRef, anchor: Point, r: number, path?: readonly Point[]): PlacedMark => ({
  ref,
  key: markKey(ref),
  layer: MARK_LAYER[ref.kind],
  anchor,
  r,
  ...(path ? { path } : {}),
})

const skyMarks = (sky: SkyLayer): readonly PlacedMark[] => [
  ...ZODIAC_SIGNS.map((sign) => place({ kind: 'sign', id: sign.id }, signPoint(sign.number, sky.ascendant), MARK_SIZE.sign / 2)),
  ...planetPlacements(sky).map((p) => place({ kind: 'planet', id: p.body.id }, planetPoint(p), MARK_SIZE.planet / 2)),
  ...(sky.ascendant !== null ? [place({ kind: 'rising' }, RISING_MIDDLE, MARK_SIZE.risingStroke / 2, RISING_LINE)] : []),
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

const bodyMarks = (atlas: PersonAtlas): readonly PlacedMark[] => {
  const { body } = atlas
  if (!body) return []
  return [
    ...CENTERS.map((centre) => {
      const pos = CENTER_POSITIONS[centre.id]
      return place({ kind: 'centre', id: centre.id }, bodyPoint(pos.x, pos.y), px(pos.size * BODY_SCALE))
    }),
    ...body.channels.flatMap((channel) => {
      const points = CHANNEL_PATHS[channel.id]
      if (!points) return []
      const middle = splitPolyline(points)[0].at(-1) ?? points[0]
      return [place({ kind: 'channel', id: channel.id }, bodyPoint(middle[0], middle[1]), px((MARK_SIZE.channelStroke / 2) * BODY_SCALE), toAtlas(points))]
    }),
    ...loneGates(body)
      .filter((g) => GATE_MOUTHS[g])
      .map((g) => place({ kind: 'gate', n: g }, bodyPoint(...GATE_MOUTHS[g]), px(MARK_SIZE.gateDot * BODY_SCALE))),
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

const distTo = (m: PlacedMark, p: Point): number =>
  m.path
    ? m.path.slice(1).reduce((best, q, i) => Math.min(best, distToSegment(p, m.path![i], q)), Infinity)
    : Math.hypot(p[0] - m.anchor[0], p[1] - m.anchor[1])

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
 * The mark the pointer is on. A point mark the pointer is inside wins over
 * everything, so a line through a glyph or a centre never takes it. Failing
 * that, of the marks within their reach (the larger of the mark's own radius
 * and half the least target), the one whose distance is the smallest share of
 * its reach wins; a point mark wins a tie with a line, then reading order
 * decides.
 */
export function hitMark(marks: readonly PlacedMark[], probe: Probe): PlacedMark | null {
  let best: { mark: PlacedMark; inside: boolean; score: number } | null = null
  for (const mark of marks) {
    const turn = probe.turns?.[mark.layer]
    const p = turn ? undo(turn, probe.point) : probe.point
    const reach = Math.max(mark.r, probe.reach)
    const d = distTo(mark, p)
    if (d > reach) continue
    const inside = !mark.path && d <= mark.r
    const score = d / reach
    const better =
      !best ||
      (inside && !best.inside) ||
      (inside === best.inside && (score < best.score - 1e-9 || (Math.abs(score - best.score) <= 1e-9 && !mark.path && best.mark.path)))
    if (better) best = { mark, inside, score }
  }
  return best?.mark ?? null
}

/** Whether a mark's anchor shows inside the drawing at `zoom` about the centre. */
export const inView = (mark: PlacedMark, zoom: number): boolean =>
  mark.anchor.every((v) => {
    const shown = C + (v - C) * zoom
    return shown >= 0 && shown <= SIZE
  })

export interface DrawingBox {
  readonly left: number
  readonly top: number
  readonly width: number
}

/** A client point in drawing units: the box scaled to the 640-unit view, then the zoom about the centre undone. */
export const toDrawing = ([x, y]: Point, box: DrawingBox, zoom: number): Point => {
  const s = SIZE / box.width
  return [C + ((x - box.left) * s - C) / zoom, C + ((y - box.top) * s - C) / zoom]
}

/** Half the least target, in drawing units, for a drawing `width` px wide at `zoom`. */
export const reachFor = (width: number, zoom: number): number => ((TARGET_MIN_PX / 2) * SIZE) / width / zoom
