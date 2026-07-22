'use client'

import type { PredictionIntensity } from '@pleiad/engine/types/prediction'
import { sealAlpha } from './seal-style'
import { SEAL_COLORS, type SealColor } from '@/components/app-kit/seal-colors'
import { cn } from '@/lib/utils'

interface IntensityBadgeProps {
  intensity: PredictionIntensity
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

/**
 * Intensity reads through the four Dreamspell seal tokens:
 * calm white → blue → yellow → peak red. Colors resolve via
 * SEAL_COLORS only — raw palette classes are banned.
 */
const intensityConfig: Record<
  PredictionIntensity,
  { label: string; seal: SealColor }
> = {
  low: { label: 'Low', seal: 'white' },
  medium: { label: 'Medium', seal: 'blue' },
  high: { label: 'High', seal: 'yellow' },
  peak: { label: 'Peak', seal: 'red' },
}

const sizeConfig = {
  sm: {
    wrapper: 'px-2 py-0.5 text-[9px]',
    dot: 'size-1.5',
  },
  md: {
    wrapper: 'px-2.5 py-1 text-[10px]',
    dot: 'size-2',
  },
  lg: {
    wrapper: 'px-3 py-1.5 text-[11px]',
    dot: 'size-2.5',
  },
}

export function IntensityBadge({
  intensity,
  size = 'md',
  showLabel = true,
  className,
}: IntensityBadgeProps) {
  const config = intensityConfig[intensity]
  const spec = SEAL_COLORS[config.seal]
  const sizeStyles = sizeConfig[size]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border',
        'font-mono uppercase tracking-[0.15em]',
        sizeStyles.wrapper,
        className
      )}
      style={{
        color: spec.css,
        borderColor: sealAlpha(config.seal, 0.33),
        backgroundColor: spec.cssSoft,
      }}
    >
      <span
        aria-hidden
        className={cn('rounded-full', sizeStyles.dot)}
        style={{ backgroundColor: spec.css }}
      />
      {showLabel && <span>{config.label}</span>}
    </span>
  )
}

export function IntensityDot({
  intensity,
  size = 'md',
  className,
}: Omit<IntensityBadgeProps, 'showLabel'>) {
  const config = intensityConfig[intensity]
  const spec = SEAL_COLORS[config.seal]
  const dotSize = {
    sm: 'size-2',
    md: 'size-3',
    lg: 'size-4',
  }[size]

  return (
    <span
      className={cn('inline-block rounded-full', dotSize, className)}
      style={{ backgroundColor: spec.css }}
      title={`${config.label} intensity`}
    />
  )
}
