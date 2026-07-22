import type { RelationshipType } from '@pleiad/api-client'
import { useRouter } from 'expo-router'
import { XIcon } from 'phosphor-react-native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
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

import { PaywallSheet } from '@/components/billing/paywall-sheet'
import { Button, NAVIGATION_BAR_HEIGHT, Surface, Text } from '@/components/m3'
import { TypeFilterChips } from '@/components/map/filter-chips'
import { NodeCard } from '@/components/map/node-card'
import { RelationshipGraph } from '@/components/map/relationship-graph'
import { CaptureSheet } from '@/components/people/capture-sheet'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { useAuthStore } from '@/lib/auth'
import {
  loadPinnedLayout,
  savePinnedLayout,
  type PinnedLayout,
} from '@/lib/map/layout-store'
import { seedPosition } from '@/lib/map/simulation'
import { usePeople } from '@/lib/people/hooks'
import { RELATIONSHIP_TYPES } from '@/lib/relationships/colors'
import { useRelationships } from '@/lib/relationships/hooks'
import { DURATION, SHAPE, SPACE, useTheme } from '@/theme/m3'

/** Stable identity for "no pins yet" so the layout seed effect fires only on load. */
const EMPTY_LAYOUT: PinnedLayout = {}

/**
 * S10 Map — the hero surface (F6). A force-settled constellation of your
 * people: seal-ringed stars, typed edges, pinch/pan, tap → node card,
 * Compare → pick a second star → S9 pair reading. All four states ship:
 * skeleton constellation, retry, two-star invitation, the living map.
 */

const SKELETON_STARS = 6
const SKELETON_STAR_SIZE = 40
/** The filter chip's drawn height. The compare banner clears the chip row. */
const CHIP_HEIGHT = 32

/** Skeleton — a dim constellation breathing at 2s, never a spinner. */
function MapSkeleton() {
  const theme = useTheme()
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
                {
                  backgroundColor: theme.surfaceAt(2),
                  borderColor: theme.colors.outlineVariant,
                  transform: [{ translateX: seed.x }, { translateY: seed.y }],
                },
              ]}
            />
          )
        })}
      </Animated.View>
      <Text variant="labelLarge" color="onSurfaceVariant">
        Drawing your map
      </Text>
    </View>
  )
}

export default function MapScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const reduced = useReducedMotion()

  const people = usePeople()
  const relationships = useRelationships()

  const userId = useAuthStore((state) => state.userId)

  const [activeTypes, setActiveTypes] = useState<ReadonlySet<RelationshipType>>(
    () => new Set(RELATIONSHIP_TYPES)
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [compareFromId, setCompareFromId] = useState<string | null>(null)
  const [captureOpen, setCaptureOpen] = useState(false)
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [initialPinned, setInitialPinned] = useState<PinnedLayout>(EMPTY_LAYOUT)
  const [pinnedCount, setPinnedCount] = useState(0)

  // Load the saved arrangement once per account; a new object identity signals
  // the graph to seed those stars and hold them fixed. Signed-out clears it.
  useEffect(() => {
    let alive = true
    const run = async () => {
      const layout = userId === null ? EMPTY_LAYOUT : await loadPinnedLayout(userId)
      if (!alive) return
      setInitialPinned(layout)
      setPinnedCount(Object.keys(layout).length)
    }
    void run()
    return () => {
      alive = false
    }
  }, [userId])

  const persistPinned = useCallback(
    (layout: PinnedLayout) => {
      setPinnedCount(Object.keys(layout).length)
      if (userId !== null) void savePinnedLayout(userId, layout)
    },
    [userId]
  )

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
      const retrying = people.isRefetching || relationships.isRefetching
      return (
        <View style={styles.errorWrap}>
          <ErrorState
            message="The map is out of reach. We couldn't load your constellation, but nothing is lost; check your connection."
            retryLabel={retrying ? 'Trying…' : 'Try again'}
            onRetry={() => {
              if (!retrying) retry()
            }}
          />
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
        initialPinned={initialPinned}
        onPinnedChange={persistPinned}
      />
    )
  }

  const showChrome = !isPending && !isError && people.people.length >= 2

  return (
    <View style={styles.screen}>
      {renderBody()}

      {showChrome && (
        <View style={[styles.chipsRow, { top: insets.top + SPACE.sm }]}>
          <TypeFilterChips active={activeTypes} onToggle={toggleType} />
        </View>
      )}

      {compareFromId !== null && (
        <Animated.View
          entering={reduced ? undefined : FadeIn.duration(DURATION.short4)}
          exiting={reduced ? undefined : FadeOut.duration(DURATION.short4)}
          style={[
            styles.compareBannerRoot,
            { top: insets.top + SPACE.sm + CHIP_HEIGHT + SPACE.md },
          ]}
        >
          {/* Real shadow: this is transient chrome floating over the canvas. */}
          <Surface level={3} radius={SHAPE.full} shadow style={styles.compareBanner}>
            <Text variant="labelLarge" color="primary">
              Pick a second star
            </Text>
            <Button
              variant="text"
              onPress={() => setCompareFromId(null)}
              icon={(color) => <XIcon size={18} color={color} />}
            >
              Cancel
            </Button>
          </Surface>
        </Animated.View>
      )}

      {showChrome &&
        pinnedCount === 0 &&
        selectedPerson === undefined &&
        compareFromId === null && (
          <Animated.View
            pointerEvents="none"
            entering={reduced ? undefined : FadeIn.duration(DURATION.medium2)}
            exiting={reduced ? undefined : FadeOut.duration(DURATION.short4)}
            style={[
              styles.hintRoot,
              { bottom: NAVIGATION_BAR_HEIGHT + insets.bottom + SPACE.md },
            ]}
          >
            <Surface level={2} radius={SHAPE.full} style={styles.hint}>
              <Text variant="labelMedium" color="onSurfaceVariant">
                Drag a star to keep it in place
              </Text>
            </Surface>
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
        trigger="people-cap"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    // The cosmic ground is painted behind every screen; the map sits on it.
    backgroundColor: 'transparent',
  },
  chipsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  compareBannerRoot: {
    position: 'absolute',
    left: SPACE.margin,
    right: SPACE.margin,
  },
  compareBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: SPACE.lg,
    paddingRight: SPACE.xs,
    paddingVertical: SPACE.xs,
  },
  hintRoot: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hint: {
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.sm,
  },
  skeletonRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.xxl,
  },
  skeletonField: {
    width: 1,
    height: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonStar: {
    position: 'absolute',
    width: SKELETON_STAR_SIZE,
    height: SKELETON_STAR_SIZE,
    borderRadius: SKELETON_STAR_SIZE / 2,
    borderWidth: 1,
  },
  errorWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACE.margin,
  },
})
