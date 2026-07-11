// Tests for the composite bodygraph service (pair overlay + Penta).
//
// The pair classifier must agree channel-for-channel with the independent
// connection logic in hd-compatibility.ts; the Penta invariants are checked
// structurally against the raw gate unions.

import { describe, it, expect } from 'vitest'
import {
  ALL_CENTER_IDS,
  buildCompositePair,
  buildPenta,
  type PairChannelState,
} from './composite-bodygraph'
import { calculateHDCompatibility } from './hd-compatibility'
import { calculateBodygraph, isCompleteBodygraph } from '../calculations/human-design'
import { CHANNELS } from '../data/human-design-channels'
import type { Bodygraph } from '../types/human-design'

function chart(birthDate: string, birthTime: string, lat: number, lng: number): Bodygraph {
  const result = calculateBodygraph({ birthDate, birthTime, latitude: lat, longitude: lng })
  if (!isCompleteBodygraph(result)) {
    throw new Error(`test chart for ${birthDate} unexpectedly incomplete`)
  }
  return result
}

// Real fully-specified charts (same fixtures as hd-compatibility.test.ts).
const A = chart('1990-06-15', '14:30', 32.0853, 34.7818) // Tel Aviv
const B = chart('1988-11-03', '08:15', 40.7128, -74.006) // New York
const C = chart('1994-03-21', '10:00', 51.5074, -0.1278) // London
const D = chart('1975-12-01', '22:45', 35.6762, 139.6503) // Tokyo
const E = chart('2001-07-07', '06:20', -33.8688, 151.2093) // Sydney

describe('buildCompositePair — structure', () => {
  const pair = buildCompositePair(A, B)

  it('classifies all 36 channels exactly once', () => {
    expect(pair.channels).toHaveLength(CHANNELS.length)
    expect(new Set(pair.channels.map((c) => c.channel.id)).size).toBe(CHANNELS.length)
  })

  it('per-channel gate lists match each chart’s raw gates', () => {
    const aGates = new Set(A.gates)
    const bGates = new Set(B.gates)
    for (const pc of pair.channels) {
      for (const g of pc.aGates) expect(aGates.has(g)).toBe(true)
      for (const g of pc.bGates) expect(bGates.has(g)).toBe(true)
      expect(pc.aGates.every((g) => pc.channel.gates.includes(g))).toBe(true)
      expect(pc.bGates.every((g) => pc.channel.gates.includes(g))).toBe(true)
    }
  })

  it('state is consistent with the gate holdings', () => {
    for (const pc of pair.channels) {
      const aFull = pc.aGates.length === 2
      const bFull = pc.bGates.length === 2
      const expected: PairChannelState = aFull && bFull
        ? 'companionship'
        : aFull
          ? (pc.bGates.length === 1 ? 'dominance-a' : 'a-defined')
          : bFull
            ? (pc.aGates.length === 1 ? 'dominance-b' : 'b-defined')
            : pc.aGates.length === 1 && pc.bGates.length === 1
              ? (pc.aGates[0] === pc.bGates[0] ? 'compromise' : 'electromagnetic')
              : pc.aGates.length === 1
                ? 'hanging-a'
                : pc.bGates.length === 1
                  ? 'hanging-b'
                  : 'open'
      expect(pc.state, pc.channel.id).toBe(expected)
    }
  })

  it('emergent flag marks exactly the electromagnetic channels', () => {
    for (const pc of pair.channels) {
      expect(pc.emergent).toBe(pc.state === 'electromagnetic')
    }
    expect([...pair.emergentChannelIds].sort()).toEqual(
      pair.channels.filter((c) => c.state === 'electromagnetic').map((c) => c.channel.id).sort()
    )
  })

  it('counts add up to the non-open channels', () => {
    const nonOpen = pair.channels.filter((c) => c.state !== 'open').length
    const total = Object.values(pair.counts).reduce((s, n) => s + n, 0)
    expect(total).toBe(nonOpen)
  })
})

describe('buildCompositePair — agrees with calculateHDCompatibility', () => {
  const pairs: Array<[Bodygraph, Bodygraph]> = [
    [A, B],
    [A, C],
    [B, D],
    [C, E],
  ]

  it.each(pairs.map((p, i) => [i, p] as const))('pair %d connection sets match', (_, [x, y]) => {
    const composite = buildCompositePair(x, y)
    const compat = calculateHDCompatibility(
      {
        birthDate: x.birthDate,
        birthTime: x.birthTime,
        latitude: x.birthPlace.latitude,
        longitude: x.birthPlace.longitude,
      },
      {
        birthDate: y.birthDate,
        birthTime: y.birthTime,
        latitude: y.birthPlace.latitude,
        longitude: y.birthPlace.longitude,
      }
    )
    expect(compat.available).toBe(true)

    const compositeByType = (states: PairChannelState[]) =>
      composite.channels
        .filter((c) => states.includes(c.state))
        .map((c) => c.channel.id)
        .sort()
    const compatByType = (type: string) =>
      compat.connections.filter((c) => c.type === type).map((c) => c.channelId).sort()

    expect(compositeByType(['electromagnetic'])).toEqual(compatByType('electromagnetic'))
    expect(compositeByType(['companionship'])).toEqual(compatByType('companionship'))
    expect(compositeByType(['dominance-a', 'dominance-b'])).toEqual(compatByType('dominance'))
    expect(compositeByType(['compromise'])).toEqual(compatByType('compromise'))
  })
})

