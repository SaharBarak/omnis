'use client'

import { cn } from '@/lib/utils'
import {
  calculateNatalChart,
  formatPlanetPosition,
  getChartSummary,
} from '@/lib/calculations/astrology'
import type {
  NatalChart,
  PlanetPosition,
  AspectInstance,
  ZodiacSign,
  Element,
  Modality,
} from '@/lib/types/astrology'
import {
  ELEMENT_LABELS,
  MODALITY_LABELS,
} from '@/lib/types/astrology'
import { getAspectColor } from '@/lib/data/aspects'

// Props for the main display
export interface AstrologyDisplayProps {
  date: string
  time?: string
  latitude: number
  longitude: number
  showPlanets?: boolean
  showAspects?: boolean
  showBalance?: boolean
  compact?: boolean
  className?: string
}

// Props for chart summary card
export interface ChartSummaryCardProps {
  chart: NatalChart
  showBalance?: boolean
  className?: string
}

// Props for planet positions list
export interface PlanetPositionsProps {
  planets: readonly PlanetPosition[]
  showHouses?: boolean
  compact?: boolean
  className?: string
}

// Props for aspects display
export interface AspectsDisplayProps {
  aspects: readonly AspectInstance[]
  compact?: boolean
  className?: string
}

// Element balance bar component
function ElementBar({ element, percentage }: { element: Element; percentage: number }) {
  const label = ELEMENT_LABELS[element]
  const colors: Record<Element, string> = {
    fire: 'bg-red-500',
    earth: 'bg-amber-600',
    air: 'bg-sky-400',
    water: 'bg-blue-600',
  }

  return (
    <div className="flex items-center gap-2">
      <span className="w-6 text-center">{label.emoji}</span>
      <span className="text-sm text-muted-foreground w-12">{label.labelHebrew}</span>
      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', colors[element])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm text-muted-foreground w-10 text-left">{percentage}%</span>
    </div>
  )
}

