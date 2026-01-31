'use client'

import { useMemo, Suspense } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/hooks/use-auth'
import { usePeople } from '@/lib/hooks/use-people'
import { useRelationships } from '@/lib/hooks/use-relationships'
import { useGroups } from '@/lib/hooks/use-groups'
import { useBoards } from '@/lib/hooks/use-boards'
import { dateToKin, kinToSeal, kinToTone } from '@/lib/calculations/dreamspell'
import { calculateOracle } from '@/lib/calculations/oracle'
import { getSeal } from '@/lib/data/seals'
import { getTone } from '@/lib/data/tones'
import { generateMantra } from '@/lib/data/mantras'
import { kinToWavespell } from '@/lib/calculations/wavespell'
import { kinToCastle } from '@/lib/calculations/cycles'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
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
  ChevronRight,
  Calendar,
  Zap,
} from 'lucide-react'

// Dynamic imports for Three.js components
const ThreeBackground = dynamic(
  () => import('@/components/dashboard/three-background').then((mod) => mod.ThreeBackground),
  { ssr: false }
)

const OracleCanvas = dynamic(
  () => import('@/components/dashboard/oracle-canvas').then((mod) => mod.OracleCanvas),
  { ssr: false }
)

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
}

// Utility functions
function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0]
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

// Stat card component - uses p-4 for compact cards, with touch feedback
function StatCard({
  label,
  value,
  icon: Icon,
  href,
  color,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  href: string
  color: string
}) {
  return (
    <Link href={href}>
      <Card className="group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 border-border/50 bg-card/80 backdrop-blur-sm active:scale-[0.98]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold tabular-nums">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
            <div className={`p-3 rounded-xl ${color} transition-transform group-hover:scale-110`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

// Quick action card - uses p-6 for feature cards, with hover:hover media query pattern
function QuickAction({
  title,
  description,
  icon: Icon,
  href,
}: {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
}) {
  return (
    <Link href={href}>
      <Card className="group cursor-pointer h-full transition-all hover:shadow-lg hover:border-primary/50 border-border/50 bg-card/80 backdrop-blur-sm active:scale-[0.98]">
        <CardContent className="p-6 flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-muted group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        </CardContent>
      </Card>
    </Link>
  )
}

// Person card - uses p-4 for compact cards, with touch feedback
function PersonCard({
  person,
  kin,
  seal,
  tone,
}: {
  person: any
  kin: number
  seal: any
  tone: any
}) {
  return (
    <Link href={`/app/people/${person.id}`}>
      <Card className="group cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 border-border/50 bg-card/80 backdrop-blur-sm active:scale-[0.98]">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-primary">{kin}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate group-hover:text-primary transition-colors">
                {person.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {tone.name} {seal.english}
              </p>
            </div>
          </div>
          {person.tags?.length > 0 && (
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {person.tags.slice(0, 2).map((tag: any) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="text-[10px]"
                  style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                >
                  {tag.name}
                </Badge>
              ))}
              {person.tags.length > 2 && (
                <Badge variant="secondary" className="text-[10px]">
                  +{person.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const { people, loading: peopleLoading } = usePeople()
  const { relationships, loading: relationshipsLoading } = useRelationships()
  const { groups, loading: groupsLoading } = useGroups()
  const { boards, loading: boardsLoading } = useBoards()

  const todayKin = useMemo(() => {
    const today = getTodayDateString()
    const kin = dateToKin(today)
    const seal = getSeal(kinToSeal(kin))
    const tone = getTone(kinToTone(kin))
    const oracle = calculateOracle(kin)
    const mantra = generateMantra(seal, tone)
    const wavespell = kinToWavespell(kin)
    const wavespellSeal = getSeal(wavespell.sealNumber)
    const castle = kinToCastle(kin)
    return { kin, seal, tone, oracle, mantra, wavespellSealName: wavespellSeal.english, castleName: castle.name, sealNumber: seal.number }
  }, [])

  const userKin = useMemo(() => {
    if (!profile?.birth_date) return null
    const kin = dateToKin(profile.birth_date)
    const seal = getSeal(kinToSeal(kin))
    const tone = getTone(kinToTone(kin))
    return { kin, seal, tone, sealNumber: seal.number }
  }, [profile?.birth_date])

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

  const recentPeople = useMemo(() => {
    return [...people]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 4)
      .map((person) => {
        const kin = dateToKin(person.birth_date)
        return { person, kin, seal: getSeal(kinToSeal(kin)), tone: getTone(kinToTone(kin)) }
      })
  }, [people])

  const counts = useMemo(() => ({
    people: people.length,
    relationships: relationships.length,
    groups: groups.length,
    boards: boards.length,
  }), [people.length, relationships.length, groups.length, boards.length])

  const isLoading = peopleLoading || relationshipsLoading || groupsLoading || boardsLoading

  // Detect new user state (0 people and 0 relationships)
  const isNewUser = counts.people === 0 && counts.relationships === 0

  const profileCompletion = useMemo(() => {
    let score = 0
    if (profile?.display_name) score++
    if (profile?.birth_date) score++
    if (profile?.hebrew_name) score++
    if (counts.people > 0) score++
    if (counts.relationships > 0) score++
    return Math.round((score / 5) * 100)
  }, [profile, counts])

  if (isLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      {/* Three.js Background */}
      <Suspense fallback={null}>
        <ThreeBackground />
      </Suspense>

      <motion.div
        className="relative z-10 space-y-8"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        {/* Header */}
        <motion.div variants={fadeIn} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {getGreeting()},{' '}
              <span className="text-primary">{profile?.display_name || 'Explorer'}</span>
            </h1>
          </div>
          {!isNewUser && (
            <Button asChild size="lg" className="gap-2">
              <Link href="/app/people">
                <Plus className="w-4 h-4" />
                Add Person
              </Link>
            </Button>
          )}
        </motion.div>

        {/* Welcome CTA for new users - prominent position above stats */}
        {isNewUser && (
          <motion.div variants={fadeIn}>
            <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-card/80 to-secondary/5 backdrop-blur-sm">
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium text-primary">Welcome to Omnis</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold mb-2">
                      Begin your symbolic journey
                    </h2>
                    <p className="text-muted-foreground max-w-lg">
                      Start by adding yourself and the people in your life to discover your unique Galactic Signatures and explore the connections between you.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <Button asChild size="lg" className="gap-2">
                      <Link href="/app/people">
                        <Plus className="w-4 h-4" />
                        Add Your First Person
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                      <Link href="/app/profile">
                        Complete Profile
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Today's Energy Card - Spans 2 cols on large screens */}
          <motion.div variants={fadeIn} className="lg:col-span-2">
            <Card className="overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm">
              <div className="grid md:grid-cols-2">
                {/* Oracle Visualization */}
                <div className="h-[280px] md:h-[320px] bg-gradient-to-br from-primary/5 to-secondary/5">
                  <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><Skeleton className="w-32 h-32 rounded-full" /></div>}>
                    <OracleCanvas kin={todayKin.kin} sealNumber={todayKin.sealNumber} className="w-full h-full" />
                  </Suspense>
                </div>

                {/* Kin Info */}
                <div className="p-6 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                    </span>
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Today&apos;s Energy
                    </span>
                  </div>

                  <h2 className="text-4xl font-bold mb-1">
                    Kin <span className="text-primary">{todayKin.kin}</span>
                  </h2>
                  <p className="text-xl text-muted-foreground mb-4">
                    {todayKin.tone.name} {todayKin.seal.english}
                  </p>

                  {todayKin.mantra && (
                    <blockquote className="text-sm italic text-muted-foreground border-l-2 border-primary/30 pl-3 mb-4">
                      &ldquo;{todayKin.mantra}&rdquo;
                    </blockquote>
                  )}

                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary">{todayKin.wavespellSealName} Wavespell</Badge>
                    <Badge variant="outline">{todayKin.castleName} Castle</Badge>
                  </div>

                  {todayRelationship && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <Zap className="w-5 h-5 text-primary shrink-0" />
                      <div>
                        <p className="font-medium text-sm">Your {todayRelationship.type} Day</p>
                        <p className="text-xs text-muted-foreground">{todayRelationship.description}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Profile / Progress Card */}
          <motion.div variants={fadeIn}>
            <Card className="h-full border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {profileCompletion < 100 ? 'Complete Your Profile' : 'Your Signature'}
                </CardTitle>
                {profileCompletion < 100 && (
                  <CardDescription>{profileCompletion}% complete</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {profileCompletion < 100 ? (
                  <div className="space-y-4">
                    <Progress value={profileCompletion} className="h-2" />
                    <div className="space-y-2">
                      {[
                        { done: !!profile?.display_name, label: 'Set display name', href: '/app/profile' },
                        { done: !!profile?.birth_date, label: 'Add birth date', href: '/app/profile' },
                        { done: counts.people > 0, label: 'Add first person', href: '/app/people' },
                      ].map((item, i) => (
                        <Link key={i} href={item.href} className="block">
                          <div className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${item.done ? 'opacity-50' : 'hover:bg-muted'}`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${item.done ? 'bg-primary text-primary-foreground' : 'border-2 border-muted-foreground'}`}>
                              {item.done && '✓'}
                            </div>
                            <span className={`text-sm ${item.done ? 'line-through text-muted-foreground' : ''}`}>
                              {item.label}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : userKin ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary">{userKin.kin}</span>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Galactic Signature</p>
                        <p className="font-semibold">{userKin.tone.name} {userKin.seal.english}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild className="p-0 h-auto">
                      <Link href="/app/profile" className="flex items-center gap-1 text-primary">
                        View profile <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <p className="text-sm text-muted-foreground mb-3">
                      Add your birth date to discover your Galactic Signature
                    </p>
                    <Button asChild size="sm">
                      <Link href="/app/profile">Complete Profile</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Stats Row */}
        <motion.div variants={fadeIn} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="People" value={counts.people} icon={Users} href="/app/people" color="bg-blue-500/10 text-blue-500" />
          <StatCard label="Relationships" value={counts.relationships} icon={Heart} href="/app/relationships" color="bg-rose-500/10 text-rose-500" />
          <StatCard label="Groups" value={counts.groups} icon={UsersRound} href="/app/groups" color="bg-amber-500/10 text-amber-500" />
          <StatCard label="Boards" value={counts.boards} icon={LayoutGrid} href="/app/boards" color="bg-emerald-500/10 text-emerald-500" />
        </motion.div>

        {/* Recent People */}
        {recentPeople.length > 0 && (
          <motion.div variants={fadeIn}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recent People</h2>
              {people.length > 4 && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/app/people" className="flex items-center gap-1">
                    View all <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              )}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentPeople.map(({ person, kin, seal, tone }) => (
                <PersonCard key={person.id} person={person} kin={kin} seal={seal} tone={tone} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Secondary empty state - only shown if not a new user but no recent people */}
        {recentPeople.length === 0 && !isNewUser && (
          <motion.div variants={fadeIn}>
            <Card className="border-dashed border-2 border-border/50 bg-card/50">
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No people yet</h3>
                <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                  Start by adding yourself and the people in your life to explore their symbolic maps.
                </p>
                <Button asChild>
                  <Link href="/app/people">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Person
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div variants={fadeIn}>
          <h2 className="text-xl font-semibold mb-4">Explore</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
        </motion.div>

        {/* Footer hint */}
        <motion.div variants={fadeIn} className="hidden md:flex justify-center py-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            Press
            <kbd className="px-2 py-1 rounded bg-muted border text-[10px] font-mono">⌘K</kbd>
            to search
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <Skeleton className="h-4 w-40 mb-2" />
          <Skeleton className="h-10 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Skeleton className="h-[320px] rounded-xl" />
        </div>
        <Skeleton className="h-[320px] rounded-xl" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      <div>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
