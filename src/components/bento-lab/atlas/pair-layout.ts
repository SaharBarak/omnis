import { mayDrawEdge } from '@pleiad/engine/services/rarity'
import { boxAround, C, labelWidth, PERSON_LABEL, RING, SIZE, stadiumOutline, TIE_LABEL, type Box, type Point, type View } from './geometry'
import { placeMarks, standoff, TARGET_MIN_PX, type PlacedMark } from './mark-geometry'
import { actingSide, bowedCurve, otherSide, PAIR_SIDES, TIE_END, TIE_LAYER, tieAnchor, tieEnds, tieStroke, type Curve, type PairSide } from './tie-geometry'
import { markKey, type AtlasMarkRef } from '@/lib/atlas/marks'
import type { AtlasLayerId, PairAtlas, PersonAtlas } from '@/lib/atlas/types'
import { centerName, type Tie } from '@/lib/relations/pair-ties'
import { tieName } from '@/lib/relations/tie-text'

/**
 * The pair drawing's geometry, held once (docs/redesign/BENTO_SITE.md, "Ties
 * explain themselves"): where each map sits, where each name sits, and each
 * drawn tie's ends, curve and label. The drawing draws it and the marks read
 * it, so a tie answers where it is drawn. Pure; drawing units throughout.
 */

/** Space between the maps when they sit side by side, unless a caller sets its own. */
export const PAIR_GAP = 140
const LIFT_FIRST = 46
const LIFT_STEP = 38
const LABEL_H = TIE_LABEL.height
/** How far under its map a person's name sits: its baseline, clear of the outer ring. */
const NAME_DROP = 34
/** The band under the maps that holds the names: the name, then its sub line to half its size. */
const NAME_BAND = NAME_DROP + PERSON_LABEL.name + PERSON_LABEL.sub / 2

/** Wide screens set the people side by side; narrow screens stack them. */
export type Orientation = 'landscape' | 'portrait'

export const ORIENTATIONS: readonly Orientation[] = Object.freeze(['landscape', 'portrait'])

/** A mark of one of the two maps, keyed by its side (`a:planet:sun`). */
export const pairMarkKey = (side: PairSide, ref: AtlasMarkRef): string => `${side}:${markKey(ref)}`

export interface TieEnd {
  /** The mark the tie touches in this map, keyed by side; null where the tie names none. */
  readonly key: string | null
  /** Where the line ends, in drawing units: off the mark's halo, or where `tieAnchor` puts a tie that names no mark. */
  readonly point: Point
}

export interface DrawnTie {
  /** The tie's place in the pair's reading, which keys it (`tie:3`) and its row. */
  readonly index: number
  /** Its place among the drawn ties, rarest first: the order they draw in, and how high each arcs. */
  readonly rank: number
  readonly tie: Tie
  readonly layer: AtlasLayerId
  readonly stroke: ReturnType<typeof tieStroke>
  /** The side the line leaves from: the one who acts, else the first person. */
  readonly from: PairSide
  readonly ends: Readonly<Record<PairSide, TieEnd>>
  /** From `from`'s end to the other's. */
  readonly curve: Curve
  readonly label: { readonly text: string; readonly box: Box }
}

export interface PairLayout {
  readonly orientation: Orientation
  readonly view: View
  /** The direction the two maps sit apart in: x side by side, y stacked. */
  readonly axis: 'x' | 'y'
  /** Each map's top-left corner. */
  readonly origins: Readonly<Record<PairSide, Point>>
  /** Where each person's name is set, under their map. */
  readonly names: Readonly<Record<PairSide, Point>>
  readonly ties: readonly DrawnTie[]
}

type Frame = Omit<PairLayout, 'orientation' | 'ties'>

interface Ground {
  readonly frame: Frame
  /** The unit direction the arcs bow out along. */
  readonly bow: Point
  /** The maps' outer edge along `bow`: arcs lift from here, so they run outside both maps. */
  readonly clear: number
}

/**
 * Room the arcs need beyond the rings: the highest lift, then the labels'
 * reach along the bow (half a label across it, `along`) and half a label's
 * height clear past that.
 */
const reach = (ties: number, along: number): number => (ties === 0 ? 0 : LIFT_FIRST + (ties - 1) * LIFT_STEP + along + LABEL_H / 2)

const landscape = (ties: number, gap: number): Ground => {
  const top = reach(ties, LABEL_H / 2)
  return {
    frame: {
      view: { width: SIZE * 2 + gap, height: top + SIZE + NAME_BAND },
      axis: 'x',
      origins: { a: [0, top], b: [SIZE + gap, top] },
      names: { a: [C, top + SIZE + NAME_DROP], b: [SIZE + gap + C, top + SIZE + NAME_DROP] },
    },
    bow: [0, -1],
    clear: -top,
  }
}

