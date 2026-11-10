import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { CHANNELS } from '@pleiad/engine/data/human-design-channels'
import { describe, expect, it } from 'vitest'
import { HALO_GAP, hitMark, placeMarks, planetPlacements, planetPoint, standoff, type PlacedMark } from './mark-geometry'
import { PairDrawing } from './pair-drawing'
import { ORIENTATIONS, pairLayout, placePairMarks, tieKey, type DrawnTie, type PairLayout } from './pair-layout'
import { otherSide, PAIR_SIDES, TIE_END, tieAnchor, tieEnds, type PairSide } from './tie-geometry'
import { C, RING } from './geometry'
import { buildPairAtlas } from '@/lib/atlas/build'
import { demoPerson } from '@/lib/atlas/demo'
import { loneGates, markKey } from '@/lib/atlas/marks'
import type { PairAtlas } from '@/lib/atlas/types'
import type { Tie } from '@/lib/relations/pair-ties'

const TODAY = '2026-11-08'
const pair = buildPairAtlas(demoPerson('maya'), demoPerson('ari'), TODAY)

const tie = (over: Partial<Tie> & Pick<Tie, 'system' | 'type'>): Tie => ({
  from: 'maya',
  to: 'ari',
  meaning: '',
  harmony: 'supportive',
  score: 0,
  bits: 9,
  baseRate: 0.002,
  tier: 'T3',
  acts: null,
  ...over,
})

const withTies = (ties: readonly Tie[], base: PairAtlas = pair): PairAtlas => ({ ...base, reading: { ...base.reading, ties } })

const marksOf = (side: PairSide, of: PairAtlas = pair): readonly PlacedMark[] => placeMarks(of[side])

const markAt = (layout: PairLayout, side: PairSide, key: string, of: PairAtlas = pair): PlacedMark => {
  const mark = marksOf(side, of).find((m) => `${side}:${m.key}` === key)!
  const [dx, dy] = layout.origins[side]
  const move = ([x, y]: readonly [number, number]): [number, number] => [x + dx, y + dy]
  return { ...mark, anchor: move(mark.anchor), ...(mark.area ? { area: { ...mark.area, outline: mark.area.outline.map(move) } } : {}) }
}

/** Even-odd: whether `p` lies inside a closed outline. */
const inside = ([x, y]: readonly [number, number], outline: readonly (readonly [number, number])[]): boolean =>
  outline.reduce((into, [xi, yi], i) => {
    const [xj, yj] = outline.at(i - 1)!
    return yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi ? !into : into
  }, false)

const distToOutline = ([x, y]: readonly [number, number], outline: readonly (readonly [number, number])[]): number =>
  Math.min(
    ...outline.map(([x1, y1], i) => {
      const [x2, y2] = outline[(i + 1) % outline.length]
      const length2 = (x2 - x1) ** 2 + (y2 - y1) ** 2
      const t = Math.max(0, Math.min(1, ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / length2))
      return Math.hypot(x - (x1 + t * (x2 - x1)), y - (y1 + t * (y2 - y1)))
    }),
  )

const unit = ([x0, y0]: readonly [number, number], [x1, y1]: readonly [number, number]): [number, number] => {
  const l = Math.hypot(x1 - x0, y1 - y0)
  return [(x1 - x0) / l, (y1 - y0) / l]
}

/** How far a tie's end stands off the mark it names, and how far it should. */
const holdOff = (layout: PairLayout, drawn: DrawnTie, side: PairSide, of: PairAtlas = pair) => {
  const end = drawn.ends[side]
  const mark = markAt(layout, side, end.key!, of)
  const dir = unit(mark.anchor, end.point)
  const dot = side === drawn.from || !drawn.tie.acts ? TIE_END.dot : 0
  return { actual: Math.hypot(end.point[0] - mark.anchor[0], end.point[1] - mark.anchor[1]), expected: standoff(mark, dir) + dot }
}

