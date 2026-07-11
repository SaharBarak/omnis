'use client'

import { useMemo, useState } from 'react'
import type {
  Bodygraph,
  CenterId,
  Channel,
} from '@pleiad/engine/types/human-design'
import { CENTER_LABELS } from '@pleiad/engine/types/human-design'
import { CHANNELS } from '@pleiad/engine/data/human-design-channels'
import {
  CENTER_COLORS,
  CENTER_GLOW,
  CENTER_POSITIONS,
  CHANNEL_PATHS,
  GATE_LABELS,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  getCenterPath,
  pointsToPath,
  splitPolyline,
} from './bodygraph-layout'

// =============================================================================
// TYPES
// =============================================================================

interface BodygraphChartProps {
  bodygraph: Bodygraph
  width?: number
  height?: number
  className?: string
}

interface TooltipState {
  x: number
  y: number
  content: string[]
}

// Classic chart convention adapted to the dark ground: design (unconscious)
// is red, personality (conscious) is light, both is the striped pattern.
const DESIGN_COLOR = '#D44C3C'
const PERSONALITY_COLOR = '#E8E8E8'
const BOTH_COLOR = '#F5C542'

type GateActivation = 'design' | 'personality' | 'both' | 'none'

function gateActivation(
  gate: number,
  personalityGates: ReadonlySet<number>,
  designGates: ReadonlySet<number>
): GateActivation {
  const p = personalityGates.has(gate)
  const d = designGates.has(gate)
  if (p && d) return 'both'
  if (p) return 'personality'
  if (d) return 'design'
  return 'none'
}

