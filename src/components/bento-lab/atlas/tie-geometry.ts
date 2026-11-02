import { bodyPoint, C, polar, px, RING, skyAngle, type Point } from './geometry'
import { CENTER_POSITIONS, GATE_MOUTHS } from '@/components/human-design/bodygraph-layout'
import type { AtlasLayerId, PersonAtlas } from '@/lib/atlas/types'
import type { Tie, TieSystem } from '@/lib/relations/pair-ties'

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
export function tieAnchor(tie: Tie, side: 'a' | 'b', atlas: PersonAtlas): Point {
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

/** Visual weight grows with information: a 1-bit tie is a hairline, an 8-bit tie a cable. */
const STROKE_FLOOR = 1.5
const STROKE_PER_BIT = 0.55
const BITS_FOR_FULL_INK = 8

export const tieStroke = (bits: number): { readonly width: number; readonly opacity: number } => ({
  width: STROKE_FLOOR + bits * STROKE_PER_BIT,
  opacity: 0.4 + 0.55 * Math.min(1, bits / BITS_FOR_FULL_INK),
})

export interface Curve {
  readonly d: string
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
    mid,
    endAngle: px((Math.atan2(to[1] - c2[1], to[0] - c2[0]) * 180) / Math.PI),
  }
}
