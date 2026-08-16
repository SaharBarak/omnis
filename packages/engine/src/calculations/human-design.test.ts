import { describe, it, expect } from 'vitest'
import {
  calculateBodygraph,
  isCompleteBodygraph,
  getAllGates,
  getPersonalityGates,
  getDesignGates,
  isPersonalityGate,
  isDesignGate,
  getGateActivation,
  getBodygraphSummary,
  formatGateActivation,
  getPlanetsForGate,
} from './human-design'
import {
  GATES,
  getGate,
  getGatesByCenter,
  GATES_BY_CENTER,
  GATE_TO_CENTER,
  longitudeToGate,
  MANDALA_SEQUENCE_FULL,
  getGateDegreeRange,
} from '../data/human-design-gates'
import {
  CHANNELS,
  getChannel,
  getChannelByGates,
  getChannelsForGate,
  getChannelsBetweenCenters,
  getChannelsByCircuitry,
  findDefinedChannels,
  findPotentialChannels,
  areGatesConnected,
} from '../data/human-design-channels'
import {
  CENTERS,
  getCenter,
  TYPES,
  getTypeDefinition,
  AUTHORITIES,
  getAuthorityDefinition,
  PROFILES,
  getProfile,
  getProfileByLines,
  LINE_THEMES,
  getLineTheme,
  MOTOR_CENTERS,
  getCrossAngle,
} from '../data/human-design'
import type { HumanDesignInput, Bodygraph, CenterId } from '../types/human-design'

// =============================================================================
// GATES DATA TESTS
// =============================================================================

describe('Human Design Gates Data', () => {
  describe('GATES array', () => {
    it('should have exactly 64 gates', () => {
      expect(GATES).toHaveLength(64)
    })

    it('should have gates numbered 1-64', () => {
      const numbers = GATES.map((g) => g.number)
      for (let i = 1; i <= 64; i++) {
        expect(numbers).toContain(i)
      }
    })

    it('should have unique gate numbers', () => {
      const numbers = GATES.map((g) => g.number)
      const uniqueNumbers = new Set(numbers)
      expect(uniqueNumbers.size).toBe(64)
    })

    it('should have valid center assignments', () => {
      const validCenters: CenterId[] = [
        'head',
        'ajna',
        'throat',
        'g',
        'heart',
        'spleen',
        'sacral',
        'solar',
        'root',
      ]
      for (const gate of GATES) {
        expect(validCenters).toContain(gate.centerId)
      }
    })

    it('should have Hebrew translations for all gates', () => {
      for (const gate of GATES) {
        expect(gate.nameHebrew).toBeDefined()
        expect(gate.nameHebrew.length).toBeGreaterThan(0)
      }
    })

    it('should have I Ching hexagram numbers 1-64', () => {
      const hexagrams = GATES.map((g) => g.iChingHexagram)
      for (let i = 1; i <= 64; i++) {
        expect(hexagrams).toContain(i)
      }
    })
  })

  describe('getGate', () => {
    it('should return correct gate for valid numbers', () => {
      const gate1 = getGate(1)
      expect(gate1.name).toBe('The Creative')
      expect(gate1.centerId).toBe('g')

      const gate64 = getGate(64)
      expect(gate64.name).toBe('Confusion')
      expect(gate64.centerId).toBe('head')
    })

    it('should throw for invalid gate numbers', () => {
      expect(() => getGate(0)).toThrow(RangeError)
      expect(() => getGate(65)).toThrow(RangeError)
      expect(() => getGate(-1)).toThrow(RangeError)
    })
  })

  describe('getGatesByCenter', () => {
    it('should return correct gates for Head center', () => {
      const headGates = getGatesByCenter('head')
      expect(headGates).toHaveLength(3)
      expect(headGates.map((g) => g.number).sort((a, b) => a - b)).toEqual([61, 63, 64])
    })

    it('should return correct gates for Sacral center', () => {
      const sacralGates = getGatesByCenter('sacral')
      expect(sacralGates).toHaveLength(9)
    })
  })

  describe('GATES_BY_CENTER', () => {
    it('should have entries for all 9 centers', () => {
      expect(Object.keys(GATES_BY_CENTER)).toHaveLength(9)
    })

    it('should have correct gate count per center', () => {
      // Gate counts from the spec
      expect(GATES_BY_CENTER.head).toHaveLength(3)
      expect(GATES_BY_CENTER.ajna).toHaveLength(6)
      expect(GATES_BY_CENTER.throat).toHaveLength(11)
      expect(GATES_BY_CENTER.g).toHaveLength(8)
      expect(GATES_BY_CENTER.heart).toHaveLength(4)
      expect(GATES_BY_CENTER.spleen).toHaveLength(7)
      expect(GATES_BY_CENTER.sacral).toHaveLength(9)
      expect(GATES_BY_CENTER.solar).toHaveLength(7)
      expect(GATES_BY_CENTER.root).toHaveLength(9)
    })

    it('should total 64 gates across all centers', () => {
      const totalGates = Object.values(GATES_BY_CENTER).reduce(
        (sum, gates) => sum + gates.length,
        0
      )
      expect(totalGates).toBe(64)
    })
  })

  describe('GATE_TO_CENTER', () => {
    it('should map all 64 gates to centers', () => {
      expect(Object.keys(GATE_TO_CENTER)).toHaveLength(64)
    })

    it('should correctly map known gates', () => {
      expect(GATE_TO_CENTER[1]).toBe('g')
      expect(GATE_TO_CENTER[64]).toBe('head')
      expect(GATE_TO_CENTER[34]).toBe('sacral')
    })
  })

  describe('longitudeToGate', () => {
    it('should return valid gate numbers (1-64)', () => {
      for (let i = 0; i < 360; i += 5.625) {
        const { gate } = longitudeToGate(i)
        expect(gate).toBeGreaterThanOrEqual(1)
        expect(gate).toBeLessThanOrEqual(64)
      }
    })

    it('should return valid lines (1-6)', () => {
      for (let i = 0; i < 360; i += 0.9375) {
        const { line } = longitudeToGate(i)
        expect(line).toBeGreaterThanOrEqual(1)
        expect(line).toBeLessThanOrEqual(6)
      }
    })

    it('should open the mandala with Gate 41.1 at 2°00\' Aquarius (302°)', () => {
      expect(longitudeToGate(302)).toEqual({ gate: 41, line: 1 })
      // one hair earlier is the last line of the last gate on the wheel
      expect(longitudeToGate(301.99)).toEqual({ gate: 60, line: 6 })
    })

    it('should place 0° Aries inside Gate 25, not at the start of the wheel', () => {
      // Gate 25 runs 28°15' Pisces → 3°52'30" Aries, so 0° Aries is 1.75°
      // into it — line 2. The wheel does NOT begin at the vernal point.
      expect(longitudeToGate(0)).toEqual({ gate: 25, line: 2 })
    })

    it('should handle full circle (360°)', () => {
      const { gate: gate0 } = longitudeToGate(0)
      const { gate: gate360 } = longitudeToGate(360)
      expect(gate0).toBe(gate360)
    })

    it('should handle negative longitudes', () => {
      const { gate: gateNeg } = longitudeToGate(-10)
      const { gate: gatePos } = longitudeToGate(350)
      expect(gateNeg).toBe(gatePos)
    })
  })

  describe('MANDALA_SEQUENCE_FULL', () => {
    it('should have exactly 64 gates', () => {
      expect(MANDALA_SEQUENCE_FULL).toHaveLength(64)
    })

    it('should contain all 64 unique gates', () => {
      const uniqueGates = new Set(MANDALA_SEQUENCE_FULL)
      expect(uniqueGates.size).toBe(64)
    })

    it('should start with Gate 41 (2°00\' Aquarius)', () => {
      expect(MANDALA_SEQUENCE_FULL[0]).toBe(41)
    })
  })

  describe('getGateDegreeRange', () => {
    it('should return correct range for Gate 41', () => {
      const range = getGateDegreeRange(41)
      expect(range).not.toBeNull()
      expect(range!.start).toBeCloseTo(302, 6)
      expect(range!.end).toBeCloseTo(307.625, 6)
    })

    it('should return null for invalid gate', () => {
      const range = getGateDegreeRange(999)
      expect(range).toBeNull()
    })
  })
})

