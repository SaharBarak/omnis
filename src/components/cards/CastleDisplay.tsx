'use client'

import type { Kin } from '@/core/types'
import {
  kinToCastle,
  getCastleWavespellDetails,
  getAllCastles,
  type Castle,
} from '@/lib/calculations/cycles'
import { kinToWavespellNumber } from '@/lib/calculations/wavespell'
import { cn } from '@/lib/utils'

const CASTLE_COLORS: Record<string, string> = {
  red: 'bg-red-500/20 border-red-500',
  white: 'bg-white border-gray-300 dark:bg-gray-100/20',
  blue: 'bg-blue-500/20 border-blue-500',
  yellow: 'bg-yellow-500/20 border-yellow-500',
  green: 'bg-green-500/20 border-green-500',
}

const CASTLE_TEXT_COLORS: Record<string, string> = {
  red: 'text-red-700 dark:text-red-400',
  white: 'text-gray-700 dark:text-gray-300',
  blue: 'text-blue-700 dark:text-blue-400',
  yellow: 'text-yellow-700 dark:text-yellow-400',
  green: 'text-green-700 dark:text-green-400',
}

const CASTLE_NAMES_HEBREW: Record<number, string> = {
  1: 'טירת הסיבוב',
  2: 'טירת המעבר',
  3: 'טירת הבעירה',
  4: 'טירת הנתינה',
  5: 'טירת הקסם',
}

export interface CastleDisplayProps {
  kin: Kin
  showAllCastles?: boolean
  className?: string
}

export function CastleDisplay({
  kin,
  showAllCastles = false,
  className = '',
}: CastleDisplayProps) {
  const currentCastle = kinToCastle(kin)
  const currentWavespell = kinToWavespellNumber(kin)
  const castles = showAllCastles ? getAllCastles() : [currentCastle]

  return (
    <div className={cn('castle-display', className)} dir="rtl">
      {showAllCastles && (
        <h3 className="text-lg font-semibold text-center mb-4">
          חמש הטירות / The Five Castles
        </h3>
      )}

      <div className={cn(
        'grid gap-3',
        showAllCastles ? 'grid-cols-5' : 'grid-cols-1'
      )}>
        {castles.map((castle) => {
          const isCurrent = castle.number === currentCastle.number
          const wavespells = getCastleWavespellDetails(castle.number)

          return (
            <div
              key={castle.number}
              className={cn(
                'p-3 rounded-lg border-2 transition-all',
                CASTLE_COLORS[castle.color],
                isCurrent && 'ring-2 ring-primary ring-offset-2'
              )}
            >
              <div className="text-center">
                <span className={cn(
                  'font-bold text-lg',
                  CASTLE_TEXT_COLORS[castle.color]
                )}>
                  {CASTLE_NAMES_HEBREW[castle.number]}
                </span>
                <p className="text-sm text-muted-foreground">
                  {castle.name}
                </p>
              </div>

              {!showAllCastles && (
                <>
                  <p className="text-sm text-center mt-2 text-muted-foreground">
                    {castle.theme}
                  </p>

                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-2 text-center">
                      גלים {castle.wavespells[0]}-{castle.wavespells[3]} /
                      Wavespells {castle.wavespells[0]}-{castle.wavespells[3]}
                    </p>

                    <div className="grid grid-cols-4 gap-1">
                      {wavespells.map((ws) => {
                        const isCurrentWs = ws.number === currentWavespell
                        return (
                          <div
                            key={ws.number}
                            className={cn(
                              'p-1 rounded text-center text-xs',
                              isCurrentWs
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted/50'
                            )}
                          >
                            {ws.number}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="mt-3 text-center text-sm">
                    <span className="text-muted-foreground">קין </span>
                    <span className="font-semibold">{kin}</span>
                    <span className="text-muted-foreground"> — יום </span>
                    <span className="font-semibold">{kin - castle.startKin + 1}</span>
                    <span className="text-muted-foreground"> מתוך 52</span>
                  </div>
                </>
              )}

              {showAllCastles && (
                <div className="text-center mt-2">
                  <span className="text-xs text-muted-foreground">
                    קין {castle.startKin}-{castle.endKin}
                  </span>
                  {isCurrent && (
                    <p className="text-xs text-primary font-medium mt-1">
                      ← אתה פה
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Mini version for inline display
export interface CastleMiniProps {
  kin: Kin
  className?: string
}

export function CastleMini({ kin, className = '' }: CastleMiniProps) {
  const castle = kinToCastle(kin)
  const position = kin - castle.startKin + 1

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <div
        className={cn(
          'w-3 h-3 rounded-full',
          castle.color === 'red' && 'bg-red-500',
          castle.color === 'white' && 'bg-gray-300 dark:bg-gray-500',
          castle.color === 'blue' && 'bg-blue-500',
          castle.color === 'yellow' && 'bg-yellow-500',
          castle.color === 'green' && 'bg-green-500'
        )}
      />
      <span className="text-sm">
        <span className="font-medium">{CASTLE_NAMES_HEBREW[castle.number]}</span>
        <span className="text-muted-foreground mx-1">•</span>
        <span>{position}/52</span>
      </span>
    </div>
  )
}
