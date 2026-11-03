import { describe, expect, it } from 'vitest'
import { SIZE } from './geometry'
import { cardGap, placeCard } from './mark-card'
import { HALO_GAP, TARGET_MIN_PX, type PlacedMark } from './mark-geometry'

const square = { width: 400, height: 400 }
const card = { width: 120, height: 80 }
const GAP = 10

describe('placeCard', () => {
  it('sets the card beside its mark, toward the centre on both axes', () => {
    expect(placeCard([60, 60], card, square, GAP)).toEqual([70, 50])
    expect(placeCard([340, 340], card, square, GAP)).toEqual([340 - GAP - card.width, 340 + GAP - card.height])
  })

  it('keeps the whole card inside the square', () => {
    const [x, y] = placeCard([395, 4], card, square, GAP)
    expect(x).toBeGreaterThanOrEqual(0)
    expect(x + card.width).toBeLessThanOrEqual(square.width)
    expect(y).toBe(0)
  })

  it('pins a card larger than the square to its start edge', () => {
    expect(placeCard([200, 200], { width: 500, height: 500 }, square, GAP)).toEqual([0, 0])
  })
})

describe('cardGap', () => {
  const mark = (r: number): PlacedMark => ({ ref: { kind: 'tone' }, key: 'tone', layer: 'maya', anchor: [0, 0], r })

  it('clears the halo at the drawing size', () => {
    expect(cardGap(mark(30), SIZE)).toBe(30 + HALO_GAP)
  })

  it('never comes closer than half the least target', () => {
    expect(cardGap(mark(1), SIZE / 4)).toBe(TARGET_MIN_PX / 2)
  })
})
