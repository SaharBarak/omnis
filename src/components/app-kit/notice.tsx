'use client'

/**
 * Notice — the ONE tokened banner for warnings / info / errors / success.
 * Replaces the copy-pasted `bg-amber-50 border-amber-200 text-amber-600`
 * pattern (person-detail, relationships, settings, billing). Colors come
 * from theme tokens only: --amber, --primary, --destructive, --secondary.
 */

import { type LucideIcon, AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type NoticeVariant = 'warning' | 'info' | 'error' | 'success'

const VARIANT: Record<
  NoticeVariant,
  { icon: LucideIcon; wrap: string; iconCls: string }
> = {
  warning: {
    icon: AlertTriangle,
    wrap: 'border-amber/25 bg-amber/[0.08] text-amber',
    iconCls: 'text-amber',
  },
  info: {
    icon: Info,
    wrap: 'border-primary/25 bg-primary/[0.08] text-white/90',
    iconCls: 'text-primary',
  },
  error: {
    icon: XCircle,
    wrap: 'border-destructive/30 bg-destructive/[0.08] text-white/90',
    iconCls: 'text-destructive',
  },
  success: {
    icon: CheckCircle2,
    wrap: 'border-secondary/30 bg-secondary/[0.08] text-white/90',
    iconCls: 'text-secondary',
  },
}

export function Notice({
  variant = 'info',
  title,
  children,
  action,
  className,
}: {
  variant?: NoticeVariant
  title?: string
  children: React.ReactNode
  /** Optional trailing action (AddDataChip, button, link). */
  action?: React.ReactNode
  className?: string
}) {
  const spec = VARIANT[variant]
  const Icon = spec.icon
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-3 rounded-xl border p-4',
        spec.wrap,
        className
      )}
    >
      <Icon className={cn('mt-0.5 size-4 shrink-0', spec.iconCls)} aria-hidden />
      <div className="min-w-0 flex-1 text-sm leading-relaxed">
        {title && <p className="font-medium">{title}</p>}
        <div className={cn(title && 'mt-1', 'text-white/70')}>{children}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
