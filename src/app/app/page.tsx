'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/use-auth'
import { usePeople } from '@/lib/hooks/use-people'
import { useRelationships } from '@/lib/hooks/use-relationships'
import { useGroups } from '@/lib/hooks/use-groups'
import { useBoards } from '@/lib/hooks/use-boards'
import { useShares } from '@/lib/hooks/use-shares'
import { dateToKin, kinToSeal, kinToTone } from '@pleiad/engine/calculations/dreamspell'
import { getSeal } from '@pleiad/engine/data/seals'
import { getTone } from '@pleiad/engine/data/tones'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  PageHeader,
  StatCard,
  TodayKin,
  PersonPreview,
  QuickAction,
  WelcomeCard,
  EmptyState,
} from '@/components/dashboard'

import {
  Users,
  Heart,
  UsersRound,
  LayoutGrid,
  Sparkles,
  Network,
  CreditCard,
  Plus,
  ArrowRight,
  Calendar,
  Check,
  X,
} from 'lucide-react'

/**
 * Get-to-value checklist persistence (namespaced localStorage keys).
 *
 * Signals that have no cheap server-side query use honest client flags:
 * - map-seen: set when the user clicks through the "See your map" step.
 *   (We cannot instrument /app/graph itself from this file, so the click-
 *   through is the simplest honest signal; a sidebar visit won't count
 *   until the user clicks the step once.)
 * - shared: set by ShareDialog on first successful share creation. Self-
 *   heals for pre-existing shares: while the step is unchecked we do one
 *   GET /api/shares and persist the flag if any share exists.
 * - dismissed: user closed the "You're set up" card.
 */
const CHECKLIST_KEYS = {
  mapSeen: 'omnis.checklist.map-seen',
  shared: 'omnis.checklist.shared',
  dismissed: 'omnis.checklist.dismissed',
} as const