describe('tieEnds', () => {
  it('joins the guide to the seat its seal takes in the guided oracle', () => {
    const guide = pair.reading.ties.find((t) => t.type === 'guide')!
    expect(guide.acts).toEqual({ by: 'ari', on: 'maya' })
    expect(pair.a.maya.oracle.guide.n).toBe(pair.b.maya.seal.n)
    expect(tieEnds(guide, pair)).toEqual({ a: { kind: 'seal', n: pair.b.maya.seal.n }, b: { kind: 'seal', n: pair.b.maya.seal.n } })
  })

  it('joins the own seals when neither oracle holds the relation', () => {
    const loose = tie({ system: 'dreamspell', type: 'occult' })
    expect(pair.a.maya.oracle.occult.n).not.toBe(pair.b.maya.seal.n)
    expect(pair.b.maya.oracle.occult.n).not.toBe(pair.a.maya.seal.n)
    expect(tieEnds(loose, pair)).toEqual({ a: { kind: 'seal', n: pair.a.maya.seal.n }, b: { kind: 'seal', n: pair.b.maya.seal.n } })
  })

  it('ends a tone tie at the tone and any other kin tie at the own seal', () => {
    expect(tieEnds(tie({ system: 'dreamspell', type: 'same-tone' }), pair)).toEqual({ a: { kind: 'tone' }, b: { kind: 'tone' } })
    expect(tieEnds(tie({ system: 'dreamspell', type: 'same-castle' }), pair)).toEqual({ a: { kind: 'seal', n: pair.a.maya.seal.n }, b: { kind: 'seal', n: pair.b.maya.seal.n } })
    expect(tieEnds(tie({ system: 'tzolkin', type: 'same-tone' }), pair)).toEqual({ a: { kind: 'seal', n: pair.a.maya.seal.n }, b: { kind: 'seal', n: pair.b.maya.seal.n } })
  })

  it('ends an astrology tie at the planets it names', () => {
    expect(tieEnds(tie({ system: 'astrology', type: 'double-whammy', planets: ['sun', 'moon'] }), pair)).toEqual({
      a: { kind: 'planet', id: 'sun' },
      b: { kind: 'planet', id: 'moon' },
    })
  })

  it('ends a Human Design tie at the centre or the lane that carries its gate', () => {
    expect(tieEnds(tie({ system: 'humanDesign', type: 'emergent-center', channel: 'heart' }), pair)).toEqual({
      a: { kind: 'centre', id: 'heart' },
      b: { kind: 'centre', id: 'heart' },
    })
    const body = pair.a.body!
    const whole = body.channels[0]
    expect(tieEnds(tie({ system: 'humanDesign', type: 'companionship', channel: whole.id }), pair).a).toEqual({ kind: 'channel', id: whole.id })
    for (const channel of CHANNELS) {
      const held = channel.gates.filter((g) => body.gates.includes(g))
      if (held.length !== 1) continue
      const end = tieEnds(tie({ system: 'humanDesign', type: 'electromagnetic', channel: channel.id }), pair).a
      const through = body.channels.find((c) => c.gates.includes(held[0]))
      expect(end, channel.id).toEqual(loneGates(body).includes(held[0]) ? { kind: 'gate', n: held[0] } : { kind: 'channel', id: through!.id })
    }
  })

  it('names no mark for a split bridge, a tie without its channel, or a number tie', () => {
    expect(tieEnds(tie({ system: 'humanDesign', type: 'split-bridge' }), pair)).toEqual({ a: null, b: null })
    expect(tieEnds(tie({ system: 'humanDesign', type: 'electromagnetic' }), pair)).toEqual({ a: null, b: null })
    expect(tieEnds(tie({ system: 'gematria', type: 'name-value-match' }), pair)).toEqual({ a: null, b: null })
  })
})

