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
    expect(container.querySelectorAll('svg line')).toHaveLength(CHANNELS.length)
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
    const violet = [...container.querySelectorAll('svg line')].filter(
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
    expect(container.querySelectorAll('svg line')).toHaveLength(CHANNELS.length)
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
    const violet = [...container.querySelectorAll('svg line')].filter(
      (l) => l.getAttribute('stroke') === '#A78FDF'
    )
    expect(violet).toHaveLength(penta.counts.emergent)
  })
})
