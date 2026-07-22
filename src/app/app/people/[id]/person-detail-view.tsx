'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Pencil, Settings } from 'lucide-react'
import { dateToKin, kinToSeal, kinToTone } from '@pleiad/engine/calculations/dreamspell'
import { getSeal } from '@pleiad/engine/data/seals'
import { getTone } from '@pleiad/engine/data/tones'
import { getEarthFamily, getColorFamily } from '@pleiad/engine/calculations/cycles'
import { getLongCountData } from '@pleiad/engine/calculations/long-count'
import { calculateNatalChart, calculateSunSignChart } from '@pleiad/engine/calculations/astrology'
import { calculateBodygraph } from '@pleiad/engine/calculations/human-design'
import { standardGematria, digitalRoot as calcDigitalRoot } from '@pleiad/engine/calculations/gematria'
import { DreamspellSection, TzolkinSection, WavespellDisplay, CastleDisplay, PersonalYearDisplay, GalacticBirthdayDisplay , LongCountDisplay, HaabDisplay, CalendarRoundDisplay, MayanTimelineDisplay , AstrologyDisplay , HumanDesignDisplay , GematriaDisplay , CrossSystemInsights  } from '@/components/cards'
import { Button } from '@/components/ui/button'
import {
  PageSection,
  DataRow,
  AddDataChip,
  FlavorTabs,
  Notice,
  Eyebrow,
  Pill,
  SkeletonRows,
  SkeletonCard,
  getFlavor,
  EASE_OUT,
  type AppFlavorKey,
  type FlavorTab,
} from '@/components/app-kit'
import type { PersonWithTags } from '@/lib/hooks/use-people'
import { useSystemPreferences, type SystemKey } from '@/lib/hooks/use-system-preferences'

type TabKey = SystemKey | 'insights'

/**
 * Mobile IA order (packages/mobile/src/app/person/[id].tsx): Dreamspell →
 * Tzolkin → Astrology → Human Design → Kabbalah → Insights. The web's
 * seventh system, Long Count, keeps its own tab folded in after its
 * nearest sibling (Tzolkin) wearing the tzolkin flavor, so per-system
 * preference toggles keep working unchanged.
 */
const SYSTEMS: { key: TabKey; label: string; flavor: AppFlavorKey }[] = [
  { key: 'dreamspell', label: 'Dreamspell', flavor: 'dreamspell' },
  { key: 'tzolkin', label: 'Tzolkin', flavor: 'tzolkin' },
  { key: 'longcount', label: 'Long Count', flavor: 'tzolkin' },
  { key: 'astrology', label: 'Astrology', flavor: 'astrology' },
  { key: 'humandesign', label: 'Human Design', flavor: 'humanDesign' },
  { key: 'gematria', label: 'Kabbalah', flavor: 'gematria' },
  { key: 'insights', label: 'Insights', flavor: 'integration' },
]

const FLAVOR = {
  dreamspell: getFlavor('dreamspell'),
  tzolkin: getFlavor('tzolkin'),
  astrology: getFlavor('astrology'),
  humanDesign: getFlavor('humanDesign'),
  gematria: getFlavor('gematria'),
  integration: getFlavor('integration'),
} as const

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter((part) => part.length > 0)
  const first = parts[0]?.[0] ?? ''
  const second = parts[1]?.[0] ?? ''
  return `${first}${second}`.toUpperCase() || '·'
}

