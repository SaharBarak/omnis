import { describe, expect, it } from 'vitest'
import { NAKSHATRAS, NAKSHATRA_SPAN, VIMSHOTTARI, nakshatraAt } from './nakshatras'

/** Published values (Wikipedia "Nakshatra"; BPHS ch. 46): the twenty-seven at 13°20' each, the Vimshottari lords and years. */
describe('nakshatras', () => {
  it('runs twenty-seven of 13°20′ from Ashwini at 0° to Revati at 346°40′', () => {
    expect(NAKSHATRAS).toHaveLength(27)
    expect(NAKSHATRA_SPAN * 3).toBeCloseTo(40)
    expect(NAKSHATRAS[26]).toMatchObject({ name: 'Revati', deity: 'Pushan' })
    expect(NAKSHATRAS[26]?.start).toBeCloseTo(346 + 2 / 3)
  })

  it('gives the Vimshottari lords from Ketu at Ashwini, 120 years in all', () => {
    expect(VIMSHOTTARI.reduce((sum, l) => sum + l.years, 0)).toBe(120)
    expect(['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Magha', 'Mula', 'Revati'].map((name) => NAKSHATRAS.find((n) => n.name === name)?.lord.name)).toEqual([
      'Ketu',
      'Venus',
      'Sun',
      'Moon',
      'Ketu',
      'Ketu',
      'Mercury',
    ])
  })

  it('finds the nakshatra and pada of a sidereal longitude', () => {
    expect(nakshatraAt(0)).toMatchObject({ nakshatra: { name: 'Ashwini' }, pada: 1 })
    expect(nakshatraAt(3.5)).toMatchObject({ nakshatra: { name: 'Ashwini' }, pada: 2 })
    expect(nakshatraAt(40)).toMatchObject({ nakshatra: { name: 'Rohini' }, pada: 1 })
    expect(nakshatraAt(359.9)).toMatchObject({ nakshatra: { name: 'Revati' }, pada: 4 })
    expect(nakshatraAt(-0.1)).toMatchObject({ nakshatra: { name: 'Revati' }, pada: 4 })
  })
})