// Chart Summary Card Component
export function ChartSummaryCard({
  chart,
  showBalance = true,
  className = '',
}: ChartSummaryCardProps) {
  const summary = getChartSummary(chart)

  const getSun = chart.planets.find(p => p.planet.id === 'sun')
  const getMoon = chart.planets.find(p => p.planet.id === 'moon')

  return (
    <div className={cn('chart-summary-card bg-card border rounded-lg p-4', className)}>
      {/* Big Three */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold mb-3">
          Big Three (הסימנים הגדולים)
        </h3>

        <div className="grid grid-cols-3 gap-4">
          {/* Sun Sign */}
          <div className="flex flex-col items-center">
            <span className="text-3xl">{chart.sunSign.symbol}</span>
            <span className="font-semibold">{chart.sunSign.name}</span>
            <span className="text-sm text-muted-foreground">Sun ({chart.sunSign.hebrew})</span>
          </div>

          {/* Moon Sign */}
          <div className="flex flex-col items-center">
            <span className="text-3xl">{chart.moonSign.symbol}</span>
            <span className="font-semibold">{chart.moonSign.name}</span>
            <span className="text-sm text-muted-foreground">Moon ({chart.moonSign.hebrew})</span>
          </div>

          {/* Rising Sign */}
          <div className="flex flex-col items-center">
            {chart.risingSign ? (
              <>
                <span className="text-3xl">{chart.risingSign.symbol}</span>
                <span className="font-semibold">{chart.risingSign.name}</span>
              </>
            ) : (
              <>
                <span className="text-3xl text-muted-foreground">?</span>
                <span className="text-muted-foreground">Unknown</span>
              </>
            )}
            <span className="text-sm text-muted-foreground">Rising ({chart.risingSign?.hebrew || 'עולה'})</span>
          </div>
        </div>
      </div>

      {/* Element Balance */}
      {showBalance && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3 text-center">
            Element Balance (איזון אלמנטים)
          </h4>
          <div className="space-y-2">
            {(['fire', 'earth', 'air', 'water'] as Element[]).map(element => (
              <ElementBar
                key={element}
                element={element}
                percentage={chart.elementBalance[element]}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Mini version for compact display
export function ChartSummaryMini({
  chart,
  className = '',
}: {
  chart: NatalChart
  className?: string
}) {
  return (
    <div className={cn('chart-summary-mini flex items-center gap-2', className)}>
      <div className="flex items-center gap-1">
        <span className="text-lg" title={chart.sunSign.name}>{chart.sunSign.symbol}</span>
        <span>/</span>
        <span className="text-lg" title={chart.moonSign.name}>{chart.moonSign.symbol}</span>
        {chart.risingSign && (
          <>
            <span>/</span>
            <span className="text-lg" title={chart.risingSign.name}>{chart.risingSign.symbol}</span>
          </>
        )}
      </div>
      <span className="text-sm text-muted-foreground">
        {chart.sunSign.name}
      </span>
    </div>
  )
}

// Planet Positions List
export function PlanetPositions({
  planets,
  showHouses = true,
  compact = false,
  className = '',
}: PlanetPositionsProps) {
  // Filter to show main planets first, then points
  const sortedPlanets = [...planets].sort((a, b) => {
    const typeOrder = { luminary: 0, personal: 1, social: 2, transpersonal: 3, point: 4 }
    return typeOrder[a.planet.type] - typeOrder[b.planet.type]
  })

  return (
    <div className={cn('planet-positions', className)}>
      <h4 className="text-sm font-medium mb-3 text-center">
        Planetary Positions (מיקומי כוכבים)
      </h4>

      <div className={cn(
        'grid gap-2',
        compact ? 'grid-cols-2' : 'grid-cols-1'
      )}>
        {sortedPlanets.map(pos => (
          <div
            key={pos.planet.id}
            className={cn(
              'flex items-center justify-between p-2 rounded-md bg-muted/30',
              pos.retrograde && 'border border-orange-500/50'
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg w-6 text-center">{pos.planet.symbol}</span>
              <span className="font-medium">{pos.planet.name}</span>
              {pos.retrograde && (
                <span className="text-xs text-orange-500" title="Retrograde">℞</span>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="font-mono">{pos.position.formatted}</span>
              {showHouses && pos.house && (
                <span className="text-muted-foreground">
                  House {pos.house}
                </span>
              )}
              {pos.dignity !== 'neutral' && (
                <span className={cn(
                  'text-xs px-1 rounded',
                  pos.dignity === 'domicile' && 'bg-green-500/20 text-green-600',
                  pos.dignity === 'exaltation' && 'bg-blue-500/20 text-blue-600',
                  pos.dignity === 'detriment' && 'bg-red-500/20 text-red-600',
                  pos.dignity === 'fall' && 'bg-orange-500/20 text-orange-600',
                )}>
                  {pos.dignity}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Aspects Display
export function AspectsDisplay({
  aspects,
  compact = false,
  className = '',
}: AspectsDisplayProps) {
  if (aspects.length === 0) {
    return (
      <div className={cn('aspects-display text-center text-muted-foreground', className)}>
        No aspects found (לא נמצאו אספקטים)
      </div>
    )
  }

  // Sort by orb (tighter aspects first)
  const sortedAspects = [...aspects].sort((a, b) => a.orb - b.orb)

  // Only show first 10 in compact mode
  const displayAspects = compact ? sortedAspects.slice(0, 10) : sortedAspects

  return (
    <div className={cn('aspects-display', className)}>
      <h4 className="text-sm font-medium mb-3 text-center">
        Aspects (אספקטים)
      </h4>

      <div className={cn(
        'space-y-1',
        compact && 'text-sm'
      )}>
        {displayAspects.map((asp, idx) => {
          const planet1 = asp.planet1.charAt(0).toUpperCase() + asp.planet1.slice(1)
          const planet2 = asp.planet2.charAt(0).toUpperCase() + asp.planet2.slice(1)

          return (
            <div
              key={`${asp.planet1}-${asp.planet2}-${asp.aspect.name}-${idx}`}
              className="flex items-center justify-between p-2 rounded-md bg-muted/30"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: getAspectColor(asp.aspect) }}
                />
                <span>{asp.aspect.symbol}</span>
                <span>{asp.aspect.name}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">
                  {planet1} — {planet2}
                </span>
                <span className="font-mono text-xs">
                  ({asp.orb.toFixed(1)}°)
                </span>
              </div>
            </div>
          )
        })}

        {compact && sortedAspects.length > 10 && (
          <div className="text-center text-muted-foreground text-sm pt-2">
            +{sortedAspects.length - 10} more aspects
          </div>
        )}
      </div>
    </div>
  )
}

// Main Astrology Display Component
export function AstrologyDisplay({
  date,
  time,
  latitude,
  longitude,
  showPlanets = true,
  showAspects = true,
  showBalance = true,
  compact = false,
  className = '',
}: AstrologyDisplayProps) {
  const chart = calculateNatalChart({
    date,
    time,
    latitude,
    longitude,
  })

  return (
    <div className={cn('astrology-display space-y-4', className)}>
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold">
          Natal Chart (מפת לידה)
        </h3>
        {!chart.hasBirthTime && (
          <p className="text-sm text-muted-foreground">
            Without birth time - calculated at 12:00
          </p>
        )}
      </div>

      {/* Chart Summary */}
      <ChartSummaryCard chart={chart} showBalance={showBalance} />

      {/* Planet Positions */}
      {showPlanets && (
        <div className="bg-card border rounded-lg p-4">
          <PlanetPositions
            planets={chart.planets}
            showHouses={chart.hasBirthTime}
            compact={compact}
          />
        </div>
      )}

      {/* Aspects */}
      {showAspects && chart.aspects.length > 0 && (
        <div className="bg-card border rounded-lg p-4">
          <AspectsDisplay aspects={chart.aspects} compact={compact} />
        </div>
      )}

      {/* Angular Points (if birth time available) */}
      {chart.hasBirthTime && chart.ascendant && chart.midheaven && (
        <div className="bg-card border rounded-lg p-4">
          <h4 className="text-sm font-medium mb-3 text-center">
            Angular Points (נקודות זוויתיות)
          </h4>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <span className="text-muted-foreground block text-sm">ASC (Ascendant)</span>
              <span className="font-medium">{chart.ascendant.formatted}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-sm">MC (Midheaven)</span>
              <span className="font-medium">{chart.midheaven.formatted}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Export a mini display for person cards
export function AstrologyMini({
  date,
  latitude = 0,
  longitude = 0,
  className = '',
}: {
  date: string
  latitude?: number
  longitude?: number
  className?: string
}) {
  const chart = calculateNatalChart({ date, latitude, longitude })

  return (
    <div className={cn('astrology-mini', className)}>
      <div className="flex items-center justify-center gap-3">
        <div className="text-center">
          <span className="text-2xl">{chart.sunSign.symbol}</span>
          <span className="block text-xs text-muted-foreground">
            {chart.sunSign.name}
          </span>
        </div>
        <div className="text-center">
          <span className="text-2xl">{chart.moonSign.symbol}</span>
          <span className="block text-xs text-muted-foreground">
            {chart.moonSign.name}
          </span>
        </div>
      </div>
    </div>
  )
}
