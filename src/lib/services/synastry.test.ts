import { describe, it, expect } from 'vitest'
import {
  calculateSynastryCompatibility,
  type SynastryInput,
} from './synastry'

describe('Synastry Compatibility Service', () => {
  describe('basic shape and determinism', () => {
    it('returns a valid 0-100 score with bilingual connections', () => {
      const p1: SynastryInput = { birthDate: '1990-06-15', birthTime: '14:30', latitude: 32.08, longitude: 34.78 }
      const p2: SynastryInput = { birthDate: '1992-11-03', birthTime: '09:15', latitude: 40.71, longitude: -74.0 }

      const result = calculateSynastryCompatibility(p1, p2)

      expect(result.available).toBe(true)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
      expect(Number.isInteger(result.score)).toBe(true)
      expect(result.sunElement1).not.toBeNull()
      expect(result.sunElement2).not.toBeNull()

      for (const conn of result.connections) {
        expect(conn.description.length).toBeGreaterThan(0)
        expect(conn.descriptionHebrew.length).toBeGreaterThan(0)
        // Hebrew text must contain Hebrew characters.
        expect(/[֐-׿]/.test(conn.descriptionHebrew)).toBe(true)
        expect(['harmonious', 'challenging']).toContain(conn.harmony)
      }
    })

    it('is deterministic — identical inputs yield identical output', () => {
      const p1: SynastryInput = { birthDate: '1985-03-21', birthTime: '06:00', latitude: 0, longitude: 0 }
      const p2: SynastryInput = { birthDate: '1988-09-09', birthTime: '18:00', latitude: 0, longitude: 0 }

      const a = calculateSynastryCompatibility(p1, p2)
      const b = calculateSynastryCompatibility(p1, p2)

      expect(a.score).toBe(b.score)
      expect(a.connections.length).toBe(b.connections.length)
    })
  })

  describe('harmonious pairing (same / compatible element)', () => {
    it('two Sun-sign same-element charts include a harmonious element connection', () => {
      // Both Leo (fire): mid-August dates.
      const p1: SynastryInput = { birthDate: '1990-08-10', birthTime: '12:00', latitude: 0, longitude: 0 }
      const p2: SynastryInput = { birthDate: '1991-08-12', birthTime: '12:00', latitude: 0, longitude: 0 }

      const result = calculateSynastryCompatibility(p1, p2)

      expect(result.available).toBe(true)
      expect(result.sunElement1).toBe('fire')
      expect(result.sunElement2).toBe('fire')

      const elementConn = result.connections.find((c) => c.type === 'element')
      expect(elementConn).toBeDefined()
      expect(elementConn?.harmony).toBe('harmonious')
      // Same-element bonus should push score above the base of 20.
      expect(result.score).toBeGreaterThan(20)
    })
  })

  describe('challenging pairing (clashing element)', () => {
    it('fire vs water Sun signs records a challenging element connection', () => {
      // Aries (fire, late March) vs Cancer (water, early July).
      const p1: SynastryInput = { birthDate: '1990-03-28', birthTime: '12:00', latitude: 0, longitude: 0 }
      const p2: SynastryInput = { birthDate: '1990-07-05', birthTime: '12:00', latitude: 0, longitude: 0 }

      const result = calculateSynastryCompatibility(p1, p2)

      expect(result.available).toBe(true)
      expect(result.sunElement1).toBe('fire')
      expect(result.sunElement2).toBe('water')

      const elementConn = result.connections.find((c) => c.type === 'element')
      expect(elementConn).toBeDefined()
      expect(elementConn?.harmony).toBe('challenging')
    })
  })

  describe('missing-location fallback', () => {
    it('still computes when latitude/longitude are absent', () => {
      const p1: SynastryInput = { birthDate: '1990-06-15', birthTime: '14:30' }
      const p2: SynastryInput = { birthDate: '1992-11-03', birthTime: '09:15' }

      const result = calculateSynastryCompatibility(p1, p2)

      expect(result.available).toBe(true)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
    })

    it('still computes when location is explicitly null and no birth time', () => {
      const p1: SynastryInput = { birthDate: '1990-06-15', birthTime: null, latitude: null, longitude: null }
      const p2: SynastryInput = { birthDate: '1992-11-03', latitude: null, longitude: null }

      const result = calculateSynastryCompatibility(p1, p2)

      expect(result.available).toBe(true)
      expect(result.sunElement1).not.toBeNull()
    })

    it('location does not change Sun element (longitude depends on date, not place)', () => {
      const withLoc = calculateSynastryCompatibility(
        { birthDate: '1990-06-15', birthTime: '14:30', latitude: 32.08, longitude: 34.78 },
        { birthDate: '1992-11-03', birthTime: '09:15', latitude: 32.08, longitude: 34.78 }
      )
      const noLoc = calculateSynastryCompatibility(
        { birthDate: '1990-06-15', birthTime: '14:30' },
        { birthDate: '1992-11-03', birthTime: '09:15' }
      )

      expect(withLoc.sunElement1).toBe(noLoc.sunElement1)
      expect(withLoc.sunElement2).toBe(noLoc.sunElement2)
    })
  })

  describe('identical birth data', () => {
    it('scores high — every planet conjuncts its counterpart', () => {
      const same: SynastryInput = { birthDate: '1990-06-15', birthTime: '14:30', latitude: 32.08, longitude: 34.78 }

      const result = calculateSynastryCompatibility(same, same)

      expect(result.available).toBe(true)
      // Identical charts: all key planets conjunct + same Sun element.
      expect(result.score).toBeGreaterThanOrEqual(80)

      // Sun-Sun conjunction must be present.
      const sunConj = result.connections.find(
        (c) => c.type === 'cross-aspect' && c.planet1 === 'sun' && c.planet2 === 'sun'
      )
      expect(sunConj).toBeDefined()
      expect(sunConj?.aspect).toBe('conjunction')
      expect(sunConj?.harmony).toBe('harmonious')

      // Same element bonus applies.
      expect(result.sunElement1).toBe(result.sunElement2)
    })
  })

  describe('unavailable when chart cannot be computed', () => {
    it('returns available: false for an empty birth date', () => {
      const result = calculateSynastryCompatibility(
        { birthDate: '' },
        { birthDate: '1990-06-15' }
      )

      expect(result.available).toBe(false)
      expect(result.score).toBe(0)
      expect(result.connections).toHaveLength(0)
    })
  })
})
