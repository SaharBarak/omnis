'use client'

import type {
  GalacticReturnMilestone,
  KatunBirthdayMilestone,
  TunBirthdayMilestone,
  CalendarRoundMilestone,
  TimelineMilestone,
} from '@pleiad/engine/types/prediction'
import { IntensityBadge } from './IntensityBadge'
import { DataRow, Eyebrow, Pill, getFlavor } from '@/components/app-kit'
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
  const flavor = getFlavor('dreamspell')
  const dateFormatted = new Date(milestone.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const isFeatured = variant === 'featured' || milestone.intensity === 'peak'

  return (
    <div
      className={cn(
        'overflow-hidden p-6',
        isFeatured ? 'feature-card' : 'surface-card',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Eyebrow accent={isFeatured ? flavor.accent : undefined}>
            {dateFormatted}
          </Eyebrow>
          <h3 className="font-display text-lg font-semibold tracking-tight text-white/90">
            {milestone.title}
          </h3>
        </div>
        <IntensityBadge intensity={milestone.intensity} />
      </div>

      <p className="mt-3 text-sm text-white/70">{milestone.description}</p>

      {milestone.daysUntil !== undefined && milestone.isFuture && (
        <div className="mt-4">
          <Pill className="px-3 py-1 text-[10px]">
            {milestone.daysUntil === 0
              ? 'Today'
              : milestone.daysUntil === 1
              ? 'Tomorrow'
              : `${milestone.daysUntil} days away`}
          </Pill>
        </div>
      )}

      {/* Type-specific facts — hairline-divided rows, never nested boxes */}
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
    </div>
  )
}

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono [font-variant-numeric:tabular-nums]">{children}</span>
  )
}

function GalacticReturnDetails({ milestone }: { milestone: GalacticReturnMilestone }) {
  return (
    <div className="mt-4 border-t border-white/[0.07]">
      <DataRow label="Kin" value={<Mono>Kin {milestone.kin}</Mono>} />
      <DataRow label="Return" value={<Mono>#{milestone.returnNumber}</Mono>} />
      <DataRow label="Age" value={<Mono>{milestone.age} years</Mono>} last />
    </div>
  )
}

function KatunDetails({ milestone }: { milestone: KatunBirthdayMilestone }) {
  return (
    <div className="mt-4 border-t border-white/[0.07]">
      <DataRow label="Katun" value={<Mono>#{milestone.katunNumber}</Mono>} />
      <DataRow label="Age at katun" value={<Mono>~{milestone.ageAtKatun} years</Mono>} />
      <DataRow label="Long count" value={<Mono>{milestone.longCount}</Mono>} last />
    </div>
  )
}

function TunDetails({ milestone }: { milestone: TunBirthdayMilestone }) {
  return (
    <div className="mt-4 border-t border-white/[0.07]">
      <DataRow label="Tun" value={<Mono>#{milestone.tunNumber}</Mono>} />
      <DataRow label="Days" value={<Mono>{milestone.tunNumber * 360}</Mono>} />
      <DataRow label="Long count" value={<Mono>{milestone.longCount}</Mono>} last />
    </div>
  )
}

function CalendarRoundDetails({ milestone }: { milestone: CalendarRoundMilestone }) {
  return (
    <div className="mt-4 border-t border-white/[0.07]">
      <DataRow
        label="Years from birth"
        value={<Mono>{milestone.yearsFromBirth} years</Mono>}
      />
      <DataRow label="Long count" value={<Mono>{milestone.longCount}</Mono>} last />
    </div>
  )
}