/** Stacked, the arcs bow sideways, so the labels reach along the bow by half the widest. */
const portrait = (ties: number, widest: number): Ground => ({
  frame: {
    view: { width: SIZE + reach(ties, widest / 2), height: SIZE * 2 + PAIR_GAP + NAME_BAND },
    axis: 'y',
    origins: { a: [0, 0], b: [0, SIZE + PAIR_GAP] },
    names: { a: [C, SIZE + NAME_DROP], b: [C, SIZE * 2 + PAIR_GAP + NAME_DROP] },
  },
  bow: [1, 0],
  clear: SIZE,
})

const shift = ([x, y]: Point, [dx, dy]: Point): Point => [x + dx, y + dy]

const toward = ([x0, y0]: Point, [x1, y1]: Point): Point => {
  const length = Math.hypot(x1 - x0, y1 - y0)
  return length === 0 ? [0, 0] : [(x1 - x0) / length, (y1 - y0) / length]
}

type Marks = Readonly<Record<PairSide, readonly PlacedMark[]>>

/** Each atlas's marks, placed once however many orientations and layers read them. */
const placed = new WeakMap<PersonAtlas, readonly PlacedMark[]>()
const marksOf = (atlas: PersonAtlas): readonly PlacedMark[] => {
  const known = placed.get(atlas)
  if (known) return known
  const marks = placeMarks(atlas)
  placed.set(atlas, marks)
  return marks
}

/**
 * One drawn tie. Its line runs between the marks it names, as they are
 * placed (a spread planet where its glyph is drawn), held off each by the
 * mark's halo and the end mark it carries there, so the tie touches the
 * halo, never the glyph.
 */
const placeTie = (pair: PairAtlas, ground: Ground, marks: Marks) => (tie: Tie, index: number, rank: number): DrawnTie => {
  const refs = tieEnds(tie, pair)
  const markOf = (side: PairSide): PlacedMark | null => {
    const ref = refs[side]
    return ref ? (marks[side].find((m) => m.key === markKey(ref)) ?? null) : null
  }
  const from = actingSide(tie, pair)
  const to = otherSide(from)
  const anchor = (side: PairSide): Point => shift(markOf(side)?.anchor ?? tieAnchor(tie, side, pair[side]), ground.frame.origins[side])
  const lift = LIFT_FIRST + rank * LIFT_STEP
  const [start, c1, c2, end] = bowedCurve(anchor(from), anchor(to), ground.bow, lift, ground.clear).controls
  const endMark = { [from]: TIE_END.dot, [to]: tie.acts ? 0 : TIE_END.dot } as Record<PairSide, number>
  const held = (side: PairSide, at: Point, leaving: Point): Point => {
    const mark = markOf(side)
    if (!mark) return at
    const dir = toward(at, leaving)
    const by = standoff(mark, dir) + endMark[side]
    return [at[0] + dir[0] * by, at[1] + dir[1] * by]
  }
  const curve = bowedCurve(held(from, start, c1), held(to, end, c2), ground.bow, lift, ground.clear)
  const text = labelOf(tie)
  const ends = Object.fromEntries(
    PAIR_SIDES.map((side) => {
      const ref = refs[side]
      return [side, { key: ref && markOf(side) ? pairMarkKey(side, ref) : null, point: side === from ? curve.controls[0] : curve.controls[3] }]
    }),
  ) as Record<PairSide, TieEnd>
  return {
    index,
    rank,
    tie,
    layer: TIE_LAYER[tie.system],
    stroke: tieStroke(tie.bits),
    from,
    ends,
    curve,
    label: { text, box: boxAround(curve.mid, labelWidth(text), LABEL_H) },
  }
}

const labelOf = (tie: Tie): string => tieName(tie, centerName)

/** The pair drawn in one orientation: its frame, and a line for every tie rare enough to draw, rarest first. */
export function pairLayout(pair: PairAtlas, orientation: Orientation, gap = PAIR_GAP): PairLayout {
  const drawn = pair.reading.ties.flatMap((tie, index) => (mayDrawEdge(tie.baseRate) ? [{ tie, index }] : []))
  const widest = Math.max(0, ...drawn.map(({ tie }) => labelWidth(labelOf(tie))))
  const ground = orientation === 'landscape' ? landscape(drawn.length, gap) : portrait(drawn.length, widest)
  const marks: Marks = { a: marksOf(pair.a), b: marksOf(pair.b) }
  const place = placeTie(pair, ground, marks)
  return { orientation, ...ground.frame, ties: drawn.map(({ tie, index }, rank) => place(tie, index, rank)) }
}

