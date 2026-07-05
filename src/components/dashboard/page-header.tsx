'use client'

import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  /** Date/time display above the title */
  meta?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  subtitle,
  meta,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div>
        {meta && (
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-1.5">{meta}</p>
        )}
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="mt-3 sm:mt-0 flex gap-2">{actions}</div>
      )}
    </div>
  )
}
