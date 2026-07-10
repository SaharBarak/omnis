'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { PersonWithTags } from '@/lib/hooks/use-people'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft,
  AlertTriangle,
  Settings,
  Orbit,
  CalendarDays,
  Landmark,
  Star,
  Dna,
  Hash,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { DreamspellSection, TzolkinSection } from '@/components/cards'
import { WavespellDisplay, CastleDisplay, PersonalYearDisplay, GalacticBirthdayDisplay } from '@/components/cards'
import { LongCountDisplay, HaabDisplay, CalendarRoundDisplay, MayanTimelineDisplay } from '@/components/cards'
import { AstrologyDisplay } from '@/components/cards'
import { HumanDesignDisplay } from '@/components/cards'
import { GematriaDisplay } from '@/components/cards'
import { CrossSystemInsights } from '@/components/cards'
import { dateToKin, kinToSeal, kinToTone } from '@pleiad/engine/calculations/dreamspell'
import { getSeal } from '@pleiad/engine/data/seals'
import { getTone } from '@pleiad/engine/data/tones'
import { getEarthFamily, getColorFamily } from '@pleiad/engine/calculations/cycles'
import { getLongCountData } from '@pleiad/engine/calculations/long-count'
import { calculateNatalChart, calculateSunSignChart } from '@pleiad/engine/calculations/astrology'
import { calculateBodygraph } from '@pleiad/engine/calculations/human-design'
import { standardGematria, digitalRoot as calcDigitalRoot } from '@pleiad/engine/calculations/gematria'
import { useSystemPreferences, type SystemKey } from '@/lib/hooks/use-system-preferences'

type TabKey = SystemKey | 'insights'

const SYSTEMS: { key: TabKey; label: string; icon: LucideIcon; requiresTime?: boolean; requiresLocation?: boolean }[] = [
  { key: 'dreamspell', label: 'Dreamspell', icon: Orbit },
  { key: 'tzolkin', label: 'Tzolkin', icon: CalendarDays },
  { key: 'longcount', label: 'Long Count', icon: Landmark },
  { key: 'astrology', label: 'Astrology', icon: Star, requiresTime: true, requiresLocation: true },
  { key: 'humandesign', label: 'Human Design', icon: Dna, requiresTime: true, requiresLocation: true },
  { key: 'gematria', label: 'Gematria', icon: Hash },
  { key: 'insights', label: 'Insights', icon: Sparkles },
]

