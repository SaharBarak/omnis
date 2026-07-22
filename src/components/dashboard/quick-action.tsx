'use client'

import Link from 'next/link'
import { type LucideIcon, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickActionProps {
  title: string
  description: string
  icon: LucideIcon
  href: string
  className?: string
}

/**
 * Explore row — a hairline-divided navigation row (lists are rows,
 * never card grids). Parent supplies the dividers via
 * `divide-y divide-white/[0.07]`.
 */
export function QuickAction({
  title,
  description,
  icon: Icon,
  href,
  className,
}: QuickActionProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-4 py-4 transition-colors active:scale-[0.98]',
        className
      )}
    >
      <div className="shrink-0 rounded-full border border-white/[0.07] p-2.5 text-white/50 transition-colors group-hover:border-white/[0.12] group-hover:text-brand-soft">
        <Icon className="size-5" strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-medium leading-tight text-white/90">{title}</h3>
        <p className="mt-0.5 truncate text-sm text-white/50">{description}</p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-white/35 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}
