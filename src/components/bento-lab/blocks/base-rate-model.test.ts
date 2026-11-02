import { describe, expect, it } from 'vitest'
import { EDGE_CEILING, mayDrawEdge, TIER_CEILING } from '@pleiad/engine/services/rarity'
import { baseRateModel, measuredRow, type SampleTie } from './base-rate-model'

const rows = [
  measuredRow('guide', 'Dreamspell guide'),
  measuredRow('double-whammy-core', 'Sun–Moon double whammy'),
  measuredRow('companionship', 'Human Design companionship'),
  measuredRow('element', 'Shared element'),
  measuredRow('cross-aspect', 'Any cross-aspect'),
]

const tie = (type: string): SampleTie => {
  const row = measuredRow(type, type)
  return { key: type, label: type, share: row.share, bits: row.bits }
}

describe('baseRateModel', () => {
  const model = baseRateModel(rows, { label: 'A and B', ties: ['electromagnetic', 'double-whammy', 'split-bridge', 'same-color', 'same-tone', 'guide'].map(tie) })

  it('lays the columns out commonest first, evenly spaced', () => {
    const shares = model.columns.map((c) => c.share)
    expect(shares).toEqual([...shares].sort((a, b) => b - a))
    const gaps = model.columns.slice(1).map((c, i) => c.x - (model.columns[i]?.x ?? 0))
    gaps.forEach((gap) => expect(gap).toBeCloseTo(1 / rows.length))
  })

  it('takes the threshold from the engine and puts it between the last undrawn and the first drawn column', () => {
    expect(model.edge.share).toBe(EDGE_CEILING)
    const lastOff = model.columns.filter((c) => !c.drawn).at(-1)
    const firstOn = model.columns.find((c) => c.drawn)
    expect(lastOff && firstOn).toBeTruthy()
    expect(model.edge.x).toBeGreaterThan(lastOff?.x ?? 1)
    expect(model.edge.x).toBeLessThan(firstOn?.x ?? 0)
    model.columns.forEach((c) => expect(c.drawn).toBe(mayDrawEdge(c.share)))
  })

  it('marks the rarest tier past the threshold', () => {
    expect(model.lead.share).toBe(TIER_CEILING[0]?.[1])
    expect(model.lead.x).toBeGreaterThan(model.edge.x)
  })

  it('places sample ties by weight, drawn exactly when the edge rule says so', () => {
    const byWeight = [...model.dots].sort((a, b) => a.bits - b.bits)
    byWeight.slice(1).forEach((dot, i) => expect(dot.x).toBeGreaterThanOrEqual(byWeight[i]?.x ?? 0))
    model.dots.forEach((dot) => {
      expect(dot.drawn).toBe(mayDrawEdge(dot.share))
      expect(dot.drawn).toBe(dot.x > model.edge.x)
    })
  })

  it('lands a sample tie of a measured kind on that kind of column', () => {
    const guide = model.dots.find((d) => d.key === 'guide')
    const column = model.columns.find((c) => c.type === 'guide')
    expect(guide?.x).toBeCloseTo(column?.x ?? -1)
  })

  it('stacks ties that would touch into separate lane rows', () => {
    const crowded = baseRateModel(rows, { label: 'A and B', ties: [tie('guide'), { ...tie('guide'), key: 'guide-2' }] })
    expect(crowded.levels).toBe(2)
  })
})
