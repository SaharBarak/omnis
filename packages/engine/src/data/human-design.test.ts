import { describe, expect, it } from 'vitest'
import { CIRCUITS, CHANNELS, circuitOfChannel } from './human-design-channels'
import { MANDALA_QUARTERS, godheadOfGate, quarterGates, quarterOfGate } from './human-design'
import {
  BASE_SIZE_DEGREES,
  COLOUR_SIZE_DEGREES,
  GATE_SIZE_DEGREES,
  LINE_SIZE_DEGREES,
  MANDALA_SEQUENCE_FULL,
  TONE_SIZE_DEGREES,
  getGateDegreeRange,
  oppositeGate,
  wheelPlace,
} from './human-design-gates'

const ARC_SECONDS = 3600

/**
 * A line's substructure as Jovian Archive sizes it ("The Basics of
 * Substructure in Human Design"): a gate 5°37′30″, a line 56′15″, a colour
 * 9′22.5″, a tone 1′33.75″, a base 18.75″.
 */
describe('the substructure of the wheel', () => {
  it.each([
    ['gate', GATE_SIZE_DEGREES, 5 * ARC_SECONDS + 37 * 60 + 30],
    ['line', LINE_SIZE_DEGREES, 56 * 60 + 15],
    ['colour', COLOUR_SIZE_DEGREES, 9 * 60 + 22.5],
    ['tone', TONE_SIZE_DEGREES, 60 + 33.75],
    ['base', BASE_SIZE_DEGREES, 18.75],
  ])('sizes a %s as published', (_, degrees, arcSeconds) => {
    expect(degrees * ARC_SECONDS).toBeCloseTo(arcSeconds, 9)
  })

  /**
   * Noon Suns of 2026–27 from the Swiss Ephemeris (pyswisseph 2.10, Moshier),
   * placed by an independent reading of the wheel from 302°: gate, line,
   * colour, tone and base.
   */
  it.each([
    [226.09314, [1, 4, 1, 2, 1]],
    [359.88543, [25, 2, 5, 3, 5]],
    [269.62516, [10, 2, 3, 5, 5]],
    [302.22553, [41, 1, 2, 3, 4]],
    [223.08283, [44, 6, 5, 6, 3]],
    [313.64643, [13, 1, 3, 4, 2]],
  ])('places the Sun at %f° down to its base', (longitude, [gate, line, colour, tone, base]) => {
    expect(wheelPlace(longitude)).toMatchObject({ gate, line, colour, tone, base })
  })

  it('opens the mandala at gate 41.1, colour, tone and base 1, at 2° Aquarius, and closes it at gate 60.6 just before', () => {
    expect(wheelPlace(302)).toMatchObject({ gate: 41, line: 1, colour: 1, tone: 1, base: 1 })
    expect(wheelPlace(302 - BASE_SIZE_DEGREES / 2)).toMatchObject({ gate: 60, line: 6, colour: 6, tone: 6, base: 5 })
  })

  it("sets the Earth's gate half the wheel from the Sun's, each the other's", () => {
    expect([1, 41, 43, 13, 25, 10].map(oppositeGate)).toEqual([2, 31, 23, 7, 46, 15])
    expect(MANDALA_SEQUENCE_FULL.every((gate) => oppositeGate(oppositeGate(gate)) === gate)).toBe(true)
  })
})

/**
 * The godheads and their gates as two listings give them, agreeing gate for
 * gate: "Human Design Quarters & Godheads of the Rave Mandala"
 * (thehumandesignsystem.com/blog/human-design-quarters-and-godheads) and
 * "Incarnation Cross Godheads" (barneyandflow.com/new-blog/incarnation-cross-godheads),
 * which also names the Sphinx gates that open the quarters (13, 2, 7, 1)
 * and the gates of the Four Ways that close them (24, 33, 44, 19).
 */
const PUBLISHED_GODHEADS: Readonly<Record<string, readonly number[]>> = {
  Kali: [13, 49, 30, 55],
  Mitra: [37, 63, 22, 36],
  Michael: [25, 17, 21, 51],
  Janus: [42, 27, 3, 24],
  Maia: [2, 23, 8, 20],
  Lakshmi: [16, 35, 45, 12],
  Parvati: [15, 52, 39, 53],
  "Ma'at": [31, 33, 62, 56],
  Thoth: [4, 7, 29, 59],
  Harmonia: [40, 64, 47, 6],
  'Christ Consciousness': [18, 46, 48, 57],
  Minerva: [28, 44, 50, 32],
  Hades: [1, 43, 14, 34],
  Prometheus: [5, 9, 11, 26],
  Vishnu: [10, 38, 54, 58],
  'Keepers of the Wheel': [19, 41, 60, 61],
}
const sorted = (gates: readonly number[]): number[] => [...gates].sort((a, b) => a - b)
/** A channel's gate pair, smaller gate first: one spelling for either order. */
const pairOf = (id: string): string => sorted(id.split('-').map(Number)).join('-')

