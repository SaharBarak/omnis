import { describe, it, expect } from 'vitest'
import { surprisal, rarityScore, bySurprisal, BASE_RATE, baseRateOf, UNMEASURED_RATE, tierOf, mayDrawEdge } from './rarity'

describe('surprisal', () => {
  it('gives a near-universal tie almost no weight', () => {
    // electromagnetic fires on 95.4% of random pairs
    expect(surprisal('electromagnetic')).toBeLessThan(0.1)
    // a cross-aspect fires on every pair: it is worth exactly nothing
    expect(surprisal('cross-aspect')).toBe(0)
  })

  it('gives the exact oracle heavy weight', () => {
    expect(surprisal('guide')).toBeGreaterThan(8)
  })

  it('ranks a guide far above an electromagnetic', () => {
    // The whole point: the tradition-assigned constants said 18 vs 12 (1.5x).
    // The information content says ~115x.
    const ratio = surprisal('guide') / surprisal('electromagnetic')
    expect(ratio).toBeGreaterThan(100)
  })

  it('treats an unmeasured tie as a coin flip, not a discovery', () => {
    expect(surprisal('not-a-real-tie')).toBe(1)
  })
})

describe('baseRateOf', () => {
  it('reads the measured table', () => {
    expect(baseRateOf('guide')).toBe(BASE_RATE.guide)
    expect(baseRateOf('electromagnetic')).toBe(BASE_RATE.electromagnetic)
  })

  it('gives an unmeasured tie the coin-flip rate that surprisal reads as one bit', () => {
    expect(baseRateOf('not-a-real-tie')).toBe(UNMEASURED_RATE)
    expect(surprisal('not-a-real-tie')).toBe(-Math.log2(UNMEASURED_RATE))
  })
})

describe('surprisal ordering', () => {

  it('sorts ties by what they actually say', () => {
    const ties = [
      { type: 'electromagnetic' },
      { type: 'guide' },
      { type: 'same-color' },
      { type: 'cross-aspect' },
    ]
    expect([...ties].sort(bySurprisal).map((t) => t.type)).toEqual([
      'guide',
      'same-color',
      'electromagnetic',
      'cross-aspect',
    ])
  })
})

describe('rarityScore', () => {
  it('refuses to let a pile of universal ties add up to a finding', () => {
    const noise = [
      { type: 'cross-aspect' }, { type: 'electromagnetic' }, { type: 'electromagnetic' },
      { type: 'dominance' }, { type: 'compromise' }, { type: 'element' },
    ]
    expect(rarityScore(noise)).toBeLessThan(10)
  })

  it('scores a single exact oracle relation far above all of that noise', () => {
    const noise = [
      { type: 'cross-aspect' }, { type: 'electromagnetic' },
      { type: 'dominance' }, { type: 'compromise' },
    ]
    expect(rarityScore([{ type: 'guide' }])).toBeGreaterThan(rarityScore(noise) * 5)
  })

  it('is 0 for no ties', () => {
    expect(rarityScore([])).toBe(0)
  })
})

describe('the base-rate table', () => {
  it('holds only real probabilities', () => {
    for (const [type, p] of Object.entries(BASE_RATE)) {
      expect(p, type).toBeGreaterThan(0)
      expect(p, type).toBeLessThanOrEqual(1)
    }
  })
})

describe('tierOf', () => {
  it('sorts measured base rates into the atlas tiers', () => {
    expect(tierOf(BASE_RATE['guide'])).toBe('T3')
    expect(tierOf(0.1)).toBe('T2')
    expect(tierOf(0.5)).toBe('T1')
    expect(tierOf(BASE_RATE['electromagnetic'])).toBe('T0')
  })

  it('lets only T2 and T3 ties carry a line', () => {
    expect(mayDrawEdge(BASE_RATE['guide'])).toBe(true)
    expect(mayDrawEdge(BASE_RATE['electromagnetic'])).toBe(false)
  })
})

describe('EDGE_CEILING', () => {
  it('is the base rate where lines stop', async () => {
    const { EDGE_CEILING, mayDrawEdge } = await import('./rarity')
    expect(mayDrawEdge(EDGE_CEILING - 1e-9)).toBe(true)
    expect(mayDrawEdge(EDGE_CEILING)).toBe(false)
  })
})
