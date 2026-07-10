import type { RelationshipType } from '@pleiad/api-client'
import { useRouter } from 'expo-router'
import { XIcon } from 'phosphor-react-native'
import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { TypeFilterChips } from '@/components/map/filter-chips'
import { NodeCard } from '@/components/map/node-card'
import { RelationshipGraph } from '@/components/map/relationship-graph'
import { CaptureSheet } from '@/components/people/capture-sheet'
import { PaywallSheet } from '@/components/people/paywall-sheet'
import { EmptyState } from '@/components/ui/empty-state'
import { Button, Eyebrow, Panel } from '@/components/ui/primitives'
import { ToastHost } from '@/components/ui/toast'
import { useSubscription } from '@/lib/api'
import { seedPosition } from '@/lib/map/simulation'
import { usePeople } from '@/lib/people/hooks'
import { RELATIONSHIP_TYPES } from '@/lib/relationships/colors'
import { useRelationships } from '@/lib/relationships/hooks'
import { COLORS, DURATION, SPACE, TYPE } from '@/theme/tokens'

/**
 * S10 Map — the hero surface (F6). A force-settled constellation of your
 * people: seal-ringed stars, typed edges, pinch/pan, tap → node card,
 * Compare → pick a second star → S9 pair reading. All four states ship:
 * skeleton constellation, retry, two-star invitation, the living map.
 */

const SKELETON_STARS = 6

/** Skeleton — a dim constellation breathing at 2s, never a spinner. */
function MapSkeleton() {
  const reduced = useReducedMotion()
  const pulse = useSharedValue(0.35)

  useEffect(() => {
    if (reduced) return
    pulse.value = withRepeat(withTiming(0.7, { duration: 1000 }), -1, true)
  }, [reduced, pulse])

  const shimmer = useAnimatedStyle(() => ({ opacity: pulse.value }))

  return (
    <View style={styles.skeletonRoot}>
      <Animated.View style={[styles.skeletonField, shimmer]}>
        {Array.from({ length: SKELETON_STARS }, (_, index) => {
          const seed = seedPosition(index)
          return (
            <View
              key={index}
              style={[
                styles.skeletonStar,
                { transform: [{ translateX: seed.x }, { translateY: seed.y }] },
              ]}
            />
          )
        })}
      </Animated.View>
      <Eyebrow>DRAWING YOUR MAP</Eyebrow>
    </View>
  )
}

export default function MapScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const reduced = useReducedMotion()

  const people = usePeople()
  const relationships = useRelationships()
  const subscription = useSubscription()

  const [activeTypes, setActiveTypes] = useState<ReadonlySet<RelationshipType>>(
    () => new Set(RELATIONSHIP_TYPES)
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [compareFromId, setCompareFromId] = useState<string | null>(null)
  const [captureOpen, setCaptureOpen] = useState(false)
  const [paywallOpen, setPaywallOpen] = useState(false)

  const selectedPerson = useMemo(
    () => people.people.find((person) => person.id === selectedId),
    [people.people, selectedId]
  )

  const toggleType = (type: RelationshipType) => {
    setActiveTypes((previous) => {
      const next = new Set(previous)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  const onSelectNode = (id: string | null) => {
    if (compareFromId !== null) {
      // Compare mode: the next tapped star becomes the second chart.
      if (id === null || id === compareFromId) return
      const from = compareFromId
      setCompareFromId(null)
      setSelectedId(null)
      router.push(`/pair/${from}/${id}`)
      return
    }
    setSelectedId(id)
  }

  const startCompare = () => {
    if (selectedId === null) return
    setCompareFromId(selectedId)
    setSelectedId(null)
  }

  const isPending = people.isPending || relationships.isPending
  const isError = !isPending && (people.isError || relationships.isError)
  const retry = () => {
    if (people.isError) people.refetch()
    if (relationships.isError) relationships.refetch()
  }

  const renderBody = () => {
    if (isPending) return <MapSkeleton />

    if (isError) {
      return (
        <View style={styles.errorWrap}>
          <Panel style={styles.errorPanel}>
            <Text style={TYPE.card}>The map is out of reach.</Text>
            <Text style={styles.errorBody}>
              We couldn't load your constellation. Check your connection — nothing is
              lost.
            </Text>
            <Button
              variant="secondary"
              onPress={retry}
              disabled={people.isRefetching || relationships.isRefetching}
            >
              {people.isRefetching || relationships.isRefetching ? 'Trying…' : 'Try again'}
            </Button>
          </Panel>
        </View>
      )
    }

    if (people.people.length < 2) {
      return (
        <EmptyState
          title="Your map needs two stars."
          body="Add two people and Pleiad draws the lines between them."
          actionLabel="Add people"
          onAction={() => setCaptureOpen(true)}
        />
      )
    }

    return (
      <RelationshipGraph
        people={people.people}
        relationships={relationships.relationships}
        visibleTypes={activeTypes}
        filtering={activeTypes.size < RELATIONSHIP_TYPES.length}
        selectedId={selectedId}
        onSelectNode={onSelectNode}
      />
    )
  }

  const showChrome = !isPending && !isError && people.people.length >= 2

  return (
    <View style={styles.screen}>
      {renderBody()}

      {showChrome && (
        <View style={[styles.chipsRow, { top: insets.top + SPACE.unit * 2 }]}>
          <TypeFilterChips active={activeTypes} onToggle={toggleType} />
        </View>
      )}

      {compareFromId !== null && (
        <Animated.View
          entering={reduced ? undefined : FadeIn.duration(DURATION.normal)}
          exiting={reduced ? undefined : FadeOut.duration(DURATION.normal)}
          style={[styles.compareBanner, { top: insets.top + SPACE.unit * 2 + 44 }]}
        >
          <Eyebrow color={COLORS.brandSoft}>PICK A SECOND STAR</Eyebrow>
          <Pressable
            onPress={() => setCompareFromId(null)}
            style={styles.cancelChip}
            accessibilityRole="button"
            accessibilityLabel="Cancel compare"
          >
            <XIcon size={12} color={COLORS.text50} />
            <Text style={styles.cancelText}>CANCEL</Text>
          </Pressable>
        </Animated.View>
      )}

      {selectedPerson !== undefined && compareFromId === null && (
        <NodeCard
          person={selectedPerson}
          people={people.people}
          relationships={relationships.relationships}
          onOpenChart={() => {
            setSelectedId(null)
            router.push({ pathname: '/person/[id]', params: { id: selectedPerson.id } })
          }}
          onCompare={startCompare}
          onDismiss={() => setSelectedId(null)}
        />
      )}

      <CaptureSheet
        visible={captureOpen}
        onClose={() => setCaptureOpen(false)}
        onLimitExceeded={() => {
          setCaptureOpen(false)
          setPaywallOpen(true)
        }}
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
  chipsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  compareBanner: {
    position: 'absolute',
    left: SPACE.gutter,
    right: SPACE.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardFill,
  },
  cancelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cancelText: {
    ...TYPE.statLabel,
  },
  skeletonRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.section,
  },
  skeletonField: {
    width: 1,
    height: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonStar: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  errorWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  errorPanel: {
    marginHorizontal: SPACE.gutter,
    gap: 14,
  },
  errorBody: {
    ...TYPE.bodySm,
    color: COLORS.text50,
  },
})
