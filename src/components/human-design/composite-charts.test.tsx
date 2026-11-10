// Render smoke tests for the composite bodygraph views (MAPS_ROADMAP #2).
// Engine math is covered in packages/engine; these verify the SVG layer:
// every channel drawn, emergent styling applied, legends present.

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  calculateBodygraph,
  isCompleteBodygraph,
} from '@pleiad/engine/calculations/human-design'
import { CHANNELS } from '@pleiad/engine/data/human-design-channels'
import { buildCompositePair, buildPenta } from '@pleiad/engine/services/composite-bodygraph'
import type { Bodygraph } from '@pleiad/engine/types/human-design'
import { CompositeBodygraphChart } from './CompositeBodygraphChart'
import { PentaChart } from './PentaChart'
import {
  CENTER_POSITIONS,
  centerOutline,
  CHANNEL_HALVES,
  CHANNEL_PATHS,
  GATE_HALVES,
  GATE_LABELS,
  GATE_MOUTHS,
  getCenterPath,
  midpointOf,
  pointsToPath,
  splitPolyline,
} from './bodygraph-layout'

function chart(birthDate: string, birthTime: string, lat: number, lng: number): Bodygraph {
  const result = calculateBodygraph({ birthDate, birthTime, latitude: lat, longitude: lng })
  if (!isCompleteBodygraph(result)) throw new Error('incomplete test chart')
  return result
}

const A = chart('1990-06-15', '14:30', 32.0853, 34.7818)
const B = chart('1988-11-03', '08:15', 40.7128, -74.006)
const C = chart('1994-03-21', '10:00', 51.5074, -0.1278)

describe('CompositeBodygraphChart', () => {
  it('renders all 36 channels and both person names in the legend', () => {
    const { container } = render(
      <CompositeBodygraphChart
        personA={{ name: 'Ada', bodygraph: A }}
        personB={{ name: 'Ben', bodygraph: B }}
      />
    )
    expect(container.querySelectorAll('svg [data-channel]')).toHaveLength(CHANNELS.length)
    expect(screen.getByText('Ada')).toBeInTheDocument()
    expect(screen.getByText('Ben')).toBeInTheDocument()
    expect(screen.getByText('Electromagnetic')).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: /composite bodygraph of Ada and Ben/i })
    ).toBeInTheDocument()
  })

  it('paints electromagnetic channels in the brand violet with glow', () => {
    const composite = buildCompositePair(A, B)
    const emCount = composite.channels.filter((c) => c.state === 'electromagnetic').length
    const { container } = render(
      <CompositeBodygraphChart
        personA={{ name: 'Ada', bodygraph: A }}
        personB={{ name: 'Ben', bodygraph: B }}
      />
    )
    const violet = [...container.querySelectorAll('svg [data-channel]')].filter(
      (l) => l.getAttribute('stroke') === '#A78FDF'
    )
    expect(violet).toHaveLength(emCount)
    for (const line of violet) {
      expect(line.getAttribute('filter')).toBe('url(#composite-glow)')
    }
  })

  it('marks partial-channel gates with per-person dots', () => {
    const composite = buildCompositePair(A, B)
    const expectedDots = composite.channels
      .filter((c) =>
        ['electromagnetic', 'dominance-a', 'dominance-b', 'compromise'].includes(c.state)
      )
      .reduce((n, c) => n + c.aGates.length + c.bGates.length, 0)
    const { container } = render(
      <CompositeBodygraphChart
        personA={{ name: 'Ada', bodygraph: A }}
        personB={{ name: 'Ben', bodygraph: B }}
      />
    )
    // r=4 gate markers (centers are paths, stars absent in composite view)
    const dots = [...container.querySelectorAll('svg circle')].filter(
      (c) => c.getAttribute('r') === '4'
    )
    expect(dots).toHaveLength(expectedDots)
  })
})

