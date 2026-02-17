'use client'

import { useMemo } from 'react'
import type { Bodygraph, CenterId } from '@/lib/types/human-design'
import { CENTER_LABELS } from '@/lib/types/human-design'
import { CHANNELS } from '@/lib/data/human-design-channels'

// =============================================================================
// TYPES
// =============================================================================

interface BodygraphChartProps {
  bodygraph: Bodygraph
  width?: number
  height?: number
  className?: string
}

interface CenterPosition {
  x: number
  y: number
  shape: 'triangle' | 'square' | 'diamond'
  size: number
}

// =============================================================================
// LAYOUT — anatomical positions within a 300×420 viewBox
// =============================================================================

const CENTER_POSITIONS: Record<CenterId, CenterPosition> = {
  head:   { x: 150, y: 30,  shape: 'triangle', size: 24 },
  ajna:   { x: 150, y: 90,  shape: 'triangle', size: 24 },
  throat: { x: 150, y: 155, shape: 'square',   size: 22 },
  g:      { x: 150, y: 225, shape: 'diamond',  size: 24 },
  heart:  { x: 210, y: 210, shape: 'triangle', size: 20 },
  spleen: { x: 80,  y: 280, shape: 'triangle', size: 20 },
  sacral: { x: 150, y: 310, shape: 'square',   size: 22 },
  solar:  { x: 220, y: 290, shape: 'triangle', size: 20 },
  root:   { x: 150, y: 390, shape: 'square',   size: 24 },
}

// =============================================================================
// SHAPE HELPERS
// =============================================================================

function trianglePath(cx: number, cy: number, s: number, inverted = false): string {
  const h = s * 0.866
  return inverted
    ? `M${cx - s},${cy - h / 2} L${cx + s},${cy - h / 2} L${cx},${cy + h / 2} Z`
    : `M${cx},${cy - h / 2} L${cx + s},${cy + h / 2} L${cx - s},${cy + h / 2} Z`
}

function squarePath(cx: number, cy: number, s: number): string {
  return `M${cx - s},${cy - s} L${cx + s},${cy - s} L${cx + s},${cy + s} L${cx - s},${cy + s} Z`
}

function diamondPath(cx: number, cy: number, s: number): string {
  return `M${cx},${cy - s} L${cx + s},${cy} L${cx},${cy + s} L${cx - s},${cy} Z`
}

function getCenterPath(id: CenterId): string {
  const p = CENTER_POSITIONS[id]
  switch (p.shape) {
    case 'triangle': {
      const inverted = id === 'ajna' || id === 'solar'
      return trianglePath(p.x, p.y, p.size, inverted)
    }
    case 'square':
      return squarePath(p.x, p.y, p.size)
    case 'diamond':
      return diamondPath(p.x, p.y, p.size)
  }
}

// =============================================================================
// ACTIVATION HELPERS
// =============================================================================

type ActivationType = 'personality' | 'design' | 'both' | 'none'

function getGateActivationType(gate: number, bg: Bodygraph): ActivationType {
  const inP = bg.activations.personality.some((a) => a.gate === gate)
  const inD = bg.activations.design.some((a) => a.gate === gate)
  if (inP && inD) return 'both'
  if (inP) return 'personality'
  if (inD) return 'design'
  return 'none'
}

function channelStroke(
  g1: ActivationType,
  g2: ActivationType
): { stroke: string; pattern: boolean } {
  const s = new Set([g1, g2])
  if (s.has('both') || (s.has('personality') && s.has('design')))
    return { stroke: 'url(#hd-stripe)', pattern: true }
  if (s.has('design')) return { stroke: '#ef4444', pattern: false }
  if (s.has('personality')) return { stroke: '#e0e0f0', pattern: false }
  return { stroke: '#4a4a6a', pattern: false }
}

// =============================================================================
// COMPONENT
// =============================================================================

