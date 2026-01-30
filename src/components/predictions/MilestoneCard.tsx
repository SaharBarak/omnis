'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { IntensityBadge } from './IntensityBadge'
import type {
  GalacticReturnMilestone,
  KatunBirthdayMilestone,
  TunBirthdayMilestone,
  CalendarRoundMilestone,
  TimelineMilestone,
} from '@/lib/types/prediction'
import { cn } from '@/lib/utils'

interface MilestoneCardProps {
  milestone: TimelineMilestone
  variant?: 'default' | 'featured'
  className?: string
}

export function MilestoneCard({
  milestone,
  variant = 'default',
  className,
}: MilestoneCardProps) {
  const dateFormatted = new Date(milestone.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const isFeatured = variant === 'featured' || milestone.intensity === 'peak'

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all',
        isFeatured && 'border-primary/50 bg-gradient-to-br from-primary/5 to-transparent',
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className={cn('text-lg', isFeatured && 'text-primary')}>
              {milestone.title}
            </CardTitle>
            <CardDescription>{dateFormatted}</CardDescription>
          </div>
          <IntensityBadge intensity={milestone.intensity} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{milestone.description}</p>

        {milestone.daysUntil !== undefined && milestone.isFuture && (
          <div className="mt-4 flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {milestone.daysUntil === 0
                ? 'Today!'
                : milestone.daysUntil === 1
                ? 'Tomorrow'
                : `${milestone.daysUntil} days away`}
            </Badge>
          </div>
        )}

        {/* Type-specific content */}
        {milestone.type === 'return' && (
          <GalacticReturnDetails milestone={milestone as GalacticReturnMilestone} />
        )}
        {milestone.type === 'katun-birthday' && (
          <KatunDetails milestone={milestone as KatunBirthdayMilestone} />
        )}
        {milestone.type === 'tun-birthday' && (
          <TunDetails milestone={milestone as TunBirthdayMilestone} />
        )}
        {milestone.type === 'calendar-round' && (
          <CalendarRoundDetails milestone={milestone as CalendarRoundMilestone} />
        )}
      </CardContent>
    </Card>
  )
}

function GalacticReturnDetails({ milestone }: { milestone: GalacticReturnMilestone }) {
  return (
    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Kin</span>
          <p className="font-medium">Kin {milestone.kin}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Return #</span>
          <p className="font-medium">{milestone.returnNumber}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Age</span>
          <p className="font-medium">{milestone.age} years</p>
        </div>
      </div>
    </div>
  )
}

function KatunDetails({ milestone }: { milestone: KatunBirthdayMilestone }) {
  return (
    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Katun #</span>
          <p className="font-medium">{milestone.katunNumber}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Age at Katun</span>
          <p className="font-medium">~{milestone.ageAtKatun} years</p>
        </div>
        <div className="col-span-2">
          <span className="text-muted-foreground">Long Count</span>
          <p className="font-mono font-medium">{milestone.longCount}</p>
        </div>
      </div>
    </div>
  )
}

function TunDetails({ milestone }: { milestone: TunBirthdayMilestone }) {
  return (
    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Tun #</span>
          <p className="font-medium">{milestone.tunNumber}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Days</span>
          <p className="font-medium">{milestone.tunNumber * 360}</p>
        </div>
        <div className="col-span-2">
          <span className="text-muted-foreground">Long Count</span>
          <p className="font-mono font-medium">{milestone.longCount}</p>
        </div>
      </div>
    </div>
  )
}

function CalendarRoundDetails({ milestone }: { milestone: CalendarRoundMilestone }) {
  return (
    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Years from Birth</span>
          <p className="font-medium">{milestone.yearsFromBirth} years</p>
        </div>
        <div className="col-span-2">
          <span className="text-muted-foreground">Long Count</span>
          <p className="font-mono font-medium">{milestone.longCount}</p>
        </div>
      </div>
    </div>
  )
}
