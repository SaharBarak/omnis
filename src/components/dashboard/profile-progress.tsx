'use client'

import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { Eyebrow } from '@/components/app-kit'

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

/**
 * Profile completion card — kit grammar: font-display header, mono
 * tabular completion numeral, tokened kin disc (no gradients), four-step
 * white text ramp.
 */
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
        <h3 className="mb-4 font-display font-semibold tracking-tight text-white/90">Your Signature</h3>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/25 bg-primary/[0.08]">
            <span className="font-display text-xl text-brand-bright [font-variant-numeric:tabular-nums]">{userKin.kin}</span>
          </div>
          <div>
            <Eyebrow className="block">Galactic Signature</Eyebrow>
            <p className="font-medium text-white/90">{userKin.signature}</p>
          </div>
        </div>
        <Link
          href="/app/profile"
          className="mt-4 inline-flex items-center gap-1 text-sm text-brand-soft transition-colors hover:text-brand-bright"
        >
          View profile <ArrowRight className="size-3.5" />
        </Link>
      </div>
    )
  }

  // Show progress for incomplete profile
  return (
    <div className={cn('surface-card p-5', className)}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display font-semibold tracking-tight text-white/90">Complete Your Profile</h3>
        <span className="text-sm text-brand-bright [font-variant-numeric:tabular-nums]">{completion}%</span>
      </div>

      <Progress value={completion} className="mb-4 h-1.5" />

      <div className="divide-y divide-white/[0.07]">
        {tasks.map((task) => (
          <Link key={task.label} href={task.href} className="block">
            <div className={cn(
              'flex items-center gap-2.5 py-2.5 transition-opacity',
              task.done && 'opacity-50'
            )}>
              <div className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                task.done
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-white/[0.12]'
              )}>
                {task.done && <Check className="size-3" />}
              </div>
              <span className={cn(
                'text-sm',
                task.done ? 'text-white/50 line-through' : 'text-white/70'
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
