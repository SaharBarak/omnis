import { bodyPoint, C, polar, px, RING, skyAngle, type Point } from './geometry'
import { CENTER_POSITIONS, GATE_MOUTHS } from '@/components/human-design/bodygraph-layout'
import { loneGates, type AtlasMarkRef } from '@/lib/atlas/marks'
import type { AtlasLayerId, PairAtlas, PersonAtlas } from '@/lib/atlas/types'
import { ORACLE_SEATS, type OracleSeatId } from '@/lib/dreamspell-oracle'
import type { Tie, TieSystem } from '@/lib/relations/pair-ties'

/** Which of the pair a map belongs to: the first person or the second. */
export type PairSide = 'a' | 'b'

export const PAIR_SIDES: readonly PairSide[] = Object.freeze(['a', 'b'])

export const TIE_LAYER: Readonly<Record<TieSystem, AtlasLayerId>> = {
  astrology: 'sky',
  dreamspell: 'maya',
  tzolkin: 'maya',
  humanDesign: 'body',
  gematria: 'number',
}

const isCenter = (id: string): id is keyof typeof CENTER_POSITIONS => id in CENTER_POSITIONS

const gatePoint = (channel: string, atlas: PersonAtlas): Point => {
  const gates = channel.split('-').map(Number)
  const own = gates.find((g) => atlas.body?.gates.includes(g)) ?? gates[0]
  const mouth = GATE_MOUTHS[own]
  return mouth ? bodyPoint(mouth[0], mouth[1]) : [C, C]
}

/**
 * Where a tie touches one person's atlas, in atlas coordinates: the planet it
 * names, the lit seal, the centre or gate, or the number strip below.
 */
export function tieAnchor(tie: Tie, side: PairSide, atlas: PersonAtlas): Point {
  switch (tie.system) {
    case 'astrology': {
      const id = tie.planets?.[side === 'a' ? 0 : 1]
      const body = atlas.sky.bodies.find((b) => b.id === id)
      return body ? polar(RING.planetTrack, skyAngle(body.longitude, atlas.sky.ascendant)) : polar(RING.skyInner, 90)
    }
    case 'dreamspell':
    case 'tzolkin':
      return polar(RING.sealTrack, 90)
    case 'humanDesign': {
      if (tie.channel && isCenter(tie.channel)) {
        const c = CENTER_POSITIONS[tie.channel]
        return bodyPoint(c.x, c.y)
      }
      if (tie.channel) return gatePoint(tie.channel, atlas)
      const g = CENTER_POSITIONS.g
      return bodyPoint(g.x, g.y)
    }
    case 'gematria':
      return polar(RING.skyOuter, 270)
  }
}

export const otherSide = (side: PairSide): PairSide => (side === 'a' ? 'b' : 'a')

/** The person drawn on a side. */
export const pairPerson = (pair: Pick<PairAtlas, 'people'>, side: PairSide) => pair.people[side === 'a' ? 0 : 1]

/** The side whose person acts in a directed tie (the guide, the bridger); the first person when the tie has no direction. */
export const actingSide = (tie: Tie, pair: Pick<PairAtlas, 'people'>): PairSide => (tie.acts?.on === pair.people[0].id ? 'b' : 'a')

/** The oracle seat a Dreamspell relation names: the kin's (`guide`) or the seal's (`guide-seal`). */
const seatOf = (type: string): OracleSeatId | undefined => ORACLE_SEATS.find((seat) => type === seat || type === `${seat}-seal`)

/**
 * A Dreamspell oracle tie joins one person's own seal to the seat it takes in
 * the other's oracle, which holds the same seal, so both ends are that seal.
 * The one acted on holds the seat (the guided), else the second person, as
 * long as their oracle does; a relation neither oracle holds joins the two
 * own seals.
 */
const oracleEnds = (seat: OracleSeatId, tie: Tie, pair: PairAtlas): Readonly<Record<PairSide, AtlasMarkRef>> => {
  const atlas = { a: pair.a, b: pair.b }
  const sealOf = (side: PairSide): AtlasMarkRef => ({ kind: 'seal', n: atlas[side].maya.seal.n })
  const holds = (side: PairSide): boolean => atlas[side].maya.oracle[seat].n === atlas[otherSide(side)].maya.seal.n
  const first = otherSide(actingSide(tie, pair))
  const seated = [first, otherSide(first)].find(holds)
  if (!seated) return { a: sealOf('a'), b: sealOf('b') }
  const given = sealOf(otherSide(seated))
  return { a: given, b: given }
}

/**
 * The lane that carries a gate in one bodygraph: the channel the person
 * holds whole when the tie names it, else the lone gate, else the first of
 * the person's channels (in the engine's order) through it.
 */
