'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Person, Tag } from '@/lib/supabase/database.types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DreamspellSection, TzolkinSection } from '@/components/cards'
import { WavespellDisplay, CastleDisplay, PersonalYearDisplay, GalacticBirthdayDisplay } from '@/components/cards'
import { LongCountDisplay, HaabDisplay, CalendarRoundDisplay, MayanTimelineDisplay } from '@/components/cards'
import { AstrologyDisplay } from '@/components/cards'
import { HumanDesignDisplay } from '@/components/cards'
import { GematriaDisplay } from '@/components/cards'
import { CrossSystemInsights } from '@/components/cards'
import { dateToKin, kinToSeal, kinToTone } from '@/lib/calculations/dreamspell'
import { getSeal } from '@/lib/data/seals'
import { getTone } from '@/lib/data/tones'
import { getEarthFamily, getColorFamily } from '@/lib/calculations/cycles'
import { getLongCountData } from '@/lib/calculations/long-count'
import { calculateNatalChart, calculateSunSignChart } from '@/lib/calculations/astrology'
import { calculateBodygraph } from '@/lib/calculations/human-design'
import { standardGematria, digitalRoot as calcDigitalRoot } from '@/lib/calculations/gematria'
import { useSystemPreferences, type SystemKey } from '@/lib/hooks/use-system-preferences'

interface PersonWithTags extends Person {
  tags: Tag[]
}

type TabKey = SystemKey | 'insights'

const SYSTEMS: { key: TabKey; label: string; labelHe: string; icon: string; requiresTime?: boolean; requiresLocation?: boolean }[] = [
  { key: 'dreamspell', label: 'Dreamspell', labelHe: 'דרימספל', icon: '🌈' },
  { key: 'tzolkin', label: 'Tzolkin', labelHe: 'צולקין', icon: '🗓️' },
  { key: 'longcount', label: 'Long Count', labelHe: 'לונג קאונט', icon: '🏛️' },
  { key: 'astrology', label: 'Astrology', labelHe: 'אסטרולוגיה', icon: '⭐', requiresTime: true, requiresLocation: true },
  { key: 'humandesign', label: 'Human Design', labelHe: 'עיצוב אנושי', icon: '🧬', requiresTime: true, requiresLocation: true },
  { key: 'gematria', label: 'Gematria', labelHe: 'גימטריה', icon: '🔢' },
  { key: 'insights', label: 'Insights', labelHe: 'תובנות', icon: '✨' },
]

function BackArrow() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <path d="M12 19l7-7-7-7" />
    </svg>
  )
}

