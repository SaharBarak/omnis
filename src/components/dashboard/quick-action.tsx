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

export function QuickAction({
  title,
  description,
  icon: Icon,
  href,
  className,
}: QuickActionProps) {
  return (
    <Link href={href}>
      <div className={cn(
        'interactive-card p-4 h-full',
        className
      )}>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-muted text-muted-foreground shrink-0 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground leading-tight">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
              {description}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        </div>
      </div>
    </Link>
  )
}
