import { describe, expect, it } from 'vitest'
import { calculateOracle } from '@pleiad/engine/calculations/oracle'
import { kinToSeal } from '@pleiad/engine/calculations/dreamspell'
import type { Kin } from '@pleiad/engine/core/types'
import { arcPath, BODY_SCALE, bodyPoint, boxAround, C, concentricPath, labelWidth, norm, overlaps, placeAlong, polar, RING, sealAngle, skyAngle, spreadAngles, TIE_LABEL, type Point } from './geometry'
import { CENTER_POSITIONS, centerOutline, VIEW_HEIGHT, VIEW_WIDTH } from '@/components/human-design/bodygraph-layout'

describe('atlas geometry', () => {
  it('puts the ascendant at 9 o clock', () => {
    expect(skyAngle(123, 123)).toBe(180)
    expect(skyAngle(0, null)).toBe(180)
    expect(skyAngle(90, 0)).toBe(270)
  })

  it('puts the lit seal at 12 o clock and its antipode at 6 for every kin', () => {
    for (let kin = 1; kin <= 260; kin++) {
      const seal = kinToSeal(kin as Kin)
      const { antipode } = calculateOracle(kin as Kin)
      expect(sealAngle(seal, seal)).toBe(90)
      expect(sealAngle(antipode, seal)).toBe(270)
    }
  })

  it('spreads a cluster across 0 degrees as one group', () => {
    const spread = spreadAngles([358, 0, 2], 6)
    const gaps = [norm(spread[1] - spread[0]), norm(spread[2] - spread[1])]
    for (const g of gaps) expect(g).toBeCloseTo(6)
    expect(spread[1]).toBeCloseTo(0)
  })

  it('keeps spread angles at least the gap apart and leaves loners alone', () => {
    const spread = spreadAngles([10, 11, 12, 200], 6)
    const sorted = [...spread.slice(0, 3)].sort((a, b) => a - b)
    expect(sorted[1] - sorted[0]).toBeGreaterThanOrEqual(6 - 1e-9)
    expect(sorted[2] - sorted[1]).toBeGreaterThanOrEqual(6 - 1e-9)
    expect(spread[3]).toBe(200)
  })

  it('fits every bodygraph centre inside the body ring', () => {
    for (const p of Object.values(CENTER_POSITIONS)) {
      const d = Math.hypot((p.x - VIEW_WIDTH / 2) * BODY_SCALE, (p.y - VIEW_HEIGHT / 2) * BODY_SCALE) + p.size * BODY_SCALE
      expect(d).toBeLessThanOrEqual(RING.bodyRadius + 1e-9)
    }
  })

  it('draws arcs the short way round', () => {
    expect(arcPath(100, 350, 10)).toContain(' 0 0 0 ')
    expect(arcPath(100, 10, 350)).toContain(' 0 0 1 ')
    const [x, y] = polar(100, 90)
    expect(x).toBeCloseTo(C)
    expect(y).toBeCloseTo(C - 100)
    expect(norm(-30)).toBe(330)
  })
})

describe('labelWidth', () => {
  it('grows with the label at the font size times the glyph advance', () => {
    const step = TIE_LABEL.fontSize * TIE_LABEL.advance
    expect(labelWidth('Guide')).toBeCloseTo(5 * step + 2 * TIE_LABEL.padX, 2)
    expect(labelWidth('Guides') - labelWidth('Guide')).toBeCloseTo(step, 2)
  })

  it('gives pointed Hebrew the width of its letters, not of its marks', () => {
    expect(labelWidth('שָׁלוֹם')).toBe(labelWidth('שלום'))
  })
})

describe('placeAlong', () => {
  const a = [0, 0] as const
  const b = [200, 0] as const

  it('keeps the preferred point when it is clear', () => {
    expect(placeAlong(a, b, 0.5, 40, 20, [])).toEqual([100, 0])
  })

  it('slides to the nearest clear point along the segment', () => {
    const blocked = [boxAround([100, 0], 60, 40)]
    const point = placeAlong(a, b, 0.5, 40, 20, blocked)
    expect(point).not.toBeNull()
    expect(overlaps(boxAround(point!, 40, 20), blocked[0])).toBe(false)
    expect(Math.abs(point![0] - 100)).toBeLessThanOrEqual(60)
  })

  it('gives up when nothing along the segment is clear', () => {
    expect(placeAlong(a, b, 0.5, 40, 20, [boxAround([100, 0], 400, 40)])).toBeNull()
  })
})

/** Distance from `p` to the nearest point of a closed outline's edges. */
const toOutline = ([x, y]: Point, outline: readonly Point[]): number =>
  Math.min(
    ...outline.map(([x0, y0], i) => {
      const [x1, y1] = outline[(i + 1) % outline.length]
      const t = Math.max(0, Math.min(1, ((x - x0) * (x1 - x0) + (y - y0) * (y1 - y0)) / ((x1 - x0) ** 2 + (y1 - y0) ** 2)))
      return Math.hypot(x - (x0 + t * (x1 - x0)), y - (y0 + t * (y1 - y0)))
    }),
  )

