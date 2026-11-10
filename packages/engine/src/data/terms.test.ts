import { describe, expect, it } from 'vitest'
import { EGYPTIAN_TERMS, termAt, termsOf } from './terms'

/**
 * The Egyptian terms as Ptolemy sets them out (Tetrabiblos I.20, Robbins
 * tr., Loeb 1940): the rows he gives for Aries, Scorpio and Pisces, and the
 * sums he reports, Saturn 57 degrees, Jupiter 79, Mars 66, Venus 82 and
 * Mercury 76.
 */
describe('EGYPTIAN_TERMS', () => {
  it('holds the rows as Ptolemy gives them', () => {
    expect(EGYPTIAN_TERMS.aries).toEqual([['jupiter', 6], ['venus', 6], ['mercury', 8], ['mars', 5], ['saturn', 5]])
    expect(EGYPTIAN_TERMS.scorpio).toEqual([['mars', 7], ['venus', 4], ['mercury', 8], ['jupiter', 5], ['saturn', 6]])
    expect(EGYPTIAN_TERMS.pisces).toEqual([['venus', 12], ['jupiter', 4], ['mercury', 3], ['mars', 9], ['saturn', 2]])
  })

  it('gives each planet the degrees Ptolemy sums, every sign thirty', () => {
    const rows = Object.values(EGYPTIAN_TERMS)
    for (const row of rows) expect(row.reduce((sum, [, d]) => sum + d, 0)).toBe(30)
    const sums = rows.flat().reduce<Record<string, number>>((acc, [planet, d]) => ({ ...acc, [planet]: (acc[planet] ?? 0) + d }), {})
    expect(sums).toEqual({ saturn: 57, jupiter: 79, mars: 66, venus: 82, mercury: 76 })
  })

  it('places a longitude in its term', () => {
    expect(termsOf('scorpio').map((t) => [t.ruler, t.start, t.end])).toEqual([
      ['mars', 0, 7],
      ['venus', 7, 11],
      ['mercury', 11, 19],
      ['jupiter', 19, 24],
      ['saturn', 24, 30],
    ])
    expect(termAt(226)).toMatchObject({ sign: 'scorpio', ruler: 'mercury', n: 3 })
    expect(termAt(359.9)).toMatchObject({ sign: 'pisces', ruler: 'saturn', n: 5 })
    expect(termAt(0)).toMatchObject({ sign: 'aries', ruler: 'jupiter', n: 1 })
  })
})
