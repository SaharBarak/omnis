'use client'

import { useMemo, useState } from 'react'
import type { Bodygraph, CenterId } from '@pleiad/engine/types/human-design'
import { CENTER_LABELS } from '@pleiad/engine/types/human-design'
import {
  buildCompositePair,
  type PairChannel,
  type PairChannelState,
} from '@pleiad/engine/services/composite-bodygraph'
import {
  CENTER_COLORS,
  CENTER_GLOW,
  CENTER_POSITIONS,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  getCenterPath,
  lerp,
} from './bodygraph-layout'

/**
 * Composite Bodygraph — two charts overlaid, channels colored by classic HD
 * connection mechanics. The headline layer is the electromagnetic channels:
 * definition the pair creates that neither person has alone (brand violet).
 */

interface CompositeBodygraphChartProps {
  personA: { name: string; bodygraph: Bodygraph }
  personB: { name: string; bodygraph: Bodygraph }
  width?: number
  height?: number
  className?: string
}

interface TooltipState {
  x: number
  y: number
  content: string[]
}

// Person hues are deliberately outside the single-chart red/black
// personality/design convention so the two vocabularies never collide.
const PERSON_A_COLOR = '#5FA8D3' // slate blue
const PERSON_B_COLOR = '#E3906B' // warm clay
const ELECTROMAGNETIC_COLOR = '#A78FDF' // brand-soft violet — the emergent spark
const COMPANIONSHIP_COLOR = '#5CB85C'
const COMPROMISE_COLOR = '#8A8A99'

interface ChannelStyle {
  stroke: string
  strokeWidth: number
  opacity: number
  dash?: string
  glow?: boolean
}

const CHANNEL_STYLES: Record<PairChannelState, ChannelStyle> = {
  'electromagnetic': { stroke: ELECTROMAGNETIC_COLOR, strokeWidth: 5, opacity: 1, glow: true },
  'companionship':   { stroke: COMPANIONSHIP_COLOR, strokeWidth: 4, opacity: 0.9 },
  'a-defined':       { stroke: PERSON_A_COLOR, strokeWidth: 3, opacity: 0.85 },
  'b-defined':       { stroke: PERSON_B_COLOR, strokeWidth: 3, opacity: 0.85 },
  'dominance-a':     { stroke: PERSON_A_COLOR, strokeWidth: 3.5, opacity: 0.9 },
  'dominance-b':     { stroke: PERSON_B_COLOR, strokeWidth: 3.5, opacity: 0.9 },
  'compromise':      { stroke: COMPROMISE_COLOR, strokeWidth: 2.5, opacity: 0.7, dash: '6,4' },
  'hanging-a':       { stroke: PERSON_A_COLOR, strokeWidth: 1.5, opacity: 0.35, dash: '3,4' },
  'hanging-b':       { stroke: PERSON_B_COLOR, strokeWidth: 1.5, opacity: 0.35, dash: '3,4' },
  'open':            { stroke: '#ffffff08', strokeWidth: 1, opacity: 0.15 },
}

function stateLabel(state: PairChannelState, aName: string, bName: string): string {
  switch (state) {
    case 'electromagnetic': return 'Electromagnetic — defined together only'
    case 'companionship': return 'Companionship — both hold this channel'
    case 'a-defined': return `Defined by ${aName}`
    case 'b-defined': return `Defined by ${bName}`
    case 'dominance-a': return `Dominance — ${aName} holds the channel`
    case 'dominance-b': return `Dominance — ${bName} holds the channel`
    case 'compromise': return 'Compromise — same hanging gate'
    case 'hanging-a': return `Hanging gate (${aName})`
    case 'hanging-b': return `Hanging gate (${bName})`
    case 'open': return 'Open'
  }
}

