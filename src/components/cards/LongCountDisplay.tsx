'use client'

import {
  dateToLongCount,
  formatLongCount,
  getLongCountData,
  daysSinceCreation,
  type LongCount,
  type LongCountData,
} from '@pleiad/engine/calculations/long-count'
import { cn } from '@/lib/utils'

export interface LongCountDisplayProps {
  dateStr: string
  showLabels?: boolean
  showDaysSinceCreation?: boolean
  showCalendarRound?: boolean
  compact?: boolean
  className?: string
}

// Long Count unit names
const UNIT_NAMES: Record<keyof LongCount, string> = {
  baktun: "B'ak'tun",
  katun: "K'atun",
  tun: 'Tun',
  winal: 'Winal',
  kin: "K'in",
}

const UNIT_ORDER: (keyof LongCount)[] = ['baktun', 'katun', 'tun', 'winal', 'kin']

export function LongCountDisplay({
  dateStr,
  showLabels = true,
  showDaysSinceCreation = true,
  showCalendarRound = true,
  compact = false,
  className = '',
}: LongCountDisplayProps) {
  const data = getLongCountData(dateStr)

  return (
    <div className={cn('long-count-display', className)}>
      {/* Header */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">
          Long Count Date
        </h3>
      </div>

      {/* Main Long Count Display */}
      <div className="bg-muted/30 rounded-lg p-4">
        {/* Formatted Long Count */}
        <div className="text-center text-2xl font-display font-bold mb-4 tracking-wider">
          {formatLongCount(data.longCount)}
        </div>

        {/* Unit Breakdown */}
        {showLabels && (
          <div className={cn(
            'grid gap-2 text-center',
            compact ? 'grid-cols-5' : 'grid-cols-5'
          )}>
            {UNIT_ORDER.map((unit) => (
              <div key={unit} className="flex flex-col items-center">
                <span className={cn(
                  'font-semibold',
                  compact ? 'text-lg' : 'text-xl'
                )}>
                  {data.longCount[unit]}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  {UNIT_NAMES[unit]}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Days Since Creation */}
        {showDaysSinceCreation && (
          <div className="mt-4 pt-4 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">{data.daysSinceCreation.toLocaleString()}</span>
              <span className="mx-1">days since creation</span>
            </p>
          </div>
        )}
      </div>

      {/* Calendar Round */}
      {showCalendarRound && (
        <div className="mt-4 bg-accent/10 rounded-lg p-3">
          <div className="text-center">
            <p className="text-sm font-medium">
              Calendar Round
            </p>
            <p className="text-lg font-semibold mt-1">
              {data.calendarRound.formatted}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// Mini version for inline display
export interface LongCountMiniProps {
  dateStr: string
  className?: string
}

export function LongCountMini({ dateStr, className = '' }: LongCountMiniProps) {
  const lc = dateToLongCount(dateStr)

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <span className="text-sm font-medium">
        {formatLongCount(lc)}
      </span>
    </div>
  )
}

// Baktun progress bar showing position within current baktun
export interface BaktunProgressProps {
  dateStr: string
  className?: string
}

export function BaktunProgress({ dateStr, className = '' }: BaktunProgressProps) {
  const data = getLongCountData(dateStr)
  const lc = data.longCount

  // Days into current baktun
  const daysIntoBaktun =
    lc.katun * 7200 +
    lc.tun * 360 +
    lc.winal * 20 +
    lc.kin

  // Baktun is 144,000 days
  const percentage = (daysIntoBaktun / 144000) * 100

  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>Baktun {lc.baktun}</span>
        <span>{percentage.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-center text-xs text-muted-foreground mt-1">
        {daysIntoBaktun.toLocaleString()} / 144,000 days
      </div>
    </div>
  )
}

// Haab date display
export interface HaabDisplayProps {
  dateStr: string
  showMonthIndex?: boolean
  className?: string
}

export function HaabDisplay({ dateStr, showMonthIndex = false, className = '' }: HaabDisplayProps) {
  const data = getLongCountData(dateStr)
  const { haab } = data

  return (
    <div className={cn('haab-display text-center', className)}>
      <div className="text-sm text-muted-foreground mb-1">
        Haab&apos;
      </div>
      <div className="text-lg font-semibold">
        {haab.day} {haab.monthName}
      </div>
      {showMonthIndex && (
        <div className="text-xs text-muted-foreground mt-1">
          Month {haab.month + 1}
        </div>
      )}
    </div>
  )
}

// Calendar Round display (Tzolkin + Haab combined)
export interface CalendarRoundDisplayProps {
  dateStr: string
  className?: string
}

export function CalendarRoundDisplay({ dateStr, className = '' }: CalendarRoundDisplayProps) {
  const data = getLongCountData(dateStr)
  const { tzolkin, haab, calendarRound } = data

  return (
    <div className={cn('calendar-round-display', className)}>
      <div className="text-center mb-3">
        <h4 className="text-sm font-medium text-muted-foreground">
          Calendar Round
        </h4>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Tzolkin Section */}
        <div className="bg-muted/30 rounded-lg p-3 text-center">
          <div className="text-xs text-muted-foreground mb-1">
            Tzolk&apos;in
          </div>
          <div className="text-lg font-semibold">
            {tzolkin.tone} {tzolkin.daySign.yucatec}
          </div>
          <div className="text-sm text-muted-foreground">
            ({tzolkin.daySign.english})
          </div>
        </div>

        {/* Haab Section */}
        <div className="bg-muted/30 rounded-lg p-3 text-center">
          <div className="text-xs text-muted-foreground mb-1">
            Haab&apos;
          </div>
          <div className="text-lg font-semibold">
            {haab.day} {haab.monthName}
          </div>
        </div>
      </div>

      {/* Combined Format */}
      <div className="mt-3 text-center text-sm">
        <span className="font-medium">{calendarRound.formatted}</span>
      </div>
    </div>
  )
}