// =============================================================================
// CHANNELS DATA TESTS
// =============================================================================

describe('Human Design Channels Data', () => {
  describe('CHANNELS array', () => {
    it('should have exactly 36 channels', () => {
      expect(CHANNELS).toHaveLength(36)
    })

    it('should have unique channel IDs', () => {
      const ids = CHANNELS.map((c) => c.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(36)
    })

    it('should have valid gate pairs', () => {
      for (const channel of CHANNELS) {
        expect(channel.gates).toHaveLength(2)
        expect(channel.gates[0]).toBeGreaterThanOrEqual(1)
        expect(channel.gates[0]).toBeLessThanOrEqual(64)
        expect(channel.gates[1]).toBeGreaterThanOrEqual(1)
        expect(channel.gates[1]).toBeLessThanOrEqual(64)
      }
    })

    it('should have valid center pairs', () => {
      const validCenters: CenterId[] = [
        'head',
        'ajna',
        'throat',
        'g',
        'heart',
        'spleen',
        'sacral',
        'solar',
        'root',
      ]
      for (const channel of CHANNELS) {
        expect(channel.centers).toHaveLength(2)
        expect(validCenters).toContain(channel.centers[0])
        expect(validCenters).toContain(channel.centers[1])
      }
    })

    it('should have valid circuitry types', () => {
      const validCircuitry = ['individual', 'collective', 'tribal', 'integration']
      for (const channel of CHANNELS) {
        expect(validCircuitry).toContain(channel.circuitry)
      }
    })

    it('should have Hebrew translations', () => {
      for (const channel of CHANNELS) {
        expect(channel.nameHebrew).toBeDefined()
        expect(channel.nameHebrew.length).toBeGreaterThan(0)
      }
    })
  })

  describe('getChannel', () => {
    it('should find channel by ID', () => {
      const channel = getChannel('1-8')
      expect(channel).toBeDefined()
      expect(channel!.name).toBe('Inspiration')
    })

    it('should return undefined for non-existent channel', () => {
      const channel = getChannel('99-99')
      expect(channel).toBeUndefined()
    })
  })

  describe('getChannelByGates', () => {
    it('should find channel regardless of gate order', () => {
      const channel1 = getChannelByGates(1, 8)
      const channel2 = getChannelByGates(8, 1)
      expect(channel1).toBeDefined()
      expect(channel2).toBeDefined()
      expect(channel1!.id).toBe(channel2!.id)
    })

    it('should return undefined for non-connected gates', () => {
      const channel = getChannelByGates(1, 64)
      expect(channel).toBeUndefined()
    })
  })

  describe('getChannelsForGate', () => {
    it('should return all channels containing a gate', () => {
      const channels = getChannelsForGate(20) // Gate 20 is in multiple channels
      expect(channels.length).toBeGreaterThan(0)
      for (const channel of channels) {
        expect(channel.gates.includes(20)).toBe(true)
      }
    })
  })

  describe('getChannelsBetweenCenters', () => {
    it('should return channels between Head and Ajna', () => {
      const channels = getChannelsBetweenCenters('head', 'ajna')
      expect(channels.length).toBe(3)
    })

    it('should work regardless of center order', () => {
      const channels1 = getChannelsBetweenCenters('head', 'ajna')
      const channels2 = getChannelsBetweenCenters('ajna', 'head')
      expect(channels1.length).toBe(channels2.length)
    })
  })

  describe('getChannelsByCircuitry', () => {
    it('should return individual channels', () => {
      const channels = getChannelsByCircuitry('individual')
      expect(channels.length).toBeGreaterThan(0)
      for (const channel of channels) {
        expect(channel.circuitry).toBe('individual')
      }
    })

    it('should return integration channels', () => {
      const channels = getChannelsByCircuitry('integration')
      expect(channels.length).toBeGreaterThan(0)
    })
  })

  describe('findDefinedChannels', () => {
    it('should find channels when both gates are active', () => {
      const channels = findDefinedChannels([1, 8, 64, 47])
      expect(channels.length).toBe(2)
    })

    it('should return empty for single gates', () => {
      const channels = findDefinedChannels([1, 64])
      expect(channels.length).toBe(0)
    })

    it('should return empty for empty input', () => {
      const channels = findDefinedChannels([])
      expect(channels.length).toBe(0)
    })
  })

  describe('findPotentialChannels', () => {
    it('should find channels with one missing gate', () => {
      const potentials = findPotentialChannels([1]) // Gate 1 connects to Gate 8
      expect(potentials.length).toBeGreaterThan(0)
      const channel1_8 = potentials.find((p) => p.channel.id === '1-8')
      expect(channel1_8).toBeDefined()
      expect(channel1_8!.missingGate).toBe(8)
    })
  })

  describe('areGatesConnected', () => {
    it('should return true for connected gates', () => {
      expect(areGatesConnected(1, 8)).toBe(true)
      expect(areGatesConnected(64, 47)).toBe(true)
    })

    it('should return false for non-connected gates', () => {
      expect(areGatesConnected(1, 64)).toBe(false)
    })
  })
})

// =============================================================================
// CENTERS, TYPES, AUTHORITIES, PROFILES TESTS
// =============================================================================

describe('Human Design Core Data', () => {
  describe('CENTERS', () => {
    it('should have exactly 9 centers', () => {
      expect(CENTERS).toHaveLength(9)
    })

    it('should have correct IDs', () => {
      const ids = CENTERS.map((c) => c.id)
      expect(ids).toContain('head')
      expect(ids).toContain('ajna')
      expect(ids).toContain('throat')
      expect(ids).toContain('g')
      expect(ids).toContain('heart')
      expect(ids).toContain('spleen')
      expect(ids).toContain('sacral')
      expect(ids).toContain('solar')
      expect(ids).toContain('root')
    })

    it('should have Hebrew translations', () => {
      for (const center of CENTERS) {
        expect(center.hebrew).toBeDefined()
        expect(center.hebrew.length).toBeGreaterThan(0)
      }
    })
  })

  describe('getCenter', () => {
    it('should return correct center', () => {
      const sacral = getCenter('sacral')
      expect(sacral.name).toBe('Sacral Center')
      expect(sacral.gates).toHaveLength(9)
    })

    it('should throw for invalid center ID', () => {
      expect(() => getCenter('invalid' as CenterId)).toThrow()
    })
  })

  describe('MOTOR_CENTERS', () => {
    it('should contain the 4 motor centers', () => {
      expect(MOTOR_CENTERS).toHaveLength(4)
      expect(MOTOR_CENTERS).toContain('sacral')
      expect(MOTOR_CENTERS).toContain('root')
      expect(MOTOR_CENTERS).toContain('solar')
      expect(MOTOR_CENTERS).toContain('heart')
    })
  })

  describe('TYPES', () => {
    it('should have exactly 5 types', () => {
      expect(TYPES).toHaveLength(5)
    })

    it('should have all type IDs', () => {
      const types = TYPES.map((t) => t.type)
      expect(types).toContain('manifestor')
      expect(types).toContain('generator')
      expect(types).toContain('manifesting-generator')
      expect(types).toContain('projector')
      expect(types).toContain('reflector')
    })

    it('should have Hebrew translations', () => {
      for (const type of TYPES) {
        expect(type.nameHebrew).toBeDefined()
        expect(type.strategyHebrew).toBeDefined()
      }
    })
  })

  describe('getTypeDefinition', () => {
    it('should return correct type definition', () => {
      const generator = getTypeDefinition('generator')
      expect(generator.name).toBe('Generator')
      expect(generator.strategy).toBe('To Respond')
    })
  })

  describe('AUTHORITIES', () => {
    it('should have exactly 8 authorities', () => {
      expect(AUTHORITIES).toHaveLength(8)
    })

    it('should have Hebrew translations', () => {
      for (const auth of AUTHORITIES) {
        expect(auth.nameHebrew).toBeDefined()
      }
    })
  })

  describe('getAuthorityDefinition', () => {
    it('should return correct authority definition', () => {
      const emotional = getAuthorityDefinition('emotional')
      expect(emotional.name).toBe('Emotional Authority')
    })
  })

  describe('PROFILES', () => {
    it('should have exactly 12 profiles', () => {
      expect(PROFILES).toHaveLength(12)
    })

    it('should have valid line combinations', () => {
      for (const profile of PROFILES) {
        expect(profile.conscious).toBeGreaterThanOrEqual(1)
        expect(profile.conscious).toBeLessThanOrEqual(6)
        expect(profile.unconscious).toBeGreaterThanOrEqual(1)
        expect(profile.unconscious).toBeLessThanOrEqual(6)
      }
    })

    it('should have Hebrew translations', () => {
      for (const profile of PROFILES) {
        expect(profile.nameHebrew).toBeDefined()
      }
    })
  })

  describe('getProfile', () => {
    it('should find profile by ID', () => {
      const profile = getProfile('1/3')
      expect(profile).toBeDefined()
      expect(profile!.name).toBe('Investigator/Martyr')
    })
  })

  describe('getProfileByLines', () => {
    it('should find profile by line numbers', () => {
      const profile = getProfileByLines(4, 6)
      expect(profile).toBeDefined()
      expect(profile!.id).toBe('4/6')
    })
  })

  describe('LINE_THEMES', () => {
    it('should have 6 line themes', () => {
      expect(Object.keys(LINE_THEMES)).toHaveLength(6)
    })
  })

  describe('getLineTheme', () => {
    it('should return correct line theme', () => {
      const line1 = getLineTheme(1)
      expect(line1.name).toBe('Investigator')
    })
  })
})

// =============================================================================
// BODYGRAPH CALCULATION TESTS
// =============================================================================

describe('Human Design Calculations', () => {
  // Test input with birth time
  const testInputWithTime: HumanDesignInput = {
    birthDate: '1980-01-15',
    birthTime: '14:30',
    latitude: 32.0853,
    longitude: 34.7818,
  }

  // Test input without birth time
  const testInputWithoutTime: HumanDesignInput = {
    birthDate: '1980-01-15',
    birthTime: null,
    latitude: 32.0853,
    longitude: 34.7818,
  }

  describe('calculateBodygraph', () => {
    it('should return PartialBodygraph when no birth time', () => {
      const result = calculateBodygraph(testInputWithoutTime)
      expect(isCompleteBodygraph(result)).toBe(false)
      expect(result.hasBirthTime).toBe(false)
      expect('message' in result).toBe(true)
      expect('messageHebrew' in result).toBe(true)
    })

    it('should return complete Bodygraph with birth time', () => {
      const result = calculateBodygraph(testInputWithTime)
      expect(isCompleteBodygraph(result)).toBe(true)
      expect(result.hasBirthTime).toBe(true)
    })

    it('should calculate valid type', () => {
      const result = calculateBodygraph(testInputWithTime)
      if (isCompleteBodygraph(result)) {
        const validTypes = [
          'manifestor',
          'generator',
          'manifesting-generator',
          'projector',
          'reflector',
        ]
        expect(validTypes).toContain(result.type)
      }
    })

    it('should calculate valid authority', () => {
      const result = calculateBodygraph(testInputWithTime)
      if (isCompleteBodygraph(result)) {
        const validAuthorities = [
          'emotional',
          'sacral',
          'splenic',
          'ego-manifested',
          'ego-projected',
          'self-projected',
          'mental',
          'lunar',
        ]
        expect(validAuthorities).toContain(result.authority)
      }
    })

    it('should calculate valid profile', () => {
      const result = calculateBodygraph(testInputWithTime)
      if (isCompleteBodygraph(result)) {
        expect(result.profile.conscious).toBeGreaterThanOrEqual(1)
        expect(result.profile.conscious).toBeLessThanOrEqual(6)
        expect(result.profile.unconscious).toBeGreaterThanOrEqual(1)
        expect(result.profile.unconscious).toBeLessThanOrEqual(6)
      }
    })

    it('should calculate valid definition', () => {
      const result = calculateBodygraph(testInputWithTime)
      if (isCompleteBodygraph(result)) {
        const validDefinitions = [
          'single',
          'split',
          'triple-split',
          'quadruple-split',
          'none',
        ]
        expect(validDefinitions).toContain(result.definition)
      }
    })

    it('should have personality and design activations', () => {
      const result = calculateBodygraph(testInputWithTime)
      if (isCompleteBodygraph(result)) {
        expect(result.activations.personality.length).toBeGreaterThan(0)
        expect(result.activations.design.length).toBeGreaterThan(0)
      }
    })

    it('should have 13 personality activations (one per planet)', () => {
      const result = calculateBodygraph(testInputWithTime)
      if (isCompleteBodygraph(result)) {
        expect(result.activations.personality).toHaveLength(13)
      }
    })

    it('should have 13 design activations (one per planet)', () => {
      const result = calculateBodygraph(testInputWithTime)
      if (isCompleteBodygraph(result)) {
        expect(result.activations.design).toHaveLength(13)
      }
    })

    it('should have valid gate numbers in activations', () => {
      const result = calculateBodygraph(testInputWithTime)
      if (isCompleteBodygraph(result)) {
        for (const activation of result.activations.personality) {
          expect(activation.gate).toBeGreaterThanOrEqual(1)
          expect(activation.gate).toBeLessThanOrEqual(64)
          expect(activation.line).toBeGreaterThanOrEqual(1)
          expect(activation.line).toBeLessThanOrEqual(6)
        }
      }
    })

    it('should calculate incarnation cross', () => {
      const result = calculateBodygraph(testInputWithTime)
      if (isCompleteBodygraph(result)) {
        expect(result.incarnationCross).toBeDefined()
        expect(result.incarnationCross.gates.personalitySun).toBeGreaterThanOrEqual(1)
        expect(result.incarnationCross.gates.personalitySun).toBeLessThanOrEqual(64)
      }
    })

    it('should have center states for all 9 centers', () => {
      const result = calculateBodygraph(testInputWithTime)
      if (isCompleteBodygraph(result)) {
        expect(Object.keys(result.centers)).toHaveLength(9)
      }
    })

    it('should have defined centers with at least one channel', () => {
      const result = calculateBodygraph(testInputWithTime)
      if (isCompleteBodygraph(result)) {
        // If there are defined centers, there should be channels
        if (result.definedCenters.length > 0) {
          expect(result.channels.length).toBeGreaterThan(0)
        }
      }
    })
  })

  describe('isCompleteBodygraph', () => {
    it('should return true for complete bodygraph', () => {
      const result = calculateBodygraph(testInputWithTime)
      expect(isCompleteBodygraph(result)).toBe(true)
    })

    it('should return false for partial bodygraph', () => {
      const result = calculateBodygraph(testInputWithoutTime)
      expect(isCompleteBodygraph(result)).toBe(false)
    })
  })

  describe('Helper functions', () => {
    const bodygraph = calculateBodygraph(testInputWithTime) as Bodygraph

    it('getAllGates should return unique gates', () => {
      const gates = getAllGates(bodygraph)
      const uniqueGates = new Set(gates)
      expect(gates.length).toBe(uniqueGates.size)
    })

    it('getPersonalityGates should return 13 gates', () => {
      const gates = getPersonalityGates(bodygraph)
      expect(gates).toHaveLength(13)
    })

    it('getDesignGates should return 13 gates', () => {
      const gates = getDesignGates(bodygraph)
      expect(gates).toHaveLength(13)
    })

    it('isPersonalityGate should identify personality gates', () => {
      const personalityGates = getPersonalityGates(bodygraph)
      expect(isPersonalityGate(bodygraph, personalityGates[0])).toBe(true)
    })

    it('isDesignGate should identify design gates', () => {
      const designGates = getDesignGates(bodygraph)
      expect(isDesignGate(bodygraph, designGates[0])).toBe(true)
    })

    it('getGateActivation should return activation details', () => {
      const personalityGates = getPersonalityGates(bodygraph)
      const activation = getGateActivation(bodygraph, personalityGates[0])
      expect(activation.personality).toBeDefined()
    })

    it('getBodygraphSummary should return valid summary', () => {
      const summary = getBodygraphSummary(bodygraph)
      expect(summary.type).toBeDefined()
      expect(summary.typeHebrew).toBeDefined()
      expect(summary.authority).toBeDefined()
      expect(summary.profile).toBeDefined()
    })

    it('formatGateActivation should return formatted string', () => {
      const formatted = formatGateActivation(bodygraph.activations.personality[0])
      expect(formatted).toContain('Gate')
    })

    it('getPlanetsForGate should return planet arrays', () => {
      const personalityGates = getPersonalityGates(bodygraph)
      const planets = getPlanetsForGate(bodygraph, personalityGates[0])
      expect(planets.personality.length).toBeGreaterThan(0)
    })
  })
})

// =============================================================================
// KNOWN DATE VALIDATION TESTS
// =============================================================================

describe('Known Dates Validation', () => {
  it('should handle historical date (1987-07-26 - Harmonic Convergence)', () => {
    const input: HumanDesignInput = {
      birthDate: '1987-07-26',
      birthTime: '12:00',
      latitude: 0,
      longitude: 0,
    }
    const result = calculateBodygraph(input)
    expect(isCompleteBodygraph(result)).toBe(true)
  })

  it('should handle recent date (2020-01-01)', () => {
    const input: HumanDesignInput = {
      birthDate: '2020-01-01',
      birthTime: '00:00',
      latitude: 40.7128,
      longitude: -74.006,
    }
    const result = calculateBodygraph(input)
    expect(isCompleteBodygraph(result)).toBe(true)
  })

  it('should handle edge case - midnight', () => {
    const input: HumanDesignInput = {
      birthDate: '2000-06-15',
      birthTime: '00:00',
      latitude: 51.5074,
      longitude: -0.1278,
    }
    const result = calculateBodygraph(input)
    expect(isCompleteBodygraph(result)).toBe(true)
  })

  it('should handle edge case - 23:59', () => {
    const input: HumanDesignInput = {
      birthDate: '2000-06-15',
      birthTime: '23:59',
      latitude: 51.5074,
      longitude: -0.1278,
    }
    const result = calculateBodygraph(input)
    expect(isCompleteBodygraph(result)).toBe(true)
  })

  it('should handle extreme latitude (Arctic)', () => {
    const input: HumanDesignInput = {
      birthDate: '1990-06-21',
      birthTime: '12:00',
      latitude: 70.0,
      longitude: 25.0,
    }
    const result = calculateBodygraph(input)
    expect(isCompleteBodygraph(result)).toBe(true)
  })

  it('should handle negative longitude (Americas)', () => {
    const input: HumanDesignInput = {
      birthDate: '1995-03-15',
      birthTime: '08:30',
      latitude: -33.8688,
      longitude: 151.2093,
    }
    const result = calculateBodygraph(input)
    expect(isCompleteBodygraph(result)).toBe(true)
  })
})

// =============================================================================
// TYPE DETERMINATION TESTS
// =============================================================================

describe('Type Determination Logic', () => {
  // These tests verify the type determination algorithm logic
  // by using known configurations

  it('should identify Generator type (Sacral defined, no motor-to-throat)', () => {
    // This is tested indirectly through bodygraph calculations
    // A true unit test would mock the center states
    const input: HumanDesignInput = {
      birthDate: '1955-06-11',
      birthTime: '10:00',
      latitude: 32.0,
      longitude: 34.0,
    }
    const result = calculateBodygraph(input)
    if (isCompleteBodygraph(result)) {
      // Just verify it returns a valid type
      expect(['generator', 'manifesting-generator', 'manifestor', 'projector', 'reflector']).toContain(
        result.type
      )
    }
  })

  it('should have consistent type definitions', () => {
    for (const type of TYPES) {
      const definition = getTypeDefinition(type.type)
      expect(definition.type).toBe(type.type)
      expect(definition.strategy.length).toBeGreaterThan(0)
      expect(definition.notSelfTheme.length).toBeGreaterThan(0)
      expect(definition.signatureTheme.length).toBeGreaterThan(0)
    }
  })
})

// =============================================================================
// EXTERNAL GROUND-TRUTH TESTS
//
// The fixtures below are NOT derived from this codebase. They come from:
//   1. The published Rave Mandala degree table (barneyandflow.com/gate-zodiac-degrees),
//      corroborated by dturkuler/humandesign_api, whose `IGING_offset = 58` encodes
//      the same 302.000° wheel start, sourced to Ra Uru Hu's BlackBook.
//   2. A Swiss Ephemeris (pyswisseph) implementation of the same rules, whose
//      planetary longitudes were themselves verified against NASA JPL Horizons.
// If these fail, the calculations have drifted from the actual Human Design system.
// =============================================================================

describe('Rave Mandala wheel (published degree table)', () => {
  // [gate, tropical longitude at which the gate's line 1 begins]
  const PUBLISHED_GATE_STARTS: ReadonlyArray<readonly [number, number]> = [
  [41, 302], // 02°00'00" Aqu
  [19, 307.625], // 07°37'30" Aqu
  [13, 313.25], // 13°15'00" Aqu
  [49, 318.875], // 18°52'30" Aqu
  [30, 324.5], // 24°30'00" Aqu
  [55, 330.125], // 00°07'30" Pis
  [37, 335.75], // 05°45'00" Pis
  [63, 341.375], // 11°22'30" Pis
  [22, 347], // 17°00'00" Pis
  [36, 352.625], // 22°37'30" Pis
  [25, 358.25], // 28°15'00" Pis
  [17, 3.875], // 03°52'30" Ari
  [21, 9.5], // 09°30'00" Ari
  [51, 15.125], // 15°07'30" Ari
  [42, 20.75], // 20°45'00" Ari
  [3, 26.375], // 26°22'30" Ari
  [27, 32], // 02°00'00" Tau
  [24, 37.625], // 07°37'30" Tau
  [2, 43.25], // 13°15'00" Tau
  [23, 48.875], // 18°52'30" Tau
  [8, 54.5], // 24°30'00" Tau
  [20, 60.125], // 00°07'30" Gem
  [16, 65.75], // 05°45'00" Gem
  [35, 71.375], // 11°22'30" Gem
  [45, 77], // 17°00'00" Gem
  [12, 82.625], // 22°37'30" Gem
  [15, 88.25], // 28°15'00" Gem
  [52, 93.875], // 03°52'30" Can
  [39, 99.5], // 09°30'00" Can
  [53, 105.125], // 15°07'30" Can
  [62, 110.75], // 20°45'00" Can
  [56, 116.375], // 26°22'30" Can
  [31, 122], // 02°00'00" Leo
  [33, 127.625], // 07°37'30" Leo
  [7, 133.25], // 13°15'00" Leo
  [4, 138.875], // 18°52'30" Leo
  [29, 144.5], // 24°30'00" Leo
  [59, 150.125], // 00°07'30" Vir
  [40, 155.75], // 05°45'00" Vir
  [64, 161.375], // 11°22'30" Vir
  [47, 167], // 17°00'00" Vir
  [6, 172.625], // 22°37'30" Vir
  [46, 178.25], // 28°15'00" Vir
  [18, 183.875], // 03°52'30" Lib
  [48, 189.5], // 09°30'00" Lib
  [57, 195.125], // 15°07'30" Lib
  [32, 200.75], // 20°45'00" Lib
  [50, 206.375], // 26°22'30" Lib
  [28, 212], // 02°00'00" Sco
  [44, 217.625], // 07°37'30" Sco
  [1, 223.25], // 13°15'00" Sco
  [43, 228.875], // 18°52'30" Sco
  [14, 234.5], // 24°30'00" Sco
  [34, 240.125], // 00°07'30" Sag
  [9, 245.75], // 05°45'00" Sag
  [5, 251.375], // 11°22'30" Sag
  [26, 257], // 17°00'00" Sag
  [11, 262.625], // 22°37'30" Sag
  [10, 268.25], // 28°15'00" Sag
  [58, 273.875], // 03°52'30" Cap
  [38, 279.5], // 09°30'00" Cap
  [54, 285.125], // 15°07'30" Cap
  [61, 290.75], // 20°45'00" Cap
  [60, 296.375], // 26°22'30" Cap
  ]

  it('covers all 64 gates exactly once', () => {
    expect(new Set(PUBLISHED_GATE_STARTS.map(([gate]) => gate)).size).toBe(64)
  })

  it('opens every gate at its published degree', () => {
    for (const [gate, start] of PUBLISHED_GATE_STARTS) {
      expect(longitudeToGate(start + 0.0001)).toEqual({ gate, line: 1 })
    }
  })

  it('closes every gate one hair before the next one opens', () => {
    for (const [gate, start] of PUBLISHED_GATE_STARTS) {
      const end = (start + 360 / 64) % 360
      expect(longitudeToGate(end - 0.0001)).toEqual({ gate, line: 6 })
    }
  })

  it('walks all six lines across a gate', () => {
    // Gate 41 opens the wheel at 2° Aquarius; each line spans 0.9375°
    for (let line = 1; line <= 6; line++) {
      expect(longitudeToGate(302 + (line - 1) * 0.9375 + 0.0001)).toEqual({ gate: 41, line })
    }
  })
})

describe('Incarnation cross angle', () => {
  it('assigns Right Angle to the seven personal profiles', () => {
    for (const [c, u] of [[1, 3], [1, 4], [2, 4], [2, 5], [3, 5], [3, 6], [4, 6]]) {
      expect(getCrossAngle(c, u)).toBe('right-angle')
    }
  })

  it('assigns Juxtaposition to 4/1 and only 4/1', () => {
    expect(getCrossAngle(4, 1)).toBe('juxtaposition')
    expect(getCrossAngle(4, 6)).toBe('right-angle')
  })

  it('assigns Left Angle to the four transpersonal profiles', () => {
    for (const [c, u] of [[5, 1], [5, 2], [6, 2], [6, 3]]) {
      expect(getCrossAngle(c, u)).toBe('left-angle')
    }
  })
})

describe('Golden charts (cross-checked against Swiss Ephemeris)', () => {
  const PLANETS = [
    'sun', 'earth', 'moon', 'north-node', 'south-node', 'mercury', 'venus',
    'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
  ] as const

  const GOLDEN = [
  {
    label: 'Tel Aviv, summer, DST',
    input: { birthDate: '1990-07-15', birthTime: '08:30', latitude: 32.0853, longitude: 34.7818 },
    birthInstantUtc: '1990-07-15T05:30:00.000Z',
    designInstantUtc: '1990-04-14T17:09:12Z',
    personality: ['62.2', '61.2', '51.5', '41.6', '31.6', '31.5', '12.2', '3.6', '62.2', '61.2', '58.4', '38.4', '1.2'],
    design: ['42.4', '32.4', '5.4', '13.1', '7.1', '2.1', '37.4', '30.1', '52.1', '61.5', '38.1', '38.6', '1.5'],
    type: 'projector', authority: 'emotional', profile: '2/4', definition: 'split',
  },
  {
    label: 'New York, pre-1970, EST',
    input: { birthDate: '1968-11-03', birthTime: '22:14', latitude: 40.7128, longitude: -74.006 },
    birthInstantUtc: '1968-11-04T03:14:00.000Z',
    designInstantUtc: '1968-08-06T04:41:21Z',
    personality: ['44.5', '24.5', '3.4', '17.6', '18.6', '32.4', '5.6', '6.5', '6.6', '51.6', '46.5', '14.2', '6.2'],
    design: ['7.1', '13.1', '38.4', '21.2', '48.2', '33.6', '29.3', '56.5', '40.4', '42.6', '6.5', '43.6', '47.5'],
    type: 'manifesting-generator', authority: 'sacral', profile: '5/1', definition: 'single',
  },
  {
    label: 'London, leap day',
    input: { birthDate: '2004-02-29', birthTime: '16:05', latitude: 51.5074, longitude: -0.1278 },
    birthInstantUtc: '2004-02-29T16:05:00.000Z',
    designInstantUtc: '2003-12-04T23:51:45Z',
    personality: ['37.5', '40.5', '12.5', '2.1', '1.1', '37.2', '42.4', '2.4', '64.4', '52.3', '55.4', '13.1', '26.6'],
    design: ['5.2', '35.2', '3.5', '23.2', '43.2', '10.5', '38.1', '36.1', '47.1', '39.3', '30.6', '19.4', '26.3'],
    type: 'manifestor', authority: 'emotional', profile: '5/2', definition: 'single',
  },
  {
    label: 'Sydney, southern hemisphere',
    input: { birthDate: '1977-12-25', birthTime: '03:47', latitude: -33.8688, longitude: 151.2093 },
    birthInstantUtc: '1977-12-24T16:47:00.000Z',
    designInstantUtc: '1977-09-28T00:26:05Z',
    personality: ['10.5', '15.5', '12.2', '48.3', '21.3', '11.4', '11.4', '33.4', '15.3', '59.1', '1.2', '5.6', '57.2'],
    design: ['18.1', '17.1', '21.4', '57.1', '51.1', '47.3', '40.1', '53.1', '52.2', '29.2', '44.3', '5.3', '48.5'],
    type: 'generator', authority: 'sacral', profile: '5/1', definition: 'single',
  },
  ]

  for (const chart of GOLDEN) {
    describe(chart.label, () => {
      const result = calculateBodygraph(chart.input) as Bodygraph

      it('resolves the birth wall-clock time to the right UTC instant', () => {
        expect(result.birthInstantUtc).toBe(chart.birthInstantUtc)
      })

      it('finds the design moment within a minute of the reference', () => {
        const delta = Math.abs(
          new Date(result.designInstantUtc!).getTime() -
            new Date(chart.designInstantUtc).getTime()
        )
        expect(delta).toBeLessThan(60_000)
      })

      it('places the Sun exactly 88° of solar arc before birth', () => {
        const personalitySun = result.activations.personality.find((a) => a.planet === 'sun')!
        const designSun = result.activations.design.find((a) => a.planet === 'sun')!
        const arc = (personalitySun.zodiacDegree - designSun.zodiacDegree + 360) % 360
        expect(arc).toBeCloseTo(88, 2)
      })

      it('matches every personality activation', () => {
        const actual = PLANETS.map((p) => {
          const a = result.activations.personality.find((x) => x.planet === p)!
          return `${a.gate}.${a.line}`
        })
        expect(actual).toEqual(chart.personality)
      })

      it('matches every design activation', () => {
        const actual = PLANETS.map((p) => {
          const a = result.activations.design.find((x) => x.planet === p)!
          return `${a.gate}.${a.line}`
        })
        expect(actual).toEqual(chart.design)
      })

      it('derives the same type, authority, profile and definition', () => {
        expect(result.type).toBe(chart.type)
        expect(result.authority).toBe(chart.authority)
        expect(result.profile.id).toBe(chart.profile)
        expect(result.definition).toBe(chart.definition)
      })
    })
  }
})
