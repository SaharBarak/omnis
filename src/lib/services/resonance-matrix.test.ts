import { describe, expect, it } from 'vitest'

import {
  MATRIX_ENGINE_VERSION,
  MATRIX_RAMP,
  buildPairCacheData,
  isFreshPairCache,
  isPairCacheData,
  orderForMatrix,
  pairCacheKey,
  pairVersion,
  scoreBucket,
  scoreRampStep,
  slimPair,
  sortPair,
  type MatrixPairScore,
} from './resonance-matrix'
import { calculateFiveSystemCompatibility } from '@pleiad/engine/services/compatibility'

const ID_A = '11111111-1111-4111-8111-111111111111'
const ID_B = '22222222-2222-4222-8222-222222222222'

function makePair(): MatrixPairScore {
  const full = calculateFiveSystemCompatibility(
    { birthDate: '1990-05-15' },
    { birthDate: '1992-08-20' }
  )
  return slimPair(ID_A, ID_B, full)
}

describe('sortPair', () => {
  it('returns ids in lexicographic order regardless of input order', () => {
    expect(sortPair(ID_A, ID_B)).toEqual([ID_A, ID_B])
    expect(sortPair(ID_B, ID_A)).toEqual([ID_A, ID_B])
  })
})

describe('pairVersion / pairCacheKey', () => {
  it('embeds the engine version and higher id', () => {
    expect(pairVersion(ID_B)).toBe(`${MATRIX_ENGINE_VERSION}:${ID_B}`)
    expect(pairCacheKey(ID_A, ID_B)).toBe(
      `${ID_A}:${MATRIX_ENGINE_VERSION}:${ID_B}`
    )
  })
})

describe('slimPair', () => {
  it('keeps only the matrix-relevant fields from the engine result', () => {
    const pair = makePair()
    expect(pair.p1).toBe(ID_A)
    expect(pair.p2).toBe(ID_B)
    expect(pair.overallScore).toBeGreaterThanOrEqual(0)
    expect(pair.overallScore).toBeLessThanOrEqual(100)
    expect(Object.keys(pair.systems)).toEqual(
      expect.arrayContaining(['dreamspell', 'tzolkin', 'astrology', 'humanDesign', 'gematria'])
    )
    expect(pair).not.toHaveProperty('dreamspellDetail')
    expect(pair).not.toHaveProperty('synastryDetail')
    expect(pair.summary.english.length).toBeGreaterThan(0)
  })
})

describe('pair cache freshness', () => {
  const t1 = '2026-07-01T00:00:00.000Z'
  const t2 = '2026-07-02T00:00:00.000Z'

  it('accepts a matching cache payload', () => {
    const data = buildPairCacheData(makePair(), t1, t2)
    expect(isPairCacheData(data)).toBe(true)
    expect(isFreshPairCache(data, t1, t2)).toBe(true)
  })

  it('rejects when either person was updated after caching', () => {
    const data = buildPairCacheData(makePair(), t1, t2)
    expect(isFreshPairCache(data, '2026-07-03T00:00:00.000Z', t2)).toBe(false)
    expect(isFreshPairCache(data, t1, '2026-07-03T00:00:00.000Z')).toBe(false)
  })

  it('rejects a payload from another engine version', () => {
    const data = { ...buildPairCacheData(makePair(), t1, t2), engine: 'five-system-v0' }
    expect(isFreshPairCache(data, t1, t2)).toBe(false)
  })

  it('rejects malformed payloads', () => {
    expect(isFreshPairCache(null, t1, t2)).toBe(false)
    expect(isFreshPairCache({}, t1, t2)).toBe(false)
    expect(isFreshPairCache({ engine: MATRIX_ENGINE_VERSION }, t1, t2)).toBe(false)
  })
})

describe('orderForMatrix', () => {
  it('pins the self entry first and keeps the rest stable', () => {
    const people = [
      { id: 'a', is_self: false },
      { id: 'b', is_self: false },
      { id: 'self', is_self: true },
      { id: 'c', is_self: false },
    ]
    expect(orderForMatrix(people).map((p) => p.id)).toEqual(['self', 'a', 'b', 'c'])
  })
})

describe('scoreBucket', () => {
  it('maps scores to the violet→neutral ramp buckets', () => {
    expect(scoreBucket(0)).toBe(0)
    expect(scoreBucket(34)).toBe(0)
    expect(scoreBucket(35)).toBe(1)
    expect(scoreBucket(50)).toBe(2)
    expect(scoreBucket(65)).toBe(3)
    expect(scoreBucket(80)).toBe(4)
    expect(scoreBucket(90)).toBe(5)
    expect(scoreBucket(100)).toBe(MATRIX_RAMP.length - 1)
  })

  it('clamps out-of-range scores', () => {
    expect(scoreBucket(-10)).toBe(0)
    expect(scoreBucket(500)).toBe(MATRIX_RAMP.length - 1)
  })

  it('scoreRampStep returns the bucket step', () => {
    expect(scoreRampStep(92)).toBe(MATRIX_RAMP[5])
    expect(scoreRampStep(10)).toBe(MATRIX_RAMP[0])
  })
})