describe('buildCompositePair — centers', () => {
  const pair = buildCompositePair(A, B)

  it('composite defined centers cover both individual definitions', () => {
    for (const c of A.definedCenters) expect(pair.definedCenters.has(c)).toBe(true)
    for (const c of B.definedCenters) expect(pair.definedCenters.has(c)).toBe(true)
  })

  it('emergent centers are defined in the composite but in neither chart', () => {
    const individually = new Set([...A.definedCenters, ...B.definedCenters])
    for (const c of pair.emergentCenters) {
      expect(pair.definedCenters.has(c)).toBe(true)
      expect(individually.has(c)).toBe(false)
    }
  })

  it('self-composite has no emergent definition at all', () => {
    const self = buildCompositePair(A, A)
    expect(self.emergentChannelIds.size).toBe(0)
    expect(self.emergentCenters.size).toBe(0)
    expect([...self.definedCenters].sort()).toEqual([...A.definedCenters].sort())
    for (const pc of self.channels) {
      expect(['companionship', 'compromise', 'open']).toContain(pc.state)
    }
  })
})

describe('buildPenta', () => {
  it('rejects fewer than 2 charts', () => {
    expect(() => buildPenta([A])).toThrow()
    expect(() => buildPenta([])).toThrow()
  })

  it('covers all 36 channels with consistent states', () => {
    const penta = buildPenta([A, B, C])
    expect(penta.channels).toHaveLength(CHANNELS.length)
    expect(penta.memberCount).toBe(3)

    const union = new Set([...A.gates, ...B.gates, ...C.gates])
    const anyoneComplete = (channelId: string, gates: readonly [number, number]) =>
      [A, B, C].some(
        (m) =>
          m.channels.some((ch) => ch.id === channelId) ||
          (m.gates.includes(gates[0]) && m.gates.includes(gates[1]))
      )

    for (const pc of penta.channels) {
      const [g0, g1] = pc.channel.gates
      const has0 = union.has(g0)
      const has1 = union.has(g1)
      if (anyoneComplete(pc.channel.id, pc.channel.gates)) {
        expect(pc.state, pc.channel.id).toBe('individual')
      } else if (has0 && has1) {
        expect(pc.state, pc.channel.id).toBe('emergent')
      } else if (has0 || has1) {
        expect(pc.state, pc.channel.id).toBe('hanging')
      } else {
        expect(pc.state, pc.channel.id).toBe('open')
      }
    }
  })

  it('contributors carry the exact gates each member activates', () => {
    const members = [A, B, C, D]
    const penta = buildPenta(members)
    for (const pc of penta.channels) {
      for (const ref of pc.contributors) {
        expect(ref.gates.length).toBeGreaterThan(0)
        for (const g of ref.gates) {
          expect(members[ref.index].gates).toContain(g)
          expect(pc.channel.gates).toContain(g)
        }
      }
    }
  })

  it('emergent centers are group-defined but absent from every member', () => {
    const members = [A, B, C, D, E]
    const penta = buildPenta(members)
    const individually = new Set(members.flatMap((m) => [...m.definedCenters]))
    for (const c of penta.emergentCenters) {
      expect(penta.definedCenters.has(c)).toBe(true)
      expect(individually.has(c)).toBe(false)
    }
    // Group definition can only grow with more members.
    const smaller = buildPenta([A, B, C])
    for (const id of smaller.definedChannelIds) {
      expect(penta.definedChannelIds.has(id)).toBe(true)
    }
  })

  it('counts match channel states', () => {
    const penta = buildPenta([A, B, C])
    expect(penta.counts.individual).toBe(
      penta.channels.filter((c) => c.state === 'individual').length
    )
    expect(penta.counts.emergent).toBe(
      penta.channels.filter((c) => c.state === 'emergent').length
    )
    expect(penta.counts.hanging).toBe(
      penta.channels.filter((c) => c.state === 'hanging').length
    )
  })
})

describe('ALL_CENTER_IDS', () => {
  it('lists the nine centers', () => {
    expect(ALL_CENTER_IDS).toHaveLength(9)
    expect(new Set(ALL_CENTER_IDS).size).toBe(9)
  })
})