describe('pairLayout', () => {
  it('draws the ties rare enough to draw, rarest first, keyed by their place in the reading', () => {
    const layout = pairLayout(pair, 'landscape')
    expect(layout.ties.map((t) => t.index)).toEqual(pair.reading.ties.flatMap((t, i) => (t.tier === 'T2' || t.tier === 'T3' ? [i] : [])))
    expect(layout.ties.map((t) => t.rank)).toEqual(layout.ties.map((_, i) => i))
  })

  it('ends each line off the halo of the mark it names, past the end mark it carries', () => {
    for (const orientation of ORIENTATIONS) {
      const layout = pairLayout(pair, orientation)
      expect(layout.ties.length).toBeGreaterThan(0)
      for (const drawn of layout.ties) {
        for (const side of PAIR_SIDES) {
          expect(drawn.ends[side].key, `${orientation} ${drawn.tie.type} ${side}`).not.toBeNull()
          const { actual, expected } = holdOff(layout, drawn, side)
          expect(actual, `${orientation} ${drawn.tie.type} ${side}`).toBeCloseTo(expected, 6)
        }
      }
    }
  })

  it('leaves from the one who acts and arrives at the one acted on, the arrow touching the halo', () => {
    const layout = pairLayout(pair, 'landscape')
    const guide = layout.ties.find((t) => t.tie.type === 'guide')!
    expect(guide.from).toBe('b')
    expect(guide.curve.controls[0]).toEqual(guide.ends.b.point)
    expect(guide.curve.controls[3]).toEqual(guide.ends.a.point)
    const seat = markAt(layout, 'a', guide.ends.a.key!)
    const tip = Math.hypot(guide.ends.a.point[0] - seat.anchor[0], guide.ends.a.point[1] - seat.anchor[1])
    expect(tip).toBeCloseTo(standoff(seat, unit(seat.anchor, guide.ends.a.point)), 6)
  })

  it('meets a spread planet where its glyph is drawn, not at its true longitude', () => {
    const sky = pair.a.sky
    const spread = planetPlacements(sky).reduce((most, p) => (Math.abs(p.shown - p.truth) > Math.abs(most.shown - most.truth) ? p : most))
    expect(Math.abs(spread.shown - spread.truth)).toBeGreaterThan(1)
    const other = pair.b.sky.bodies[0].id
    const stellium = withTies([tie({ system: 'astrology', type: 'conjunction', planets: [spread.body.id, other] })])
    const layout = pairLayout(stellium, 'landscape')
    const [drawn] = layout.ties
    const key = `a:${markKey({ kind: 'planet', id: spread.body.id })}`
    expect(drawn.ends.a.key).toBe(key)
    const glyph = planetPoint(spread)
    const [dx, dy] = layout.origins.a
    const fromGlyph = Math.hypot(drawn.ends.a.point[0] - glyph[0] - dx, drawn.ends.a.point[1] - glyph[1] - dy)
    expect(fromGlyph).toBeCloseTo(standoff(markAt(layout, 'a', key, stellium), unit([glyph[0] + dx, glyph[1] + dy], drawn.ends.a.point)) + TIE_END.dot, 6)
  })

  it('holds a line off a centre by its outline, its paint and the gap', () => {
    const emergent = withTies([tie({ system: 'humanDesign', type: 'emergent-center', channel: 'heart' })])
    const layout = pairLayout(emergent, 'portrait')
    const [drawn] = layout.ties
    for (const side of PAIR_SIDES) {
      const mark = markAt(layout, side, drawn.ends[side].key!, emergent)
      const dir = unit(mark.anchor, drawn.ends[side].point)
      const reach = standoff(mark, dir)
      const edge: [number, number] = [mark.anchor[0] + dir[0] * reach, mark.anchor[1] + dir[1] * reach]
      const outline = mark.area!.outline
      const at = (t: number): [number, number] => [mark.anchor[0] + dir[0] * t, mark.anchor[1] + dir[1] * t]
      expect(inside(edge, outline)).toBe(false)
      expect(distToOutline(edge, outline)).toBeCloseTo(mark.area!.paint + HALO_GAP, 6)
      expect(distToOutline(at(reach - 0.01), outline) < mark.area!.paint + HALO_GAP || inside(at(reach - 0.01), outline)).toBe(true)
    }
  })

  it('ends a tie that names no mark where tieAnchor puts it', () => {
    const bridge = withTies([tie({ system: 'humanDesign', type: 'split-bridge', from: 'ari', to: 'maya', acts: { by: 'ari', on: 'maya' } })])
    const layout = pairLayout(bridge, 'landscape')
    const [drawn] = layout.ties
    for (const side of PAIR_SIDES) {
      const [x, y] = tieAnchor(drawn.tie, side, bridge[side])
      const [dx, dy] = layout.origins[side]
      expect(drawn.ends[side]).toEqual({ key: null, point: [x + dx, y + dy] })
    }
    expect(drawn.from).toBe(otherSide('a'))
  })

  it('is what the drawing draws: each line, its ends and its label', () => {
    const markup = renderToStaticMarkup(createElement(PairDrawing, { pair }))
    for (const orientation of ORIENTATIONS) {
      for (const drawn of pairLayout(pair, orientation).ties) {
        const [from] = drawn.curve.controls
        expect(markup).toContain(`d="${drawn.curve.d}"`)
        expect(markup).toContain(`cx="${from[0]}" cy="${from[1]}"`)
        expect(markup).toContain(`x="${drawn.label.box.x0}" y="${drawn.label.box.y0}"`)
      }
    }
  })
})