/** The points a path moves, arcs and draws lines to, and its arcs' radii and sweeps. */
function pathParts(d: string): { readonly points: readonly Point[]; readonly arcs: readonly { readonly r: number; readonly sweep: number }[] } {
  const points: Point[] = []
  const arcs: { r: number; sweep: number }[] = []
  for (const [, command, args] of d.matchAll(/([MAL])([^MALZ]*)/g)) {
    const n = args.trim().split(/\s+/).map(Number)
    if (command === 'A') arcs.push({ r: n[0], sweep: n[4] })
    points.push([n.at(-2)!, n.at(-1)!])
  }
  return { points, arcs }
}

/** Whether `p` lies inside a closed outline (even-odd rule). */
const inside = ([x, y]: Point, outline: readonly Point[]): boolean =>
  outline.reduce((within, [xi, yi], i) => {
    const [xj, yj] = outline.at(i - 1)!
    return (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi ? !within : within
  }, false)

/** The middle of each corner's round, `gap` out from its vertex between the normals of the edges meeting there. */
const arcMiddles = (outline: readonly Point[], gap: number): readonly Point[] =>
  outline.map((vertex, i) => {
    const away = ([x, y]: Point): Point => [(vertex[0] - x) / Math.hypot(vertex[0] - x, vertex[1] - y), (vertex[1] - y) / Math.hypot(vertex[0] - x, vertex[1] - y)]
    const [a, b] = [away(outline.at(i - 1)!), away(outline[(i + 1) % outline.length])]
    const out: Point = [a[0] + b[0], a[1] + b[1]]
    const length = Math.hypot(...out)
    return [vertex[0] + (out[0] / length) * gap, vertex[1] + (out[1] / length) * gap]
  })

/** A small arc's centre, from its ends, radius and sweep flag (SVG 1.1, F.6.5). */
function arcCentre([x0, y0]: Point, [x1, y1]: Point, r: number, sweep: number): Point {
  const [hx, hy] = [(x0 - x1) / 2, (y0 - y1) / 2]
  const k = (sweep === 1 ? 1 : -1) * Math.sqrt(Math.max(0, r * r - hx * hx - hy * hy) / (hx * hx + hy * hy))
  return [k * hy + (x0 + x1) / 2, -k * hx + (y0 + y1) / 2]
}

describe('concentricPath', () => {
  const outlines = Object.values(CENTER_POSITIONS).map((pos) => centerOutline(pos).map(([x, y]) => bodyPoint(x, y)))

  it('stands every point the gap off each centre\'s outline, outside it, in either winding', () => {
    for (const outline of outlines) {
      for (const wound of [outline, [...outline].reverse()]) {
        for (const gap of [2, 5]) {
          const { points, arcs } = pathParts(concentricPath(wound, gap)!)
          expect(points).toHaveLength(2 * wound.length + 1)
          for (const p of points) expect(toOutline(p, wound)).toBeCloseTo(gap, 1)
          for (const p of arcMiddles(wound, gap)) {
            expect(toOutline(p, wound)).toBeCloseTo(gap, 5)
            expect(inside(p, wound)).toBe(false)
          }
          expect(arcs).toHaveLength(wound.length)
          for (const arc of arcs) expect(arc.r).toBe(gap)
        }
      }
    }
  })

  it('rounds each corner about its own vertex, in either winding', () => {
    for (const outline of outlines) {
      for (const wound of [outline, [...outline].reverse()]) {
        const { points, arcs } = pathParts(concentricPath(wound, 2)!)
        wound.forEach((vertex, i) => {
          const [cx, cy] = arcCentre(points[2 * i], points[2 * i + 1], arcs[i].r, arcs[i].sweep)
          expect(cx).toBeCloseTo(vertex[0], 1)
          expect(cy).toBeCloseTo(vertex[1], 1)
        })
      }
    }
  })

  it('takes a repeated point as one corner, and has no path for an outline without area or turning both ways', () => {
    const square: readonly Point[] = [[0, 0], [10, 0], [10, 10], [0, 10]]
    const closed = concentricPath([...square, square[0]], 2)!
    for (const p of pathParts(closed).points) expect(toOutline(p, square)).toBeCloseTo(2, 1)
    expect(concentricPath([[0, 0], [10, 0], [10, 0], [10, 10], [0, 10]], 2)).toBe(concentricPath(square, 2))
    expect(concentricPath([[0, 0], [5, 0], [10, 0]], 2)).toBeNull()
    expect(concentricPath([[0, 0], [10, 0]], 2)).toBeNull()
    expect(concentricPath([[0, 0], [10, 0], [5, 3], [10, 10], [0, 10]], 2)).toBeNull()
  })
})

