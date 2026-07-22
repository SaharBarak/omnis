'use client'

/**
 * Layout-matched skeletons — the codebase forbids spinners for content
 * loading (mobile law). Shapes mirror their real counterparts so the
 * page doesn't jump when data lands. Shimmer via globals.css
 * `.skeleton-shimmer` (1.8s, reduced-motion aware globally).
 */

import { cn } from '@/lib/utils'

/** A hairline-divided list row: avatar disc + two text lines. */
export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 border-b border-white/[0.07] py-3',
        className
      )}
    >
      <div className="skeleton-shimmer size-11 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="skeleton-shimmer h-4 w-36 rounded" />
        <div className="skeleton-shimmer h-3 w-52 rounded" />
      </div>
    </div>
  )
}

export function SkeletonRows({ count = 5 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  )
}

/** A surface-card sized block. */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('surface-card p-5', className)}>
      <div className="skeleton-shimmer h-3 w-24 rounded" />
      <div className="skeleton-shimmer mt-3 h-8 w-20 rounded" />
    </div>
  )
}