describe('placePairMarks', () => {
  const REACH = 12

  for (const orientation of ORIENTATIONS) {
    describe(orientation, () => {
      const layout = pairLayout(pair, orientation)
      const marks = placePairMarks(pair, layout)
      const hit = (point: readonly [number, number]) => hitMark(marks, { point, reach: REACH })?.key ?? null

      it('holds the ties rarest first, then each person in reading order, every key once', () => {
        const keys = marks.map((m) => m.key)
        expect(new Set(keys).size).toBe(keys.length)
        expect(keys.slice(0, layout.ties.length)).toEqual(layout.ties.map((t) => tieKey(t.index)))
        expect(keys.slice(layout.ties.length)).toEqual(PAIR_SIDES.flatMap((side) => placeMarks(pair[side]).map((m) => `${side}:${m.key}`)))
      })

      it('moves the marks of each map to where it sits, outline and lines alike', () => {
        for (const side of PAIR_SIDES) {
          const [dx, dy] = layout.origins[side]
          for (const own of placeMarks(pair[side])) {
            const moved = marks.find((m) => m.key === `${side}:${own.key}`)!
            expect(moved.anchor).toEqual([own.anchor[0] + dx, own.anchor[1] + dy])
            expect(moved.area?.outline).toEqual(own.area?.outline.map(([x, y]) => [x + dx, y + dy]))
            expect(moved.lines).toEqual(own.lines?.map((line) => line.map(([x, y]) => [x + dx, y + dy])))
          }
        }
      })

      it('answers a tie anywhere on its label pill, whose outline is the pill drawn', () => {
        for (const drawn of layout.ties) {
          const { x0, y0, x1, y1 } = drawn.label.box
          const r = (y1 - y0) / 2
          const pill = marks.find((m) => m.key === tieKey(drawn.index))!.area!.outline
          for (const [x, y] of pill) {
            const cap: readonly [number, number] = [Math.min(Math.max(x, x0 + r), x1 - r), (y0 + y1) / 2]
            expect(Math.hypot(x - cap[0], y - cap[1])).toBeCloseTo(r, 6)
          }
          for (const point of [drawn.curve.mid, [x0 + r, y0 + r], [x1 - r, y1 - r]] as const) expect(hit(point)).toBe(tieKey(drawn.index))
        }
      })

      it('answers a tie on its line between the maps, and a glyph inside a map', () => {
        const tieMarks = layout.ties.map((t) => marks.find((m) => m.key === tieKey(t.index))!)
        const near = (p: readonly [number, number], m: PlacedMark<unknown>): boolean =>
          m.lines!.some((line) => line.some(([x, y]) => Math.hypot(x - p[0], y - p[1]) < REACH + 8)) ||
          (p[0] > m.area!.outline[0][0] - REACH && p[0] < m.area!.outline[2][0] + REACH && p[1] > m.area!.outline[0][1] - REACH && p[1] < m.area!.outline[2][1] + REACH)
        for (const own of tieMarks) {
          expect(own.lines!.length).toBeGreaterThan(0)
          const alone = own.lines!.flat().find((p) => tieMarks.every((other) => !near(p, other) || other === own) && !near(p, { ...own, lines: [] }))
          expect(alone, own.key).toBeDefined()
          expect(hit(alone!)).toBe(own.key)
        }
        const sun = marks.find((m) => m.key === 'a:planet:sun')!
        expect(hit(sun.anchor)).toBe('a:planet:sun')
      })

      it('leaves the inside of both maps to their marks', () => {
        const centres = PAIR_SIDES.map((side) => [layout.origins[side][0] + C, layout.origins[side][1] + C] as const)
        for (const drawn of layout.ties) {
          for (const [x, y] of marks.find((m) => m.key === tieKey(drawn.index))!.lines!.flat()) {
            for (const [cx, cy] of centres) expect(Math.hypot(x - cx, y - cy)).toBeGreaterThan(RING.skyOuter)
          }
        }
      })
    })
  }
})
