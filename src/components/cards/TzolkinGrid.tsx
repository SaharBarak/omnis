'use client'

import { useMemo } from 'react'
import { asKin, type Kin } from '@/core/types'
import { kinToSeal, kinToTone } from '@/lib/calculations/dreamspell'
import { getSeal } from '@/lib/data/seals'
import { SealIcon } from './SealIcon'
import { cn } from '@/lib/utils'

const COLOR_CLASSES = {
  red: { bg: 'bg-red-500/20', border: 'border-red-500/40', text: 'text-red-300', glow: 'shadow-red-500/50' },
  white: { bg: 'bg-white/10', border: 'border-white/30', text: 'text-white/80', glow: 'shadow-white/40' },
  blue: { bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-300', glow: 'shadow-blue-500/50' },
  yellow: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', text: 'text-yellow-300', glow: 'shadow-yellow-500/50' },
} as const

export interface TzolkinGridProps {
  /** The kin to highlight on the grid */
  highlightKin?: Kin
  /** Additional kins to mark (e.g. oracle positions) */
  markedKins?: Kin[]
  /** Compact mode for smaller displays */
  compact?: boolean
  className?: string
}

/**
 * Full 260-day Tzolkin calendar grid (13 tones × 20 seals).
 * Columns = tones 1–13, rows = seals 1–20.
 * Kin number flows: seal 1 tone 1 = kin 1, seal 2 tone 1 = kin 2, ... seal 20 tone 1 = kin 20, seal 1 tone 2 = kin 21, etc.
 * But actually in the Tzolkin, kin flows: kin 1 = seal 1 tone 1, kin 2 = seal 2 tone 2, kin 3 = seal 3 tone 3...
 * The grid position: row = (kin-1) % 20, col = (kin-1) % 13
 */
export function TzolkinGrid({ highlightKin, markedKins = [], compact = false, className = '' }: TzolkinGridProps) {
  // Build the 13×20 grid
  const grid = useMemo(() => {
    // grid[row][col] = kin number, where row = seal (0-19), col = tone (0-12)
    const cells: (Kin | null)[][] = Array.from({ length: 20 }, () => Array(13).fill(null))

    for (let k = 1; k <= 260; k++) {
      const row = (k - 1) % 20  // seal index
      const col = (k - 1) % 13  // tone index
      cells[row][col] = asKin(k)
    }

    return cells
  }, [])

  const markedSet = useMemo(() => new Set(markedKins), [markedKins])

  const sealLabels = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => getSeal(i + 1 as any)),
    []
  )

  return (
    <div className={cn('tzolkin-grid', className)}>
      <div className="text-center mb-3">
        <h3 className="text-lg font-bold text-foreground">Tzolkin · 260-Day Sacred Calendar</h3>
        <p className="text-xs text-muted-foreground">13 Tones × 20 Seals</p>
      </div>

      <div className="overflow-x-auto">
        <div className={cn('inline-grid gap-px', compact ? 'text-[8px]' : 'text-[9px]')}
          style={{ gridTemplateColumns: `auto repeat(13, ${compact ? '28px' : '36px'})` }}
        >
          {/* Header row: tone numbers */}
          <div className="w-8" /> {/* empty corner */}
          {Array.from({ length: 13 }, (_, t) => (
            <div key={`tone-${t}`} className="text-center text-[10px] font-bold text-muted-foreground py-1">
              {t + 1}
            </div>
          ))}

          {/* Grid rows */}
          {grid.map((row, sealIdx) => {
            const seal = sealLabels[sealIdx]
            return (
              <div key={`row-${sealIdx}`} className="contents">
                {/* Seal label */}
                <div className="flex items-center justify-center w-8 h-full">
                  <SealIcon sealNumber={seal.number} size="xs" />
                </div>

                {/* Kin cells */}
                {row.map((kinNum, toneIdx) => {
                  if (!kinNum) return <div key={`empty-${toneIdx}`} />
                  const sealNum = kinToSeal(kinNum)
                  const sealData = getSeal(sealNum)
                  const color = sealData.color
                  const isHighlight = highlightKin === kinNum
                  const isMarked = markedSet.has(kinNum)
                  const colors = COLOR_CLASSES[color]

                  return (
                    <div
                      key={kinNum}
                      className={cn(
                        'flex flex-col items-center justify-center rounded-sm transition-all duration-200',
                        compact ? 'h-6' : 'h-8',
                        colors.bg,
                        isHighlight && [
                          'ring-2 ring-primary scale-110 z-10 shadow-lg',
                          colors.glow,
                          'animate-pulse',
                        ],
                        isMarked && !isHighlight && [
                          'ring-1',
                          colors.border,
                        ],
                        !isHighlight && !isMarked && 'hover:brightness-150 hover:scale-105',
                      )}
                      title={`Kin ${kinNum} - ${sealData.english} (Tone ${toneIdx + 1})`}
                    >
                      <span className={cn(
                        'font-mono leading-none tabular-nums',
                        isHighlight ? 'font-bold text-white' : colors.text,
                      )}>
                        {kinNum}
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
        {(['red', 'white', 'blue', 'yellow'] as const).map(color => (
          <div key={color} className="flex items-center gap-1">
            <div className={cn('w-3 h-3 rounded-sm', COLOR_CLASSES[color].bg, 'border', COLOR_CLASSES[color].border)} />
            <span className="capitalize">{color}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
