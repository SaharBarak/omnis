'use client'

import { useState, useMemo } from 'react'
import type {
  NatalChart,
  PlanetPosition,
  AspectInstance,
  Element,
  PlanetId,
} from '@/lib/types/astrology'
import { ZODIAC_SIGNS } from '@/lib/data/zodiac-signs'
import { cn } from '@/lib/utils'

// ─── Constants ───────────────────────────────────────────────────────
const SIZE = 600
const CX = SIZE / 2
const CY = SIZE / 2
const R_OUTER = 270       // outer edge
const R_ZODIAC_IN = 230   // inner edge of zodiac ring
const R_HOUSE_NUM = 205   // house number labels
const R_HOUSES_IN = 185   // inner edge of house ring
const R_PLANET = 165      // planet glyph radius
const R_ASPECT = 140      // aspect lines live inside this
const R_TICK = R_OUTER    // degree ticks on outer edge

const ELEMENT_COLORS: Record<Element, string> = {
  fire: '#EF4444',
  earth: '#22C55E',
  air: '#FACC15',
  water: '#3B82F6',
}

const ASPECT_COLORS: Record<string, string> = {
  Conjunction: '#FFD700',
  Sextile: '#60A5FA',
  Square: '#EF4444',
  Trine: '#22C55E',
  Opposition: '#EF4444',
  Quincunx: '#A78BFA',
  'Semi-sextile': '#94A3B8',
}

const PLANET_GLYPHS: Record<string, string> = {
  sun: '☉', moon: '☽', mercury: '☿', venus: '♀', mars: '♂',
  jupiter: '♃', saturn: '♄', uranus: '♅', neptune: '♆', pluto: '♇',
  northNode: '☊', southNode: '☋', lilith: '⚸',
}

// ─── Helpers ─────────────────────────────────────────────────────────
/** Convert ecliptic longitude to SVG angle. Astro charts have 0° Aries at 9-o'clock (left),
 *  going counter-clockwise. We rotate so ASC (or 0° Aries if no ASC) is at the left. */
