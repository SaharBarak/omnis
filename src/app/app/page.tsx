'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/use-auth'
import { usePeople } from '@/lib/hooks/use-people'
import { useRelationships } from '@/lib/hooks/use-relationships'
import { useGroups } from '@/lib/hooks/use-groups'
import { useBoards } from '@/lib/hooks/use-boards'
import { dateToKin, kinToSeal, kinToTone } from '@/lib/calculations/dreamspell'
import { getSeal } from '@/lib/data/seals'
import { getTone } from '@/lib/data/tones'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  PageHeader,
  StatCard,
  TodayKin,
  PersonPreview,
  ProfileProgress,
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
} from 'lucide-react'

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

        {/* Profile progress */}
        <ProfileProgress
          displayName={profile?.display_name}
          birthDate={profile?.birth_date}
          hebrewName={profile?.hebrew_name}
          peopleCount={counts.people}
          relationshipCount={counts.relationships}
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
