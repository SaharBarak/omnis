'use client'

import type { PersonalTimeline, TimelineMilestone } from '@pleiad/engine/types/prediction'
import { IntensityBadge } from './IntensityBadge'
import { Eyebrow } from '@/components/app-kit'
import { SEAL_COLORS } from '@/components/app-kit/seal-colors'
import { cn } from '@/lib/utils'

interface PredictionTimelineProps {
  timeline: PersonalTimeline
  maxItems?: number
  showPast?: boolean
  className?: string
}

export function PredictionTimeline({
  timeline,
  maxItems = 10,
  showPast = false,
  className,
}: PredictionTimelineProps) {
  // Combine all milestones and sort by date
  const allMilestones: TimelineMilestone[] = [
    ...timeline.milestones,
    ...timeline.galacticReturns,
    ...timeline.tunBirthdays,
    ...timeline.katunBirthdays,
    ...(timeline.nextCalendarRoundReturn ? [timeline.nextCalendarRoundReturn] : []),
  ]
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter((m) => showPast || m.isFuture)
    .slice(0, maxItems)

  return (
    <div className={cn('surface-card p-6', className)}>
      <div className="flex flex-col gap-1">
        <Eyebrow>Timeline</Eyebrow>
        <h3 className="font-display text-lg font-semibold tracking-tight text-white/90">
          Upcoming milestones for {timeline.personName}
        </h3>
      </div>

      <div className="relative mt-6">
        {/* Timeline line */}
        <div className="absolute bottom-0 left-4 top-0 w-px bg-white/[0.07]" />

        <div className="space-y-6">
          {allMilestones.map((milestone) => (
            <TimelineItem key={`${milestone.type}-${milestone.date}`} milestone={milestone} />
          ))}

          {allMilestones.length === 0 && (
            <p className="py-4 text-sm text-white/50">
              No upcoming milestones found.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

interface TimelineItemProps {
  milestone: TimelineMilestone
}

function TimelineItem({ milestone }: TimelineItemProps) {
  const dateFormatted = new Date(milestone.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="relative flex gap-4 pl-10">
      {/* Timeline dot */}
      <div
        className={cn(
          'absolute left-2 flex size-5 items-center justify-center rounded-full',
          'font-mono text-[9px] uppercase',
          getTypeClasses(milestone.type)
        )}
      >
        {getTypeGlyph(milestone.type)}
      </div>

      <div className="flex-1 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium text-white/90">{milestone.title}</h4>
              <IntensityBadge intensity={milestone.intensity} size="sm" />
            </div>
            <p className="mt-0.5 font-mono text-xs text-white/50 [font-variant-numeric:tabular-nums]">
              {dateFormatted}
            </p>
          </div>
          {milestone.daysUntil !== undefined && milestone.isFuture && (
            <span className="whitespace-nowrap font-mono text-xs text-white/35 [font-variant-numeric:tabular-nums]">
              {milestone.daysUntil === 0
                ? 'Today'
                : milestone.daysUntil === 1
                ? 'Tomorrow'
                : `in ${milestone.daysUntil} days`}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-white/70">{milestone.description}</p>
      </div>
    </div>
  )
}

function getTypeGlyph(type: string): string {
  switch (type) {
    case 'return':
      return 'R'
    case 'yearly-kin':
      return 'Y'
    case 'calendar-round':
      return 'CR'
    case 'katun-birthday':
      return 'K'
    case 'tun-birthday':
      return 'T'
    case 'wavespell':
      return 'W'
    case 'castle':
      return 'C'
    default:
      return '·'
  }
}

/** Milestone families read through the seal tokens (kit seal-colors). */
function getTypeClasses(type: string): string {
  switch (type) {
    case 'return':
    case 'calendar-round':
      return `${SEAL_COLORS.red.bg} text-white`
    case 'yearly-kin':
    case 'katun-birthday':
      return `${SEAL_COLORS.yellow.bg} text-ground`
    case 'tun-birthday':
      return `${SEAL_COLORS.blue.bg} text-white`
    case 'wavespell':
    case 'castle':
      return 'bg-brand text-white'
    default:
      return 'bg-white/10 text-white/70'
  }
}
