'use client'

import { useMemo, useState } from 'react'
import type {
  Bodygraph,
  CenterId,
  Channel,
} from '@/lib/types/human-design'
import { CENTER_LABELS } from '@/lib/types/human-design'
import { CHANNELS } from '@/lib/data/human-design-channels'
// Gate data available via CHANNELS

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
  shape: 'triangle' | 'triangle-inv' | 'square' | 'diamond' | 'triangle-right' | 'triangle-left'
  size: number
}

interface TooltipState {
  x: number
  y: number
  content: string[]
}

// =============================================================================
// CONSTANTS
// =============================================================================

const VIEW_WIDTH = 400
const VIEW_HEIGHT = 560

/** Anatomical positions for each center */
const CENTER_POSITIONS: Record<CenterId, CenterPosition> = {
  head:   { x: 200, y: 45,  shape: 'triangle',       size: 30 },
  ajna:   { x: 200, y: 115, shape: 'triangle-inv',   size: 30 },
  throat: { x: 200, y: 190, shape: 'square',          size: 28 },
  g:      { x: 200, y: 280, shape: 'diamond',         size: 32 },
  heart:  { x: 305, y: 245, shape: 'triangle-right',  size: 22 },
  spleen: { x: 95,  y: 340, shape: 'triangle-left',   size: 26 },
  sacral: { x: 200, y: 380, shape: 'square',          size: 28 },
  solar:  { x: 305, y: 380, shape: 'triangle-right',  size: 26 },
  root:   { x: 200, y: 480, shape: 'square',          size: 30 },
}

/** Colors for defined centers */
const CENTER_COLORS: Record<CenterId, string> = {
  head:   '#F5C542',
  ajna:   '#5CB85C',
  throat: '#D4813B',
  g:      '#F5D442',
  heart:  '#E74C3C',
  spleen: '#C9822B',
  sacral: '#D44C3C',
  solar:  '#D4813B',
  root:   '#C9822B',
}

const CENTER_GLOW: Record<CenterId, string> = {
  head:   '#F5C54280',
  ajna:   '#5CB85C80',
  throat: '#D4813B80',
  g:      '#F5D44280',
  heart:  '#E74C3C80',
  spleen: '#C9822B80',
  sacral: '#D44C3C80',
  solar:  '#D4813B80',
  root:   '#C9822B80',
}

// =============================================================================
// SHAPE HELPERS
// =============================================================================

function getCenterPath(pos: CenterPosition): string {
  const { x, y, shape, size } = pos
  switch (shape) {
    case 'triangle':
      return `M ${x} ${y - size} L ${x + size} ${y + size * 0.6} L ${x - size} ${y + size * 0.6} Z`
    case 'triangle-inv':
      return `M ${x} ${y + size} L ${x + size} ${y - size * 0.6} L ${x - size} ${y - size * 0.6} Z`
    case 'square':
      return `M ${x - size} ${y - size} L ${x + size} ${y - size} L ${x + size} ${y + size} L ${x - size} ${y + size} Z`
    case 'diamond':
      return `M ${x} ${y - size} L ${x + size} ${y} L ${x} ${y + size} L ${x - size} ${y} Z`
    case 'triangle-right':
      return `M ${x - size} ${y - size} L ${x + size} ${y} L ${x - size} ${y + size} Z`
    case 'triangle-left':
      return `M ${x + size} ${y - size} L ${x - size} ${y} L ${x + size} ${y + size} Z`
  }
}

// =============================================================================
// CHANNEL ACTIVATION ANALYSIS
// =============================================================================

type ChannelActivationType = 'design' | 'personality' | 'both' | 'none'

function getChannelActivationTypes(
  bodygraph: Bodygraph
): Map<string, ChannelActivationType> {
  const personalityGates = new Set(bodygraph.activations.personality.map(a => a.gate))
  const designGates = new Set(bodygraph.activations.design.map(a => a.gate))

  const result = new Map<string, ChannelActivationType>()

  for (const channel of bodygraph.channels) {
    const [g1, g2] = channel.gates
    const g1p = personalityGates.has(g1)
    const g1d = designGates.has(g1)
    const g2p = personalityGates.has(g2)
    const g2d = designGates.has(g2)

    const hasPersonality = (g1p && g2p)
    const hasDesign = (g1d && g2d)
    // If both gates activated by personality only → personality
    // If both gates activated by design only → design
    // If mix → both
    if (hasPersonality && hasDesign) {
      result.set(channel.id, 'both')
    } else if (g1p || g2p) {
      if (g1d || g2d) {
        result.set(channel.id, 'both')
      } else {
        result.set(channel.id, 'personality')
      }
    } else {
      result.set(channel.id, 'design')
    }
  }

  return result
}

// =============================================================================
// GATE POSITIONS ON CHANNELS
// =============================================================================

