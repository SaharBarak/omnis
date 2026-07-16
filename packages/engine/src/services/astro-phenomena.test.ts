import { describe, expect, it } from 'vitest'

import { MOON_PHASES } from '../calculations/moon'
import { getDailyAstroPhenomena } from './astro-phenomena'

describe('getDailyAstroPhenomena', () => {
  const date = '2026-07-16'
  const result = getDailyAstroPhenomena(date)

  it('returns a valid moon phase and illumination', () => {
    expect(MOON_PHASES).toContain(result.moon.phase)
    expect(result.moon.illumination).toBeGreaterThanOrEqual(0)
    expect(result.moon.illumination).toBeLessThanOrEqual(1)
  })

  it('reports the sun sign', () => {
    expect(result.sun.sign).toBeTruthy()
    expect(result.sun.sign).not.toBe('Unknown')
  })

  it('only lists real planets as retrograde (never sun, moon, or nodes)', () => {
    const bodies = result.retrogrades.map((r) => r.planet.toLowerCase())
    expect(bodies).not.toContain('sun')
    expect(bodies).not.toContain('moon')
    expect(bodies).not.toContain('north node')
    expect(bodies).not.toContain('south node')
  })

  it('only surfaces tight major aspects', () => {
    for (const aspect of result.aspects) {
      expect(aspect.orb).toBeLessThanOrEqual(3)
      expect(['major-hard', 'major-soft']).toContain(aspect.nature)
    }
  })

  it('builds a one-line summary with the moon phase and sun sign', () => {
    expect(result.summary).toContain(result.moon.phase)
    expect(result.summary).toContain(`Sun in ${result.sun.sign}`)
  })

  it('is deterministic for a given date', () => {
    expect(getDailyAstroPhenomena(date)).toEqual(result)
  })

  it('detects a moon-phase transition on a known cardinal-phase crossing', () => {
    // Scan a lunation; at least one day must cross into a new phase octant.
    const transitions = Array.from({ length: 30 }, (_, i) => {
      const d = new Date('2026-07-01T00:00:00Z')
      d.setUTCDate(d.getUTCDate() + i)
      return getDailyAstroPhenomena(d.toISOString().slice(0, 10))
    }).flatMap((p) => p.transitions)
    expect(transitions.some((t) => t.kind === 'moon-phase')).toBe(true)
  })
})
