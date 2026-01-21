'use client'

import { cn } from '@/lib/utils'
import {
  calculatePersonalMayanDates,
  formatLongCount,
  HISTORICAL_DATES,
  type PersonalMayanDates,
  type TunBirthday,
  type KatunBirthday,
  type CalendarRoundReturn,
} from '@/lib/calculations/long-count'

export interface MayanTimelineDisplayProps {
  birthDateStr: string
  showTunBirthdays?: boolean
  showKatunBirthdays?: boolean
  showCalendarRoundReturn?: boolean
  maxTunBirthdays?: number
  className?: string
}

export function MayanTimelineDisplay({
  birthDateStr,
  showTunBirthdays = true,
  showKatunBirthdays = true,
  showCalendarRoundReturn = true,
  maxTunBirthdays = 5,
  className = '',
}: MayanTimelineDisplayProps) {
  const dates = calculatePersonalMayanDates(birthDateStr)

  // Get future tun birthdays only
  const futureTunBirthdays = dates.tunBirthdays
    .filter(t => t.isFuture)
    .slice(0, maxTunBirthdays)

  return (
    <div className={cn('mayan-timeline-display', className)} dir="rtl">
      {/* Header */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">
          לוח זמנים מאיה / Mayan Timeline
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          תאריכים מיוחדים בחייך
        </p>
      </div>

      {/* Birth Info */}
      <div className="bg-primary/10 rounded-lg p-4 mb-4">
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-1">
            לידה / Birth
          </div>
          <div className="text-lg font-mono font-bold">
            {formatLongCount(dates.birth.longCount)}
          </div>
          <div className="text-sm mt-2">
            {dates.birth.calendarRound.formatted}
          </div>
          <div className="text-xs text-muted-foreground">
            {dates.birth.calendarRound.formattedHebrew}
          </div>
        </div>
      </div>

      {/* Tun Birthdays (360-day cycles) */}
      {showTunBirthdays && futureTunBirthdays.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            ימי הולדת טון / Tun Birthdays
            <span className="text-xs text-muted-foreground font-normal">(כל 360 ימים)</span>
          </h4>
          <div className="space-y-2">
            {futureTunBirthdays.map((tun) => (
              <TunBirthdayCard key={tun.tunNumber} tun={tun} />
            ))}
          </div>
        </div>
      )}

      {/* Katun Birthdays (7,200-day cycles) */}
      {showKatunBirthdays && dates.katunBirthdays.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500"></span>
            ימי הולדת קאטון / K'atun Birthdays
            <span className="text-xs text-muted-foreground font-normal">(~19.7 שנים)</span>
          </h4>
          <div className="space-y-2">
            {dates.katunBirthdays.map((katun) => (
              <KatunBirthdayCard key={katun.katunNumber} katun={katun} />
            ))}
          </div>
        </div>
      )}

      {/* Calendar Round Return */}
      {showCalendarRoundReturn && dates.nextCalendarRoundReturn && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            חזרת מעגל לוח השנה / Calendar Round Return
            <span className="text-xs text-muted-foreground font-normal">(~52 שנים)</span>
          </h4>
          <CalendarRoundReturnCard crReturn={dates.nextCalendarRoundReturn} />
        </div>
      )}
    </div>
  )
}

// Sub-components

interface TunBirthdayCardProps {
  tun: TunBirthday
}

function TunBirthdayCard({ tun }: TunBirthdayCardProps) {
  return (
    <div className={cn(
      'flex items-center justify-between p-2 rounded border',
      tun.isFuture ? 'bg-muted/30' : 'bg-muted/10 opacity-60'
    )}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          טון {tun.tunNumber}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatLongCount(tun.longCount)}
        </span>
      </div>
      <div className="text-sm">
        {formatDateHebrew(tun.gregorianDate)}
      </div>
    </div>
  )
}

interface KatunBirthdayCardProps {
  katun: KatunBirthday
}