function readChecklistFlag(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function writeChecklistFlag(key: string): void {
  try {
    window.localStorage.setItem(key, '1')
  } catch {
    // Private mode / storage disabled — flag simply won't persist.
  }
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const { people, loading: peopleLoading } = usePeople()
  const { relationships, loading: relationshipsLoading } = useRelationships()
  const { groups, loading: groupsLoading } = useGroups()
  const { boards, loading: boardsLoading } = useBoards()
  const { shares, fetchShares } = useShares()

  // Client-persisted checklist flags (read once after mount; see
  // CHECKLIST_KEYS for what each signal means and why).
  const [mapSeen, setMapSeen] = useState(false)
  const [hasShared, setHasShared] = useState(false)
  const [checklistDismissed, setChecklistDismissed] = useState(false)
  const [flagsLoaded, setFlagsLoaded] = useState(false)

  useEffect(() => {
    setMapSeen(readChecklistFlag(CHECKLIST_KEYS.mapSeen))
    setHasShared(readChecklistFlag(CHECKLIST_KEYS.shared))
    setChecklistDismissed(readChecklistFlag(CHECKLIST_KEYS.dismissed))
    setFlagsLoaded(true)
  }, [])

  // Self-heal the share flag: one cheap GET /api/shares, only while the
  // step is still unchecked and the card hasn't been dismissed.
  useEffect(() => {
    if (flagsLoaded && !hasShared && !checklistDismissed) fetchShares()
  }, [flagsLoaded, hasShared, checklistDismissed, fetchShares])

  useEffect(() => {
    if (!hasShared && shares.length > 0) {
      writeChecklistFlag(CHECKLIST_KEYS.shared)
      setHasShared(true)
    }
  }, [shares.length, hasShared])

  const markMapSeen = useCallback(() => {
    writeChecklistFlag(CHECKLIST_KEYS.mapSeen)
    setMapSeen(true)
  }, [])

  const dismissChecklist = useCallback(() => {
    writeChecklistFlag(CHECKLIST_KEYS.dismissed)
    setChecklistDismissed(true)
  }, [])

  // User's kin data
  const userKin = useMemo(() => {
    if (!profile?.birth_date) return null
    const kin = dateToKin(profile.birth_date)
    const seal = getSeal(kinToSeal(kin))
    const tone = getTone(kinToTone(kin))
    return {
      kin,
      signature: `${tone.name} ${seal.english}`,
    }
  }, [profile?.birth_date])

  // Recent people with their kin
  const recentPeople = useMemo(() => {
    return [...people]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 4)
      .map((person) => {
        const kin = dateToKin(person.birth_date)
        const seal = getSeal(kinToSeal(kin))
        const tone = getTone(kinToTone(kin))
        return {
          id: person.id,
          name: person.name,
          kin,
          signature: `${tone.name} ${seal.english}`,
          tags: person.tags || [],
        }
      })
  }, [people])

  // Get-to-value checklist steps. Onboarding auto-creates an is_self
  // person, so "Add your first person" counts non-self people only.
  const nonSelfPeopleCount = useMemo(
    () => people.filter((person) => !person.is_self).length,
    [people]
  )

  const checklistSteps: ChecklistStep[] = useMemo(
    () => [
      {
        done: !!profile?.display_name,
        label: 'Set display name',
        href: '/app/profile',
      },
      {
        done: !!profile?.birth_date,
        label: 'Add your birth date',
        href: '/app/profile',
      },
      {
        done: nonSelfPeopleCount > 0,
        label: 'Add your first person',
        href: '/app/people',
      },
      {
        done: relationships.length > 0,
        label: 'Create a relationship',
        href: '/app/relationships',
      },
      {
        done: mapSeen,
        label: 'See your map',
        href: '/app/graph',
        onNavigate: markMapSeen,
      },
      {
        done: hasShared,
        label: 'Share a reading',
        href: '/app/groups',
      },
    ],
    [
      profile?.display_name,
      profile?.birth_date,
      nonSelfPeopleCount,
      relationships.length,
      mapSeen,
      hasShared,
      markMapSeen,
    ]
  )

  // Stats
  const counts = useMemo(
    () => ({
      people: people.length,
      relationships: relationships.length,
      groups: groups.length,
      boards: boards.length,
    }),
    [people.length, relationships.length, groups.length, boards.length]
  )

  const isLoading = peopleLoading || relationshipsLoading || groupsLoading || boardsLoading
  const isNewUser = counts.people === 0 && counts.relationships === 0

  if (isLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        meta={formatDate()}
        title={`${getGreeting()}, ${profile?.display_name || 'Explorer'}`}
        actions={
          !isNewUser && (
            <Button asChild>
              <Link href="/app/people">
                <Plus className="w-4 h-4 mr-2" />
                Add Person
              </Link>
            </Button>
          )
        }
      />

      {/* Welcome card for new users */}
      {isNewUser && <WelcomeCard />}

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Kin - spans 2 cols on large screens */}
        <div className="lg:col-span-2">
          <TodayKin userKin={userKin?.kin} />
        </div>

        {/* Get-to-value checklist */}
        <SetupChecklist
          steps={checklistSteps}
          dismissed={checklistDismissed}
          onDismiss={dismissChecklist}
          userKin={userKin || undefined}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="People"
          value={counts.people}
          icon={Users}
          href="/app/people"
        />
        <StatCard
          label="Relationships"
          value={counts.relationships}
          icon={Heart}
          href="/app/relationships"
        />
        <StatCard
          label="Groups"
          value={counts.groups}
          icon={UsersRound}
          href="/app/groups"
        />
        <StatCard
          label="Boards"
          value={counts.boards}
          icon={LayoutGrid}
          href="/app/boards"
        />
      </div>

      {/* Recent People */}
      {recentPeople.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">Recent People</h2>
            {people.length > 4 && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/app/people" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                  View all <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recentPeople.map((person) => (
              <PersonPreview
                key={person.id}
                id={person.id}
                name={person.name}
                kin={person.kin}
                signature={person.signature}
                tags={person.tags}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty state for existing users with no people */}
      {recentPeople.length === 0 && !isNewUser && (
        <EmptyState
          icon="people"
          title="No people yet"
          description="Start by adding yourself and the people in your life to explore their symbolic maps."
          action={{
            label: 'Add Your First Person',
            href: '/app/people',
          }}
        />
      )}

      {/* Explore section */}
      <section>
        <h2 className="font-display text-lg font-semibold tracking-tight text-foreground mb-4">Explore</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction
            title="Predictions"
            description="Daily, weekly, and monthly forecasts"
            icon={Sparkles}
            href="/app/predictions"
          />
          <QuickAction
            title="Relationship Map"
            description="Visualize connections between people"
            icon={Network}
            href="/app/graph"
          />
          <QuickAction
            title="Print Cards"
            description="Generate beautiful person cards"
            icon={CreditCard}
            href="/app/cards"
          />
        </div>
      </section>

      {/* Keyboard shortcut hint */}
      <div className="hidden md:flex justify-center pt-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          Press
          <kbd className="px-2 py-1 rounded bg-muted border border-border text-[10px] font-mono">
            ⌘K
          </kbd>
          to search
        </div>
      </div>
    </div>
  )
}

