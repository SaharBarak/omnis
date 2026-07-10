'use client'

import { SealIcon } from './SealIcon'
import type { Kin, SealNumber } from '@pleiad/engine/core/types'
import { kinToSeal, kinToTone } from '@pleiad/engine/calculations/dreamspell'
import { calculateOracle } from '@pleiad/engine/calculations/oracle'
import { getSeal } from '@pleiad/engine/data/seals'
import { getTone } from '@pleiad/engine/data/tones'
import { cn } from '@/lib/utils'

// Color map for seal color families
const SEAL_COLOR_MAP = {
  red: { bg: 'bg-red-500/15', border: 'border-red-500/40', glow: 'shadow-red-500/30', text: 'text-red-400' },
  white: { bg: 'bg-white/10', border: 'border-white/40', glow: 'shadow-white/30', text: 'text-white/90' },
  blue: { bg: 'bg-blue-500/15', border: 'border-blue-500/40', glow: 'shadow-blue-500/30', text: 'text-blue-400' },
  yellow: { bg: 'bg-yellow-500/15', border: 'border-yellow-500/40', glow: 'shadow-yellow-500/30', text: 'text-yellow-400' },
} as const

export interface OracleMapProps {
  kin: Kin
  animated?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

interface OraclePositionProps {
  sealNumber: SealNumber
  label: string
  position: 'guide' | 'analog' | 'antipode' | 'occult' | 'center'
  delay?: number
  size?: 'sm' | 'md' | 'lg'
}

function OraclePosition({ sealNumber, label, position, delay = 0, size = 'md' }: OraclePositionProps) {
  const seal = getSeal(sealNumber)
  const colors = SEAL_COLOR_MAP[seal.color]
  const isCenter = position === 'center'

  const sizeClasses = {
    sm: isCenter ? 'w-16 h-16' : 'w-12 h-12',
    md: isCenter ? 'w-24 h-24' : 'w-16 h-16',
    lg: isCenter ? 'w-32 h-32' : 'w-20 h-20',
  }

  const iconSize = isCenter
    ? (size === 'sm' ? 'md' : size === 'md' ? 'lg' : 'xl')
    : (size === 'sm' ? 'sm' : size === 'md' ? 'md' : 'lg')

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-1 oracle-position',
        'animate-in fade-in zoom-in-95',
      )}
      style={{ animationDelay: `${delay}ms`, animationDuration: '600ms', animationFillMode: 'both' }}
    >
      <div
        className={cn(
          'rounded-full flex items-center justify-center border-2 transition-all duration-500',
          colors.bg, colors.border,
          isCenter && `shadow-lg ${colors.glow} ring-1 ring-white/10`,
          !isCenter && 'hover:scale-110 hover:shadow-md',
          sizeClasses[size],
        )}
      >
        <SealIcon sealNumber={sealNumber} size={iconSize as any} />
      </div>
      {!isCenter && (
        <div className="text-center">
          <span className={cn('text-[10px] font-semibold uppercase tracking-wider', colors.text)}>
            {label}
          </span>
        </div>
      )}
      {isCenter && (
        <span className={cn('text-xs font-bold', colors.text)}>
          {seal.english}
        </span>
      )}
    </div>
  )
}

export function OracleMap({ kin, animated = true, size = 'md', className = '' }: OracleMapProps) {
  const seal: SealNumber = kinToSeal(kin)
  const tone = kinToTone(kin)
  const oracle = calculateOracle(kin)
  const sealData = getSeal(seal)
  const toneData = getTone(tone)
  const centerColors = SEAL_COLOR_MAP[sealData.color]

  return (
    <div
      className={cn('oracle-map relative', className)}
      role="img"
      aria-label={`Oracle cross for Kin ${kin}: ${toneData.name} ${sealData.english}`}
    >
      {/* Cross connecting lines */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className={cn('absolute w-px h-full', centerColors.bg)} style={{ opacity: 0.4 }} />
        <div className={cn('absolute h-px w-full', centerColors.bg)} style={{ opacity: 0.4 }} />
      </div>

      <div className="grid grid-cols-3 grid-rows-3 gap-2 place-items-center w-fit mx-auto">
        {/* Row 1: Guide (top center) */}
        <div className="col-start-2 row-start-1">
          <OraclePosition
            sealNumber={oracle.guide}
            label="Guide"
            position="guide"
            delay={animated ? 100 : 0}
            size={size}
          />
        </div>

        {/* Row 2: Antipode (left), Kin (center), Analog (right) */}
        <div className="col-start-1 row-start-2">
          <OraclePosition
            sealNumber={oracle.antipode}
            label="Antipode"
            position="antipode"
            delay={animated ? 200 : 0}
            size={size}
          />
        </div>

        <div className="col-start-2 row-start-2">
          <OraclePosition
            sealNumber={seal}
            label={sealData.english}
            position="center"
            delay={animated ? 0 : 0}
            size={size}
          />
        </div>

        <div className="col-start-3 row-start-2">
          <OraclePosition
            sealNumber={oracle.analog}
            label="Analog"
            position="analog"
            delay={animated ? 300 : 0}
            size={size}
          />
        </div>

        {/* Row 3: Occult (bottom center) */}
        <div className="col-start-2 row-start-3">
          <OraclePosition
            sealNumber={oracle.occult}
            label="Occult"
            position="occult"
            delay={animated ? 400 : 0}
            size={size}
          />
        </div>
      </div>
    </div>
  )
}