// ---------- the pair's marks ----------

/** What a mark on the pair drawing names: a drawn tie, by its place in the reading, or a mark of one map. */
export type PairMarkRef =
  | { readonly kind: 'tie'; readonly index: number }
  | { readonly kind: 'mark'; readonly side: PairSide; readonly mark: AtlasMarkRef }

export const tieKey = (index: number): string => `tie:${index}`

const TIE_PREFIX = tieKey(0).replace(/\d+$/, '')

/**
 * Where the elements a key names are in the pair drawing: a tie's groups
 * carry its key (`data-tie-key`); a mark is its map's `data-mark` inside its
 * person's group (`data-person`), the key's side and own key apart.
 */
export const keySelector = (key: string): string => {
  if (key.startsWith(TIE_PREFIX)) return `[data-tie-key="${key}"]`
  const at = key.indexOf(':')
  return `[data-person="${key.slice(0, at)}"] [data-mark="${key.slice(at + 1)}"]`
}

/** Samples along a tie's line, a third of the least target apart, so the pointer near the line is near a sample. */
const SAMPLE_STEP = TARGET_MIN_PX / 3

const cubicAt = ([p0, p1, p2, p3]: Curve['controls'], t: number): Point => {
  const u = 1 - t
  const [a, b, c, d] = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t]
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]]
}

const hull = (points: readonly Point[]): number => points.slice(1).reduce((sum, q, i) => sum + Math.hypot(q[0] - points[i][0], q[1] - points[i][1]), 0)

/**
 * A tie's line as the pointer reads it: sampled along its curve, and only the
 * runs outside both maps' outer rings, since inside a map its marks answer
 * and the tie answers through the mark it ends on.
 */
const openRuns = (curve: Curve, layout: PairLayout): readonly (readonly Point[])[] => {
  const centres = PAIR_SIDES.map((side): Point => [layout.origins[side][0] + C, layout.origins[side][1] + C])
  const open = (p: Point): boolean => centres.every(([cx, cy]) => Math.hypot(p[0] - cx, p[1] - cy) > RING.skyOuter)
  const count = Math.max(2, Math.ceil(hull(curve.controls) / SAMPLE_STEP))
  const samples = Array.from({ length: count + 1 }, (_, i) => cubicAt(curve.controls, i / count))
  return samples
    .reduce<Point[][]>((runs, p, i) => {
      if (!open(p)) return runs
      const last = runs.at(-1)
      if (last && i > 0 && open(samples[i - 1])) last.push(p)
      else runs.push([p])
      return runs
    }, [])
    .filter((run) => run.length > 1)
}

/** A drawn tie as a mark: its label pill is its area, so the pointer on the pill is on the tie, and its open runs its lines. */
const tieMark = (drawn: DrawnTie, layout: PairLayout): PlacedMark<PairMarkRef> => {
  const { box } = drawn.label
  return {
    ref: { kind: 'tie', index: drawn.index },
    key: tieKey(drawn.index),
    layer: drawn.layer,
    anchor: drawn.curve.mid,
    r: (box.x1 - box.x0) / 2,
    lines: openRuns(drawn.curve, layout),
    area: { outline: stadiumOutline(box), paint: 0 },
  }
}

/** One map's mark, moved to where its map sits and keyed by side. */
const sideMark =
  (side: PairSide, [dx, dy]: Point) =>
  (mark: PlacedMark): PlacedMark<PairMarkRef> => {
    const move = ([x, y]: Point): Point => [x + dx, y + dy]
    return {
      ref: { kind: 'mark', side, mark: mark.ref },
      key: pairMarkKey(side, mark.ref),
      layer: mark.layer,
      anchor: move(mark.anchor),
      r: mark.r,
      ...(mark.lines ? { lines: mark.lines.map((line) => line.map(move)) } : {}),
      ...(mark.area ? { area: { ...mark.area, outline: mark.area.outline.map(move) } } : {}),
    }
  }

/**
 * Every mark of the pair drawing, in keyboard order: the drawn ties rarest
 * first, then the first person's marks and the second's, each in its
 * atlas's reading order.
 */
export function placePairMarks(pair: PairAtlas, layout: PairLayout): readonly PlacedMark<PairMarkRef>[] {
  return [
    ...layout.ties.map((drawn) => tieMark(drawn, layout)),
    ...PAIR_SIDES.flatMap((side) => marksOf(pair[side]).map(sideMark(side, layout.origins[side]))),
  ]
}
