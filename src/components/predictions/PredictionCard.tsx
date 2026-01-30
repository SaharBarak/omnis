'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { IntensityBadge } from './IntensityBadge'
import type { PredictionEvent, DailyPrediction } from '@/lib/types/prediction'
import { cn } from '@/lib/utils'

interface PredictionCardProps {
  prediction: DailyPrediction
  showEvents?: boolean
  compact?: boolean
  onClick?: () => void
  className?: string
}

const colorClasses: Record<string, string> = {
  red: 'bg-red-500 text-white',
  white: 'bg-gray-100 text-gray-900 border border-gray-300',
  blue: 'bg-blue-500 text-white',
  yellow: 'bg-yellow-400 text-gray-900',
}

export function PredictionCard({
  prediction,
  showEvents = true,
  compact = false,
  onClick,
  className,
}: PredictionCardProps) {
  const dateFormatted = new Date(prediction.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cn(
          'p-3 rounded-lg text-center transition-all hover:scale-105 hover:bg-muted/50',
          className
        )}
      >
        <p className="text-xs text-muted-foreground mb-1">
          {new Date(prediction.date).toLocaleDateString('en-US', { weekday: 'short' })}
        </p>
        <p className="text-sm font-medium mb-2">
          {new Date(prediction.date).getDate()}
        </p>
        <div
          className={cn(
            'w-10 h-10 mx-auto rounded-lg flex items-center justify-center text-sm font-bold',
            colorClasses[prediction.color]
          )}
        >
          {prediction.kin}
        </div>
        <p className="text-xs mt-1 truncate">{prediction.sealName}</p>
        {prediction.events.length > 0 && (
          <div className="mt-1 flex justify-center">
            <IntensityBadge intensity={prediction.intensity} size="sm" showLabel={false} />
          </div>
        )}
      </button>
    )
  }

  return (
    <Card className={cn('overflow-hidden', className)} onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{dateFormatted}</CardTitle>
            <CardDescription>Kin {prediction.kin}</CardDescription>
          </div>
          {prediction.events.length > 0 && (
            <IntensityBadge intensity={prediction.intensity} />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Kin Display */}
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold shadow-lg',
              colorClasses[prediction.color]
            )}
          >
            {prediction.kin}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold">
              {prediction.toneName} {prediction.sealName}
            </h3>
            <p className="text-sm text-muted-foreground">
              Day {prediction.wavespell.day} of {prediction.wavespell.name} Wavespell
            </p>
            <p className="text-sm text-muted-foreground">
              Theme: {prediction.wavespell.role}
            </p>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="grid gap-3 md:grid-cols-2">
          {/* Wavespell Progress */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between text-sm mb-1">
              <span>{prediction.wavespell.name}</span>
              <span className="text-muted-foreground">
                Day {prediction.wavespell.day}/13
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(prediction.wavespell.day / 13) * 100}%` }}
              />
            </div>
          </div>

          {/* Castle Progress */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between text-sm mb-1">
              <span>{prediction.castle.name}</span>
              <span className="text-muted-foreground">
                Day {prediction.castle.day}/52
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(prediction.castle.day / 52) * 100}%`,
                  backgroundColor: prediction.colorHex,
                }}
              />
            </div>
          </div>
        </div>

        {/* Events */}
        {showEvents && prediction.events.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Events</h4>
            {prediction.events.map((event, index) => (
              <EventCard key={index} event={event} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface EventCardProps {
  event: PredictionEvent
  className?: string
}

export function EventCard({ event, className }: EventCardProps) {
  return (
    <div
      className={cn(
        'p-3 rounded-lg border bg-card',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h5 className="font-medium">{event.title}</h5>
            <IntensityBadge intensity={event.intensity} size="sm" />
          </div>
          <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
        </div>
      </div>
      {event.themes.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {event.themes.map((theme, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {theme}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
