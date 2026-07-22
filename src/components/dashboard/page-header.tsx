'use client'

import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Eyebrow } from '@/components/app-kit'

interface PageHeaderProps {
  title: string
  subtitle?: string
  /** Date/time display above the title */
  meta?: string
  actions?: ReactNode
  className?: string
}

/**
 * Page header — kit grammar: mono micro-caps eyebrow above a
 * font-display title, four-step white text ramp. Shared by every
 * authed page, so the API stays stable.
 */
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
        {meta && <Eyebrow className="mb-1.5 block">{meta}</Eyebrow>}
        <h1 className="font-display text-2xl font-semibold tracking-tight text-white/90 sm:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="mt-0.5 text-white/50">{subtitle}</p>}
      </div>
      {actions && <div className="mt-3 flex gap-2 sm:mt-0">{actions}</div>}
    </div>
  )
}
