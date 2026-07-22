'use client'

import { MeterBar } from '@/components/app-kit'
import { COLORS } from '@/lib/design/landing-tokens'

interface UsageItemProps {
  label: string
  used: number
  limit: number
  percentage: number
}

function UsageItem({ label, used, limit, percentage }: UsageItemProps) {
  const isUnlimited = limit === Infinity || limit > 10000
  const displayLimit = isUnlimited ? '∞' : limit.toString()

  return (
    <MeterBar
      label={label}
      value={isUnlimited ? 0 : percentage}
      max={100}
      accent={COLORS.brand}
      displayValue={`${used}/${displayLimit}`}
    />
  )
}

interface UsageDisplayProps {
  usage: {
    profiles: { used: number; limit: number; percentage: number }
    aiInterpretations: { used: number; limit: number; percentage: number }
    boards: { used: number; limit: number; percentage: number }
  }
}

export function UsageDisplay({ usage }: UsageDisplayProps) {
  return (
    <div className="space-y-4">
      <UsageItem
        label="Profiles"
        used={usage.profiles.used}
        limit={usage.profiles.limit}
        percentage={usage.profiles.percentage}
      />
      <UsageItem
        label="AI This Month"
        used={usage.aiInterpretations.used}
        limit={usage.aiInterpretations.limit}
        percentage={usage.aiInterpretations.percentage}
      />
      <UsageItem
        label="Boards"
        used={usage.boards.used}
        limit={usage.boards.limit}
        percentage={usage.boards.percentage}
      />
    </div>
  )
}
