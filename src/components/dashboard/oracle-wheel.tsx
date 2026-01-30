'use client'

import { useMemo } from 'react'
import { getSeal } from '@/lib/data/seals'

interface OracleWheelProps {
  kin: number
  sealNumber: number
  size?: 'sm' | 'md' | 'lg'
  showGuides?: boolean
  className?: string
}

// Seal color mapping for the four directions
const SEAL_COLORS: Record<string, string> = {
  red: '#C75B3A',     // Terracotta red
  white: '#E8E4DB',   // Warm white
  blue: '#4A6FA5',    // Deep blue
  yellow: '#D4A84B',  // Amber yellow
}

// Get color family for a seal number
function getSealColor(sealNum: number): string {
  const colorIndex = (sealNum - 1) % 4
  const colors = ['red', 'white', 'blue', 'yellow']
  return colors[colorIndex]
}

export function OracleWheel({ kin, sealNumber, size = 'md', showGuides = false, className = '' }: OracleWheelProps) {
  const seal = useMemo(() => getSeal(sealNumber), [sealNumber])
  const sealColor = getSealColor(sealNumber)

  const dimensions = {
    sm: { outer: 80, inner: 50, center: 28, iconSize: 20 },
    md: { outer: 140, inner: 90, center: 50, iconSize: 36 },
    lg: { outer: 200, inner: 130, center: 72, iconSize: 52 },
  }

  const d = dimensions[size]
  const cx = d.outer / 2
  const cy = d.outer / 2

  // Calculate oracle positions (for larger sizes)
  const oraclePositions = showGuides ? [
    { angle: -90, label: 'Guide' },   // Top
    { angle: 0, label: 'Analog' },    // Right
    { angle: 180, label: 'Antipode' }, // Left
    { angle: 90, label: 'Occult' },   // Bottom
  ] : []

  return (
    <div className={`relative ${className}`} style={{ width: d.outer, height: d.outer }} role="img" aria-label={`Kin ${kin}, ${seal.english} seal`}>
      <svg viewBox={`0 0 ${d.outer} ${d.outer}`} className="w-full h-full" aria-hidden="true">
        <defs>
          {/* Gradient for outer ring */}
          <linearGradient id={`outerGrad-${kin}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={SEAL_COLORS[sealColor]} stopOpacity="0.2" />
            <stop offset="100%" stopColor={SEAL_COLORS[sealColor]} stopOpacity="0.05" />
          </linearGradient>

          {/* Radial gradient for center */}
          <radialGradient id={`centerGrad-${kin}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={SEAL_COLORS[sealColor]} stopOpacity="0.9" />
            <stop offset="100%" stopColor={SEAL_COLORS[sealColor]} stopOpacity="0.7" />
          </radialGradient>

          {/* Glow filter */}
          <filter id={`glow-${kin}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer ring with sacred geometry pattern */}
        <circle
          cx={cx}
          cy={cy}
          r={(d.outer - 4) / 2}
          fill="none"
          stroke={SEAL_COLORS[sealColor]}
          strokeWidth="1"
          strokeOpacity="0.3"
        />

        {/* Middle ring */}
        <circle
          cx={cx}
          cy={cy}
          r={d.inner / 2}
          fill={`url(#outerGrad-${kin})`}
          stroke={SEAL_COLORS[sealColor]}
          strokeWidth="1"
          strokeOpacity="0.4"
        />

        {/* Inner sacred geometry - four directional lines */}
        <g stroke={SEAL_COLORS[sealColor]} strokeWidth="0.5" strokeOpacity="0.3">
          <line x1={cx} y1={cy - d.inner / 2} x2={cx} y2={cy + d.inner / 2} />
          <line x1={cx - d.inner / 2} y1={cy} x2={cx + d.inner / 2} y2={cy} />
          {/* Diagonal lines */}
          <line
            x1={cx - d.inner / 2 * 0.7}
            y1={cy - d.inner / 2 * 0.7}
            x2={cx + d.inner / 2 * 0.7}
            y2={cy + d.inner / 2 * 0.7}
          />
          <line
            x1={cx + d.inner / 2 * 0.7}
            y1={cy - d.inner / 2 * 0.7}
            x2={cx - d.inner / 2 * 0.7}
            y2={cy + d.inner / 2 * 0.7}
          />
        </g>

        {/* Center circle with seal */}
        <circle
          cx={cx}
          cy={cy}
          r={d.center / 2}
          fill={`url(#centerGrad-${kin})`}
          filter={`url(#glow-${kin})`}
        />

        {/* Oracle guide labels for large size */}
        {showGuides && oraclePositions.map((pos, i) => {
          const radians = (pos.angle * Math.PI) / 180
          const labelRadius = (d.outer - 12) / 2
          const x = cx + Math.cos(radians) * labelRadius
          const y = cy + Math.sin(radians) * labelRadius

          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[8px] fill-muted-foreground uppercase tracking-wider"
            >
              {pos.label}
            </text>
          )
        })}
      </svg>

      {/* Center seal icon */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          left: cx - d.iconSize / 2,
          top: cy - d.iconSize / 2,
          width: d.iconSize,
          height: d.iconSize,
        }}
      >
        <img
          src={`/icons/dreamspell/seals/${String(seal.number).padStart(2, '0')}-${seal.mayan.toLowerCase()}.svg`}
          alt={seal.english}
          className="w-full h-full drop-shadow-md"
          style={{
            filter: sealColor === 'white' || sealColor === 'yellow'
              ? 'brightness(0.3)'
              : 'brightness(1)'
          }}
        />
      </div>

      {/* Kin number badge */}
      <div
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-xs font-mono font-bold"
        style={{
          backgroundColor: SEAL_COLORS[sealColor],
          color: sealColor === 'white' || sealColor === 'yellow' ? '#2D2519' : '#F7F4EF',
        }}
      >
        {kin}
      </div>
    </div>
  )
}

// Mini version for list items
export function OracleWheelMini({ sealNumber, className = '' }: { sealNumber: number; className?: string }) {
  const seal = useMemo(() => getSeal(sealNumber), [sealNumber])
  const sealColor = getSealColor(sealNumber)

  return (
    <div
      className={`w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden ${className}`}
      style={{ backgroundColor: `${SEAL_COLORS[sealColor]}15` }}
      role="img"
      aria-label={`${seal.english} seal`}
    >
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(circle at center, ${SEAL_COLORS[sealColor]}40 0%, transparent 70%)`
        }}
      />
      <img
        src={`/icons/dreamspell/seals/${String(seal.number).padStart(2, '0')}-${seal.mayan.toLowerCase()}.svg`}
        alt={seal.english}
        className="w-6 h-6 relative z-10"
      />
    </div>
  )
}