describe('the quarters and godheads of the Rave Mandala', () => {
  it('holds each godhead\'s gates as published', () => {
    const godheads = MANDALA_QUARTERS.flatMap((q) => q.godheads)
    expect(godheads.map((g) => g.name)).toEqual(Object.keys(PUBLISHED_GODHEADS))
    for (const g of godheads) expect(sorted(g.gates)).toEqual(sorted(PUBLISHED_GODHEADS[g.name] ?? []))
  })

  it('runs each quarter for sixteen gates of the wheel from its Sphinx gate to its gate of the Four Ways, a godhead every four', () => {
    expect(MANDALA_QUARTERS.map((q) => [quarterGates(q)[0], quarterGates(q)[quarterGates(q).length - 1]])).toEqual([
      [13, 24],
      [2, 33],
      [7, 44],
      [1, 19],
    ])
    for (const quarter of MANDALA_QUARTERS) {
      const start = MANDALA_SEQUENCE_FULL.indexOf(quarterGates(quarter)[0])
      const run = Array.from({ length: 16 }, (_, i) => MANDALA_SEQUENCE_FULL[(start + i) % MANDALA_SEQUENCE_FULL.length])
      expect(quarterGates(quarter)).toEqual(run)
      expect(quarter.godheads.every((g) => g.gates.length === 4)).toBe(true)
    }
  })

  it('opens the quarters at 13°15′ of the fixed signs: Aquarius, Taurus, Leo and Scorpio', () => {
    expect(MANDALA_QUARTERS.map((q) => getGateDegreeRange(quarterGates(q)[0])?.start)).toEqual([313.25, 43.25, 133.25, 223.25])
  })

  it('sets every gate under one quarter and one godhead', () => {
    expect(sorted(MANDALA_QUARTERS.flatMap(quarterGates))).toEqual(sorted(MANDALA_SEQUENCE_FULL))
    expect(godheadOfGate(1)?.name).toBe('Hades')
    expect(quarterOfGate(1)?.name).toBe('Mutation')
    expect(godheadOfGate(41)?.name).toBe('Keepers of the Wheel')
  })
})

/**
 * The circuits as "HD101: The Human Design Circuits" (Chrysalis) lists them:
 * Knowing 9 channels, Centering 2, Integration 4, Understanding 7, Sensing 7,
 * Ego 5, Defense 2. The Brainwave (57-20) runs in Knowing and Exploration
 * (34-10) in Centering; Integration holds 34-57, 34-20, 57-10 and 10-20.
 */
describe('the circuits', () => {
  it('counts the channels of each circuit as published', () => {
    expect(Object.fromEntries(CIRCUITS.map((c) => [c.id, c.channels.length]))).toEqual({
      knowing: 9,
      centering: 2,
      integration: 4,
      understanding: 7,
      sensing: 7,
      ego: 5,
      defense: 2,
    })
  })

  it('sets every channel in one circuit', () => {
    const held = CIRCUITS.flatMap((c) => c.channels.map(pairOf))
    expect(new Set(held).size).toBe(CHANNELS.length)
    for (const channel of CHANNELS) expect(channel.circuitry).toBe(circuitOfChannel(channel.id).group)
  })

  it('runs the Brainwave in Knowing and Exploration in Centering, both Individual, apart from Integration', () => {
    expect(circuitOfChannel('20-57')).toMatchObject({ id: 'knowing', group: 'individual' })
    expect(circuitOfChannel('10-34')).toMatchObject({ id: 'centering', group: 'individual' })
    const integration = CIRCUITS.find((c) => c.id === 'integration')?.channels ?? []
    expect(integration.map(pairOf).sort()).toEqual(['10-20', '10-57', '20-34', '34-57'])
  })

  it('totals the groups as published: Individual 11, Collective 14, Tribal 7, Integration 4', () => {
    const count = (group: string): number => CHANNELS.filter((c) => c.circuitry === group).length
    expect(['individual', 'collective', 'tribal', 'integration'].map(count)).toEqual([11, 14, 7, 4])
  })
})
