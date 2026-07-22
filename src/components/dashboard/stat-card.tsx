'use client'

import Link from 'next/link'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Eyebrow, useCountUp } from '@/components/app-kit'

interface StatCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  href?: string
  trend?: {
    value: number
    label: string
  }
  className?: string
}

/**
 * Library stat — split-flap numeral treatment: mono tabular
 * brand-bright, counted up on first view. Icon sits in a quiet
 * hairline chip (chrome, not a colored feature badge).
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  href,
  trend,
  className,
}: StatCardProps) {
  const numeric = typeof value === 'number' ? value : null
  const [ref, counted] = useCountUp(numeric ?? 0)

  const content = (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      className={cn(
        'surface-card p-4 transition-all',
        href && 'interactive-card',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-3xl tracking-tight text-brand-bright [font-variant-numeric:tabular-nums]">
            {numeric === null ? value : counted}
          </p>
          <Eyebrow className="mt-1.5 block truncate">{label}</Eyebrow>
          {trend && (
            <p
              className={cn(
                'mt-1.5 font-mono text-xs [font-variant-numeric:tabular-nums]',
                trend.value >= 0 ? 'text-secondary' : 'text-destructive'
              )}
            >
              {trend.value >= 0 ? '+' : ''}
              {trend.value} {trend.label}
            </p>
          )}
        </div>
        <div className="shrink-0 rounded-full border border-white/[0.07] p-2.5 text-white/50">
          <Icon className="size-5" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
