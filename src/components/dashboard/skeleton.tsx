'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

// Card skeleton
export function CardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-6 space-y-4', className)}>
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  )
}

// Stat card skeleton
export function StatSkeleton() {
  return (
    <div className="p-4 rounded-xl bg-muted/30">
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

// Hero card skeleton
export function HeroSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 md:p-8">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-center">
        <Skeleton className="h-40 w-40 lg:h-48 lg:w-48 rounded-full" />
        <div className="space-y-4 flex-1 text-center lg:text-left">
          <div className="space-y-2">
            <Skeleton className="h-3 w-32 mx-auto lg:mx-0" />
            <Skeleton className="h-9 w-48 mx-auto lg:mx-0" />
            <Skeleton className="h-6 w-40 mx-auto lg:mx-0" />
          </div>
          <Skeleton className="h-5 w-full max-w-md mx-auto lg:mx-0" />
          <div className="flex gap-2 justify-center lg:justify-start">
            <Skeleton className="h-9 w-44 rounded-full" />
            <Skeleton className="h-9 w-36 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Person card skeleton
export function PersonCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    </div>
  )
}

// Dashboard grid skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-5 w-48" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* Hero */}
      <HeroSkeleton />

      {/* Stats row */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-5">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </div>
        </div>
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
          <Skeleton className="h-6 w-36 mb-4" />
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent people */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <PersonCardSkeleton />
          <PersonCardSkeleton />
          <PersonCardSkeleton />
          <PersonCardSkeleton />
        </div>
      </div>

      {/* Explore */}
      <div>
        <Skeleton className="h-7 w-24 mb-5" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="h-5 w-28" />
            </div>
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="h-5 w-36" />
            </div>
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

// List skeleton for people/relationships pages
export function ListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}
