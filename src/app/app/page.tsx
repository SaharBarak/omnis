'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { dateToKin, kinToSeal, kinToTone } from '@pleiad/engine/calculations/dreamspell'
import { getSeal } from '@pleiad/engine/data/seals'
import { getTone } from '@pleiad/engine/data/tones'
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
  Check,
  X,
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/use-auth'
import { useSystemPreferences } from '@/lib/hooks/use-system-preferences'
import { usePeople } from '@/lib/hooks/use-people'
import { useRelationships } from '@/lib/hooks/use-relationships'
import { useGroups } from '@/lib/hooks/use-groups'
import { useBoards } from '@/lib/hooks/use-boards'
import { useShares } from '@/lib/hooks/use-shares'
import { cn } from '@/lib/utils'
import { getTodayAcrossSystems } from '@/lib/today-board'
import { COLORS } from '@/lib/design/landing-tokens'

import { Progress } from '@/components/ui/progress'
import {
  EASE_OUT,
  Eyebrow,
  FlapBoard,
  PageSection,
  SkeletonCard,
  SkeletonRows,
  VIEWPORT_ONCE,
  getFlavor,
  type FlapRow,
} from '@/components/app-kit'
import {
  PageHeader,
  StatCard,
  TodayKin,
  PersonPreview,
  QuickAction,
  WelcomeCard,
  EmptyState,
} from '@/components/dashboard'

const INTEGRATION_ACCENT = getFlavor('integration').accent
const DREAMSPELL_ACCENT = getFlavor('dreamspell').accent

/**
 * Get-to-value checklist state, persisted server-side on the profile under
 * `preferences.checklist` so progress follows the user across devices and
 * sessions (not trapped in one browser's localStorage).
 *
 * Signals that have no cheap server-side query use honest flags:
 * - mapSeen: set when the user clicks through the "See your map" step.
 *   (We cannot instrument /app/graph itself from this file, so the click-
 *   through is the simplest honest signal; a sidebar visit won't count
 *   until the user clicks the step once.)
 * - shared: set by ShareDialog on first successful share creation. Self-
 *   heals for pre-existing shares: while the step is unchecked we do one
 *   GET /api/shares and persist the flag if any share exists.
 * - dismissed: user closed the "You're set up" card.
 */
type ChecklistState = { mapSeen?: boolean; shared?: boolean; dismissed?: boolean }

function readChecklist(preferences: unknown): ChecklistState {
  const prefs = (preferences ?? {}) as Record<string, unknown>
  return (prefs.checklist as ChecklistState) ?? {}
}