/** Get a point along the line between two centers, at a fraction t (0=center1, 1=center2) */
function lerp(c1: CenterPosition, c2: CenterPosition, t: number): { x: number; y: number } {
  return {
    x: c1.x + (c2.x - c1.x) * t,
    y: c1.y + (c2.y - c1.y) * t,
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

  const channelActivations = useMemo(
    () => getChannelActivationTypes(bodygraph),
    [bodygraph]
  )

  const definedChannelIds = useMemo(
    () => new Set(bodygraph.channels.map(c => c.id)),
    [bodygraph]
  )

  const allGates = useMemo(
    () => new Set(bodygraph.gates),
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

  // Build gate-to-position map for displaying gate numbers
  const gatePositions = useMemo(() => {
    const positions: { gate: number; x: number; y: number; channelId: string }[] = []
    const placedGates = new Set<string>() // "gate-channelId" to avoid duplicates

    for (const channel of CHANNELS) {
      const [g1, g2] = channel.gates
      const [c1Id, c2Id] = channel.centers
      const c1 = CENTER_POSITIONS[c1Id]
      const c2 = CENTER_POSITIONS[c2Id]

      // Only show gates that are activated
      if (allGates.has(g1)) {
        const key = `${g1}-${channel.id}`
        if (!placedGates.has(key)) {
          placedGates.add(key)
          const pos = lerp(c1, c2, 0.15)
          positions.push({ gate: g1, ...pos, channelId: channel.id })
        }
      }
      if (allGates.has(g2)) {
        const key = `${g2}-${channel.id}`
        if (!placedGates.has(key)) {
          placedGates.add(key)
          const pos = lerp(c2, c1, 0.15)
          positions.push({ gate: g2, ...pos, channelId: channel.id })
        }
      }
    }

    return positions
  }, [allGates])

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
    const activation = channelActivations.get(channel.id) || 'none'
    const labels: Record<ChannelActivationType, string> = {
      design: '🔴 Design (Unconscious)',
      personality: '⚫ Personality (Conscious)',
      both: '🔴⚫ Both',
      none: '',
    }
    const content = [
      `${channel.name} (${channel.id})`,
      `${channel.nameHebrew}`,
      labels[activation],
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

        {/* Striped pattern for "both" channels */}
        <pattern id="stripe-both" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <rect width="3" height="6" fill="#1a1a2e" />
          <rect x="3" width="3" height="6" fill="#D44C3C" />
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
      {/* Draw all 36 channels as faint lines, highlight defined ones */}
      {CHANNELS.map((channel) => {
        const [c1Id, c2Id] = channel.centers
        const c1 = CENTER_POSITIONS[c1Id]
        const c2 = CENTER_POSITIONS[c2Id]
        const isDefined = definedChannelIds.has(channel.id)
        const activation = channelActivations.get(channel.id)

        let stroke = '#ffffff08'
        let strokeWidth = 1

        if (isDefined) {
          strokeWidth = 3
          switch (activation) {
            case 'design':
              stroke = '#D44C3C'
              break
            case 'personality':
              stroke = '#e8e8e8'
              break
            case 'both':
              stroke = 'url(#stripe-both)'
              strokeWidth = 4
              break
            default:
              stroke = '#D4813B'
          }
        }

        return (
          <line
            key={channel.id}
            x1={c1.x}
            y1={c1.y}
            x2={c2.x}
            y2={c2.y}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity={isDefined ? 0.9 : 0.15}
            style={{ cursor: isDefined ? 'pointer' : 'default' }}
            onMouseEnter={isDefined ? (e) => handleChannelHover(channel, e) : undefined}
            onMouseLeave={() => setTooltip(null)}
          />
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
            {/* Center shape */}
            <path
              d={path}
              fill={isDefined ? color : 'transparent'}
              stroke={isDefined ? color : '#555'}
              strokeWidth={isDefined ? 1.5 : 1}
              strokeDasharray={isDefined ? undefined : '3,3'}
              opacity={isDefined ? 1 : 0.5}
            />
            {/* Center label */}
            <text
              x={pos.x}
              y={pos.y + 3}
              textAnchor="middle"
              fontSize="8"
              fontWeight="600"
              fill={isDefined ? '#0d0d1a' : '#888'}
              style={{ pointerEvents: 'none' }}
            >
              {CENTER_LABELS[centerId]}
            </text>
          </g>
        )
      })}

      {/* === GATE NUMBERS === */}
      {gatePositions.map(({ gate, x, y, channelId }) => {
        const isPersonality = personalityGates.has(gate)
        const isDesign = designGates.has(gate)
        const color = isPersonality && isDesign
          ? '#F5C542'
          : isPersonality
            ? '#e8e8e8'
            : '#D44C3C'

        return (
          <text
            key={`gate-${gate}-${channelId}`}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="7"
            fontWeight="bold"
            fill={color}
            opacity={0.85}
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
            x={tooltip.x - 70}
            y={tooltip.y - tooltip.content.length * 14 - 8}
            width={140}
            height={tooltip.content.length * 14 + 12}
            rx={6}
            fill="#1a1a2eee"
            stroke="#F5C54266"
            strokeWidth={1}
          />
          {tooltip.content.map((line, i) => (
            <text
              key={i}
              x={tooltip.x}
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