const LEGEND: Array<{ label: string; style: ChannelStyle }> = [
  { label: 'Electromagnetic', style: CHANNEL_STYLES['electromagnetic'] },
  { label: 'Companionship', style: CHANNEL_STYLES['companionship'] },
  { label: 'Dominance', style: { ...CHANNEL_STYLES['dominance-a'], stroke: '#B9BDC7' } },
  { label: 'Compromise', style: CHANNEL_STYLES['compromise'] },
]

export function CompositeBodygraphChart({
  personA,
  personB,
  width,
  height,
  className = '',
}: CompositeBodygraphChartProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  const composite = useMemo(
    () => buildCompositePair(personA.bodygraph, personB.bodygraph),
    [personA.bodygraph, personB.bodygraph]
  )

  const handleChannelHover = (pc: PairChannel, event: React.MouseEvent<SVGElement>) => {
    const svg = event.currentTarget.closest('svg')
    if (!svg) return
    const pt = svg.createSVGPoint()
    pt.x = event.clientX
    pt.y = event.clientY
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse())
    const content = [
      `${pc.channel.name} (${pc.channel.id})`,
      stateLabel(pc.state, personA.name, personB.name),
    ]
    if (pc.aGates.length > 0) content.push(`${personA.name}: gate ${pc.aGates.join(', ')}`)
    if (pc.bGates.length > 0) content.push(`${personB.name}: gate ${pc.bGates.join(', ')}`)
    setTooltip({ x: svgP.x, y: svgP.y - 20, content })
  }

  const handleCenterHover = (centerId: CenterId, event: React.MouseEvent<SVGElement>) => {
    const svg = event.currentTarget.closest('svg')
    if (!svg) return
    const pt = svg.createSVGPoint()
    pt.x = event.clientX
    pt.y = event.clientY
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse())
    const aHas = personA.bodygraph.centers[centerId].defined
    const bHas = personB.bodygraph.centers[centerId].defined
    const emergent = composite.emergentCenters.has(centerId)
    const content = [
      CENTER_LABELS[centerId],
      emergent
        ? '✦ Defined only together'
        : composite.definedCenters.has(centerId)
          ? '● Defined in the composite'
          : '○ Open in the composite',
      `${personA.name}: ${aHas ? 'defined' : 'open'} · ${personB.name}: ${bHas ? 'defined' : 'open'}`,
    ]
    setTooltip({ x: svgP.x, y: svgP.y - 20, content })
  }

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        width={width}
        height={height}
        style={{ maxWidth: '100%', height: 'auto' }}
        onMouseLeave={() => setTooltip(null)}
        role="img"
        aria-label={`Composite bodygraph of ${personA.name} and ${personB.name}`}
      >
        <defs>
          <filter id="composite-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="composite-bg" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#1a1a2e" />
            <stop offset="100%" stopColor="#0d0d1a" />
          </radialGradient>
        </defs>

        <rect width={VIEW_WIDTH} height={VIEW_HEIGHT} fill="url(#composite-bg)" rx="12" />

        {/* Channels — open first so defined layers paint on top */}
        {[...composite.channels]
          .sort((a, b) => CHANNEL_STYLES[a.state].strokeWidth - CHANNEL_STYLES[b.state].strokeWidth)
          .map((pc) => {
            const [c1Id, c2Id] = pc.channel.centers
            const c1 = CENTER_POSITIONS[c1Id]
            const c2 = CENTER_POSITIONS[c2Id]
            const style = CHANNEL_STYLES[pc.state]
            const interactive = pc.state !== 'open'

            return (
              <line
                key={pc.channel.id}
                x1={c1.x}
                y1={c1.y}
                x2={c2.x}
                y2={c2.y}
                stroke={style.stroke}
                strokeWidth={style.strokeWidth}
                strokeDasharray={style.dash}
                strokeLinecap="round"
                opacity={style.opacity}
                filter={style.glow ? 'url(#composite-glow)' : undefined}
                style={{ cursor: interactive ? 'pointer' : 'default' }}
                onMouseEnter={interactive ? (e) => handleChannelHover(pc, e) : undefined}
                onMouseLeave={() => setTooltip(null)}
              />
            )
          })}

        {/* Gate markers on partial channels: who brings which half */}
        {composite.channels
          .filter((pc) =>
            ['electromagnetic', 'dominance-a', 'dominance-b', 'compromise'].includes(pc.state)
          )
          .flatMap((pc) => {
            const [c1Id, c2Id] = pc.channel.centers
            const c1 = CENTER_POSITIONS[c1Id]
            const c2 = CENTER_POSITIONS[c2Id]
            const [g0] = pc.channel.gates
            const markers: React.ReactNode[] = []
            const mark = (gate: number, color: string, key: string) => {
              // Gate g0 lives at the c1 end, g1 at the c2 end.
              const pos = gate === g0 ? lerp(c1, c2, 0.22) : lerp(c2, c1, 0.22)
              markers.push(
                <circle
                  key={key}
                  cx={pos.x}
                  cy={pos.y}
                  r={4}
                  fill={color}
                  stroke="#0d0d1a"
                  strokeWidth={1}
                  style={{ pointerEvents: 'none' }}
                />
              )
            }
            for (const g of pc.aGates) mark(g, PERSON_A_COLOR, `a-${pc.channel.id}-${g}`)
            for (const g of pc.bGates) mark(g, PERSON_B_COLOR, `b-${pc.channel.id}-${g}`)
            return markers
          })}

        {/* Centers */}
        {(Object.keys(CENTER_POSITIONS) as CenterId[]).map((centerId) => {
          const pos = CENTER_POSITIONS[centerId]
          const path = getCenterPath(pos)
          const isDefined = composite.definedCenters.has(centerId)
          const isEmergent = composite.emergentCenters.has(centerId)
          const color = CENTER_COLORS[centerId]

          return (
            <g
              key={centerId}
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => handleCenterHover(centerId, e)}
              onMouseLeave={() => setTooltip(null)}
            >
              {isDefined && (
                <path d={path} fill={CENTER_GLOW[centerId]} filter="url(#composite-glow)" />
              )}
              <path
                d={path}
                fill={isDefined ? color : 'transparent'}
                stroke={isEmergent ? ELECTROMAGNETIC_COLOR : isDefined ? color : '#555'}
                strokeWidth={isEmergent ? 3 : isDefined ? 1.5 : 1}
                strokeDasharray={isDefined ? undefined : '3,3'}
                opacity={isDefined ? 1 : 0.5}
              />
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

        {/* Tooltip */}
        {tooltip && (
          <g style={{ pointerEvents: 'none' }}>
            <rect
              x={Math.min(Math.max(tooltip.x - 85, 4), VIEW_WIDTH - 174)}
              y={tooltip.y - tooltip.content.length * 14 - 8}
              width={170}
              height={tooltip.content.length * 14 + 12}
              rx={6}
              fill="#1a1a2eee"
              stroke="#A78FDF66"
              strokeWidth={1}
            />
            {tooltip.content.map((line, i) => (
              <text
                key={i}
                x={Math.min(Math.max(tooltip.x, 89), VIEW_WIDTH - 89)}
                y={tooltip.y - (tooltip.content.length - i - 1) * 14 - 8}
                textAnchor="middle"
                fontSize="9"
                fill={i === 0 ? '#A78FDF' : '#ccc'}
                fontWeight={i === 0 ? 'bold' : 'normal'}
              >
                {line}
              </text>
            ))}
          </g>
        )}
      </svg>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: PERSON_A_COLOR }} />
          {personA.name}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: PERSON_B_COLOR }} />
          {personB.name}
        </span>
        {LEGEND.map(({ label, style }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span
              className="inline-block h-0.5 w-5 rounded-full"
              style={{
                background: style.dash
                  ? `repeating-linear-gradient(90deg, ${style.stroke} 0 4px, transparent 4px 7px)`
                  : style.stroke,
              }}
            />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default CompositeBodygraphChart
