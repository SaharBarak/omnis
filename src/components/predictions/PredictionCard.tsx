'use client'

import type { PredictionEvent, DailyPrediction } from '@pleiad/engine/types/prediction'
import { IntensityBadge } from './IntensityBadge'
import { sealTileClasses } from './seal-style'
import { Eyebrow, MeterBar, getFlavor } from '@/components/app-kit'
import { SEAL_COLORS, toSealColor } from '@/components/app-kit/seal-colors'
import { cn } from '@/lib/utils'

interface PredictionCardProps {
  prediction: DailyPrediction
  showEvents?: boolean
  compact?: boolean
  onClick?: () => void
  className?: string
}

export function PredictionCard({
  prediction,
  showEvents = true,
  compact = false,
  onClick,
  className,
}: PredictionCardProps) {
  const flavor = getFlavor('dreamspell')
  const dateFormatted = new Date(prediction.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
  const seal = toSealColor(prediction.color)

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cn(
          'rounded-xl border border-transparent p-3 text-center',
          'transition-colors hover:border-white/[0.12] active:scale-[0.98]',
          className
        )}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/35">
          {new Date(prediction.date).toLocaleDateString('en-US', { weekday: 'short' })}
        </p>
        <p className="mb-2 font-mono text-sm text-white/90 [font-variant-numeric:tabular-nums]">
          {new Date(prediction.date).getDate()}
        </p>
        <div
          className={cn(
            'mx-auto flex size-10 items-center justify-center rounded-lg',
            'font-mono text-sm [font-variant-numeric:tabular-nums]',
            sealTileClasses(prediction.color)
          )}
        >
          {prediction.kin}
        </div>
        <p className="mt-1 truncate text-[10px] text-white/50">{prediction.sealName}</p>
        {prediction.events.length > 0 && (
          <div className="mt-1 flex justify-center">
            <IntensityBadge intensity={prediction.intensity} size="sm" showLabel={false} />
          </div>
        )}
      </button>
    )
  }

  return (
    <div className={cn('surface-card p-6', className)} onClick={onClick}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Eyebrow accent={flavor.accent}>{dateFormatted}</Eyebrow>
          <span className="font-mono text-xs text-white/50 [font-variant-numeric:tabular-nums]">
            Kin {prediction.kin}
          </span>
        </div>
        {prediction.events.length > 0 && (
          <IntensityBadge intensity={prediction.intensity} />
        )}
      </div>

      {/* Main kin display */}
      <div className="mt-4 flex items-start gap-4">
        <div
          className={cn(
            'flex size-16 shrink-0 items-center justify-center rounded-xl',
            'font-mono text-2xl [font-variant-numeric:tabular-nums]',
            sealTileClasses(prediction.color)
          )}
        >
          {prediction.kin}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-xl font-semibold tracking-tight text-white/90">
            {prediction.toneName} {prediction.sealName}
          </h3>
          <p className="mt-1 text-sm text-white/70">
            Day {prediction.wavespell.day} of {prediction.wavespell.name} Wavespell
          </p>
          <p className="text-sm text-white/50">{prediction.wavespell.role}</p>
        </div>
      </div>

      {/* Cycle progress */}
      <div className="mt-5 flex flex-col gap-3">
        <MeterBar
          label={prediction.wavespell.name}
          value={prediction.wavespell.day}
          max={13}
          accent={flavor.accent}
          displayValue={`${prediction.wavespell.day}/13`}
        />
        <MeterBar
          label={prediction.castle.name}
          value={prediction.castle.day}
          max={52}
          accent={seal ? SEAL_COLORS[seal].css : flavor.accent}
          displayValue={`${prediction.castle.day}/52`}
        />
      </div>

      {/* Events — hairline-divided rows, never nested boxes */}
      {showEvents && prediction.events.length > 0 && (
        <div className="mt-5 border-t border-white/[0.07] pt-4">
          <Eyebrow>Events</Eyebrow>
          <div className="mt-1 divide-y divide-white/[0.07]">
            {prediction.events.map((event, index) => (
              <EventCard key={index} event={event} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface EventCardProps {
  event: PredictionEvent
  className?: string
}

export function EventCard({ event, className }: EventCardProps) {
  return (
    <div className={cn('py-3', className)}>
      <div className="flex items-center gap-2">
        <h5 className="text-sm font-medium text-white/90">{event.title}</h5>
        <IntensityBadge intensity={event.intensity} size="sm" />
      </div>
      <p className="mt-1 text-sm text-white/70">{event.description}</p>
      {event.themes.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {event.themes.map((theme, i) => (
            <span
              key={i}
              className="rounded-full border border-white/15 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-white/50"
            >
              {theme}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
