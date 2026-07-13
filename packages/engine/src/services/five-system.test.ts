import { describe, it, expect } from 'vitest'
import {
  calculateFiveSystemCompatibility,
  nameValueMatch,
  type PersonCompatInput,
} from './compatibility'

const dateOnlyA: PersonCompatInput = { birthDate: '1990-05-14' }
const dateOnlyB: PersonCompatInput = { birthDate: '1988-11-02' }

const fullA: PersonCompatInput = {
  birthDate: '1990-05-14',
  birthTime: '14:30',
  birthPlace: { lat: 32.0853, lng: 34.7818 },
  hebrewName: 'דוד',
}
const fullB: PersonCompatInput = {
  birthDate: '1988-11-02',
  birthTime: '09:15',
  birthPlace: { lat: 40.7128, lng: -74.006 },
  hebrewName: 'שרה',
}

function weightSum(r: ReturnType<typeof calculateFiveSystemCompatibility>) {
  return Object.values(r.systems).reduce((s, x) => s + x.weight, 0)
}

describe('calculateFiveSystemCompatibility', () => {
  it('with birth dates only, runs dreamspell + tzolkin + astrology (no HD/gematria)', () => {
    const r = calculateFiveSystemCompatibility(dateOnlyA, dateOnlyB)
    expect(r.availableSystems).toContain('dreamspell')
    expect(r.availableSystems).toContain('tzolkin')
    expect(r.availableSystems).toContain('astrology')
    expect(r.availableSystems).not.toContain('humanDesign')
    expect(r.availableSystems).not.toContain('gematria')
    expect(r.systems.humanDesign.weight).toBe(0)
    expect(r.systems.gematria.weight).toBe(0)
  })

  it('reports a name-value comparison but never scores gematria', () => {
    const r = calculateFiveSystemCompatibility(
      { ...dateOnlyA, hebrewName: 'דוד' },
      { ...dateOnlyB, hebrewName: 'שרה' }
    )
    // Gematria has no traditional compatibility doctrine, so it contributes no
    // score and no weight — only the one relation the tradition sanctions.
    expect(r.availableSystems).not.toContain('gematria')
    expect(r.systems.gematria.weight).toBe(0)
    expect(r.nameMatch).not.toBeNull()
    expect(r.nameMatch?.exact).toBe(false) // דוד=14, שרה=505
  })

  it('flags an exact name-value match', () => {
    const r = calculateFiveSystemCompatibility(
      { ...dateOnlyA, hebrewName: 'דוד' },
      { ...dateOnlyB, hebrewName: 'דוד' }
    )
    expect(r.nameMatch?.exact).toBe(true)
  })

  it('runs all five systems with full birth data', () => {
    const r = calculateFiveSystemCompatibility(fullA, fullB)
    // Four SCORED systems. Gematria is deliberately not among them — it has no
    // traditional compatibility doctrine, so it contributes `nameMatch` only.
    expect(r.availableSystems).toEqual(
      expect.arrayContaining(['dreamspell', 'tzolkin', 'astrology', 'humanDesign'])
    )
    expect(r.availableSystems).not.toContain('gematria')
    expect(r.hdDetail).not.toBeNull()
    expect(r.synastryDetail).not.toBeNull()
  })

  it('effective weights of available systems sum to ~1', () => {
    expect(weightSum(calculateFiveSystemCompatibility(dateOnlyA, dateOnlyB))).toBeCloseTo(1, 5)
    expect(weightSum(calculateFiveSystemCompatibility(fullA, fullB))).toBeCloseTo(1, 5)
  })

  it('overall score is 0-100 and deterministic', () => {
    const a = calculateFiveSystemCompatibility(fullA, fullB)
    const b = calculateFiveSystemCompatibility(fullA, fullB)
    expect(a.overallScore).toBeGreaterThanOrEqual(0)
    expect(a.overallScore).toBeLessThanOrEqual(100)
    expect(a.overallScore).toBe(b.overallScore)
  })

  it('nameValueMatch returns null without both names', () => {
    expect(nameValueMatch('דוד', null)).toBeNull()
    expect(nameValueMatch('', 'שרה')).toBeNull()
    expect(nameValueMatch('דוד', 'דוד')?.exact).toBe(true)
  })
})
