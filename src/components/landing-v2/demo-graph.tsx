'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { SYSTEM_FLAVORS, FLAVOR_DESCENT, type SystemKey } from '@/lib/design/system-flavors'

// ============================================
// DEMO GRAPH — lightweight SVG relationship map for marketing surfaces.
// Deterministic layout (no physics engine on the landing page); the real
// force graph lives in /app/graph. Hover an edge → five-system score stack.
// ============================================

interface DemoNode {
  readonly id: string
  readonly name: string
  readonly group: 'Family' | 'Team' | 'Friends'
  readonly x: number
  readonly y: number
  /** Dreamspell seal family color. */
  readonly color: string
}

interface DemoEdge {
  readonly a: string
  readonly b: string
  /** Per-system 0-100 demo scores, in FLAVOR_DESCENT order. */
  readonly scores: readonly number[]
}

const NODES: readonly DemoNode[] = [
  { id: 'maya', name: 'Maya', group: 'Family', x: 200, y: 120, color: '#C0392B' },
  { id: 'noam', name: 'Noam', group: 'Family', x: 90, y: 210, color: '#F1C40F' },
  { id: 'dana', name: 'Dana', group: 'Family', x: 250, y: 270, color: '#ECF0F1' },
  { id: 'ari', name: 'Ari', group: 'Team', x: 470, y: 90, color: '#2C3E90' },
  { id: 'tal', name: 'Tal', group: 'Team', x: 610, y: 190, color: '#C0392B' },
  { id: 'omer', name: 'Omer', group: 'Team', x: 500, y: 300, color: '#F1C40F' },
  { id: 'lior', name: 'Lior', group: 'Friends', x: 350, y: 380, color: '#ECF0F1' },
  { id: 'shai', name: 'Shai', group: 'Friends', x: 160, y: 400, color: '#2C3E90' },
]

const EDGES: readonly DemoEdge[] = [
  { a: 'maya', b: 'noam', scores: [82, 64, 71, 88, 59] },
  { a: 'maya', b: 'dana', scores: [45, 91, 62, 38, 77] },
  { a: 'noam', b: 'dana', scores: [67, 52, 80, 73, 61] },
  { a: 'maya', b: 'ari', scores: [58, 73, 44, 92, 66] },
  { a: 'ari', b: 'tal', scores: [90, 41, 68, 55, 84] },
  { a: 'ari', b: 'omer', scores: [39, 85, 76, 61, 48] },
  { a: 'tal', b: 'omer', scores: [72, 60, 53, 79, 70] },
  { a: 'dana', b: 'lior', scores: [86, 57, 91, 42, 63] },
  { a: 'lior', b: 'shai', scores: [64, 78, 49, 87, 92] },
  { a: 'shai', b: 'noam', scores: [51, 69, 83, 60, 55] },
  { a: 'omer', b: 'lior', scores: [74, 46, 65, 71, 58] },
]

const nodeById = new Map(NODES.map((n) => [n.id, n]))

function edgeMidpoint(edge: DemoEdge) {
  const a = nodeById.get(edge.a)!
  const b = nodeById.get(edge.b)!
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

function fusedScore(edge: DemoEdge): number {
  return Math.round(edge.scores.reduce((s, v) => s + v, 0) / edge.scores.length)
}

interface DemoGraphProps {
  /** Highlight edges through a single system lens; null = fused view. */
  readonly lens?: SystemKey | null
  readonly className?: string
}

export function DemoGraph({ lens = null, className }: DemoGraphProps) {
  const [hovered, setHovered] = useState<DemoEdge | null>(null)

  const lensIndex = useMemo(
    () => (lens ? FLAVOR_DESCENT.indexOf(lens) : -1),
    [lens],
  )

  const edgeColor = (edge: DemoEdge): string => {
    if (lensIndex >= 0) {
      const score = edge.scores[lensIndex]
      return SYSTEM_FLAVORS[lens as SystemKey].accent + (score > 65 ? 'cc' : '55')
    }
    return fusedScore(edge) > 65 ? '#C9A227cc' : '#ffffff30'
  }

  return (
    <div className={className}>
      <svg
        viewBox="0 0 700 470"
        className="h-auto w-full"
        role="img"
        aria-label="Demo relationship map: eight people connected across family, team, and friends"
      >
        {/* Edges */}
        {EDGES.map((edge) => {
          const a = nodeById.get(edge.a)!
          const b = nodeById.get(edge.b)!
          return (
            <motion.line
              key={`${edge.a}-${edge.b}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={edgeColor(edge)}
              strokeWidth={hovered === edge ? 2.5 : 1.25}
              className="cursor-pointer"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
              onMouseEnter={() => setHovered(edge)}
              onMouseLeave={() => setHovered(null)}
            />
          )
        })}

        {/* Nodes */}
        {NODES.map((node, i) => (
          <motion.g
            key={node.id}
            initial={{ opacity: 0, scale: 0.6 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 + i * 0.06, ease: 'easeOut' }}
          >
            <circle cx={node.x} cy={node.y} r={17} fill={node.color} opacity={0.16} />
            <circle
              cx={node.x}
              cy={node.y}
              r={9}
              fill={node.color}
              stroke="#0B0D16"
              strokeWidth={2}
            >
              <animate
                attributeName="opacity"
                values="0.85;1;0.85"
                dur="4s"
                begin={`${i * 0.5}s`}
                repeatCount="indefinite"
              />
            </circle>
            <text
              x={node.x}
              y={node.y + 30}
              textAnchor="middle"
              className="fill-white/70 text-[12px]"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              {node.name}
            </text>
          </motion.g>
        ))}

        {/* Hover scorecard */}
        {hovered && <EdgeScorecard edge={hovered} />}
      </svg>

      {/* Group legend */}
      <div className="mt-3 flex justify-center gap-6 text-xs uppercase tracking-widest text-white/40">
        <span>Family</span>
        <span>Team</span>
        <span>Friends</span>
      </div>
    </div>
  )
}

function EdgeScorecard({ edge }: { readonly edge: DemoEdge }) {
  const mid = edgeMidpoint(edge)
  const x = Math.min(Math.max(mid.x - 70, 8), 700 - 148)
  const y = Math.min(Math.max(mid.y - 96, 8), 470 - 120)

  return (
    <g pointerEvents="none">
      <rect x={x} y={y} width={140} height={104} rx={8} fill="#141828" stroke="#ffffff22" />
      {FLAVOR_DESCENT.map((key, i) => {
        const flavor = SYSTEM_FLAVORS[key]
        const score = edge.scores[i]
        return (
          <g key={key} transform={`translate(${x + 10}, ${y + 18 + i * 18})`}>
            <text className="fill-white/60 text-[9px]" style={{ fontFamily: 'var(--font-mono)' }}>
              {flavor.name.toUpperCase()}
            </text>
            <rect x={72} y={-7} width={40} height={5} rx={2.5} fill="#ffffff18" />
            <rect
              x={72}
              y={-7}
              width={(score / 100) * 40}
              height={5}
              rx={2.5}
              fill={flavor.accent}
            />
            <text
              x={118}
              className="fill-white/80 text-[9px]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {score}
            </text>
          </g>
        )
      })}
    </g>
  )
}
