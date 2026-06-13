import { describe, it, expect } from 'vitest'
import {
  calculateFiveSystemCompatibility,
  gematriaCompatibilityScore,
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

  it('adds gematria when both Hebrew names are present', () => {
    const r = calculateFiveSystemCompatibility(
      { ...dateOnlyA, hebrewName: 'דוד' },
      { ...dateOnlyB, hebrewName: 'שרה' }
    )
    expect(r.availableSystems).toContain('gematria')
    expect(r.gematriaScore).not.toBeNull()
  })

  it('runs all five systems with full birth data', () => {
    const r = calculateFiveSystemCompatibility(fullA, fullB)
    expect(r.availableSystems).toEqual(
      expect.arrayContaining(['dreamspell', 'tzolkin', 'astrology', 'humanDesign', 'gematria'])
    )
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

  it('gematriaCompatibilityScore returns null without both names', () => {
    expect(gematriaCompatibilityScore('דוד', null)).toBeNull()
    expect(gematriaCompatibilityScore('', 'שרה')).toBeNull()
    expect(gematriaCompatibilityScore('דוד', 'דוד')).toBeGreaterThan(0)
  })
})