function KatunBirthdayCard({ katun }: KatunBirthdayCardProps) {
  return (
    <div className={cn(
      'p-3 rounded-lg border',
      katun.isFuture ? 'bg-purple-500/10 border-purple-500/30' : 'bg-muted/10 opacity-60'
    )}>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold">
            קאטון {katun.katunNumber}
          </span>
          <span className="text-xs text-muted-foreground mr-2">
            (גיל ~{katun.ageAtKatun})
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          {katun.isFuture ? 'עתידי' : 'עבר'}
        </div>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-xs font-mono">
          {formatLongCount(katun.longCount)}
        </span>
        <span className="text-xs text-muted-foreground">•</span>
        <span className="text-sm">
          {formatDateHebrew(katun.gregorianDate)}
        </span>
      </div>
    </div>
  )
}

interface CalendarRoundReturnCardProps {
  crReturn: CalendarRoundReturn
}

function CalendarRoundReturnCard({ crReturn }: CalendarRoundReturnCardProps) {
  return (
    <div className="p-3 rounded-lg border bg-amber-500/10 border-amber-500/30">
      <div className="text-center">
        <div className="text-sm font-medium">
          בגיל {crReturn.yearsFromBirth} שנים
        </div>
        <div className="text-lg font-semibold mt-1">
          {formatDateHebrew(crReturn.gregorianDate)}
        </div>
        <div className="text-xs font-mono text-muted-foreground mt-1">
          {formatLongCount(crReturn.longCount)}
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          אותו מעגל לוח שנה כמו יום הלידה
        </div>
      </div>
    </div>
  )
}

// Helper to format date in Hebrew-friendly format
function formatDateHebrew(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const hebrewMonths = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ]
  return `${day} ב${hebrewMonths[month - 1]} ${year}`
}

// Historical dates display component
export interface HistoricalDatesDisplayProps {
  className?: string
}

export function HistoricalDatesDisplay({ className = '' }: HistoricalDatesDisplayProps) {
  return (
    <div className={cn('historical-dates-display', className)} dir="rtl">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">
          תאריכים היסטוריים / Historical Dates
        </h3>
      </div>

      <div className="space-y-3">
        {HISTORICAL_DATES.map((date) => (
          <div
            key={date.gregorian}
            className="p-3 rounded-lg border bg-muted/30"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">
                {date.significanceHebrew}
              </div>
              <div className="text-xs text-muted-foreground">
                {date.gregorian}
              </div>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {date.significance}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Long Count: </span>
                <span className="font-mono">{date.longCount}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Tzolkin: </span>
                <span>{date.tzolkin}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Compact timeline for person cards
export interface MayanTimelineMiniProps {
  birthDateStr: string
  className?: string
}

export function MayanTimelineMini({ birthDateStr, className = '' }: MayanTimelineMiniProps) {
  const dates = calculatePersonalMayanDates(birthDateStr)

  // Get next tun birthday
  const nextTun = dates.tunBirthdays.find(t => t.isFuture)

  // Get next katun birthday
  const nextKatun = dates.katunBirthdays.find(k => k.isFuture)

  return (
    <div className={cn('mayan-timeline-mini text-sm', className)} dir="rtl">
      <div className="flex flex-wrap gap-3">
        {/* Birth Long Count */}
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">לידה:</span>
          <span className="font-mono text-xs">
            {formatLongCount(dates.birth.longCount)}
          </span>
        </div>

        {/* Next Tun */}
        {nextTun && (
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="text-muted-foreground">טון הבא:</span>
            <span className="text-xs">{nextTun.gregorianDate}</span>
          </div>
        )}

        {/* Next Katun */}
        {nextKatun && (
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            <span className="text-muted-foreground">קאטון הבא:</span>
            <span className="text-xs">{nextKatun.gregorianDate}</span>
          </div>
        )}

        {/* CR Return */}
        {dates.nextCalendarRoundReturn && (
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="text-muted-foreground">חזרת מעגל:</span>
            <span className="text-xs">{dates.nextCalendarRoundReturn.gregorianDate}</span>
          </div>
        )}
      </div>
    </div>
  )
}