function toAngle(longitude: number, ascLong: number): number {
  // offset so ascendant is at 180° (left side, "9 o'clock")
  return 180 - (longitude - ascLong)
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) }
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const s = polar(cx, cy, r, startAngle)
  const e = polar(cx, cy, r, endAngle)
  // sweep 30° arcs — always minor arc
  const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 0 ${e.x} ${e.y}`
}

// ─── Tooltip state ───────────────────────────────────────────────────
interface TooltipData {
  x: number
  y: number
  content: string
}

// ─── Sub-components (all inline SVG) ─────────────────────────────────

function ZodiacRing({ ascLong }: { ascLong: number }) {
  return (
    <g className="zodiac-ring">
      {/* Outer circle */}
      <circle cx={CX} cy={CY} r={R_OUTER} fill="none" stroke="#334155" strokeWidth={1} />
      <circle cx={CX} cy={CY} r={R_ZODIAC_IN} fill="none" stroke="#334155" strokeWidth={1} />

      {ZODIAC_SIGNS.map((sign) => {
        const startAngle = toAngle(sign.degreesStart, ascLong)
        const endAngle = toAngle(sign.degreesEnd, ascLong)
        const midAngle = (startAngle + endAngle) / 2
        const color = ELEMENT_COLORS[sign.element]
        const mid = polar(CX, CY, (R_OUTER + R_ZODIAC_IN) / 2, midAngle)
        const lineStart = polar(CX, CY, R_ZODIAC_IN, startAngle)
        const lineEnd = polar(CX, CY, R_OUTER, startAngle)

        return (
          <g key={sign.id}>
            {/* Sign arc background */}
            <path
              d={`${arcPath(CX, CY, R_OUTER, startAngle, endAngle)} L ${polar(CX, CY, R_ZODIAC_IN, endAngle).x} ${polar(CX, CY, R_ZODIAC_IN, endAngle).y} ${arcPath(CX, CY, R_ZODIAC_IN, endAngle, startAngle).replace('M', 'L')} Z`}
              fill={color}
              fillOpacity={0.12}
              stroke="none"
            />
            {/* Division line */}
            <line
              x1={lineStart.x} y1={lineStart.y}
              x2={lineEnd.x} y2={lineEnd.y}
              stroke="#475569" strokeWidth={0.5}
            />
            {/* Sign glyph */}
            <text
              x={mid.x} y={mid.y}
              textAnchor="middle" dominantBaseline="central"
              fill={color} fontSize={16} fontWeight="bold"
              style={{ filter: `drop-shadow(0 0 3px ${color}80)` }}
            >
              {sign.symbol}
            </text>
          </g>
        )
      })}
    </g>
  )
}

function DegreeMarkers({ ascLong }: { ascLong: number }) {
  const ticks = []
  for (let deg = 0; deg < 360; deg++) {
    const angle = toAngle(deg, ascLong)
    const isMajor = deg % 10 === 0
    const is5 = deg % 5 === 0
    const innerR = isMajor ? R_OUTER - 8 : is5 ? R_OUTER - 5 : R_OUTER - 3
    const p1 = polar(CX, CY, innerR, angle)
    const p2 = polar(CX, CY, R_OUTER, angle)
    ticks.push(
      <line
        key={deg}
        x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke={isMajor ? '#64748B' : '#334155'}
        strokeWidth={isMajor ? 0.8 : 0.3}
      />
    )
  }
  return <g className="degree-markers">{ticks}</g>
}

function HouseLines({
  chart,
  ascLong,
}: {
  chart: NatalChart
  ascLong: number
}) {
  if (!chart.houses) return null

  return (
    <g className="house-lines">
      <circle cx={CX} cy={CY} r={R_HOUSES_IN} fill="none" stroke="#1E293B" strokeWidth={0.5} />
      {chart.houses.map((h) => {
        const angle = toAngle(h.cusp.longitude, ascLong)
        const inner = polar(CX, CY, 30, angle)
        const outer = polar(CX, CY, R_ZODIAC_IN, angle)
        const isAngle = [1, 4, 7, 10].includes(h.house.number)
        // House number label
        const nextHouse = chart.houses![(h.house.number) % 12]
        const nextAngle = toAngle(nextHouse.cusp.longitude, ascLong)
        let midAngle = (angle + nextAngle) / 2
        // Handle wrap-around
        if (Math.abs(angle - nextAngle) > 180) {
          midAngle = midAngle + 180
        }
        const labelPos = polar(CX, CY, R_HOUSE_NUM, midAngle)

        return (
          <g key={h.house.number}>
            <line
              x1={inner.x} y1={inner.y}
              x2={outer.x} y2={outer.y}
              stroke={isAngle ? '#94A3B8' : '#334155'}
              strokeWidth={isAngle ? 1.5 : 0.5}
            />
            <text
              x={labelPos.x} y={labelPos.y}
              textAnchor="middle" dominantBaseline="central"
              fill="#64748B" fontSize={10}
            >
              {h.house.number}
            </text>
          </g>
        )
      })}
    </g>
  )
}

function AngleLabels({ chart, ascLong }: { chart: NatalChart; ascLong: number }) {
  if (!chart.ascendant) return null
  const angles = [
    { label: 'ASC', pos: chart.ascendant },
    { label: 'DC', pos: chart.descendant },
    { label: 'MC', pos: chart.midheaven },
    { label: 'IC', pos: chart.imumCoeli },
  ]

  return (
    <g className="angle-labels">
      {angles.map((a) => {
        if (!a.pos) return null
        const angle = toAngle(a.pos.longitude, ascLong)
        const p = polar(CX, CY, R_OUTER + 18, angle)
        return (
          <text
            key={a.label}
            x={p.x} y={p.y}
            textAnchor="middle" dominantBaseline="central"
            fill="#F8FAFC" fontSize={11} fontWeight="bold"
            style={{ filter: 'drop-shadow(0 0 4px #3B82F680)' }}
          >
            {a.label}
          </text>
        )
      })}
    </g>
  )
}

/** Spread planets that are too close together */
function spreadPlanets(
  planets: PlanetPosition[],
  ascLong: number,
  radius: number,
  minSeparation: number = 14
): Array<{ planet: PlanetPosition; x: number; y: number; angle: number }> {
  const items = planets.map((p) => ({
    planet: p,
    angle: toAngle(p.position.longitude, ascLong),
  }))

  // Sort by angle
  items.sort((a, b) => a.angle - b.angle)

  // Push apart overlapping ones
  for (let pass = 0; pass < 5; pass++) {
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        let diff = items[j].angle - items[i].angle
        if (diff < 0) diff += 360
        if (diff > 180) diff = 360 - diff
        const needed = minSeparation * (180 / (Math.PI * radius))
        if (diff < needed) {
          const push = (needed - diff) / 2 + 0.5
          items[i].angle -= push
          items[j].angle += push
        }
      }
    }
  }

  return items.map((item) => {
    const pos = polar(CX, CY, radius, item.angle)
    return { planet: item.planet, x: pos.x, y: pos.y, angle: item.angle }
  })
}

function PlanetGlyphs({
  chart,
  ascLong,
  onHover,
  onLeave,
}: {
  chart: NatalChart
  ascLong: number
  onHover: (data: TooltipData) => void
  onLeave: () => void
}) {
  const mainPlanets = chart.planets.filter(
    (p) => !['northNode', 'southNode', 'lilith'].includes(p.planet.id)
  )
  const spread = useMemo(() => spreadPlanets(mainPlanets, ascLong, R_PLANET), [mainPlanets, ascLong])

  return (
    <g className="planet-glyphs">
      {spread.map(({ planet: pos, x, y }) => {
        const glyph = PLANET_GLYPHS[pos.planet.id] || '?'
        const tipText = `${pos.planet.name} ${pos.position.formatted}${pos.house ? ` • House ${pos.house}` : ''}${pos.retrograde ? ' ℞' : ''}${pos.dignity !== 'neutral' ? ` (${pos.dignity})` : ''}`

        return (
          <g
            key={pos.planet.id}
            onMouseEnter={(e) => onHover({ x: e.clientX, y: e.clientY, content: tipText })}
            onMouseLeave={onLeave}
            style={{ cursor: 'pointer' }}
          >
            {/* Glow background */}
            <circle cx={x} cy={y} r={12} fill="#0F172A" fillOpacity={0.8} />
            <circle cx={x} cy={y} r={12} fill="none" stroke="#334155" strokeWidth={0.5} />
            {/* Planet glyph */}
            <text
              x={x} y={y}
              textAnchor="middle" dominantBaseline="central"
              fill="#E2E8F0" fontSize={14}
              style={{ filter: 'drop-shadow(0 0 3px #60A5FA80)' }}
            >
              {glyph}
            </text>
            {/* Retrograde indicator */}
            {pos.retrograde && (
              <text
                x={x + 10} y={y - 8}
                textAnchor="middle" dominantBaseline="central"
                fill="#F97316" fontSize={7} fontWeight="bold"
              >
                Rx
              </text>
            )}
            {/* Line from planet to its true position on zodiac ring */}
            {(() => {
              const trueAngle = toAngle(pos.position.longitude, ascLong)
              const ringPos = polar(CX, CY, R_ZODIAC_IN - 2, trueAngle)
              return (
                <line
                  x1={x} y1={y}
                  x2={ringPos.x} y2={ringPos.y}
                  stroke="#475569" strokeWidth={0.4} strokeDasharray="2,2"
                />
              )
            })()}
          </g>
        )
      })}
    </g>
  )
}

function AspectLines({
  chart,
  ascLong,
  onHover,
  onLeave,
}: {
  chart: NatalChart
  ascLong: number
  onHover: (data: TooltipData) => void
  onLeave: () => void
}) {
  // Build planet longitude lookup
  const longitudes = useMemo(() => {
    const map: Record<string, number> = {}
    chart.planets.forEach((p) => { map[p.planet.id] = p.position.longitude })
    return map
  }, [chart.planets])

  // Only show major aspects
  const majorAspects = chart.aspects.filter(
    (a) => a.aspect.nature.startsWith('major')
  )

  return (
    <g className="aspect-lines">
      {majorAspects.map((asp, i) => {
        const l1 = longitudes[asp.planet1]
        const l2 = longitudes[asp.planet2]
        if (l1 === undefined || l2 === undefined) return null

        const a1 = toAngle(l1, ascLong)
        const a2 = toAngle(l2, ascLong)
        const p1 = polar(CX, CY, R_ASPECT, a1)
        const p2 = polar(CX, CY, R_ASPECT, a2)
        const color = ASPECT_COLORS[asp.aspect.name] || '#64748B'
        const maxOrb = asp.aspect.orb
        const tightness = 1 - asp.orb / maxOrb
        const opacity = 0.25 + tightness * 0.65
        const width = 0.5 + tightness * 2
        const isOpposition = asp.aspect.name === 'Opposition'

        const tipText = `${asp.aspect.name} ${asp.aspect.symbol}: ${asp.planet1} — ${asp.planet2} (orb ${asp.orb.toFixed(1)}°${asp.applying ? ', applying' : ', separating'})`

        return (
          <line
            key={`${asp.planet1}-${asp.planet2}-${i}`}
            x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
            stroke={color}
            strokeWidth={width}
            strokeOpacity={opacity}
            strokeDasharray={isOpposition ? '6,3' : 'none'}
            style={{ filter: tightness > 0.7 ? `drop-shadow(0 0 2px ${color}60)` : undefined, cursor: 'pointer' }}
            onMouseEnter={(e) => onHover({ x: e.clientX, y: e.clientY, content: tipText })}
            onMouseLeave={onLeave}
          />
        )
      })}
    </g>
  )
}

// ─── Sidebar components ──────────────────────────────────────────────

function PlanetTable({ chart }: { chart: NatalChart }) {
  const sorted = [...chart.planets]
    .filter((p) => !['northNode', 'southNode', 'lilith'].includes(p.planet.id))
    .sort((a, b) => {
      const order = { luminary: 0, personal: 1, social: 2, transpersonal: 3, point: 4 }
      return order[a.planet.type] - order[b.planet.type]
    })

  return (
    <div className="text-xs">
      <h4 className="text-sm font-semibold mb-2 text-slate-200">Planets</h4>
      <table className="w-full">
        <thead>
          <tr className="text-slate-500 border-b border-slate-800">
            <th className="text-left py-1 font-medium">Planet</th>
            <th className="text-left py-1 font-medium">Position</th>
            {chart.hasBirthTime && <th className="text-center py-1 font-medium">House</th>}
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => (
            <tr key={p.planet.id} className="border-b border-slate-800/50">
              <td className="py-1">
                <span className="mr-1">{PLANET_GLYPHS[p.planet.id]}</span>
                <span className="text-slate-300">{p.planet.name}</span>
                {p.retrograde && <span className="text-orange-400 ml-1 text-[10px]">Rx</span>}
              </td>
              <td className="py-1 text-slate-400 font-mono text-[11px]">{p.position.formatted}</td>
              {chart.hasBirthTime && (
                <td className="py-1 text-center text-slate-500">{p.house || '—'}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AspectTable({ chart }: { chart: NatalChart }) {
  const majors = [...chart.aspects]
    .filter((a) => a.aspect.nature.startsWith('major'))
    .sort((a, b) => a.orb - b.orb)
    .slice(0, 15)

  return (
    <div className="text-xs mt-4">
      <h4 className="text-sm font-semibold mb-2 text-slate-200">Aspects</h4>
      <div className="space-y-0.5">
        {majors.map((asp, i) => {
          const color = ASPECT_COLORS[asp.aspect.name] || '#64748B'
          return (
            <div key={i} className="flex items-center gap-1.5 py-0.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="text-slate-400 truncate">
                {asp.planet1} {asp.aspect.symbol} {asp.planet2}
              </span>
              <span className="text-slate-600 ml-auto font-mono">{asp.orb.toFixed(1)}°</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AspectLegend() {
  const items = [
    { name: 'Conjunction', color: '#FFD700', dash: false },
    { name: 'Trine', color: '#22C55E', dash: false },
    { name: 'Sextile', color: '#60A5FA', dash: false },
    { name: 'Square', color: '#EF4444', dash: false },
    { name: 'Opposition', color: '#EF4444', dash: true },
  ]
  return (
    <div className="text-xs mt-4">
      <h4 className="text-sm font-semibold mb-2 text-slate-200">Legend</h4>
      <div className="space-y-1">
        {items.map((it) => (
          <div key={it.name} className="flex items-center gap-2">
            <svg width={20} height={8}>
              <line
                x1={0} y1={4} x2={20} y2={4}
                stroke={it.color} strokeWidth={2}
                strokeDasharray={it.dash ? '4,2' : 'none'}
              />
            </svg>
            <span className="text-slate-400">{it.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────

export interface NatalChartWheelProps {
  chart: NatalChart
  className?: string
}

export function NatalChartWheel({ chart, className }: NatalChartWheelProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)

  const ascLong = chart.ascendant?.longitude ?? 0

  return (
    <div className={cn('natal-chart-wheel relative', className)}>
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* SVG Chart */}
        <div className="relative flex-shrink-0">
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            width={SIZE}
            height={SIZE}
            className="w-full max-w-[600px] h-auto"
            style={{ background: 'radial-gradient(circle at 50% 50%, #0F172A 0%, #020617 100%)' }}
          >
            {/* Background glow */}
            <defs>
              <radialGradient id="centerGlow">
                <stop offset="0%" stopColor="#1E293B" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#020617" stopOpacity={0} />
              </radialGradient>
            </defs>
            <circle cx={CX} cy={CY} r={R_HOUSES_IN} fill="url(#centerGlow)" />

            <DegreeMarkers ascLong={ascLong} />
            <ZodiacRing ascLong={ascLong} />
            <HouseLines chart={chart} ascLong={ascLong} />
            <AspectLines
              chart={chart}
              ascLong={ascLong}
              onHover={setTooltip}
              onLeave={() => setTooltip(null)}
            />
            <PlanetGlyphs
              chart={chart}
              ascLong={ascLong}
              onHover={setTooltip}
              onLeave={() => setTooltip(null)}
            />
            <AngleLabels chart={chart} ascLong={ascLong} />
          </svg>

          {/* Tooltip */}
          {tooltip && (
            <div
              className="fixed z-50 pointer-events-none bg-slate-900 border border-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-md shadow-lg max-w-xs"
              style={{ left: tooltip.x + 12, top: tooltip.y - 8 }}
            >
              {tooltip.content}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-64 bg-slate-950/80 border border-slate-800 rounded-lg p-4 overflow-y-auto max-h-[600px]">
          {/* Angles */}
          {chart.ascendant && (
            <div className="text-xs mb-4">
              <h4 className="text-sm font-semibold mb-2 text-slate-200">Angles</h4>
              <div className="grid grid-cols-2 gap-1 text-slate-400">
                <div><span className="text-slate-200 font-medium">ASC</span> {chart.ascendant.formatted}</div>
                {chart.midheaven && <div><span className="text-slate-200 font-medium">MC</span> {chart.midheaven.formatted}</div>}
                {chart.descendant && <div><span className="text-slate-200 font-medium">DC</span> {chart.descendant.formatted}</div>}
                {chart.imumCoeli && <div><span className="text-slate-200 font-medium">IC</span> {chart.imumCoeli.formatted}</div>}
              </div>
            </div>
          )}

          <PlanetTable chart={chart} />
          <AspectTable chart={chart} />
          <AspectLegend />
        </div>
      </div>
    </div>
  )
}
