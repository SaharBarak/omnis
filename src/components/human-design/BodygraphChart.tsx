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
// is red, personality (conscious) is light, both is gold. Gold solid replaced
// the 45° candy stripes — at chart size the stripes read as noise, not as
// "both activated".
const DESIGN_COLOR = '#D44C3C'
const PERSONALITY_COLOR = '#E8E8E8'
const BOTH_COLOR = '#F5C542'

const MONO = 'var(--font-mono), ui-monospace, monospace'

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
    case 'both': return BOTH_COLOR
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
    <div className={className} style={{ maxWidth: '100%' }}>
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      width={width}
      height={height}
      style={{ maxWidth: '100%', height: 'auto', width: width ? undefined : '100%' }}
      onMouseLeave={() => setTooltip(null)}
    >

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
            {/* Base lane — legible full-length track, so a colored half reads
                as "half of a channel", never as a floating dash. */}
            <path
              d={pointsToPath(points)}
              fill="none"
              stroke="#3A4152"
              strokeOpacity={0.55}
              strokeWidth={2.5}
              strokeLinecap="butt"
              strokeLinejoin="round"
            />
            {/* Butt caps: round caps at the shared midpoint painted a blob
                over the seam where two half-colors meet. */}
            {stroke0 && (
              <path
                d={pointsToPath(half0)}
                fill="none"
                stroke={stroke0}
                strokeWidth={3.5}
                strokeLinecap="butt"
                strokeLinejoin="round"
                opacity={isDefined ? 1 : 0.9}
              />
            )}
            {stroke1 && (
              <path
                d={pointsToPath(half1)}
                fill="none"
                stroke={stroke1}
                strokeWidth={3.5}
                strokeLinecap="butt"
                strokeLinejoin="round"
                opacity={isDefined ? 1 : 0.9}
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

        return (
          <g
            key={centerId}
            style={{ cursor: 'pointer' }}
            onMouseEnter={(e) => handleCenterHover(centerId, e)}
            onMouseLeave={() => setTooltip(null)}
          >
            {/* Center shape — names live in the hover tooltip, matching the
                canonical unlabeled bodygraph so gate numbers stay legible.
                Defined centers are tinted surfaces with a crisp colored edge,
                not solid paint: the solid fills plus outer glows were what
                made the chart read as a pile of hot slabs. Color lives in
                the channels and gate chips — the data. */}
            <path
              d={path}
              fill={isDefined ? `${color}2E` : 'rgba(255,255,255,0.03)'}
              stroke={isDefined ? color : 'rgba(255,255,255,0.22)'}
              strokeWidth={isDefined ? 1.6 : 1.2}
              strokeLinejoin="round"
            />
          </g>
        )
      })}

      {/* === GATE NUMBERS === */}
      {/* All 64 gates at their channel mouths. Activated gates get a chip —
          a dark disc with a colored ring — so the numbers that matter are
          readable at a glance; open gates stay as faint marks. The old
          bare 6.5px numerals were illegible at rendered size. */}
      {Object.entries(GATE_LABELS).map(([gateStr, [x, y]]) => {
        const gate = Number(gateStr)
        const activation = gateActivation(gate, personalityGates, designGates)
        if (activation === 'none') {
          return (
            <text
              key={`gate-${gate}`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="6.5"
              fontFamily={MONO}
              fill="#ffffff"
              opacity={0.4}
              style={{ pointerEvents: 'none' }}
            >
              {gate}
            </text>
          )
        }

        const color =
          activation === 'both'
            ? BOTH_COLOR
            : activation === 'personality'
              ? PERSONALITY_COLOR
              : DESIGN_COLOR

        // The chip REPLACES the gate number at the identical slot — one
        // placement rule for every gate, activated or open.
        return (
          <g key={`gate-${gate}`} style={{ pointerEvents: 'none' }}>
            <circle cx={x} cy={y} r={6} fill="#12151F" stroke={color} strokeWidth={1.3} />
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="7"
              fontWeight="bold"
              fontFamily={MONO}
              fill={color}
            >
              {gate}
            </text>
          </g>
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
            rx={8}
            fill="rgba(18,21,31,0.96)"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={1}
          />
          {tooltip.content.map((line, i) => (
            <text
              key={i}
              x={Math.min(Math.max(tooltip.x - 75, 4), VIEW_WIDTH - 154) + 75}
              y={tooltip.y - (tooltip.content.length - i - 1) * 14 - 8}
              textAnchor="middle"
              fontSize="9"
              fontFamily={MONO}
              fill={i === 0 ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.6)'}
              fontWeight={i === 0 ? 'bold' : 'normal'}
            >
              {line}
            </text>
          ))}
        </g>
      )}
    </svg>

    {/* Legend — HTML so its type scales with the site, not the viewBox. */}
    <div className="mt-3 flex items-center justify-center gap-6 text-[11px] text-white/55">
      {(
        [
          [PERSONALITY_COLOR, 'Personality'],
          [DESIGN_COLOR, 'Design'],
          [BOTH_COLOR, 'Both'],
        ] as const
      ).map(([swatch, label]) => (
        <span key={label} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full border"
            style={{ borderColor: swatch, backgroundColor: '#12151F' }}
          />
          {label}
        </span>
      ))}
    </div>
    </div>
  )
}

export default BodygraphChart
