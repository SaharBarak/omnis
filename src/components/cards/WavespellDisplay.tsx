'use client'

import { SealIcon } from './SealIcon'
import { asTone, type Kin, type ToneNumber } from '@/core/types'
import { kinToSeal, kinToTone } from '@/lib/calculations/dreamspell'
import {
  kinToWavespell,
  getWavespellKins,
  getWavespellRole,
  type Wavespell,
} from '@/lib/calculations/wavespell'
import { getSeal } from '@/lib/data/seals'
import { getTone } from '@/lib/data/tones'
import { cn } from '@/lib/utils'

export interface WavespellDisplayProps {
  kin: Kin
  showLabels?: boolean
  highlightCurrent?: boolean
  compact?: boolean
  className?: string
}

export function WavespellDisplay({
  kin,
  showLabels = true,
  highlightCurrent = true,
  compact = false,
  className = '',
}: WavespellDisplayProps) {
  const wavespell = kinToWavespell(kin)
  const wavespellKins = getWavespellKins(wavespell.number)
  const currentPosition = kinToTone(kin)
  const wavespellSeal = getSeal(wavespell.sealNumber)

  return (
    <div className={cn('wavespell-display', className)}>
      {/* Wavespell Header */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">
          {wavespellSeal.english} Wavespell (גל ה{wavespellSeal.hebrew})
        </h3>
        <p className="text-sm text-muted-foreground">
          Kin {wavespell.startKin}-{wavespell.endKin}
        </p>
      </div>

      {/* Wavespell Visualization */}
      <div className={cn(
        'grid gap-2',
        compact ? 'grid-cols-13' : 'grid-cols-7'
      )}>
        {wavespellKins.map((wsKin, index) => {
          const position = asTone(index + 1)
          const seal = kinToSeal(wsKin)
          const tone = getTone(position)
          const role = getWavespellRole(position)
          const isCurrent = highlightCurrent && wsKin === kin
          const isCenter = position === 7

          return (
            <div
              key={wsKin}
              className={cn(
                'flex flex-col items-center p-2 rounded-lg transition-colors',
                isCurrent && 'bg-primary/20 ring-2 ring-primary',
                isCenter && !isCurrent && 'bg-accent/10',
                !isCurrent && !isCenter && 'hover:bg-muted/50'
              )}
            >
              <SealIcon sealNumber={seal} size={compact ? 'sm' : 'md'} />

              <span className={cn(
                'mt-1 font-semibold',
                compact ? 'text-xs' : 'text-sm'
              )}>
                {position}
              </span>

              {showLabels && !compact && (
                <>
                  <span className="text-xs text-muted-foreground mt-0.5">
                    {tone.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {role}
                  </span>
                </>
              )}

              {isCurrent && (
                <span className="text-xs text-primary font-medium mt-1">
                  You are here →
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      {showLabels && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>
            Position {currentPosition}: {getWavespellRole(currentPosition)}
          </p>
        </div>
      )}
    </div>
  )
}

// Mini version for inline display
export interface WavespellMiniProps {
  kin: Kin
  className?: string
}

export function WavespellMini({ kin, className = '' }: WavespellMiniProps) {
  const wavespell = kinToWavespell(kin)
  const wavespellSeal = getSeal(wavespell.sealNumber)
  const position = kinToTone(kin)
  const role = getWavespellRole(position)

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <SealIcon sealNumber={wavespell.sealNumber} size="sm" />
      <div className="text-sm">
        <span className="font-medium">{wavespellSeal.english}</span>
        <span className="text-muted-foreground mx-1">•</span>
        <span>{position}/13</span>
        <span className="text-muted-foreground mx-1">•</span>
        <span className="text-muted-foreground">{role}</span>
      </div>
    </div>
  )
}

// Horizontal bar version showing progress through wavespell
export interface WavespellProgressProps {
  kin: Kin
  className?: string
}

export function WavespellProgress({ kin, className = '' }: WavespellProgressProps) {
  const wavespell = kinToWavespell(kin)
  const wavespellSeal = getSeal(wavespell.sealNumber)
  const position = kinToTone(kin)
  const percentage = ((position - 1) / 12) * 100

  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>Kin {wavespell.startKin}</span>
        <span>Kin {wavespell.endKin}</span>
      </div>
      <div
        className="h-2 bg-muted rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={position}
        aria-valuemin={1}
        aria-valuemax={13}
        aria-label={`Progress through ${wavespellSeal.english} Wavespell: Day ${position} of 13`}
      >
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-center text-xs text-muted-foreground mt-1" aria-hidden="true">
        Day {position} of 13
      </div>
    </div>
  )
}
