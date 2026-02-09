'use client'

import Link from 'next/link'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

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

export function StatCard({
  label,
  value,
  icon: Icon,
  href,
  trend,
  className,
}: StatCardProps) {
  const content = (
    <div className={cn(
      'surface-card p-4 transition-all',
      href && 'interactive-card',
      className
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="stat-value">{value}</p>
          <p className="stat-label mt-0.5">{label}</p>
          {trend && (
            <p className={cn(
              'text-xs mt-1.5 font-medium',
              trend.value >= 0 ? 'text-secondary' : 'text-destructive'
            )}>
              {trend.value >= 0 ? '+' : ''}{trend.value} {trend.label}
            </p>
          )}
        </div>
        <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
