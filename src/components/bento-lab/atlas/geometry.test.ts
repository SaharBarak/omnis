import { describe, expect, it } from 'vitest'
import { calculateOracle } from '@pleiad/engine/calculations/oracle'
import { kinToSeal } from '@pleiad/engine/calculations/dreamspell'
import type { Kin } from '@pleiad/engine/core/types'
import { arcPath, BODY_SCALE, boxAround, C, labelWidth, norm, overlaps, placeAlong, polar, RING, sealAngle, skyAngle, spreadAngles, TIE_LABEL } from './geometry'
import { CENTER_POSITIONS, VIEW_HEIGHT, VIEW_WIDTH } from '@/components/human-design/bodygraph-layout'

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