export function PersonDetailView({ person }: { person: PersonWithTags }) {
  const { isSystemEnabled, loading: prefsLoading } = useSystemPreferences()
  const [activeTab, setActiveTab] = useState<TabKey>('dreamspell')
  const reduced = useReducedMotion()

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

  const editHref = `/app/people?edit=${person.id}`
  const kinLine = `KIN ${kin} · ${tone.name} ${seal.english}`.toUpperCase()

  const currentTab: TabKey = visibleSystems.some(s => s.key === activeTab)
    ? activeTab
    : (visibleSystems[0]?.key ?? 'dreamspell')

  const tabs: FlavorTab[] = visibleSystems.map(s => ({
    key: s.key,
    label: s.label,
    flavor: s.flavor,
  }))

  const birthRows: { label: string; value: string }[] = [
    {
      label: 'Born',
      value: new Date(person.birth_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    },
    ...(person.birth_time ? [{ label: 'Time', value: person.birth_time }] : []),
    ...(birthPlace?.name ? [{ label: 'Place', value: birthPlace.name }] : []),
  ]

  const renderTab = (tab: TabKey) => {
    switch (tab) {
      case 'dreamspell':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <PageSection index={0} accent={FLAVOR.dreamspell.accent} eyebrow="Birthday Kin">
                <p className="text-sm text-white/50">Galactic signature according to the Dreamspell</p>
                <DreamspellSection date={person.birth_date} />
              </PageSection>
              <PageSection index={1} accent={FLAVOR.dreamspell.accent} eyebrow="Wavespell">
                <p className="text-sm text-white/50">Position in the 13-day wave</p>
                <WavespellDisplay kin={kin} showLabels />
              </PageSection>
            </div>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <PageSection index={2} accent={FLAVOR.dreamspell.accent} eyebrow="Castle">
                <p className="text-sm text-white/50">Position in the 52-day cycle</p>
                <CastleDisplay kin={kin} />
              </PageSection>
              <PageSection index={3} accent={FLAVOR.dreamspell.accent} eyebrow="Personal Year">
                <p className="text-sm text-white/50">Annual Kin</p>
                <PersonalYearDisplay birthDate={person.birth_date} />
              </PageSection>
            </div>
            <PageSection index={4} accent={FLAVOR.dreamspell.accent} eyebrow="Galactic Birthday">
              <p className="text-sm text-white/50">Date of the next Galactic Birthday</p>
              <GalacticBirthdayDisplay birthDate={person.birth_date} />
            </PageSection>
          </div>
        )

      case 'tzolkin':
        return (
          <PageSection index={0} accent={FLAVOR.tzolkin.accent} eyebrow="Traditional Tzolkin">
            <p className="text-sm text-white/50">The traditional Mayan calendar (260 days)</p>
            <TzolkinSection date={person.birth_date} />
          </PageSection>
        )

      case 'longcount':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <PageSection index={0} accent={FLAVOR.tzolkin.accent} eyebrow="Long Count">
                <p className="text-sm text-white/50">Birth date in the Mayan Long Count</p>
                <LongCountDisplay dateStr={person.birth_date} showLabels showDaysSinceCreation />
              </PageSection>
              <PageSection index={1} accent={FLAVOR.tzolkin.accent} eyebrow="Haab (Solar Year)">
                <p className="text-sm text-white/50">The 365-day solar calendar</p>
                <HaabDisplay dateStr={person.birth_date} showMonthIndex />
              </PageSection>
            </div>
            <PageSection index={2} accent={FLAVOR.tzolkin.accent} eyebrow="Calendar Round">
              <p className="text-sm text-white/50">Combination of Tzolkin and Haab: 52-year cycle</p>
              <CalendarRoundDisplay dateStr={person.birth_date} />
            </PageSection>
            <PageSection index={3} accent={FLAVOR.tzolkin.accent} eyebrow="Mayan Timeline">
              <p className="text-sm text-white/50">Significant events in the Mayan calendar</p>
              <MayanTimelineDisplay
                birthDateStr={person.birth_date}
                showTunBirthdays
                showKatunBirthdays
                showCalendarRoundReturn
              />
            </PageSection>
          </div>
        )

      case 'astrology':
        return (
          <div className="space-y-6">
            {!hasBirthTime && (
              <Notice
                variant="warning"
                action={
                  <AddDataChip accent={FLAVOR.astrology.accent} href={editHref}>
                    Add birth time
                  </AddDataChip>
                }
              >
                Without a birth time this chart is an approximation.
              </Notice>
            )}
            <PageSection index={0} accent={FLAVOR.astrology.accent} eyebrow="Birth Chart">
              <p className="text-sm text-white/50">Western astrology: planet positions at birth</p>
              <AstrologyDisplay
                date={person.birth_date}
                time={person.birth_time || undefined}
                latitude={latitude}
                longitude={longitude}
                showPlanets
                showAspects
                showBalance
              />
            </PageSection>
          </div>
        )

      case 'humandesign':
        return (
          <div className="space-y-6">
            {!hasBirthTime && (
              <Notice
                variant="warning"
                action={
                  <AddDataChip accent={FLAVOR.humanDesign.accent} href={editHref}>
                    Add birth time
                  </AddDataChip>
                }
              >
                Without a birth time this reading is an approximation.
              </Notice>
            )}
            <PageSection index={0} accent={FLAVOR.humanDesign.accent} eyebrow="Human Design">
              <p className="text-sm text-white/50">Type, strategy, and authority</p>
              <HumanDesignDisplay
                date={person.birth_date}
                time={person.birth_time || undefined}
                latitude={latitude}
                longitude={longitude}
                showActivations
                showChannels
                showCenters
              />
            </PageSection>
          </div>
        )

      case 'gematria':
        return (
          <div className="space-y-6">
            {!person.hebrew_name && (
              <Notice
                variant="warning"
                action={
                  <AddDataChip accent={FLAVOR.gematria.accent} href={editHref}>
                    Add Hebrew name
                  </AddDataChip>
                }
              >
                Computed from the Latin spelling. Add a Hebrew name for a truer reading.
              </Notice>
            )}
            <PageSection index={0} accent={FLAVOR.gematria.accent} eyebrow="Gematria">
              <p className="text-sm text-white/50">Numerical values of the Hebrew name</p>
              <GematriaDisplay
                text={hebrewName}
                showBreakdown
                showAllMethods
                showNotable
              />
            </PageSection>
          </div>
        )

      case 'insights':
        return (
          <PageSection index={0} accent={FLAVOR.integration.accent} eyebrow="Cross-System Insights">
            <p className="text-sm text-white/50">Connections and patterns across different systems</p>
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
          </PageSection>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header — avatar + display name + kin eyebrow, icon actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <Button variant="ghost" size="icon" asChild className="shrink-0 text-white/70 hover:text-white/90">
            <Link href="/app/people" aria-label="Back to people">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <span
            className="flex size-14 shrink-0 items-center justify-center rounded-full border border-white/[0.07] bg-surface-2 font-mono text-sm uppercase tracking-[0.1em] text-white/70"
            aria-hidden
          >
            {initialsOf(person.name)}
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="truncate font-display text-2xl font-semibold tracking-tight text-white/90 sm:text-3xl">
              {person.name}
            </h1>
            <Eyebrow accent={FLAVOR.dreamspell.accentSoft}>{kinLine}</Eyebrow>
            {person.hebrew_name && person.hebrew_name !== person.name && (
              <p className="truncate text-sm text-white/50">{person.hebrew_name}</p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" asChild className="shrink-0 text-white/70 hover:text-white/90">
          <Link href={editHref} aria-label={`Edit ${person.name}`}>
            <Pencil className="size-5" />
          </Link>
        </Button>
      </div>

      {/* Birth data — hairline rows, never a nested card box */}
      <PageSection index={0} accent={FLAVOR.dreamspell.accent} eyebrow="Birth Data">
        <div>
          {birthRows.map((row, i) => (
            <DataRow key={row.label} label={row.label} value={row.value} last={i === birthRows.length - 1} />
          ))}
        </div>
        {person.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {person.tags.map(tag => (
              <Pill key={tag.id} accent={tag.color} className="px-2.5 py-0.5 text-[10px] tracking-[0.15em]">
                {tag.name}
              </Pill>
            ))}
          </div>
        )}
        {person.notes && (
          <p className="text-sm leading-relaxed text-white/70">{person.notes}</p>
        )}
      </PageSection>

      {/* Honest partial state — missing birth data narrows some readings */}
      {(!hasBirthTime || !hasLocation) && (
        <Notice
          variant="warning"
          action={
            <AddDataChip accent={FLAVOR.integration.accent} href={editHref}>
              Add birth data
            </AddDataChip>
          }
        >
          {!hasBirthTime && !hasLocation && (
            <p>Birth time and place not specified. Astrology and Human Design will be shown as approximations only.</p>
          )}
          {!hasBirthTime && hasLocation && (
            <p>Birth time not specified. Astrology and Human Design will be shown as approximations only.</p>
          )}
          {hasBirthTime && !hasLocation && (
            <p>Birth place not specified. Astrology and Human Design will use default location (Tel Aviv).</p>
          )}
        </Notice>
      )}

      {/* Systems */}
      {visibleSystems.length === 0 ? (
        <div className="surface-card p-12 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
            <Settings className="size-6 text-muted-foreground" />
          </div>
          <p className="mb-1 font-medium text-white/90">No systems enabled</p>
          <p className="mb-4 text-sm text-white/50">
            Enable symbolic systems in settings to see this person&apos;s readings.
          </p>
          <Button variant="outline" asChild className="rounded-xl">
            <Link href="/app/settings">
              <Settings className="mr-2 size-4" />
              System Settings
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <FlavorTabs
            tabs={tabs}
            active={currentTab}
            onChange={(key) => setActiveTab(key as TabKey)}
          />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentTab}
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -12 }}
              transition={{
                duration: reduced ? 0 : 0.3,
                ease: EASE_OUT as [number, number, number, number],
              }}
            >
              {renderTab(currentTab)}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

// Loading skeleton — layout-matched shapes, shimmer, never a spinner.
export function PersonDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="skeleton-shimmer size-10 rounded-xl" />
        <div className="skeleton-shimmer size-14 rounded-full" />
        <div className="flex flex-col gap-2">
          <div className="skeleton-shimmer h-7 w-48 rounded" />
          <div className="skeleton-shimmer h-3 w-40 rounded" />
        </div>
      </div>

      {/* Birth data rows */}
      <SkeletonRows count={3} />

      {/* Tab pills */}
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton-shimmer h-8 w-24 shrink-0 rounded-full" />
        ))}
      </div>

      {/* Reading body */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SkeletonCard className="h-64" />
        <SkeletonCard className="h-64" />
      </div>
    </div>
  )
}