function halfStroke(activation: GateActivation): string | null {
  switch (activation) {
    case 'design': return DESIGN_COLOR
    case 'personality': return PERSONALITY_COLOR
    case 'both': return 'url(#stripe-both)'
    case 'none': return null
  }
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
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  const definedChannelIds = useMemo(
    () => new Set(bodygraph.channels.map(c => c.id)),
    [bodygraph]
  )

  const personalityGates = useMemo(
    () => new Set(bodygraph.activations.personality.map(a => a.gate)),
    [bodygraph]
  )

  const designGates = useMemo(
    () => new Set(bodygraph.activations.design.map(a => a.gate)),
    [bodygraph]
  )

  const handleCenterHover = (centerId: CenterId, event: React.MouseEvent<SVGElement>) => {
    const state = bodygraph.centers[centerId]
    const content = [
      `${CENTER_LABELS[centerId]}`,
      state.defined ? '● Defined' : '○ Undefined',
      `Gates: ${state.activeGates.length > 0 ? state.activeGates.join(', ') : 'none'}`,
    ]
    const svg = event.currentTarget.closest('svg')
    if (!svg) return
    const pt = svg.createSVGPoint()
    pt.x = event.clientX
    pt.y = event.clientY
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse())
    setTooltip({ x: svgP.x, y: svgP.y - 20, content })
  }

  const handleChannelHover = (channel: Channel, event: React.MouseEvent<SVGElement>) => {
    const [g0, g1] = channel.gates
    const a0 = gateActivation(g0, personalityGates, designGates)
    const a1 = gateActivation(g1, personalityGates, designGates)
    const describe = (gate: number, a: GateActivation) => {
      switch (a) {
        case 'both': return `${gate}: both`
        case 'personality': return `${gate}: personality`
        case 'design': return `${gate}: design`
        case 'none': return `${gate}: open`
      }
    }
    const content = [
      `${channel.name} (${channel.id})`,
      definedChannelIds.has(channel.id) ? '● Defined channel' : '◐ Hanging gate',
      `${describe(g0, a0)} · ${describe(g1, a1)}`,
      `Circuit: ${channel.circuitry}`,
    ]
    const svg = event.currentTarget.closest('svg')
    if (!svg) return
    const pt = svg.createSVGPoint()
    pt.x = event.clientX
    pt.y = event.clientY
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse())
    setTooltip({ x: svgP.x, y: svgP.y - 20, content })
  }

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      width={width}
      height={height}
      className={className}
      style={{ maxWidth: '100%', height: 'auto' }}
      onMouseLeave={() => setTooltip(null)}
    >
      <defs>
        {/* Glow filter for defined centers */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Striped pattern for gates activated by both personality and design */}
        <pattern id="stripe-both" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <rect width="3" height="6" fill={PERSONALITY_COLOR} />
          <rect x="3" width="3" height="6" fill={DESIGN_COLOR} />
        </pattern>

        {/* Background gradient */}
        <radialGradient id="bg-gradient" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#1a1a2e" />
          <stop offset="100%" stopColor="#0d0d1a" />
        </radialGradient>
      </defs>

      {/* Background */}
      <rect width={VIEW_WIDTH} height={VIEW_HEIGHT} fill="url(#bg-gradient)" rx="12" />

      {/* Subtle star field */}
      {Array.from({ length: 30 }, (_, i) => (
        <circle
          key={`star-${i}`}
          cx={((i * 137.5) % VIEW_WIDTH)}
          cy={((i * 97.3 + 20) % VIEW_HEIGHT)}
          r={0.5 + (i % 3) * 0.3}
          fill="white"
          opacity={0.15 + (i % 5) * 0.05}
        />
      ))}

      {/* === CHANNELS === */}
      {/* Every channel gets its own lane; each half colors by its gate's
          activation, so hanging gates read as half-filled channels. */}
      {CHANNELS.map((channel) => {
        const points = CHANNEL_PATHS[channel.id]
        if (!points) return null
        const [g0, g1] = channel.gates
        const a0 = gateActivation(g0, personalityGates, designGates)
        const a1 = gateActivation(g1, personalityGates, designGates)
        const [half0, half1] = splitPolyline(points)
        const stroke0 = halfStroke(a0)
        const stroke1 = halfStroke(a1)
        const isDefined = definedChannelIds.has(channel.id)
        const hasActivation = stroke0 !== null || stroke1 !== null

        return (
          <g
            key={channel.id}
            data-channel={channel.id}
            style={{ cursor: hasActivation ? 'pointer' : 'default' }}
            onMouseEnter={hasActivation ? (e) => handleChannelHover(channel, e) : undefined}
            onMouseLeave={() => setTooltip(null)}
          >
            {/* Base lane (always visible, faint) */}
            <path
              d={pointsToPath(points)}
              fill="none"
              stroke="#ffffff"
              strokeOpacity={0.05}
              strokeWidth={5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {stroke0 && (
              <path
                d={pointsToPath(half0)}
                fill="none"
                stroke={stroke0}
                strokeWidth={4.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={isDefined ? 1 : 0.85}
              />
            )}
            {stroke1 && (
              <path
                d={pointsToPath(half1)}
                fill="none"
                stroke={stroke1}
                strokeWidth={4.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={isDefined ? 1 : 0.85}
              />
            )}
          </g>
        )
      })}

      {/* === CENTERS === */}
      {(Object.keys(CENTER_POSITIONS) as CenterId[]).map((centerId) => {
        const pos = CENTER_POSITIONS[centerId]
        const isDefined = bodygraph.centers[centerId].defined
        const path = getCenterPath(pos)
        const color = CENTER_COLORS[centerId]
        const glowColor = CENTER_GLOW[centerId]

        return (
          <g
            key={centerId}
            style={{ cursor: 'pointer' }}
            onMouseEnter={(e) => handleCenterHover(centerId, e)}
            onMouseLeave={() => setTooltip(null)}
          >
            {/* Glow for defined centers */}
            {isDefined && (
              <path
                d={path}
                fill={glowColor}
                filter="url(#glow)"
              />
            )}
            {/* Center shape — names live in the hover tooltip, matching the
                canonical unlabeled bodygraph so gate numbers stay legible */}
            <path
              d={path}
              fill={isDefined ? color : '#181828'}
              stroke={isDefined ? color : '#8A8AA0'}
              strokeWidth={isDefined ? 1.5 : 1.2}
              strokeDasharray={isDefined ? undefined : '3,3'}
            />
          </g>
        )
      })}

      {/* === GATE NUMBERS === */}
      {/* All 64 gates at their channel mouths; activated gates highlighted. */}
      {Object.entries(GATE_LABELS).map(([gateStr, [x, y]]) => {
        const gate = Number(gateStr)
        const activation = gateActivation(gate, personalityGates, designGates)
        const color =
          activation === 'both'
            ? BOTH_COLOR
            : activation === 'personality'
              ? PERSONALITY_COLOR
              : activation === 'design'
                ? DESIGN_COLOR
                : '#666'

        return (
          <text
            key={`gate-${gate}`}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="6.5"
            fontWeight={activation === 'none' ? 'normal' : 'bold'}
            fill={color}
            opacity={activation === 'none' ? 0.55 : 1}
            style={{ pointerEvents: 'none' }}
          >
            {gate}
          </text>
        )
      })}

      {/* === TOOLTIP === */}
      {tooltip && (
        <g style={{ pointerEvents: 'none' }}>
          <rect
            x={Math.min(Math.max(tooltip.x - 75, 4), VIEW_WIDTH - 154)}
            y={tooltip.y - tooltip.content.length * 14 - 8}
            width={150}
            height={tooltip.content.length * 14 + 12}
            rx={6}
            fill="#1a1a2eee"
            stroke="#F5C54266"
            strokeWidth={1}
          />
          {tooltip.content.map((line, i) => (
            <text
              key={i}
              x={Math.min(Math.max(tooltip.x, 79), VIEW_WIDTH - 79)}
              y={tooltip.y - (tooltip.content.length - i - 1) * 14 - 8}
              textAnchor="middle"
              fontSize="9"
              fill={i === 0 ? '#F5C542' : '#ccc'}
              fontWeight={i === 0 ? 'bold' : 'normal'}
            >
              {line}
            </text>
          ))}
        </g>
      )}
    </svg>
  )
}

export default BodygraphChart