interface ChecklistStep {
  done: boolean
  label: string
  href: string
  /** Fired when the user clicks through the step (e.g. to flag map visits). */
  onNavigate?: () => void
}

interface SetupChecklistProps {
  steps: ChecklistStep[]
  dismissed: boolean
  onDismiss: () => void
  userKin?: {
    kin: number
    signature: string
  }
}

/**
 * Get-to-value checklist card. Speaks the same design language as the rest
 * of the dashboard (surface-card, violet brand, mono numerals). Collapses
 * to a small dismissible "You're set up" state once every step is done,
 * and to the galactic signature card after dismissal.
 */
function SetupChecklist({ steps, dismissed, onDismiss, userKin }: SetupChecklistProps) {
  const doneCount = steps.filter((step) => step.done).length
  const completion = Math.round((doneCount / steps.length) * 100)
  const allDone = doneCount === steps.length

  // All steps done and acknowledged — fall back to the signature card
  // (birth date is a required step, so userKin is available here).
  if (allDone && dismissed) {
    if (!userKin) return null
    return (
      <div className="surface-card p-5">
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

  // All steps done — collapse into a small dismissible confirmation.
  if (allDone) {
    return (
      <div className="surface-card p-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-display font-semibold tracking-tight text-foreground">You&apos;re set up</p>
            <p className="text-sm text-muted-foreground">Every step is complete. Enjoy the map.</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 -mt-1 -mr-1 text-muted-foreground hover:text-foreground"
          aria-label="Dismiss setup checklist"
          onClick={onDismiss}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  // Steps remaining — show progress and the full checklist.
  return (
    <div className="surface-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-semibold tracking-tight text-foreground">Get Set Up</h3>
        <span className="font-mono text-sm tabular-nums text-muted-foreground">{completion}%</span>
      </div>

      <Progress value={completion} className="h-1.5 mb-4" />

      <div className="space-y-1.5">
        {steps.map((step) => (
          <Link key={step.label} href={step.href} onClick={step.onNavigate}>
            <div className={cn(
              'flex items-center gap-2.5 p-2 rounded-lg transition-colors',
              step.done ? 'opacity-50' : 'hover:bg-muted'
            )}>
              <div className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0',
                step.done
                  ? 'bg-primary text-primary-foreground'
                  : 'border-2 border-muted-foreground/30'
              )}>
                {step.done && <Check className="w-3 h-3" />}
              </div>
              <span className={cn(
                'text-sm',
                step.done && 'line-through text-muted-foreground'
              )}>
                {step.label}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-10 w-28 mt-3 sm:mt-0" />
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 lg:col-span-2 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      {/* Recent people */}
      <div>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