const laneOf = (channel: string, atlas: PersonAtlas): AtlasMarkRef | null => {
  const body = atlas.body
  if (!body) return null
  if (body.channels.some((c) => c.id === channel)) return { kind: 'channel', id: channel }
  const gate = channel
    .split('-')
    .map(Number)
    .find((g) => body.gates.includes(g))
  if (gate === undefined) return null
  if (loneGates(body).includes(gate)) return { kind: 'gate', n: gate }
  const through = body.channels.find((c) => c.gates.includes(gate))
  return through ? { kind: 'channel', id: through.id } : null
}

const hdEnd = (tie: Tie, atlas: PersonAtlas): AtlasMarkRef | null => {
  if (!tie.channel || !atlas.body) return null
  return isCenter(tie.channel) ? { kind: 'centre', id: tie.channel } : laneOf(tie.channel, atlas)
}

const skyEnd = (tie: Tie, side: PairSide, atlas: PersonAtlas): AtlasMarkRef | null => {
  const id = tie.planets?.[side === 'a' ? 0 : 1]
  const body = atlas.sky.bodies.find((b) => b.id === id)
  return body ? { kind: 'planet', id: body.id } : null
}

/**
 * The mark a tie touches in each map (docs/redesign/BENTO_SITE.md, "Ties
 * explain themselves"): the planet an astrology tie names; for Dreamspell, the
 * tone a tone tie names, the own seal and the oracle seat an oracle tie joins,
 * or the own seal; the own seal for a Tzolkin tie; the centre or the lane a
 * Human Design tie names. Null where a tie names no mark: a split bridge, an
 * electromagnetic tie without its channel, a number tie.
 */
export function tieEnds(tie: Tie, pair: PairAtlas): Readonly<Record<PairSide, AtlasMarkRef | null>> {
  const atlas = { a: pair.a, b: pair.b }
  const each = (end: (side: PairSide, atlas: PersonAtlas) => AtlasMarkRef | null) => ({ a: end('a', atlas.a), b: end('b', atlas.b) })
  switch (tie.system) {
    case 'astrology':
      return each((side, a) => skyEnd(tie, side, a))
    case 'dreamspell': {
      const seat = seatOf(tie.type)
      if (seat) return oracleEnds(seat, tie, pair)
      return each((_, a) => (tie.type === 'same-tone' ? { kind: 'tone' } : { kind: 'seal', n: a.maya.seal.n }))
    }
    case 'tzolkin':
      return each((_, a) => ({ kind: 'seal', n: a.maya.seal.n }))
    case 'humanDesign':
      return each((_, a) => hdEnd(tie, a))
    case 'gematria':
      return { a: null, b: null }
  }
}

/** Visual weight grows with information: a 1-bit tie is a hairline, an 8-bit tie a cable. */
const STROKE_FLOOR = 1.5
const STROKE_PER_BIT = 0.55
const BITS_FOR_FULL_INK = 8

export const tieStroke = (bits: number): { readonly width: number; readonly opacity: number } => ({
  width: STROKE_FLOOR + bits * STROKE_PER_BIT,
  opacity: 0.4 + 0.55 * Math.min(1, bits / BITS_FOR_FULL_INK),
})

/** A tie's end marks, in drawing units: the dot it leaves from, and the arrow a directed tie arrives with. */
export const TIE_END = Object.freeze({ dot: 6, arrowLength: 14, arrowHalf: 7 })

export interface Curve {
  readonly d: string
  /** The cubic's four points: its two ends and the two that bow it. */
  readonly controls: readonly [Point, Point, Point, Point]
  readonly mid: Point
  /** Angle in degrees of the curve where it arrives at `to`. */
  readonly endAngle: number
}

const lerp = (a: Point, b: Point, t: number): Point => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]

/**
 * A cubic between two points, bowed outward along `bow` (a unit vector) by
 * `lift` past the further of its ends, or past `clear` (the drawing's edge
 * along `bow`) when that is further, so the arc leaves the maps it joins.
 */
export function bowedCurve(from: Point, to: Point, bow: Point, lift: number, clear = Number.NEGATIVE_INFINITY): Curve {
  const reach = Math.max(from[0] * bow[0] + from[1] * bow[1], to[0] * bow[0] + to[1] * bow[1], clear) + lift
  const pull = (p: Point): Point => {
    const along = p[0] * bow[0] + p[1] * bow[1]
    return [p[0] + bow[0] * (reach - along), p[1] + bow[1] * (reach - along)]
  }
  const c1 = pull(lerp(from, to, 0.25))
  const c2 = pull(lerp(from, to, 0.75))
  const mid: Point = [
    px(0.125 * from[0] + 0.375 * c1[0] + 0.375 * c2[0] + 0.125 * to[0]),
    px(0.125 * from[1] + 0.375 * c1[1] + 0.375 * c2[1] + 0.125 * to[1]),
  ]
  const f = (n: number) => n.toFixed(1)
  return {
    d: `M ${f(from[0])} ${f(from[1])} C ${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(to[0])} ${f(to[1])}`,
    controls: [from, c1, c2, to],
    mid,
    endAngle: px((Math.atan2(to[1] - c2[1], to[0] - c2[0]) * 180) / Math.PI),
  }
}