export default function PersonDetailPage() {
  const params = useParams()
  const router = useRouter()
  const personId = params.id as string
  const { enabledSystems, isSystemEnabled, loading: prefsLoading } = useSystemPreferences()

  const [person, setPerson] = useState<PersonWithTags | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('dreamspell')

  // Filter systems based on user preferences (insights shown when 2+ systems enabled)
  const enabledSystemsCount = SYSTEMS.filter(s => s.key !== 'insights' && isSystemEnabled(s.key as SystemKey)).length
  const visibleSystems = SYSTEMS.filter(s => {
    if (s.key === 'insights') {
      return enabledSystemsCount >= 2
    }
    return isSystemEnabled(s.key as SystemKey)
  })

  // Load person data
  useEffect(() => {
    async function loadPerson() {
      const supabase = createClient()

      // Fetch person
      const { data: personData, error: personError } = await supabase
        .from('people')
        .select('*')
        .eq('id', personId)
        .is('deleted_at', null)
        .single()

      if (personError || !personData) {
        setError('Person not found')
        setLoading(false)
        return
      }

      // Fetch person's tags
      const { data: personTags } = await supabase
        .from('person_tags')
        .select('tag_id')
        .eq('person_id', personId)

      const tagIds = personTags?.map(pt => pt.tag_id) || []

      let tags: Tag[] = []
      if (tagIds.length > 0) {
        const { data: tagsData } = await supabase
          .from('tags')
          .select('*')
          .in('id', tagIds)
        tags = tagsData || []
      }

      setPerson({ ...personData, tags })
      setLoading(false)
    }

    loadPerson()
  }, [personId])

  if (loading || prefsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (error || !person) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-center text-destructive">{error || 'Person not found'}</div>
        <Button variant="outline" onClick={() => router.push('/app/people')}>
          Back to List
        </Button>
      </div>
    )
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
  let astroSunSignHebrew = ''
  let astroMoonSign: string | null = null
  let astroMoonSignHebrew: string | null = null
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
      astroSunSignHebrew = chart.sunSign.hebrew
      astroMoonSign = chart.moonSign.id
      astroMoonSignHebrew = chart.moonSign.hebrew
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
      astroSunSignHebrew = chart.sunSign.hebrew
      const moon = chart.planets.find(p => p.planet.id === 'moon')
      if (moon) {
        astroMoonSign = moon.sign.id
        astroMoonSignHebrew = moon.sign.hebrew
      }
    } catch (e) {
      // Ignore errors
    }
  }

  // Calculate Human Design data for insights
  let hdType = ''
  let hdTypeHebrew = ''
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
        const bodygraph = result as import('@/lib/types/human-design').Bodygraph
        hdType = bodygraph.type
        hdTypeHebrew = bodygraph.typeDefinition.nameHebrew
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
          <Link href="/app/people">
            <Button variant="ghost" size="icon">
              <BackArrow />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{person.name}</h1>
            {person.hebrew_name && person.hebrew_name !== person.name && (
              <p className="text-lg text-muted-foreground">{person.hebrew_name}</p>
            )}
          </div>
        </div>
        <Link href={`/app/people`}>
          <Button variant="outline" onClick={() => router.push('/app/people')}>
            <span className="mr-2">←</span>
            Back
          </Button>
        </Link>
      </div>

      {/* Person Info Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Personal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Birth Date: </span>
              <span>{new Date(person.birth_date).toLocaleDateString('en-US')}</span>
            </div>
            {person.birth_time && (
              <div>
                <span className="text-sm text-muted-foreground">Birth Time: </span>
                <span>{person.birth_time}</span>
              </div>
            )}
            {birthPlace?.name && (
              <div>
                <span className="text-sm text-muted-foreground">Birth Place: </span>
                <span>{birthPlace.name}</span>
              </div>
            )}
          </div>
          {person.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2">
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
            <div className="pt-2 text-sm text-muted-foreground">
              {person.notes}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Missing data warnings */}
      {(!hasBirthTime || !hasLocation) && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
          <CardContent className="py-3">
            <div className="flex items-start gap-2">
              <span className="text-amber-600">⚠️</span>
              <div className="text-sm">
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
          </CardContent>
        </Card>
      )}

      {/* Systems Tabs */}
      {visibleSystems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No systems selected for display. You can enable systems in settings.
            </p>
            <Button variant="outline" onClick={() => router.push('/app/settings')}>
              System Settings
            </Button>
          </CardContent>
        </Card>
      ) : (
      <Tabs value={visibleSystems.some(s => s.key === activeTab) ? activeTab : visibleSystems[0]?.key || 'dreamspell'} onValueChange={(v) => setActiveTab(v as TabKey)} className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 p-1">
          {visibleSystems.map((system) => (
            <TabsTrigger
              key={system.key}
              value={system.key}
              className="flex-1 min-w-[100px] gap-1"
            >
              <span>{system.icon}</span>
              <span className="hidden sm:inline">{system.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Dreamspell Tab */}
        <TabsContent value="dreamspell" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Birthday Kin</CardTitle>
                <CardDescription>Your Galactic Signature according to the Dreamspell</CardDescription>
              </CardHeader>
              <CardContent>
                <DreamspellSection date={person.birth_date} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Wavespell</CardTitle>
                <CardDescription>Position in the 13-day wave</CardDescription>
              </CardHeader>
              <CardContent>
                <WavespellDisplay kin={kin} showLabels />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Castle</CardTitle>
                <CardDescription>Position in the 52-day cycle</CardDescription>
              </CardHeader>
              <CardContent>
                <CastleDisplay kin={kin} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Personal Year</CardTitle>
                <CardDescription>Your annual Kin</CardDescription>
              </CardHeader>
              <CardContent>
                <PersonalYearDisplay birthDate={person.birth_date} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Galactic Birthday</CardTitle>
              <CardDescription>Date of your next Galactic Birthday</CardDescription>
            </CardHeader>
            <CardContent>
              <GalacticBirthdayDisplay birthDate={person.birth_date} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tzolkin Tab */}
        <TabsContent value="tzolkin" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Traditional Tzolkin</CardTitle>
              <CardDescription>The traditional Mayan calendar (260 days)</CardDescription>
            </CardHeader>
            <CardContent>
              <TzolkinSection date={person.birth_date} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Long Count Tab */}
        <TabsContent value="longcount" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Long Count</CardTitle>
                <CardDescription>Birth date in the Mayan Long Count</CardDescription>
              </CardHeader>
              <CardContent>
                <LongCountDisplay dateStr={person.birth_date} showLabels showDaysSinceCreation />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Haab (Solar Year)</CardTitle>
                <CardDescription>The 365-day solar calendar</CardDescription>
              </CardHeader>
              <CardContent>
                <HaabDisplay dateStr={person.birth_date} showMonthIndex />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Calendar Round</CardTitle>
              <CardDescription>Combination of Tzolkin and Haab - 52-year cycle</CardDescription>
            </CardHeader>
            <CardContent>
              <CalendarRoundDisplay dateStr={person.birth_date} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mayan Timeline</CardTitle>
              <CardDescription>Significant events in the Mayan calendar</CardDescription>
            </CardHeader>
            <CardContent>
              <MayanTimelineDisplay
                birthDateStr={person.birth_date}
                showTunBirthdays
                showKatunBirthdays
                showCalendarRoundReturn
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Astrology Tab */}
        <TabsContent value="astrology" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Birth Chart</CardTitle>
              <CardDescription>
                Western Astrology - Planet positions at birth
                {!hasBirthTime && <span className="text-amber-600 ml-2">(without birth time - approximate)</span>}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AstrologyDisplay
                date={person.birth_date}
                time={person.birth_time || undefined}
                latitude={latitude}
                longitude={longitude}
                showPlanets
                showAspects
                showBalance
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Human Design Tab */}
        <TabsContent value="humandesign" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Human Design</CardTitle>
              <CardDescription>
                Your Type, Strategy, and Authority
                {!hasBirthTime && <span className="text-amber-600 ml-2">(without birth time - approximate)</span>}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HumanDesignDisplay
                date={person.birth_date}
                time={person.birth_time || undefined}
                latitude={latitude}
                longitude={longitude}
                showActivations
                showChannels
                showCenters
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gematria Tab */}
        <TabsContent value="gematria" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Gematria</CardTitle>
              <CardDescription>Numerical values of the Hebrew name</CardDescription>
            </CardHeader>
            <CardContent>
              <GematriaDisplay
                text={hebrewName}
                showBreakdown
                showAllMethods
                showNotable
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cross-System Insights Tab */}
        <TabsContent value="insights" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Cross-System Insights</CardTitle>
              <CardDescription>Connections and patterns across different systems</CardDescription>
            </CardHeader>
            <CardContent>
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
                  sunSignHebrew: astroSunSignHebrew,
                  moonSign: astroMoonSign,
                  moonSignHebrew: astroMoonSignHebrew,
                  dominantElement: astroDominantElement,
                  dominantModality: astroDominantModality,
                } : null}
                humanDesign={hdType ? {
                  type: hdType,
                  typeHebrew: hdTypeHebrew,
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      )}
    </div>
  )
}