function getGreeting(now: Date): string {
  const hour = now.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate(now: Date): string {
  return now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Galactic-birthday window (mobile parity —
 * packages/mobile/src/app/(tabs)/index.tsx).
 */
const BIRTHDAY_WINDOW_DAYS = 7
const TZOLKIN_CYCLE = 260
const MS_PER_DAY = 86_400_000

/**
 * Days until this person's kin recurs (260-day cycle). Ported verbatim
 * from packages/mobile/src/lib/people/reading.ts `nextGalacticBirthday`
 * — same math as the mobile Today screen, not new date logic. Returns
 * null for unparseable birth dates (mobile wraps the call in try/catch).
 */
function daysUntilKinReturn(birthDate: string, today: Date): number | null {
  const birthMs = new Date(`${birthDate}T00:00:00Z`).getTime()
  if (!Number.isFinite(birthMs)) return null
  const todayMs = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const daysSince = Math.max(0, Math.floor((todayMs - birthMs) / MS_PER_DAY))
  const remainder = daysSince % TZOLKIN_CYCLE
  return remainder === 0 ? 0 : TZOLKIN_CYCLE - remainder
}

/**
 * fadeUp entrance for blocks that aren't full PageSections (grid cells).
 * Mirrors PageSection's motion contract; the kit has no bare motion
 * wrapper primitive, so this lives here (reported as a kit gap).
 */
function Rise({
  index = 0,
  className,
  children,
}: {
  index?: number
  className?: string
  children: React.ReactNode
}) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT_ONCE}
      transition={{
        duration: 0.5,
        delay: index * 0.06,
        ease: EASE_OUT as [number, number, number, number],
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function DashboardPage() {
  const { profile, updateProfile } = useAuth()
  const { people, loading: peopleLoading } = usePeople()
  const { relationships, loading: relationshipsLoading } = useRelationships()
  const { groups, loading: groupsLoading } = useGroups()
  const { boards, loading: boardsLoading } = useBoards()
  const { shares, fetchShares } = useShares()

  // Stable "now", created once after mount so SSR markup and the client
  // agree (the engine's today service and greeting are time-dependent).
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
  }, [])

  // Client-persisted checklist flags (read once after mount; see
  // CHECKLIST_KEYS for what each signal means and why).
  const [mapSeen, setMapSeen] = useState(false)
  const [hasShared, setHasShared] = useState(false)
  const [checklistDismissed, setChecklistDismissed] = useState(false)
  const [flagsLoaded, setFlagsLoaded] = useState(false)

  // Persist a checklist flag change onto the profile (`preferences.checklist`).
  // Local state already reflects it, so a failed write is harmless — the flag
  // simply re-appears next session.
  const persistChecklist = useCallback(
    (patch: ChecklistState) => {
      const prefs = (profile?.preferences ?? {}) as Record<string, unknown>
      const checklist = { ...readChecklist(profile?.preferences), ...patch }
      updateProfile({
        preferences: { ...prefs, checklist },
      } as Parameters<typeof updateProfile>[0]).catch(() => {})
    },
    [profile?.preferences, updateProfile],
  )

  // Hydrate checklist flags from the server-persisted profile once it loads.
  useEffect(() => {
    if (!profile) return
    const cl = readChecklist(profile.preferences)
    setMapSeen(!!cl.mapSeen)
    setHasShared(!!cl.shared)
    setChecklistDismissed(!!cl.dismissed)
    setFlagsLoaded(true)
  }, [profile])

  // Self-heal the share flag: one cheap GET /api/shares, only while the
  // step is still unchecked and the card hasn't been dismissed.
  useEffect(() => {
    if (flagsLoaded && !hasShared && !checklistDismissed) fetchShares()
  }, [flagsLoaded, hasShared, checklistDismissed, fetchShares])

  useEffect(() => {
    if (!hasShared && shares.length > 0) {
      setHasShared(true)
      persistChecklist({ shared: true })
    }
  }, [shares.length, hasShared])

  const markMapSeen = useCallback(() => {
    setMapSeen(true)
    persistChecklist({ mapSeen: true })
  }, [persistChecklist])

  const dismissChecklist = useCallback(() => {
    setChecklistDismissed(true)
    persistChecklist({ dismissed: true })
  }, [persistChecklist])

  // "Today, across the systems" — pure engine call, computed client-side
  // from the mounted, stable `now` (@pleiad/engine/services/today). Rows
  // honour the user's preferred systems; if every row is toggled off the
  // full board shows (an empty hero would read as broken, not minimal).
  const { enabledSystems } = useSystemPreferences()
  const flapRows = useMemo<readonly FlapRow[]>(() => {
    if (!now) return []
    const board = getTodayAcrossSystems(now)
    const rows: (FlapRow & { system: keyof typeof enabledSystems })[] = [
      { label: 'Kin', value: board.kin.toUpperCase(), href: '/app/calendar', system: 'dreamspell' },
      { label: 'Moon', value: board.moon.toUpperCase(), href: '/app/moon', system: 'moon' },
      { label: 'Sun', value: board.sun.toUpperCase(), href: '/learn/astrology', system: 'astrology' },
      { label: 'Sidereal', value: board.sidereal.toUpperCase(), href: '/app/calendars/panchang', system: 'sidereal' },
      { label: 'Gate', value: board.gate.toUpperCase(), system: 'humandesign' },
      {
        label: 'Hebrew',
        value: board.hebrewDate ? board.hebrewDate.toUpperCase() : '—',
        href: '/app/calendars/hebrew',
        system: 'hebrew',
      },
      { label: 'Hijri', value: board.hijri ? board.hijri.toUpperCase() : '—', href: '/app/calendars/hijri', system: 'hijri' },
      { label: 'Persian', value: board.persian ? board.persian.toUpperCase() : '—', href: '/app/calendars/persian', system: 'persian' },
      { label: 'Chinese', value: board.chineseYear ? board.chineseYear.toUpperCase() : '—', href: '/app/calendars/chinese', system: 'chinese' },
      { label: 'Panchang', value: board.panchang.toUpperCase(), href: '/app/calendars/panchang', system: 'panchang' },
      { label: 'Long Count', value: board.longCount, href: '/app/calendars/long-count', system: 'longcount' },
    ]
    const visible = rows.filter((row) => enabledSystems[row.system] ?? true)
    return (visible.length > 0 ? visible : rows).map(({ system: _system, ...row }) => row)
  }, [now, enabledSystems])

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

  // People whose kin recurs today or within the week — omitted when none
  // (mobile Today-screen parity).
  const birthdays = useMemo(() => {
    if (!now) return []
    return people
      .flatMap((person) => {
        const daysUntil = daysUntilKinReturn(person.birth_date, now)
        return daysUntil !== null && daysUntil <= BIRTHDAY_WINDOW_DAYS
          ? [{ person, daysUntil }]
          : []
      })
      .sort((a, b) => a.daysUntil - b.daysUntil)
  }, [people, now])

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

  if (isLoading || !now) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <PageHeader
        meta={formatDate(now)}
        title={`${getGreeting(now)}, ${profile?.display_name || 'Explorer'}`}
        actions={
          !isNewUser && (
            <Link
              href="/app/people"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-soft active:scale-[0.98]"
            >
              <Plus className="size-4" strokeWidth={1.5} />
              Add Person
            </Link>
          )
        }
      />

      {/* Welcome card for new users */}
      {isNewUser && <WelcomeCard />}

      {/* Hero set piece — the split-flap board across the systems */}
      <PageSection index={0} accent={INTEGRATION_ACCENT} eyebrow="Today">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-white/90 md:text-3xl">
          Today, across the systems.
        </h2>
        <div className="feature-card">
          <FlapBoard rows={flapRows} />
          <p className="mt-4 text-xs text-white/35">(the calendars never stop)</p>
        </div>
      </PageSection>

      {/* Personal kin + get-to-value checklist */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Rise index={0} className="lg:col-span-2">
          <TodayKin userKin={userKin?.kin} now={now} className="h-full" />
        </Rise>
        <Rise index={1}>
          <SetupChecklist
            steps={checklistSteps}
            dismissed={checklistDismissed}
            onDismiss={dismissChecklist}
            userKin={userKin || undefined}
          />
        </Rise>
      </div>

      {/* Stats row */}
      <PageSection index={1} accent={COLORS.brand} eyebrow="Your library">
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
      </PageSection>

      {/* Galactic birthdays — kin recurrences landing within the week */}
      {birthdays.length > 0 && (
        <PageSection index={2} accent={DREAMSPELL_ACCENT} eyebrow="Galactic birthdays">
          <div className="divide-y divide-white/[0.07]">
            {birthdays.map(({ person, daysUntil }) => (
              <Link
                key={person.id}
                href={`/app/people/${person.id}`}
                aria-label={`${person.name}, galactic birthday ${
                  daysUntil === 0 ? 'today' : `in ${daysUntil} days`
                }`}
                className="flex items-center justify-between gap-6 py-3.5 transition-colors hover:text-white active:scale-[0.98]"
              >
                <span className="truncate text-sm text-white/90">{person.name}</span>
                <span className="shrink-0 text-sm tracking-tight text-brand-bright [font-variant-numeric:tabular-nums]">
                  {daysUntil === 0 ? 'TODAY' : `IN ${daysUntil}D`}
                </span>
              </Link>
            ))}
          </div>
        </PageSection>
      )}

      {/* Recent People */}
      {recentPeople.length > 0 && (
        <PageSection index={3} accent={COLORS.brand} eyebrow="Recent people">
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
          {people.length > 4 && (
            <Link
              href="/app/people"
              className="inline-flex w-fit items-center gap-1 text-sm text-brand-soft transition-colors hover:text-brand-bright"
            >
              View all {people.length} people <ArrowRight className="size-4" />
            </Link>
          )}
        </PageSection>
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

      {/* Explore — hairline-divided navigation rows, not a card row */}
      <PageSection index={4} accent={COLORS.brand} eyebrow="Explore">
        <div className="divide-y divide-white/[0.07]">
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
      </PageSection>

      {/* Keyboard shortcut hint */}
      <div className="hidden justify-center pt-4 md:flex">
        <div className="flex items-center gap-2 text-xs text-white/35">
          Press
          <kbd className="rounded border border-white/[0.07] bg-white/[0.04] px-2 py-1 font-mono text-[10px] text-white/50">
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
 * Get-to-value checklist card. Kit grammar: font-display header, mono
 * tabular completion numeral, hairline-divided step rows, tokened check
 * discs. Collapses to a small dismissible "You're set up" state once
 * every step is done, and to the galactic signature card after dismissal.
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
      <div className="surface-card h-full p-5">
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

  // All steps done — collapse into a small dismissible confirmation.
  if (allDone) {
    return (
      <div className="surface-card flex h-full items-start justify-between gap-3 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/15">
            <Check className="size-4 text-primary" />
          </div>
          <div>
            <p className="font-display font-semibold tracking-tight text-white/90">You&apos;re set up</p>
            <p className="text-sm text-white/50">Every step is complete. Enjoy the map.</p>
          </div>
        </div>
        <button
          type="button"
          aria-label="Dismiss setup checklist"
          onClick={onDismiss}
          className="-mr-1 -mt-1 rounded-full p-1.5 text-white/35 transition-colors hover:text-white/70 active:scale-[0.98]"
        >
          <X className="size-4" />
        </button>
      </div>
    )
  }

  // Steps remaining — show progress and the full checklist.
  return (
    <div className="surface-card h-full p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display font-semibold tracking-tight text-white/90">Get Set Up</h3>
        <span className="text-sm text-brand-bright [font-variant-numeric:tabular-nums]">{completion}%</span>
      </div>

      <Progress value={completion} className="mb-4 h-1.5" />

      <div className="divide-y divide-white/[0.07]">
        {steps.map((step) => (
          <Link key={step.label} href={step.href} onClick={step.onNavigate} className="block">
            <div
              className={cn(
                'flex items-center gap-2.5 py-2.5 transition-opacity',
                step.done && 'opacity-50'
              )}
            >
              <div
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                  step.done
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-white/[0.12]'
                )}
              >
                {step.done && <Check className="size-3" />}
              </div>
              <span
                className={cn(
                  'text-sm',
                  step.done ? 'text-white/50 line-through' : 'text-white/70'
                )}
              >
                {step.label}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

/** Layout-matched loading state — kit skeletons, never spinners. */
function DashboardSkeleton() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="skeleton-shimmer h-3 w-32 rounded" />
          <div className="skeleton-shimmer h-8 w-64 rounded" />
        </div>
        <div className="skeleton-shimmer mt-3 h-10 w-32 rounded-xl sm:mt-0" />
      </div>

      {/* Split-flap board */}
      <div className="feature-card">
        <SkeletonRows count={5} />
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <SkeletonCard className="h-64 lg:col-span-2" />
        <SkeletonCard className="h-64" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Recent people */}
      <div>
        <div className="skeleton-shimmer mb-4 h-4 w-32 rounded" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <SkeletonCard key={i} className="h-28" />
          ))}
        </div>
      </div>
    </div>
  )
}