export function BodygraphChart({
  bodygraph,
  width,
  height,
  className = '',
}: BodygraphChartProps) {
  const definedSet = useMemo(() => new Set(bodygraph.definedCenters), [bodygraph.definedCenters])
  const gateSet = useMemo(() => new Set(bodygraph.gates), [bodygraph.gates])

  const channelLines = useMemo(() => {
    return CHANNELS.map((ch) => {
      const c1 = CENTER_POSITIONS[ch.centers[0]]
      const c2 = CENTER_POSITIONS[ch.centers[1]]
      const active = gateSet.has(ch.gates[0]) && gateSet.has(ch.gates[1])

      let color = { stroke: '#1e1e36', pattern: false }
      if (active) {
        color = channelStroke(
          getGateActivationType(ch.gates[0], bodygraph),
          getGateActivationType(ch.gates[1], bodygraph)
        )
      }

      return { ch, c1, c2, active, color }
    })
  }, [gateSet, bodygraph])

  // Gate number labels along active channels
  const gateLabels = useMemo(() => {
    const labels: { gate: number; x: number; y: number; type: ActivationType }[] = []
    for (const { ch, c1, c2, active } of channelLines) {
      if (!active) continue
      const [g1, g2] = ch.gates
      labels.push({
        gate: g1,
        x: c1.x + (c2.x - c1.x) * 0.25,
        y: c1.y + (c2.y - c1.y) * 0.25,
        type: getGateActivationType(g1, bodygraph),
      })
      labels.push({
        gate: g2,
        x: c1.x + (c2.x - c1.x) * 0.75,
        y: c1.y + (c2.y - c1.y) * 0.75,
        type: getGateActivationType(g2, bodygraph),
      })
    }
    return labels
  }, [channelLines, bodygraph])

  return (
    <svg
      viewBox="0 0 300 420"
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label="Human Design Bodygraph"
      style={{ maxWidth: '100%', height: 'auto' }}
    >
      <title>Human Design Bodygraph</title>

      <defs>
        {/* Striped pattern for personality + design */}
        <pattern
          id="hd-stripe"
          patternUnits="userSpaceOnUse"
          width="6"
          height="6"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="6" stroke="#e0e0f0" strokeWidth="3" />
          <line x1="3" y1="0" x2="3" y2="6" stroke="#ef4444" strokeWidth="3" />
        </pattern>

        {/* Glow for defined centers */}
        <filter id="hd-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Dark background */}
      <rect width="300" height="420" rx="12" fill="#0f0f1a" />

      {/* Inactive channels */}
      {channelLines
        .filter((l) => !l.active)
        .map(({ ch, c1, c2 }) => (
          <line
            key={ch.id}
            x1={c1.x} y1={c1.y} x2={c2.x} y2={c2.y}
            stroke="#1e1e36"
            strokeWidth="1.5"
            opacity="0.4"
          >
            <title>{ch.name} ({ch.id})</title>
          </line>
        ))}

      {/* Active channels */}
      {channelLines
        .filter((l) => l.active)
        .map(({ ch, c1, c2, color }) => (
          <line
            key={ch.id}
            x1={c1.x} y1={c1.y} x2={c2.x} y2={c2.y}
            stroke={color.stroke}
            strokeWidth="3"
            strokeLinecap="round"
          >
            <title>{ch.name} ({ch.id}) — {ch.circuitry}</title>
          </line>
        ))}

      {/* Gate numbers */}
      {gateLabels.map(({ gate, x, y, type }, i) => (
        <text
          key={`g${gate}-${i}`}
          x={x} y={y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="8"
          fontWeight="bold"
          fill={type === 'design' ? '#ef4444' : type === 'personality' ? '#e0e0f0' : '#f5c542'}
          style={{ pointerEvents: 'none' }}
        >
          {gate}
        </text>
      ))}

      {/* Centers */}
      {(Object.keys(CENTER_POSITIONS) as CenterId[]).map((id) => {
        const defined = definedSet.has(id)
        const pos = CENTER_POSITIONS[id]
        return (
          <g key={id}>
            <path
              d={getCenterPath(id)}
              fill={defined ? '#d4a017' : 'transparent'}
              stroke={defined ? '#f5c542' : '#3a3a5c'}
              strokeWidth={defined ? 2 : 1.5}
              filter={defined ? 'url(#hd-glow)' : undefined}
              opacity={defined ? 1 : 0.6}
            >
              <title>{CENTER_LABELS[id]} — {defined ? 'Defined' : 'Undefined'}</title>
            </path>
            <text
              x={pos.x} y={pos.y + 1}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="7"
              fontWeight="600"
              fill={defined ? '#0f0f1a' : '#6a6a8a'}
              style={{ pointerEvents: 'none' }}
            >
              {CENTER_LABELS[id]}
            </text>
          </g>
        )
      })}

      {/* Legend */}
      <g transform="translate(8, 406)">
        <circle cx="0" cy="0" r="3" fill="#e0e0f0" />
        <text x="6" y="1" fontSize="6" fill="#8888aa" dominantBaseline="central">Personality</text>
        <circle cx="62" cy="0" r="3" fill="#ef4444" />
        <text x="68" y="1" fontSize="6" fill="#8888aa" dominantBaseline="central">Design</text>
        <rect x="108" y="-3" width="6" height="6" fill="url(#hd-stripe)" />
        <text x="118" y="1" fontSize="6" fill="#8888aa" dominantBaseline="central">Both</text>
      </g>
    </svg>
  )
}

export default BodygraphChart
