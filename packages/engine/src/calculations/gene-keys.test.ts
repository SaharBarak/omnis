import { describe, it, expect } from 'vitest'

import { geneKeysProfile } from './gene-keys'
import { GENE_KEYS, getGeneKey } from '../data/gene-keys'
import { calculateBodygraph } from './human-design'
import type { ActivationSet, PlanetaryActivation } from '../types/human-design'

function activation(planet: string, gate: number, line = 3): PlanetaryActivation {
  return { planet: planet as PlanetaryActivation['planet'], gate, line: line as PlanetaryActivation['line'], zodiacDegree: 0 }
}

describe('GENE_KEYS data', () => {
  it('carries 64 keys aligned with gate numbering', () => {
    expect(GENE_KEYS.length).toBe(64)
    GENE_KEYS.forEach((k, i) => expect(k.key).toBe(i + 1))
    expect(getGeneKey(55)).toMatchObject({ shadow: 'Victimization', siddhi: 'Freedom' })
    expect(getGeneKey(64)).toMatchObject({ shadow: 'Confusion', gift: 'Imagination', siddhi: 'Illumination' })
  })
})

describe('geneKeysProfile', () => {
  const set: ActivationSet = {
    personality: [
      activation('sun', 1, 4),
      activation('earth', 2, 4),
      activation('venus', 10),
      activation('mars', 20),
      activation('jupiter', 30),
    ],
    design: [
      activation('sun', 3, 2),
      activation('earth', 4, 2),
      activation('moon', 5),
      activation('venus', 6),
      activation('mars', 7),
      activation('jupiter', 8),
    ],
  }

  it('maps the Activation sequence to sun/earth both sides', () => {
    const profile = geneKeysProfile(set)
    expect(profile.activation.map((s) => [s.sphere, s.geneKey.key])).toEqual([
      ["Life's Work", 1],
      ['Evolution', 2],
      ['Radiance', 3],
      ['Purpose', 4],
    ])
    expect(profile.activation[0].line).toBe(4)
    expect(profile.activation[2].line).toBe(2)
  })

  it('maps Venus and Pearl per the official correlations', () => {
    const profile = geneKeysProfile(set)
    expect(profile.venus.map((s) => [s.sphere, s.geneKey.key])).toEqual([
      ['Attraction', 5],
      ['IQ', 10],
      ['EQ', 20],
      ['SQ', 6],
      ['Core', 7],
    ])
    expect(profile.pearl.map((s) => [s.sphere, s.geneKey.key])).toEqual([
      ['Vocation', 7],
      ['Culture', 8],
      ['Pearl', 30],
    ])
  })

  it('omits spheres whose planet is missing instead of inventing them', () => {
    const profile = geneKeysProfile({ personality: [activation('sun', 1)], design: [] })
    expect(profile.activation.length).toBe(1)
    expect(profile.venus.length).toBe(0)
  })

  it('rides a real bodygraph end to end', () => {
    const chart = calculateBodygraph({
      birthDate: '1990-07-29',
      birthTime: '12:00',
      latitude: 32.0853,
      longitude: 34.7818,
    })
    expect(chart.hasBirthTime).toBe(true)
    if (chart.hasBirthTime) {
      const profile = geneKeysProfile(chart.activations)
      expect(profile.activation.length).toBe(4)
      expect(profile.venus.length).toBe(5)
      expect(profile.pearl.length).toBe(3)
      for (const s of [...profile.activation, ...profile.venus, ...profile.pearl]) {
        expect(s.geneKey.key).toBeGreaterThanOrEqual(1)
        expect(s.geneKey.key).toBeLessThanOrEqual(64)
        expect(s.line).toBeGreaterThanOrEqual(1)
        expect(s.line).toBeLessThanOrEqual(6)
      }
    }
  })
})
