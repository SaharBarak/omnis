'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { IntensityBadge } from './IntensityBadge'
import type { PersonalTimeline, TimelineMilestone } from '@/lib/types/prediction'
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
    <Card className={className}>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
        <CardDescription>
          Upcoming milestones for {timeline.personName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-6">
            {allMilestones.map((milestone, index) => (
              <TimelineItem key={`${milestone.type}-${milestone.date}`} milestone={milestone} />
            ))}

            {allMilestones.length === 0 && (
              <p className="text-muted-foreground text-sm py-4">
                No upcoming milestones found.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
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

  const typeIcon = getTypeIcon(milestone.type)
  const typeColor = getTypeColor(milestone.type)

  return (
    <div className="relative flex gap-4 pl-10">
      {/* Timeline dot */}
      <div
        className={cn(
          'absolute left-2 w-5 h-5 rounded-full flex items-center justify-center text-xs',
          typeColor
        )}
      >
        {typeIcon}
      </div>

      <div className="flex-1 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{milestone.title}</h4>
              <IntensityBadge intensity={milestone.intensity} size="sm" />
            </div>
            <p className="text-sm text-muted-foreground">{dateFormatted}</p>
          </div>
          {milestone.daysUntil !== undefined && milestone.isFuture && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {milestone.daysUntil === 0
                ? 'Today'
                : milestone.daysUntil === 1
                ? 'Tomorrow'
                : `in ${milestone.daysUntil} days`}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
      </div>
    </div>
  )
}

function getTypeIcon(type: string): string {
  switch (type) {
    case 'return':
      return '*'
    case 'yearly-kin':
      return '@'
    case 'calendar-round':
      return '#'
    case 'katun-birthday':
      return 'K'
    case 'tun-birthday':
      return 'T'
    case 'wavespell':
      return 'W'
    case 'castle':
      return 'C'
    default:
      return '*'
  }
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'return':
    case 'calendar-round':
      return 'bg-red-500 text-white'
    case 'yearly-kin':
    case 'katun-birthday':
      return 'bg-yellow-500 text-black'
    case 'tun-birthday':
      return 'bg-blue-500 text-white'
    case 'wavespell':
    case 'castle':
      return 'bg-primary text-primary-foreground'
    default:
      return 'bg-muted text-muted-foreground'
  }
}
