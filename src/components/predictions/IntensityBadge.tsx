'use client'

import { cn } from '@/lib/utils'
import type { PredictionIntensity } from '@/lib/types/prediction'

interface IntensityBadgeProps {
  intensity: PredictionIntensity
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const intensityConfig: Record<
  PredictionIntensity,
  { label: string; color: string; bg: string; ring: string }
> = {
  low: {
    label: 'Low',
    color: 'text-green-400',
    bg: 'bg-green-500/20',
    ring: 'ring-green-500/30',
  },
  medium: {
    label: 'Medium',
    color: 'text-blue-400',
    bg: 'bg-blue-500/20',
    ring: 'ring-blue-500/30',
  },
  high: {
    label: 'High',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/20',
    ring: 'ring-yellow-500/30',
  },
  peak: {
    label: 'Peak',
    color: 'text-red-400',
    bg: 'bg-red-500/20',
    ring: 'ring-red-500/30',
  },
}

const sizeConfig = {
  sm: {
    wrapper: 'px-1.5 py-0.5 text-xs',
    dot: 'w-1.5 h-1.5',
  },
  md: {
    wrapper: 'px-2 py-1 text-sm',
    dot: 'w-2 h-2',
  },
  lg: {
    wrapper: 'px-3 py-1.5 text-base',
    dot: 'w-2.5 h-2.5',
  },
}

export function IntensityBadge({
  intensity,
  size = 'md',
  showLabel = true,
  className,
}: IntensityBadgeProps) {
  const config = intensityConfig[intensity]
  const sizeStyles = sizeConfig[size]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium ring-1',
        config.bg,
        config.ring,
        sizeStyles.wrapper,
        className
      )}
    >
      <span
        className={cn(
          'rounded-full',
          sizeStyles.dot,
          config.color.replace('text-', 'bg-').replace('-400', '-500'),
          'animate-pulse'
        )}
      />
      {showLabel && <span className={config.color}>{config.label}</span>}
    </span>
  )
}

export function IntensityDot({
  intensity,
  size = 'md',
  className,
}: Omit<IntensityBadgeProps, 'showLabel'>) {
  const config = intensityConfig[intensity]
  const dotSize = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  }[size]

  return (
    <span
      className={cn(
        'rounded-full',
        dotSize,
        config.color.replace('text-', 'bg-').replace('-400', '-500'),
        className
      )}
      title={`${config.label} intensity`}
    />
  )
}
