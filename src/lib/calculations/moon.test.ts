import { describe, it, expect } from 'vitest'
import {
  getMoonReading,
  getLunation,
  angleToPhaseIndex,
  MOON_PHASES,
} from './moon'

describe('angleToPhaseIndex', () => {
  it('maps cardinal angles to their octants', () => {
    expect(angleToPhaseIndex(0)).toBe(0) // new
    expect(angleToPhaseIndex(90)).toBe(2) // first quarter
    expect(angleToPhaseIndex(180)).toBe(4) // full
    expect(angleToPhaseIndex(270)).toBe(6) // last quarter
  })

  it('handles octant boundaries and wraparound', () => {
    expect(angleToPhaseIndex(22.4)).toBe(0)
    expect(angleToPhaseIndex(22.5)).toBe(1)
    expect(angleToPhaseIndex(359)).toBe(0) // wraps back to new
    expect(angleToPhaseIndex(337.4)).toBe(7) // last sliver of waning crescent
    expect(angleToPhaseIndex(337.5)).toBe(0) // new-moon octant begins
  })
})

describe('getMoonReading', () => {
  // Reference events (UTC): solar eclipse = exact new moon.
  it('detects the 2024-04-08 total solar eclipse as a new moon', () => {
    const r = getMoonReading('2024-04-08')
    expect(r.phase).toBe('New Moon')
    expect(r.illumination).toBeLessThan(0.05)
  })

  it('detects the 2024-09-18 lunar eclipse as a full moon', () => {
    const r = getMoonReading('2024-09-18')
    expect(r.phase).toBe('Full Moon')
    expect(r.illumination).toBeGreaterThan(0.95)
  })

  it('phases advance through the cycle across a synodic month', () => {
    const phases = [
      getMoonReading('2025-01-01').phaseIndex,
      getMoonReading('2025-01-08').phaseIndex,
      getMoonReading('2025-01-15').phaseIndex,
      getMoonReading('2025-01-22').phaseIndex,
    ]
    // Strictly increasing octants over ~3 weeks (no wrap in this window).
    expect(phases[0]).toBeLessThan(phases[1])
    expect(phases[1]).toBeLessThan(phases[2])
    expect(phases[2]).toBeLessThan(phases[3])
  })

  it('illumination stays in [0,1] and phase names are valid', () => {
    for (const d of ['1970-06-15', '1991-03-21', '2010-12-01', '2026-07-05']) {
      const r = getMoonReading(d)
      expect(r.illumination).toBeGreaterThanOrEqual(0)
      expect(r.illumination).toBeLessThanOrEqual(1)
      expect(MOON_PHASES).toContain(r.phase)
    }
  })
})

describe('getLunation', () => {
  it('countdowns stay within one synodic month', () => {
    const l = getLunation('2026-07-05')
    expect(l.daysToFull).toBeGreaterThanOrEqual(0)
    expect(l.daysToFull).toBeLessThan(29.6)
    expect(l.daysToNew).toBeGreaterThanOrEqual(0)
    expect(l.daysToNew).toBeLessThan(29.6)
  })

  it('a new moon is ~14.8 days from full', () => {
    const l = getLunation('2024-04-08')
    expect(l.daysToFull).toBeGreaterThan(11)
    expect(l.daysToFull).toBeLessThan(18)
  })
})