export function PersonDetailView({ person }: { person: PersonWithTags }) {
  const { isSystemEnabled, loading: prefsLoading } = useSystemPreferences()
  const [activeTab, setActiveTab] = useState<TabKey>('dreamspell')

  // Filter systems based on user preferences (insights shown when 2+ systems enabled)
  const enabledSystemsCount = SYSTEMS.filter(s => s.key !== 'insights' && isSystemEnabled(s.key as SystemKey)).length
  const visibleSystems = SYSTEMS.filter(s => {
    if (s.key === 'insights') {
      return enabledSystemsCount >= 2
    }
    return isSystemEnabled(s.key as SystemKey)
  })

  if (prefsLoading) {
    return <PersonDetailSkeleton />
  }

  // Extract birth location if available (stored as JSON)
  const birthPlace = person.birth_place as { lat?: number; lng?: number; name?: string } | null
  const hasLocation = birthPlace?.lat !== undefined && birthPlace?.lng !== undefined
  const hasBirthTime = !!person.birth_time

  // Default to Tel Aviv coordinates if no location specified
  const latitude = birthPlace?.lat ?? 32.0853
  const longitude = birthPlace?.lng ?? 34.7818

  // Hebrew name for gematria, fallback to regular name
  const hebrewName = person.hebrew_name || person.name

  // Calculate Dreamspell Kin for the person
  const kin = dateToKin(person.birth_date)
  const sealNumber = kinToSeal(kin)
  const toneNumber = kinToTone(kin)
  const seal = getSeal(sealNumber)
  const tone = getTone(toneNumber)
  const earthFamily = getEarthFamily(sealNumber)
  const colorFamily = getColorFamily(sealNumber)

  // Calculate Long Count data
  const longCountData = getLongCountData(person.birth_date)

  // Calculate Astrology data for insights
  let astroSunSign = ''
  let astroMoonSign: string | null = null
  let astroDominantElement = ''
  let astroDominantModality = ''

  if (hasBirthTime) {
    try {
      const chart = calculateNatalChart({
        date: person.birth_date,
        time: person.birth_time!,
        latitude,
        longitude,
      })
      astroSunSign = chart.sunSign.id
      astroMoonSign = chart.moonSign.id
      // Find dominant element and modality
      const elements = Object.entries(chart.elementBalance)
      const modalities = Object.entries(chart.modalityBalance)
      astroDominantElement = elements.reduce((a, b) => a[1] > b[1] ? a : b)[0]
      astroDominantModality = modalities.reduce((a, b) => a[1] > b[1] ? a : b)[0]
    } catch (e) {
      // Fall back to sun sign chart
    }
  }

  if (!astroSunSign) {
    try {
      const chart = calculateSunSignChart(person.birth_date, latitude, longitude)
      astroSunSign = chart.sunSign.id
      const moon = chart.planets.find(p => p.planet.id === 'moon')
      if (moon) {
        astroMoonSign = moon.sign.id
      }
    } catch (e) {
      // Ignore errors
    }
  }

  // Calculate Human Design data for insights
  let hdType = ''
  let hdStrategy = ''
  let hdAuthority = ''
  let hdProfile: string | null = null
  let hdDefinedCenters: string[] = []

  if (hasBirthTime) {
    try {
      const result = calculateBodygraph({
        birthDate: person.birth_date,
        birthTime: person.birth_time || null,
        latitude,
        longitude,
      })
      if (result.hasBirthTime) {
        const bodygraph = result as import('@pleiad/engine/types/human-design').Bodygraph
        hdType = bodygraph.type
        hdStrategy = bodygraph.typeDefinition.strategy
        hdAuthority = bodygraph.authority
        hdProfile = bodygraph.profile.name
        hdDefinedCenters = [...bodygraph.definedCenters]
      }
    } catch (e) {
      // Ignore errors
    }
  }

  // Calculate Gematria data for insights
  let gematriaValue = 0
  let gematriaDigitalRoot = 0
  let gematriaLetterCount = 0

  if (hebrewName) {
    try {
      gematriaValue = standardGematria(hebrewName)
      gematriaDigitalRoot = calcDigitalRoot(gematriaValue)
      gematriaLetterCount = hebrewName.replace(/\s/g, '').length
    } catch (e) {
      // Ignore errors
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/app/people">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">{person.name}</h1>
            {person.hebrew_name && person.hebrew_name !== person.name && (
              <p className="text-lg text-muted-foreground">{person.hebrew_name}</p>
            )}
          </div>
        </div>
        <Badge variant="secondary" className="font-mono text-sm tabular-nums">
          Kin {kin}
        </Badge>
      </div>

      {/* Person Info Card */}
      <div className="surface-card p-5">
        <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground mb-4">Personal Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <span className="text-sm text-muted-foreground block mb-1">Birth Date</span>
            <span className="font-medium text-foreground">{new Date(person.birth_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          {person.birth_time && (
            <div>
              <span className="text-sm text-muted-foreground block mb-1">Birth Time</span>
              <span className="font-medium text-foreground">{person.birth_time}</span>
            </div>
          )}
          {birthPlace?.name && (
            <div>
              <span className="text-sm text-muted-foreground block mb-1">Birth Place</span>
              <span className="font-medium text-foreground">{birthPlace.name}</span>
            </div>
          )}
        </div>
        {person.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-4 mt-4 border-t border-border">
            {person.tags.map(tag => (
              <Badge
                key={tag.id}
                variant="secondary"
                style={{ backgroundColor: tag.color + '20', color: tag.color }}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
        {person.notes && (
          <div className="pt-4 mt-4 border-t border-border text-sm text-muted-foreground">
            {person.notes}
          </div>
        )}
      </div>

      {/* Missing data warnings */}
      {(!hasBirthTime || !hasLocation) && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            {!hasBirthTime && !hasLocation && (
              <p>Birth time and place not specified. Astrology and Human Design will be shown as approximations only.</p>
            )}
            {!hasBirthTime && hasLocation && (
              <p>Birth time not specified. Astrology and Human Design will be shown as approximations only.</p>
            )}
            {hasBirthTime && !hasLocation && (
              <p>Birth place not specified. Astrology and Human Design will use default location (Tel Aviv).</p>
            )}
          </div>
        </div>
      )}

      {/* Systems Tabs */}
      {visibleSystems.length === 0 ? (
        <div className="surface-card p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Settings className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground mb-1">No systems enabled</p>
          <p className="text-sm text-muted-foreground mb-4">
            Enable symbolic systems in settings to see this person&apos;s readings.
          </p>
          <Button variant="outline" asChild>
            <Link href="/app/settings">
              <Settings className="w-4 h-4 mr-2" />
              System Settings
            </Link>
          </Button>
        </div>
      ) : (
      <Tabs value={visibleSystems.some(s => s.key === activeTab) ? activeTab : visibleSystems[0]?.key || 'dreamspell'} onValueChange={(v) => setActiveTab(v as TabKey)} className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 p-1">
          {visibleSystems.map((system) => {
            const SystemIcon = system.icon
            return (
              <TabsTrigger
                key={system.key}
                value={system.key}
                className="flex-1 min-w-[100px] gap-1.5"
              >
                <SystemIcon className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">{system.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* Dreamspell Tab */}
        <TabsContent value="dreamspell" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="surface-card p-5">
              <h3 className="font-display font-semibold tracking-tight text-foreground mb-1">Birthday Kin</h3>
              <p className="text-sm text-muted-foreground mb-4">Galactic Signature according to the Dreamspell</p>
              <DreamspellSection date={person.birth_date} />
            </div>

            <div className="surface-card p-5">
              <h3 className="font-display font-semibold tracking-tight text-foreground mb-1">Wavespell</h3>
              <p className="text-sm text-muted-foreground mb-4">Position in the 13-day wave</p>
              <WavespellDisplay kin={kin} showLabels />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="surface-card p-5">
              <h3 className="font-display font-semibold tracking-tight text-foreground mb-1">Castle</h3>
              <p className="text-sm text-muted-foreground mb-4">Position in the 52-day cycle</p>
              <CastleDisplay kin={kin} />
            </div>

            <div className="surface-card p-5">
              <h3 className="font-display font-semibold tracking-tight text-foreground mb-1">Personal Year</h3>
              <p className="text-sm text-muted-foreground mb-4">Annual Kin</p>
              <PersonalYearDisplay birthDate={person.birth_date} />
            </div>
          </div>

          <div className="surface-card p-5">
            <h3 className="font-display font-semibold tracking-tight text-foreground mb-1">Galactic Birthday</h3>
            <p className="text-sm text-muted-foreground mb-4">Date of the next Galactic Birthday</p>
            <GalacticBirthdayDisplay birthDate={person.birth_date} />
          </div>
        </TabsContent>

        {/* Tzolkin Tab */}
        <TabsContent value="tzolkin" className="space-y-6 mt-6">
          <div className="surface-card p-5">
            <h3 className="font-display font-semibold tracking-tight text-foreground mb-1">Traditional Tzolkin</h3>
            <p className="text-sm text-muted-foreground mb-4">The traditional Mayan calendar (260 days)</p>
            <TzolkinSection date={person.birth_date} />
          </div>
        </TabsContent>

        {/* Long Count Tab */}
        <TabsContent value="longcount" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="surface-card p-5">
              <h3 className="font-display font-semibold tracking-tight text-foreground mb-1">Long Count</h3>
              <p className="text-sm text-muted-foreground mb-4">Birth date in the Mayan Long Count</p>
              <LongCountDisplay dateStr={person.birth_date} showLabels showDaysSinceCreation />
            </div>

            <div className="surface-card p-5">
              <h3 className="font-display font-semibold tracking-tight text-foreground mb-1">Haab (Solar Year)</h3>
              <p className="text-sm text-muted-foreground mb-4">The 365-day solar calendar</p>
              <HaabDisplay dateStr={person.birth_date} showMonthIndex />
            </div>
          </div>

          <div className="surface-card p-5">
            <h3 className="font-display font-semibold tracking-tight text-foreground mb-1">Calendar Round</h3>
            <p className="text-sm text-muted-foreground mb-4">Combination of Tzolkin and Haab - 52-year cycle</p>
            <CalendarRoundDisplay dateStr={person.birth_date} />
          </div>

          <div className="surface-card p-5">
            <h3 className="font-display font-semibold tracking-tight text-foreground mb-1">Mayan Timeline</h3>
            <p className="text-sm text-muted-foreground mb-4">Significant events in the Mayan calendar</p>
            <MayanTimelineDisplay
              birthDateStr={person.birth_date}
              showTunBirthdays
              showKatunBirthdays
              showCalendarRoundReturn
            />
          </div>
        </TabsContent>

        {/* Astrology Tab */}
        <TabsContent value="astrology" className="space-y-6 mt-6">
          <div className="surface-card p-5">
            <h3 className="font-display font-semibold tracking-tight text-foreground mb-1">Birth Chart</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Western Astrology - Planet positions at birth
              {!hasBirthTime && <span className="text-amber-600 ml-2">(without birth time - approximate)</span>}
            </p>
            <AstrologyDisplay
              date={person.birth_date}
              time={person.birth_time || undefined}
              latitude={latitude}
              longitude={longitude}
              showPlanets
              showAspects
              showBalance
            />
          </div>
        </TabsContent>

        {/* Human Design Tab */}
        <TabsContent value="humandesign" className="space-y-6 mt-6">
          <div className="surface-card p-5">
            <h3 className="font-display font-semibold tracking-tight text-foreground mb-1">Human Design</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Type, Strategy, and Authority
              {!hasBirthTime && <span className="text-amber-600 ml-2">(without birth time - approximate)</span>}
            </p>
            <HumanDesignDisplay
              date={person.birth_date}
              time={person.birth_time || undefined}
              latitude={latitude}
              longitude={longitude}
              showActivations
              showChannels
              showCenters
            />
          </div>
        </TabsContent>

        {/* Gematria Tab */}
        <TabsContent value="gematria" className="space-y-6 mt-6">
          <div className="surface-card p-5">
            <h3 className="font-display font-semibold tracking-tight text-foreground mb-1">Gematria</h3>
            <p className="text-sm text-muted-foreground mb-4">Numerical values of the Hebrew name</p>
            <GematriaDisplay
              text={hebrewName}
              showBreakdown
              showAllMethods
              showNotable
            />
          </div>
        </TabsContent>

        {/* Cross-System Insights Tab */}
        <TabsContent value="insights" className="space-y-6 mt-6">
          <div className="surface-card p-5">
            <h3 className="font-display font-semibold tracking-tight text-foreground mb-1">Cross-System Insights</h3>
            <p className="text-sm text-muted-foreground mb-4">Connections and patterns across different systems</p>
            <CrossSystemInsights
                dreamspell={{
                  kin,
                  seal: sealNumber,
                  tone: toneNumber,
                  sealName: seal.english,
                  toneName: tone.name,
                  earthFamily: earthFamily.name,
                  colorFamily: colorFamily.color,
                }}
                astrology={astroSunSign ? {
                  sunSign: astroSunSign,
                  moonSign: astroMoonSign,
                  dominantElement: astroDominantElement,
                  dominantModality: astroDominantModality,
                } : null}
                humanDesign={hdType ? {
                  type: hdType,
                  strategy: hdStrategy,
                  authority: hdAuthority,
                  profile: hdProfile,
                  definedCenters: hdDefinedCenters,
                } : null}
                gematria={gematriaValue > 0 ? {
                  standardValue: gematriaValue,
                  digitalRoot: gematriaDigitalRoot,
                  letterCount: gematriaLetterCount,
                } : null}
                longCount={{
                  baktun: longCountData.longCount.baktun,
                  katun: longCountData.longCount.katun,
                  tun: longCountData.longCount.tun,
                  daysSinceCreation: longCountData.daysSinceCreation,
                }}
              />
          </div>
        </TabsContent>
      </Tabs>
      )}
    </div>
  )
}

// Loading skeleton
export function PersonDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      {/* Info card */}
      <div className="rounded-xl border border-border bg-card p-5">
        <Skeleton className="h-4 w-32 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-4">
        <div className="flex gap-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
