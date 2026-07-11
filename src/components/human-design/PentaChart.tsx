'use client'

import { useMemo, useState } from 'react'
import type { Bodygraph, CenterId } from '@pleiad/engine/types/human-design'
import { CENTER_LABELS } from '@pleiad/engine/types/human-design'
import {
  buildPenta,
  type PentaChannel,
} from '@pleiad/engine/services/composite-bodygraph'
import {
  CENTER_COLORS,
  CENTER_GLOW,
  CENTER_POSITIONS,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  getCenterPath,
} from './bodygraph-layout'

/**
 * Penta — the group bodygraph. Aggregates the members' charts and highlights
 * what the GROUP defines that no individual member has (emergent channels and
 * centers, brand violet). Classically read for 3-5 people; the aggregation
 * itself works for any group size.
 */

export interface PentaMember {
  name: string
  bodygraph: Bodygraph
}

interface PentaChartProps {
  members: PentaMember[]
  width?: number
  height?: number
  className?: string
}

interface TooltipState {
  x: number
  y: number
  content: string[]
}

const EMERGENT_COLOR = '#A78FDF' // brand-soft violet
const INDIVIDUAL_COLOR = '#B9BDC7' // neutral — carried by at least one member
const HANGING_COLOR = '#8A8A99'

export function PentaChart({ members, width, height, className = '' }: PentaChartProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  const penta = useMemo(
    () => buildPenta(members.map((m) => m.bodygraph)),
    [members]
  )

  const handleChannelHover = (pc: PentaChannel, event: React.MouseEvent<SVGElement>) => {
    const svg = event.currentTarget.closest('svg')
    if (!svg) return
    const pt = svg.createSVGPoint()
    pt.x = event.clientX
    pt.y = event.clientY
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse())
    const content = [`${pc.channel.name} (${pc.channel.id})`]
    if (pc.state === 'emergent') content.push('✦ Defined only by the group')
    if (pc.state === 'individual') content.push('Carried by a member')
    if (pc.state === 'hanging') content.push('Hanging gate')
    for (const ref of pc.contributors) {
      content.push(`${members[ref.index].name}: gate ${ref.gates.join(', ')}`)
    }
    setTooltip({ x: svgP.x, y: svgP.y - 20, content: content.slice(0, 6) })
  }

  const handleCenterHover = (centerId: CenterId, event: React.MouseEvent<SVGElement>) => {
    const svg = event.currentTarget.closest('svg')
    if (!svg) return
    const pt = svg.createSVGPoint()
    pt.x = event.clientX
    pt.y = event.clientY
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse())
    const definedFor = members
      .filter((m) => m.bodygraph.centers[centerId].defined)
      .map((m) => m.name)
    const content = [
      CENTER_LABELS[centerId],
      penta.emergentCenters.has(centerId)
        ? '✦ Defined only by the group'
        : penta.definedCenters.has(centerId)
          ? '● Defined in the group'
          : '○ Open in the group',
      definedFor.length > 0 ? `Defined for: ${definedFor.join(', ')}` : 'Defined for no one alone',
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
        aria-label={`Group bodygraph of ${members.length} members`}
      >
        <defs>
          <filter id="penta-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="penta-bg" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#1a1a2e" />
            <stop offset="100%" stopColor="#0d0d1a" />
          </radialGradient>
        </defs>

        <rect width={VIEW_WIDTH} height={VIEW_HEIGHT} fill="url(#penta-bg)" rx="12" />

        {/* Channels — emergent last so the group layer paints on top */}
        {[...penta.channels]
          .sort((a, b) => {
            const order = { open: 0, hanging: 1, individual: 2, emergent: 3 }
            return order[a.state] - order[b.state]
          })
          .map((pc) => {
            const [c1Id, c2Id] = pc.channel.centers
            const c1 = CENTER_POSITIONS[c1Id]
            const c2 = CENTER_POSITIONS[c2Id]
            const interactive = pc.state !== 'open'

            let stroke = '#ffffff08'
            let strokeWidth = 1
            let opacity = 0.15
            let dash: string | undefined
            let glow = false

            switch (pc.state) {
              case 'emergent':
                stroke = EMERGENT_COLOR
                strokeWidth = 5
                opacity = 1
                glow = true
                break
              case 'individual':
                stroke = INDIVIDUAL_COLOR
                strokeWidth = 3
                opacity = 0.55
                break
              case 'hanging':
                stroke = HANGING_COLOR
                strokeWidth = 1.5
                opacity = 0.3
                dash = '3,4'
                break
            }

            return (
              <line
                key={pc.channel.id}
                x1={c1.x}
                y1={c1.y}
                x2={c2.x}
                y2={c2.y}
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeDasharray={dash}
                strokeLinecap="round"
                opacity={opacity}
                filter={glow ? 'url(#penta-glow)' : undefined}
                style={{ cursor: interactive ? 'pointer' : 'default' }}
                onMouseEnter={interactive ? (e) => handleChannelHover(pc, e) : undefined}
                onMouseLeave={() => setTooltip(null)}
              />
            )
          })}

        {/* Centers */}
        {(Object.keys(CENTER_POSITIONS) as CenterId[]).map((centerId) => {
          const pos = CENTER_POSITIONS[centerId]
          const path = getCenterPath(pos)
          const isDefined = penta.definedCenters.has(centerId)
          const isEmergent = penta.emergentCenters.has(centerId)
          const color = CENTER_COLORS[centerId]

          return (
            <g
              key={centerId}
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => handleCenterHover(centerId, e)}
              onMouseLeave={() => setTooltip(null)}
            >
              {isDefined && (
                <path d={path} fill={CENTER_GLOW[centerId]} filter="url(#penta-glow)" />
              )}
              <path
                d={path}
                fill={isDefined ? color : 'transparent'}
                stroke={isEmergent ? EMERGENT_COLOR : isDefined ? color : '#555'}
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

      {/* Legend + emergent summary */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-5 rounded-full" style={{ background: EMERGENT_COLOR }} />
          Group-only definition
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-5 rounded-full" style={{ background: INDIVIDUAL_COLOR }} />
          Carried by a member
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-0.5 w-5 rounded-full"
            style={{
              background: `repeating-linear-gradient(90deg, ${HANGING_COLOR} 0 4px, transparent 4px 7px)`,
            }}
          />
          Hanging gate
        </span>
      </div>
    </div>
  )
}

export default PentaChart
