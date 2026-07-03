'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { SYSTEM_FLAVORS, FLAVOR_DESCENT, type SystemKey } from '@/lib/design/system-flavors'
import { COLORS } from '@/lib/design/landing-tokens'

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
  /** Five-system mini reading, FLAVOR_DESCENT order. */
  readonly reading: readonly [string, string, string, string, string]
}

interface DemoEdge {
  readonly a: string
  readonly b: string
  /** Per-system 0-100 demo scores, in FLAVOR_DESCENT order. */
  readonly scores: readonly number[]
}

const NODES: readonly DemoNode[] = [
  { id: 'maya', name: 'Maya', group: 'Family', x: 200, y: 120, color: '#C0392B', reading: ['Leo · Pisces moon', 'Kin 113 Skywalker', "B'en 9", 'MG 5/1', 'מיה · 55'] },
  { id: 'noam', name: 'Noam', group: 'Family', x: 90, y: 210, color: '#F1C40F', reading: ['Taurus · Virgo moon', 'Kin 42 Wind', 'Ik 3', 'Projector 3/5', 'נועם · 166'] },
  { id: 'dana', name: 'Dana', group: 'Family', x: 250, y: 270, color: '#ECF0F1', reading: ['Cancer · Leo moon', 'Kin 200 Sun', 'Ajaw 5', 'Generator 1/3', 'דנה · 59'] },
  { id: 'ari', name: 'Ari', group: 'Team', x: 470, y: 90, color: '#2C3E90', reading: ['Sagittarius · Aries moon', 'Kin 87 Hand', 'Manik 10', 'Manifestor 6/2', 'ארי · 211'] },
  { id: 'tal', name: 'Tal', group: 'Team', x: 610, y: 190, color: '#C0392B', reading: ['Scorpio · Cancer moon', 'Kin 155 Eagle', 'Men 12', 'Generator 4/6', 'טל · 39'] },
  { id: 'omer', name: 'Omer', group: 'Team', x: 500, y: 300, color: '#F1C40F', reading: ['Gemini · Libra moon', 'Kin 231 Monkey', "Chuwen 10", 'Reflector', 'עומר · 316'] },
  { id: 'lior', name: 'Lior', group: 'Friends', x: 350, y: 380, color: '#ECF0F1', reading: ['Virgo · Taurus moon', 'Kin 18 Mirror', 'Etznab 5', 'Projector 5/1', 'ליאור · 247'] },
  { id: 'shai', name: 'Shai', group: 'Friends', x: 160, y: 400, color: '#2C3E90', reading: ['Pisces · Scorpio moon', 'Kin 260 Sun', 'Ajaw 13', 'MG 2/4', 'שי · 310'] },
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
  const [selected, setSelected] = useState<DemoNode | null>(null)

  const lensIndex = useMemo(
    () => (lens ? FLAVOR_DESCENT.indexOf(lens) : -1),
    [lens],
  )

  const edgeColor = (edge: DemoEdge): string => {
    if (lensIndex >= 0) {
      const score = edge.scores[lensIndex]
      return SYSTEM_FLAVORS[lens as SystemKey].accent + (score > 65 ? 'cc' : '55')
    }
    return fusedScore(edge) > 65 ? `${COLORS.gold}cc` : '#ffffff30'
  }

  return (
    <div className={`relative ${className ?? ''}`}>
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
            className="cursor-pointer"
            onClick={() => setSelected(selected?.id === node.id ? null : node)}
          >
            <circle cx={node.x} cy={node.y} r={17} fill={node.color} opacity={0.16} />
            <circle
              cx={node.x}
              cy={node.y}
              r={9}
              fill={node.color}
              stroke={COLORS.ground}
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

      {/* Node person card — tap a node for its five-system mini reading */}
      {selected && (
        <motion.div
          className="absolute right-3 top-3 w-56 rounded-xl border border-white/10 bg-surface-2 p-4 shadow-2xl"
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 20 }}
        >
          <div className="flex items-center justify-between">
            <p className="font-display text-base text-white">{selected.name}</p>
            <button
              type="button"
              aria-label="Close"
              className="text-white/50 transition-colors hover:text-white"
              onClick={() => setSelected(null)}
            >
              ×
            </button>
          </div>
          <p className="mt-0.5 text-[10px] uppercase tracking-widest text-white/50">
            {selected.group}
          </p>
          <div className="mt-3 space-y-1.5">
            {FLAVOR_DESCENT.map((key, i) => (
              <div key={key} className="flex items-baseline justify-between gap-2">
                <span
                  className="text-[9px] uppercase tracking-wider"
                  style={{ color: SYSTEM_FLAVORS[key].accent }}
                >
                  {SYSTEM_FLAVORS[key].name}
                </span>
                <span className="text-right font-mono text-[11px] text-white/90">
                  {selected.reading[i]}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Group legend */}
      <div className="mt-3 flex justify-center gap-6 text-xs uppercase tracking-widest text-white/50">
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
      <rect x={x} y={y} width={140} height={104} rx={8} fill={COLORS.surface2} stroke="#ffffff22" />
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