describe('PentaChart', () => {
  it('renders all 36 channels and the group legend', () => {
    const { container } = render(
      <PentaChart
        members={[
          { name: 'Ada', bodygraph: A },
          { name: 'Ben', bodygraph: B },
          { name: 'Cai', bodygraph: C },
        ]}
      />
    )
    expect(container.querySelectorAll('svg [data-channel]')).toHaveLength(CHANNELS.length)
    expect(screen.getByText('Group-only definition')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /group bodygraph of 3 members/i })).toBeInTheDocument()
  })

  it('paints exactly the emergent channels in brand violet', () => {
    const penta = buildPenta([A, B, C])
    const { container } = render(
      <PentaChart
        members={[
          { name: 'Ada', bodygraph: A },
          { name: 'Ben', bodygraph: B },
          { name: 'Cai', bodygraph: C },
        ]}
      />
    )
    const violet = [...container.querySelectorAll('svg [data-channel]')].filter(
      (l) => l.getAttribute('stroke') === '#A78FDF'
    )
    expect(violet).toHaveLength(penta.counts.emergent)
  })
})

describe('bodygraph-layout', () => {
  it('has a lane for every one of the 36 channels', () => {
    for (const channel of CHANNELS) {
      expect(CHANNEL_PATHS[channel.id], channel.id).toBeDefined()
      expect(CHANNEL_PATHS[channel.id].length).toBeGreaterThanOrEqual(2)
    }
    expect(Object.keys(CHANNEL_PATHS)).toHaveLength(CHANNELS.length)
  })

  it('labels all 64 gates', () => {
    expect(Object.keys(GATE_LABELS)).toHaveLength(64)
  })

  it('splitPolyline halves meet at the midpoint and preserve endpoints', () => {
    for (const channel of CHANNELS) {
      const points = CHANNEL_PATHS[channel.id]
      const [h0, h1] = splitPolyline(points)
      expect(h0[0]).toEqual(points[0])
      expect(h1[h1.length - 1]).toEqual(points[points.length - 1])
      expect(h0[h0.length - 1]).toEqual(h1[0])
    }
  })

  it('halves each channel at its midpoint, each half starting at its own gate\'s mouth', () => {
    for (const channel of CHANNELS) {
      const halves = CHANNEL_HALVES[channel.id]
      const middle = midpointOf(CHANNEL_PATHS[channel.id])
      channel.gates.forEach((gate, i) => {
        expect(halves[i][0]).toEqual(GATE_MOUTHS[gate])
        expect(halves[i].at(-1)).toEqual(middle)
      })
    }
  })

  it('gives every gate its half of each of its channels, in the engine\'s channel order', () => {
    for (let gate = 1; gate <= 64; gate++) {
      const channels = CHANNELS.filter((c) => c.gates.includes(gate))
      expect(GATE_HALVES[gate].map((h) => h.channel), `gate ${gate}`).toEqual(channels.map((c) => c.id))
      for (const half of GATE_HALVES[gate]) expect(half.points[0]).toEqual(GATE_MOUTHS[gate])
    }
    for (const gate of [10, 20, 34, 57]) expect(GATE_HALVES[gate]).toHaveLength(3)
  })

  it('shows each half from where it leaves its centre: 37-40 leaves the solar plexus under its own shape', () => {
    for (const half of Object.values(GATE_HALVES).flat()) expect(half.shown.at(-1)).toEqual(half.points.at(-1))
    const half = GATE_HALVES[37].find((h) => h.channel === '37-40')!
    expect(half.shown[0]).not.toEqual(GATE_MOUTHS[37])
    expect(half.shown.length).toBeLessThanOrEqual(half.points.length)
  })

  it('draws each centre from its outline', () => {
    for (const pos of Object.values(CENTER_POSITIONS)) {
      expect(getCenterPath(pos)).toBe(`${pointsToPath(centerOutline(pos))} Z`)
      expect(centerOutline(pos).length).toBeGreaterThanOrEqual(3)
    }
  })
})
