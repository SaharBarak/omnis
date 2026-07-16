import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  ArrowsLeftRightIcon,
  CaretLeftIcon,
  PencilSimpleIcon,
  ShareNetworkIcon,
} from 'phosphor-react-native'
import { useMemo, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import PagerView, {
  type PageScrollStateChangedNativeEvent,
  type PagerViewOnPageSelectedEvent,
} from 'react-native-pager-view'
import Animated, { ZoomIn, useReducedMotion } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import type { PersonWithTags } from '@pleiad/api-client'

import { PaywallSheet, type PaywallTrigger } from '@/components/billing/paywall-sheet'
import { IconButton, Text, TopAppBar } from '@/components/m3'
import { PersonPickerSheet } from '@/components/pair/person-picker-sheet'
import { CaptureSheet } from '@/components/people/capture-sheet'
import { ShareSheet } from '@/components/share/share-sheet'
import { AstrologyPage } from '@/components/person/astrology-page'
import { DreamspellPage } from '@/components/person/dreamspell-page'
import { FlavorTabs, type FlavorTab } from '@/components/person/flavor-tabs'
import { HumanDesignPage } from '@/components/person/human-design-page'
import { InsightsPage } from '@/components/person/insights-page'
import { KabbalahPage } from '@/components/person/kabbalah-page'
import { LockedPage } from '@/components/person/scaffold'
import { TzolkinPage } from '@/components/person/tzolkin-page'
import { EmptyState } from '@/components/ui/empty-state'
import { useSubscription } from '@/lib/api'
import { usePersonDraft } from '@/lib/people/draft-store'
import { usePeople } from '@/lib/people/hooks'
import { buildInsights, computeReading } from '@/lib/people/reading'
import { SPACE, SPRING, useTheme } from '@/theme/m3'
import { FLAVORS } from '@/theme/tokens'
import { initialsOf } from '@/lib/text'

/**
 * Person detail — the core reading artifact. Six pages in a swipeable pager
 * synced to a segmented button; every reading computed on-device,
 * synchronously, from the ['people'] cache.
 *
 * Entitlements: free reads Dreamspell only — the other pages render a dimmed
 * preview under a lock card (an upsell surface, not a wall). Subscription
 * loading and error are both treated as free, so a locked page never flashes
 * open while the plan resolves.
 */

const AVATAR_SIZE = 56

const TABS: FlavorTab[] = [
  { key: 'dreamspell', label: 'Dreamspell', flavor: FLAVORS.dreamspell },
  { key: 'tzolkin', label: 'Tzolkin', flavor: FLAVORS.tzolkin },
  { key: 'astrology', label: 'Astrology', flavor: FLAVORS.astrology },
  { key: 'humanDesign', label: 'Human Design', flavor: FLAVORS.humanDesign },
  { key: 'gematria', label: 'Kabbalah', flavor: FLAVORS.gematria },
  { key: 'insights', label: 'Insights', flavor: FLAVORS.integration },
]

const SYSTEM_NAMES: Record<string, string> = {
  tzolkin: 'Tzolkin',
  astrology: 'Astrology',
  humanDesign: 'Human Design',
  gematria: 'Kabbalah',
  insights: 'Insights',
}

function parseBirthDate(isoDate: string): Date {
  const [year = 1990, month = 1, day = 1] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function parseBirthTime(time: string): Date {
  const [hours = 12, minutes = 0] = time.split(':').map(Number)
  const value = new Date()
  value.setHours(hours, minutes, 0, 0)
  return value
}

/** Pre-fill the capture draft from the saved person — the edit path. */
function prefillDraft(person: PersonWithTags): void {
  usePersonDraft.getState().prefill({
    name: person.name,
    birthDate: parseBirthDate(person.birth_date),
    birthTime: person.birth_time !== null ? parseBirthTime(person.birth_time) : null,
    timeUnknown: person.birth_time === null,
    city: person.birth_place?.city ?? '',
    country: person.birth_place?.country ?? '',
    timezone: person.birth_place?.timezone ?? null,
    // Only a located place has coordinates; an older row saved from free text
    // has none, and editing it must not invent them.
    coords:
      person.birth_place?.lat !== undefined && person.birth_place?.lng !== undefined
        ? { lat: person.birth_place.lat, lng: person.birth_place.lng }
        : null,
    hebrewName: person.hebrew_name ?? '',
    notes: person.notes ?? '',
  })
}

export default function PersonScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const theme = useTheme()
  const reduced = useReducedMotion()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { people, isPending } = usePeople()
  const subscription = useSubscription()

  const pagerRef = useRef<PagerView>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  // Lazy page mount = the stagger fade-up runs on each page's FIRST view,
  // once per person (this screen remounts per person id).
  const [viewed, setViewed] = useState<ReadonlySet<number>>(() => new Set([0]))
  const [editOpen, setEditOpen] = useState(false)
  const [paywallOpen, setPaywallOpen] = useState(false)
  // The one sheet, two doors: the system lock and the edit cap.
  const [paywallTrigger, setPaywallTrigger] = useState<PaywallTrigger>('system-lock')
  const [compareOpen, setCompareOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  const person = people.find((candidate) => candidate.id === id)

  const reading = useMemo(
    () => (person === undefined ? null : computeReading(person)),
    [person]
  )
  const insights = useMemo(
    () => (reading === null ? [] : buildInsights(reading)),
    [reading]
  )

  // Entitlements — free reads Dreamspell only. Loading/error = free: a
  // locked page must never flash unlocked while the plan resolves.
  const plan = subscription.data?.plan
  const paidPlan = plan !== undefined && plan !== 'free'
  const isUnlocked = (key: string): boolean => key === 'dreamspell' || paidPlan

  const markViewed = (...indexes: number[]) => {
    setViewed((previous) => {
      const fresh = indexes.filter(
        (index) => index >= 0 && index < TABS.length && !previous.has(index)
      )
      if (fresh.length === 0) return previous
      const next = new Set(previous)
      for (const index of fresh) next.add(index)
      return next
    })
  }

  const selectTab = (index: number) => {
    markViewed(index)
    setActiveIndex(index)
    pagerRef.current?.setPage(index)
  }

  const onPageSelected = (event: PagerViewOnPageSelectedEvent) => {
    const index = event.nativeEvent.position
    markViewed(index)
    setActiveIndex(index)
  }

  // Mount neighbors the moment a drag starts so the incoming page's stagger
  // plays as it slides in — never a blank frame mid-swipe.
  const onPageScrollStateChanged = (event: PageScrollStateChangedNativeEvent) => {
    if (event.nativeEvent.pageScrollState === 'dragging') {
      markViewed(activeIndex - 1, activeIndex + 1)
    }
  }

  const goBack = () => {
    if (router.canGoBack()) router.back()
    else router.replace('/people')
  }

  const openEdit = () => {
    if (person === undefined) return
    prefillDraft(person)
    setEditOpen(true)
  }

  const openPaywall = (trigger: PaywallTrigger) => {
    setPaywallTrigger(trigger)
    setPaywallOpen(true)
  }

  if (person === undefined) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + SPACE.margin }]}>
        <EmptyState
          title={isPending ? 'Finding them…' : "They aren't on your map."}
          body={isPending ? undefined : 'This person may have been removed.'}
          actionLabel="Back to your people"
          onAction={goBack}
        />
      </View>
    )
  }

  const dreamspell = reading?.dreamspell ?? null
  const kinLine =
    dreamspell !== null
      ? `Kin ${dreamspell.kin} · ${dreamspell.tone.name} ${dreamspell.seal.english}`
      : person.birth_date

  const missingBirthTime = person.birth_time === null
  const missingHebrewName = (person.hebrew_name ?? '').trim().length === 0

  const renderPage = (key: string) => {
    if (reading === null) return null
    switch (key) {
      case 'dreamspell':
        return <DreamspellPage reading={reading.dreamspell} />
      case 'tzolkin':
        return <TzolkinPage mayan={reading.mayan} />
      case 'astrology':
        return <AstrologyPage astrology={reading.astrology} onAddBirthTime={openEdit} />
      case 'humanDesign':
        return (
          <HumanDesignPage humanDesign={reading.humanDesign} onAddBirthTime={openEdit} />
        )
      case 'gematria':
        return (
          <KabbalahPage
            person={person}
            gematria={reading.gematria}
            onAddHebrewName={openEdit}
          />
        )
      case 'insights':
        return (
          <InsightsPage
            lines={insights}
            missingBirthTime={missingBirthTime}
            missingHebrewName={missingHebrewName}
            onAddData={openEdit}
          />
        )
      default:
        return null
    }
  }

  return (
    <View style={styles.screen}>
      {/*
       * The bar's title is empty on purpose: the person is the hero directly
       * beneath it, and repeating the name in a 22dp slot squeezed between four
       * icon buttons would truncate it. Back is the navigation icon, not an
       * action, so the bar carries exactly the three actions M3 allows.
       */}
      <TopAppBar
        title=""
        navigationIcon={
          <IconButton
            icon={(color) => <CaretLeftIcon size={24} color={color} />}
            onPress={goBack}
            accessibilityLabel="Back"
          />
        }
        actions={
          <>
            <IconButton
              icon={(color) => <ArrowsLeftRightIcon size={24} color={color} />}
              onPress={() => setCompareOpen(true)}
              accessibilityLabel={`Compare ${person.name} with someone`}
            />
            <IconButton
              icon={(color) => <PencilSimpleIcon size={24} color={color} />}
              onPress={openEdit}
              accessibilityLabel={`Edit ${person.name}`}
            />
            <IconButton
              icon={(color) => <ShareNetworkIcon size={24} color={color} />}
              onPress={() => setShareOpen(true)}
              accessibilityLabel={`Share ${person.name}`}
            />
          </>
        }
      />

      <View style={styles.header}>
        <Animated.View
          entering={
            reduced
              ? undefined
              : ZoomIn.springify()
                  .damping(SPRING.spatial.damping)
                  .stiffness(SPRING.spatial.stiffness)
          }
          style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}
        >
          <Text variant="titleMedium" color={theme.colors.onPrimaryContainer}>
            {initialsOf(person.name)}
          </Text>
        </Animated.View>
        <View style={styles.headerText}>
          <Text variant="headlineSmall" color="onSurface" numberOfLines={1}>
            {person.name}
          </Text>
          {/* The kin line is a Dreamspell fact, so it wears Dreamspell's accent
              whichever system is open. */}
          <Text variant="labelLarge" color={FLAVORS.dreamspell.accentSoft}>
            {kinLine}
          </Text>
        </View>
      </View>

      <FlavorTabs tabs={TABS} activeIndex={activeIndex} onSelect={selectTab} />

      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={onPageSelected}
        onPageScrollStateChanged={onPageScrollStateChanged}
      >
        {TABS.map((tab, index) => (
          <View key={tab.key} style={styles.pageHost} collapsable={false}>
            {viewed.has(index) &&
              (isUnlocked(tab.key) ? (
                renderPage(tab.key)
              ) : (
                <LockedPage
                  systemName={SYSTEM_NAMES[tab.key] ?? tab.label}
                  onUnlock={() => openPaywall('system-lock')}
                >
                  {renderPage(tab.key)}
                </LockedPage>
              ))}
          </View>
        ))}
      </PagerView>

      <CaptureSheet
        visible={editOpen}
        onClose={() => setEditOpen(false)}
        onLimitExceeded={() => {
          setEditOpen(false)
          openPaywall('people-cap')
        }}
        editPersonId={person.id}
      />

      <PaywallSheet
        visible={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        trigger={paywallTrigger}
      />

      <ShareSheet
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        subject={{ type: 'person', personId: person.id, title: person.name }}
      />

      <PersonPickerSheet
        visible={compareOpen}
        people={people.filter((candidate) => candidate.id !== person.id)}
        onClose={() => setCompareOpen(false)}
        onPick={(other) => {
          setCompareOpen(false)
          router.push(`/pair/${person.id}/${other.id}`)
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.lg,
    paddingHorizontal: SPACE.margin,
    paddingBottom: SPACE.lg,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: SPACE.xs,
  },
  pager: {
    flex: 1,
  },
  pageHost: {
    flex: 1,
  },
})
