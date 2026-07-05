'use client'

import Link from 'next/link'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Check, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProfileProgressProps {
  displayName?: string | null
  birthDate?: string | null
  hebrewName?: string | null
  peopleCount: number
  relationshipCount: number
  /** User's kin data if available */
  userKin?: {
    kin: number
    signature: string // e.g. "Rhythmic Serpent"
  }
  className?: string
}

export function ProfileProgress({
  displayName,
  birthDate,
  hebrewName,
  peopleCount,
  relationshipCount,
  userKin,
  className,
}: ProfileProgressProps) {
  // Calculate completion score
  let score = 0
  if (displayName) score++
  if (birthDate) score++
  if (hebrewName) score++
  if (peopleCount > 0) score++
  if (relationshipCount > 0) score++
  const completion = Math.round((score / 5) * 100)

  const tasks = [
    { done: !!displayName, label: 'Set display name', href: '/app/profile' },
    { done: !!birthDate, label: 'Add birth date', href: '/app/profile' },
    { done: peopleCount > 0, label: 'Add first person', href: '/app/people' },
  ]

  // If profile is complete and user has kin, show signature
  if (completion === 100 && userKin) {
    return (
      <div className={cn('surface-card p-5', className)}>
        <h3 className="font-display font-semibold tracking-tight text-foreground mb-4">Your Signature</h3>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center border border-primary/10">
            <span className="font-mono text-xl font-semibold tabular-nums text-primary">{userKin.kin}</span>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Galactic Signature</p>
            <p className="font-semibold text-foreground">{userKin.signature}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" asChild className="mt-4 p-0 h-auto text-primary">
          <Link href="/app/profile" className="flex items-center gap-1">
            View profile <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </div>
    )
  }

  // Show progress for incomplete profile
  return (
    <div className={cn('surface-card p-5', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-semibold tracking-tight text-foreground">Complete Your Profile</h3>
        <span className="font-mono text-sm tabular-nums text-muted-foreground">{completion}%</span>
      </div>

      <Progress value={completion} className="h-1.5 mb-4" />

      <div className="space-y-1.5">
        {tasks.map((task, i) => (
          <Link key={i} href={task.href}>
            <div className={cn(
              'flex items-center gap-2.5 p-2 rounded-lg transition-colors',
              task.done ? 'opacity-50' : 'hover:bg-muted'
            )}>
              <div className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0',
                task.done
                  ? 'bg-primary text-primary-foreground'
                  : 'border-2 border-muted-foreground/30'
              )}>
                {task.done && <Check className="w-3 h-3" />}
              </div>
              <span className={cn(
                'text-sm',
                task.done && 'line-through text-muted-foreground'
              )}>
                {task.label}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
