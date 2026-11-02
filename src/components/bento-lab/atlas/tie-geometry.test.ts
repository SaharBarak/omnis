import { describe, expect, it } from 'vitest'
import { bowedCurve } from './tie-geometry'

const controls = (d: string): readonly number[] => d.replace(/[MC]/g, '').trim().split(/\s+/).map(Number)

describe('bowedCurve', () => {
  it('bows past the further end by the lift', () => {
    const [, , c1x] = controls(bowedCurve([100, 0], [100, 400], [1, 0], 40).d)
    expect(c1x).toBeCloseTo(140, 1)
  })

  it('lifts from the drawing edge when that is further than both ends, so the arc leaves the maps', () => {
    const curve = bowedCurve([100, 0], [100, 400], [1, 0], 40, 640)
    const [, , c1x, , c2x] = controls(curve.d)
    expect(c1x).toBeCloseTo(680, 1)
    expect(c2x).toBeCloseTo(680, 1)
    expect(curve.mid[0]).toBeGreaterThan(400)
  })

  it('ignores an edge nearer than the ends', () => {
    expect(bowedCurve([100, 0], [100, 400], [1, 0], 40, 0).d).toBe(bowedCurve([100, 0], [100, 400], [1, 0], 40).d)
  })
})
