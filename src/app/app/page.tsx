'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/use-auth'
import { usePeople } from '@/lib/hooks/use-people'
import { useRelationships } from '@/lib/hooks/use-relationships'
import { useGroups } from '@/lib/hooks/use-groups'
import { useBoards } from '@/lib/hooks/use-boards'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { dateToKin, kinToSeal, kinToTone } from '@/lib/calculations/dreamspell'
import { calculateOracle } from '@/lib/calculations/oracle'
import { getSeal } from '@/lib/data/seals'
import { getTone } from '@/lib/data/tones'
import { generateMantra } from '@/lib/data/mantras'
import { getWavespell } from '@/lib/calculations/wavespell'
import { kinToCastle } from '@/lib/calculations/cycles'

// Today's date
function getTodayDateString(): string {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

// Get greeting based on time of day
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

// Format date for display
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const { people, loading: peopleLoading } = usePeople()
  const { relationships, loading: relationshipsLoading } = useRelationships()
  const { groups, loading: groupsLoading } = useGroups()
  const { boards, loading: boardsLoading } = useBoards()

  // Calculate today's Kin
  const todayKin = useMemo(() => {
    const today = getTodayDateString()
    const kin = dateToKin(today)
    const seal = getSeal(kinToSeal(kin))
    const tone = getTone(kinToTone(kin))
    const oracle = calculateOracle(kin)
    const mantra = generateMantra(seal, tone)
    const wavespell = getWavespell(kin)
    const wavespellSeal = getSeal(wavespell.sealNumber)
    const castle = kinToCastle(kin)

    return {
      kin,
      seal,
      tone,
      oracle,
      mantra,
      wavespell,
      wavespellSealName: wavespellSeal.english,
      castleName: castle.name,
    }
  }, [])

  // Calculate user's personal Kin (if they have birth date)
  const userKin = useMemo(() => {
    if (!profile?.birth_date) return null

    const kin = dateToKin(profile.birth_date)
    const seal = getSeal(kinToSeal(kin))
    const tone = getTone(kinToTone(kin))

    return { kin, seal, tone }
  }, [profile?.birth_date])

  // Get relationship between today's Kin and user's Kin
  const todayRelationship = useMemo(() => {
    if (!userKin) return null

    const todaySealNum = kinToSeal(todayKin.kin)
    const userSealNum = kinToSeal(userKin.kin)
    const userOracle = calculateOracle(userKin.kin)

    if (todaySealNum === userSealNum) return { type: 'Self', description: 'Today resonates with your core energy' }
    if (todaySealNum === userOracle.guide) return { type: 'Guide', description: 'A day of guidance and higher wisdom' }
    if (todaySealNum === userOracle.analog) return { type: 'Analog', description: 'A supportive and harmonious day' }
    if (todaySealNum === userOracle.antipode) return { type: 'Antipode', description: 'A day of challenge and growth' }
    if (todaySealNum === userOracle.occult) return { type: 'Occult', description: 'A day of hidden gifts and magic' }

    return null
  }, [todayKin, userKin])

  // Recent people (last 4 added)
  const recentPeople = useMemo(() => {
    return [...people]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 4)
  }, [people])

  // Counts
  const counts = {
    people: people.length,
    relationships: relationships.length,
    groups: groups.length,
    boards: boards.length,
  }

  const isLoading = peopleLoading || relationshipsLoading || groupsLoading || boardsLoading

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading">
          {getGreeting()}, {profile?.display_name || 'Explorer'}
        </h1>
        <p className="text-muted-foreground">
          {formatDate(new Date())}
        </p>
      </div>

      {/* Today's Kin - Hero Card */}
      <div className="hero-card p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center">
          {/* Seal Icon */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-card/50 flex items-center justify-center border border-border">
              <img
                src={`/icons/dreamspell/seals/${String(todayKin.seal.number).padStart(2, '0')}-${todayKin.seal.mayan.toLowerCase()}.svg`}
                alt={todayKin.seal.english}
                className="w-14 h-14 md:w-16 md:h-16"
              />
            </div>
          </div>

          {/* Kin Info */}
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wider">Today&apos;s Energy</p>
              <h2 className="text-2xl md:text-3xl font-heading font-bold">
                Kin <span className="text-gold-gradient">{todayKin.kin}</span>
              </h2>
              <p className="text-lg md:text-xl text-foreground/90">
                {todayKin.tone.name} {todayKin.seal.english}
              </p>
            </div>

            {/* Mantra */}
            {todayKin.mantra && (
              <p className="text-sm md:text-base text-muted-foreground italic">
                &ldquo;{todayKin.mantra}&rdquo;
              </p>
            )}

            {/* Context */}
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-card/50 border border-border">
                Wavespell: {todayKin.wavespellSealName}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-card/50 border border-border">
                Castle: {todayKin.castleName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats + Profile Snapshot */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-heading">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/app/people" className="stat-card">
                <div className="stat-value">{isLoading ? '...' : counts.people}</div>
                <div className="stat-label">People</div>
              </Link>
              <Link href="/app/relationships" className="stat-card">
                <div className="stat-value">{isLoading ? '...' : counts.relationships}</div>
                <div className="stat-label">Relationships</div>
              </Link>
              <Link href="/app/groups" className="stat-card">
                <div className="stat-value">{isLoading ? '...' : counts.groups}</div>
                <div className="stat-label">Groups</div>
              </Link>
              <Link href="/app/boards" className="stat-card">
                <div className="stat-value">{isLoading ? '...' : counts.boards}</div>
                <div className="stat-label">Boards</div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Profile Snapshot */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-heading">Your Signature</CardTitle>
          </CardHeader>
          <CardContent>
            {userKin ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                    <img
                      src={`/icons/dreamspell/seals/${String(userKin.seal.number).padStart(2, '0')}-${userKin.seal.mayan.toLowerCase()}.svg`}
                      alt={userKin.seal.english}
                      className="w-10 h-10"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Your Galactic Signature</p>
                    <p className="font-medium">
                      Kin {userKin.kin} — {userKin.tone.name} {userKin.seal.english}
                    </p>
                  </div>
                </div>

                {/* Today's relationship to user */}
                {todayRelationship && (
                  <div className="p-3 rounded-lg bg-muted/50 border border-border">
                    <p className="text-sm font-medium text-accent">
                      Today is your {todayRelationship.type} day
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {todayRelationship.description}
                    </p>
                  </div>
                )}

                <Link
                  href="/app/profile"
                  className="inline-flex text-sm text-primary hover:underline"
                >
                  View full profile →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  Add your birth date to see your Galactic Signature
                </p>
                <Link
                  href="/app/profile"
                  className="inline-flex text-sm text-primary hover:underline"
                >
                  Complete profile →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent People */}
      {recentPeople.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-heading font-semibold">Recent People</h2>
            <Link href="/app/people" className="text-sm text-primary hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recentPeople.map((person) => {
              const kin = dateToKin(person.birth_date)
              const seal = getSeal(kinToSeal(kin))
              const tone = getTone(kinToTone(kin))

              return (
                <Link key={person.id} href={`/app/people/${person.id}`}>
                  <Card className="hover:border-primary/30 transition-colors cursor-pointer h-full">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <img
                            src={`/icons/dreamspell/seals/${String(seal.number).padStart(2, '0')}-${seal.mayan.toLowerCase()}.svg`}
                            alt={seal.english}
                            className="w-7 h-7"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{person.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            Kin {kin} — {tone.name} {seal.english}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-heading font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/app/people">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-xl">👥</span>
                  <span>My People</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Add new people and view their symbolic maps
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/app/predictions">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-xl">🔮</span>
                  <span>Predictions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Daily, weekly and monthly forecasts
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/app/cards">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-xl">🎴</span>
                  <span>Print Cards</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Generate printable A5 person cards
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
