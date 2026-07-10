import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  CaretLeftIcon,
  PencilSimpleIcon,
  ShareNetworkIcon,
} from 'phosphor-react-native'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import PagerView, {
  type PageScrollStateChangedNativeEvent,
  type PagerViewOnPageSelectedEvent,
} from 'react-native-pager-view'
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
  useReducedMotion,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import type { PersonWithTags } from '@pleiad/api-client'

import { CaptureSheet } from '@/components/people/capture-sheet'
import { PaywallSheet } from '@/components/people/paywall-sheet'
import { AstrologyPage } from '@/components/person/astrology-page'
import { DreamspellPage } from '@/components/person/dreamspell-page'
import { FlavorTabs, type FlavorTab } from '@/components/person/flavor-tabs'
import { HumanDesignPage } from '@/components/person/human-design-page'
import { InsightsPage } from '@/components/person/insights-page'
import { KabbalahPage } from '@/components/person/kabbalah-page'
import { LockedPage } from '@/components/person/scaffold'
import { TzolkinPage } from '@/components/person/tzolkin-page'
import { EmptyState } from '@/components/ui/empty-state'
import { Eyebrow } from '@/components/ui/primitives'
import { ToastHost } from '@/components/ui/toast'
import { useSubscription } from '@/lib/api'
import { usePersonDraft } from '@/lib/people/draft-store'
import { usePeople } from '@/lib/people/hooks'
import { buildInsights, computeReading } from '@/lib/people/reading'
import { COLORS, DURATION, FLAVORS, SPACE, SPRING, TYPE } from '@/theme/tokens'

/**
 * S8 Person detail — the core reading artifact (F4). Six flavored pages in a
 * swipeable pager synced to segmented pills; every reading computed
 * on-device, synchronously, from the ['people'] cache. Entitlements: free
 * plan reads Dreamspell only — the other pages render a dimmed preview under
 * a lock panel (upsell surface, not a wall). Subscription loading/error is
 * treated as free so a locked page never flashes open.
 */

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

const TOOLTIP_MS = 1800

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter((part) => part.length > 0)
  const first = parts[0]?.[0] ?? ''
  const second = parts[1]?.[0] ?? ''
  return `${first}${second}`.toUpperCase() || '·'
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

/** Pre-fill the S7 draft from the saved person — the S8 edit path. */
function prefillDraft(person: PersonWithTags): void {
  usePersonDraft.getState().prefill({
    name: person.name,
    birthDate: parseBirthDate(person.birth_date),
    birthTime: person.birth_time !== null ? parseBirthTime(person.birth_time) : null,
    timeUnknown: person.birth_time === null,
    city: person.birth_place?.city ?? '',
    country: person.birth_place?.country ?? '',
    timezone: person.birth_place?.timezone ?? null,
    hebrewName: person.hebrew_name ?? '',
    notes: person.notes ?? '',
  })
}

export default function PersonScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
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
  const [shareNote, setShareNote] = useState(false)
  const shareTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (shareTimer.current !== null) clearTimeout(shareTimer.current)
    },
    []
  )

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

  const showShareNote = () => {
    setShareNote(true)
    if (shareTimer.current !== null) clearTimeout(shareTimer.current)
    shareTimer.current = setTimeout(() => setShareNote(false), TOOLTIP_MS)
  }

  if (person === undefined) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + SPACE.gutter }]}>
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
      ? `KIN ${dreamspell.kin} · ${dreamspell.tone.name} ${dreamspell.seal.english}`.toUpperCase()
      : person.birth_date

  const missingBirthTime = person.birth_time === null
  const missingHebrewName = (person.hebrew_name ?? '').trim().length === 0
  const activeFlavor = TABS[activeIndex]?.flavor ?? FLAVORS.dreamspell

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
    <View style={[styles.screen, { paddingTop: insets.top + SPACE.unit * 2 }]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={goBack}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <CaretLeftIcon size={20} color={COLORS.text70} />
        </Pressable>
        <View style={styles.topBarSpacer} />
        <Pressable
          onPress={openEdit}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${person.name}`}
        >
          <PencilSimpleIcon size={20} color={COLORS.text70} />
        </Pressable>
        <Pressable
          onPress={showShareNote}
          style={[styles.iconButton, styles.iconDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Share — arrives with M3"
          accessibilityState={{ disabled: true }}
        >
          <ShareNetworkIcon size={20} color={COLORS.text35} />
        </Pressable>
      </View>

      {shareNote && (
        <Animated.View
          entering={reduced ? undefined : FadeIn.duration(DURATION.normal)}
          exiting={reduced ? undefined : FadeOut.duration(DURATION.normal)}
          style={styles.shareNote}
          pointerEvents="none"
        >
          <Eyebrow>SHARING ARRIVES WITH M3</Eyebrow>
        </Animated.View>
      )}

      <View style={styles.header}>
        <Animated.View
          entering={
            reduced
              ? undefined
              : ZoomIn.springify().damping(SPRING.damping).stiffness(SPRING.stiffness)
          }
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>{initialsOf(person.name)}</Text>
        </Animated.View>
        <View style={styles.headerText}>
          <Text style={TYPE.zone} numberOfLines={1}>
            {person.name}
          </Text>
          <Eyebrow color={FLAVORS.dreamspell.accentSoft}>{kinLine}</Eyebrow>
        </View>
      </View>

      <View style={styles.tabsBlock}>
        <FlavorTabs tabs={TABS} activeIndex={activeIndex} onSelect={selectTab} />
        {/* Active flavor tint crossfades 200ms under the tabs. */}
        <View style={styles.accentTrack}>
          <Animated.View
            key={activeFlavor.accent}
            entering={reduced ? undefined : FadeIn.duration(DURATION.normal)}
            style={[styles.accentLine, { backgroundColor: activeFlavor.accent }]}
          />
        </View>
      </View>

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
                  flavor={tab.flavor}
                  systemName={SYSTEM_NAMES[tab.key] ?? tab.label}
                  onUnlock={() => setPaywallOpen(true)}
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
          setPaywallOpen(true)
        }}
        editPersonId={person.id}
      />

      <PaywallSheet
        visible={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        limit={subscription.data?.usage.profiles.limit ?? 3}
        planName={subscription.data?.planName ?? 'Free'}
      />

      <ToastHost />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.gutter - 8,
  },
  topBarSpacer: {
    flex: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDisabled: {
    opacity: 0.8,
  },
  shareNote: {
    position: 'absolute',
    top: 0,
    right: SPACE.gutter,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: SPACE.gutter,
    paddingTop: SPACE.unit * 2,
    paddingBottom: SPACE.cardPad,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarText: {
    ...TYPE.card,
    color: COLORS.text70,
  },
  headerText: {
    flex: 1,
    gap: 5,
  },
  tabsBlock: {
    gap: 10,
  },
  accentTrack: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: SPACE.gutter,
  },
  accentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.45,
  },
  pager: {
    flex: 1,
  },
  pageHost: {
    flex: 1,
  },
})
