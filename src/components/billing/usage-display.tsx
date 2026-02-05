'use client'

import { Progress } from '@/components/ui/progress'

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
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {used} / {displayLimit}
        </span>
      </div>
      <Progress 
        value={isUnlimited ? 0 : percentage} 
        className="h-2"
      />
    </div>
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
        label="AI Interpretations (this month)"
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
