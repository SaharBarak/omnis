import type {
  PersonWithTags,
  RelationshipType,
  RelationshipWithPeople,
} from '@pleiad/api-client'
import { dateToKin, kinToSeal } from '@pleiad/engine/calculations/dreamspell'
import { getSeal } from '@pleiad/engine/data/seals'
import { Canvas, Line } from '@shopify/react-native-skia'
import { useEffect, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'

import { useForceLayout, type NodePosition } from '@/components/map/use-force-layout'
import { Text } from '@/components/m3'
import type { PinnedLayout } from '@/lib/map/layout-store'
import { RELATIONSHIP_COLORS } from '@/lib/relationships/colors'
import { useTheme } from '@/theme/m3'
import { SEAL_COLOR_HEX } from '@/theme/tokens'
import { initialsOf } from '@/lib/text'

/**
 * S10 relationship graph — force-settled constellation on a Skia canvas
 * (edges) under Reanimated node views (seal-ringed stars). Pinch/pan/tap all
 * ride shared values on the UI thread; the tap hit-test inverts the current
 * transform inside the gesture worklet, so selection stays <100ms at any
 * zoom (F6 Scenario F).
 */

const NODE_SIZE = 44
const SELF_SIZE = 52
const HIT_RADIUS = 34
const MIN_SCALE = 0.5
const MAX_SCALE = 3
const EDGE_OPACITY = 0.55
const DIMMED_OPACITY = 0.35
const PULSE_MS = 1250 // half of the 2.5s gentle cycle

/** Vivid dreamspell seal color for the node ring; neutral when uncomputable. */
function sealRingColor(birthDate: string, fallback: string): string {
  try {
    const seal = getSeal(kinToSeal(dateToKin(birthDate)))
    return SEAL_COLOR_HEX[seal.color] ?? fallback
  } catch {
    return fallback
  }
}

/** One Skia edge bound to both endpoints' shared positions. */
function EdgeLine({
  a,
  b,
  color,
  centerX,
  centerY,
}: {
  a: NodePosition
  b: NodePosition
  color: string
  centerX: number
  centerY: number
}) {
  const p1 = useDerivedValue(() => ({ x: centerX + a.x.value, y: centerY + a.y.value }))
  const p2 = useDerivedValue(() => ({ x: centerX + b.x.value, y: centerY + b.y.value }))
  return <Line p1={p1} p2={p2} color={color} strokeWidth={1} opacity={EDGE_OPACITY} />
}

/** Isolated pulse — mounts only on the selected node, 2.5s gentle cycle. */
function SelectedPulse({ size }: { size: number }) {
  const theme = useTheme()
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: PULSE_MS }), -1, true)
    return () => cancelAnimation(progress)
  }, [progress])

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + progress.value * 0.22 }],
    opacity: 0.7 - progress.value * 0.45,
  }))

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        { borderColor: theme.colors.primary, borderWidth: 1.5 },
        { width: size + 12, height: size + 12, borderRadius: (size + 12) / 2 },
        style,
      ]}
    />
  )
}

function GraphNode({
  person,
  position,
  centerX,
  centerY,
  dimmed,
  selected,
  pinned,
  reducedMotion,
}: {
  person: PersonWithTags
  position: NodePosition
  centerX: number
  centerY: number
  dimmed: boolean
  selected: boolean
  /** User has dragged/anchored this star; the sim holds it fixed. */
  pinned: boolean
  reducedMotion: boolean
}) {
  const theme = useTheme()
  const size = person.is_self ? SELF_SIZE : NODE_SIZE
  const ringColor = useMemo(
    () => sealRingColor(person.birth_date, theme.colors.outline),
    [person.birth_date, theme.colors.outline]
  )

  const positionStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: centerX + position.x.value - size / 2 },
      { translateY: centerY + position.y.value - size / 2 },
    ],
  }))

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.node, { width: size, height: size }, positionStyle]}
    >
      {selected && !reducedMotion && <SelectedPulse size={size} />}
      {selected && reducedMotion && (
        <View
          style={[
            styles.ring,
            styles.staticRing,
            { borderColor: theme.colors.primary, borderWidth: 1.5 },
            { width: size + 12, height: size + 12, borderRadius: (size + 12) / 2 },
          ]}
        />
      )}
      {person.is_self && (
        <View
          style={[
            styles.ring,
            { borderColor: theme.colors.primary, borderWidth: 1 },
            { width: size + 8, height: size + 8, borderRadius: (size + 8) / 2 },
          ]}
        />
      )}
      {/* A pinned star wears a quiet secondary halo — the mark of "I placed this". */}
      {pinned && !person.is_self && (
        <View
          style={[
            styles.ring,
            { borderColor: theme.colors.secondary, borderWidth: 1.5 },
            { width: size + 8, height: size + 8, borderRadius: (size + 8) / 2 },
          ]}
        />
      )}
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            // A star is a raised surface over the sky — tint, not shadow.
            backgroundColor: theme.surfaceAt(2),
            borderColor: ringColor,
            opacity: dimmed ? DIMMED_OPACITY : 1,
          },
        ]}
      >
        <Text variant="labelMedium" color="onSurfaceVariant">
          {initialsOf(person.name)}
        </Text>
      </View>
    </Animated.View>
  )
}

interface HitTarget {
  id: string
  x: SharedValue<number>
  y: SharedValue<number>
}

export function RelationshipGraph({
  people,
  relationships,
  visibleTypes,
  filtering,
  selectedId,
  onSelectNode,
  initialPinned,
  onPinnedChange,
}: {
  people: PersonWithTags[]
  relationships: RelationshipWithPeople[]
  /** Relationship types whose edges render. */
  visibleTypes: ReadonlySet<RelationshipType>
  /** True when any type chip is toggled off — orphan nodes dim. */
  filtering: boolean
  selectedId: string | null
  onSelectNode: (id: string | null) => void
  /** Persisted pinned positions (stable identity once loaded). */
  initialPinned: PinnedLayout
  /** Called when the user pins or releases a star. */
  onPinnedChange: (layout: PinnedLayout) => void
}) {
  const reducedMotion = useReducedMotion()
  const [size, setSize] = useState<{ width: number; height: number } | null>(null)

  const peopleIds = useMemo(() => new Set(people.map((person) => person.id)), [people])

  // Edges whose endpoints are both on the map. Layout uses every bond
  // (regardless of filters) so toggling chips never re-shuffles the sky.
  const edges = useMemo(
    () =>
      relationships.filter(
        (edge) => peopleIds.has(edge.person1_id) && peopleIds.has(edge.person2_id)
      ),
    [relationships, peopleIds]
  )

  const layoutPairs = useMemo(() => {
    const seen = new Set<string>()
    const pairs: Array<readonly [string, string]> = []
    for (const edge of edges) {
      const key =
        edge.person1_id < edge.person2_id
          ? `${edge.person1_id}~${edge.person2_id}`
          : `${edge.person2_id}~${edge.person1_id}`
      if (seen.has(key)) continue
      seen.add(key)
      pairs.push([edge.person1_id, edge.person2_id] as const)
    }
    return pairs
  }, [edges])

  const { positions, activeDragId, pinnedIds, startDrag, endDrag, unpin } = useForceLayout(
    people,
    layoutPairs,
    size,
    reducedMotion,
    { initial: initialPinned, onChange: onPinnedChange }
  )

  const visibleEdges = useMemo(
    () => edges.filter((edge) => visibleTypes.has(edge.type)),
    [edges, visibleTypes]
  )

  // Orphans under an active filter dim to 35%.
  const connectedIds = useMemo(() => {
    const ids = new Set<string>()
    for (const edge of visibleEdges) {
      ids.add(edge.person1_id)
      ids.add(edge.person2_id)
    }
    return ids
  }, [visibleEdges])

  // --- Gestures: pinch zoom + pan on shared values, tap hit-test ----------
  const scale = useSharedValue(1)
  const savedScale = useSharedValue(1)
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const savedX = useSharedValue(0)
  const savedY = useSharedValue(0)

  const hitTargets = useMemo<HitTarget[]>(() => {
    const targets: HitTarget[] = []
    for (const person of people) {
      const position = positions.get(person.id)
      if (position !== undefined) {
        targets.push({ id: person.id, x: position.x, y: position.y })
      }
    }
    return targets
  }, [people, positions])

  const width = size?.width ?? 0
  const height = size?.height ?? 0

  // Nearest star within HIT_RADIUS of a screen point, in content space. Shared
  // by tap-select, double-tap-pin, and the drag branch of the pan gesture.
  const hitTest = (screenX: number, screenY: number): string | null => {
    'worklet'
    const contentX = (screenX - width / 2 - translateX.value) / scale.value
    const contentY = (screenY - height / 2 - translateY.value) / scale.value
    let hit: string | null = null
    let best = HIT_RADIUS * HIT_RADIUS
    for (const target of hitTargets) {
      const dx = target.x.value - contentX
      const dy = target.y.value - contentY
      const distSq = dx * dx + dy * dy
      if (distSq < best) {
        best = distSq
        hit = target.id
      }
    }
    return hit
  }

  // Double-tap toggles a star's pin: release it if pinned, else anchor in place.
  const togglePin = (id: string) => {
    if (pinnedIds.has(id)) unpin(id)
    else endDrag(id)
  }

  // Pan does double duty: drag a star (when it starts on one) or pan the canvas.
  const pan = Gesture.Pan()
    .averageTouches(true)
    .onStart((event) => {
      const id = hitTest(event.x, event.y)
      if (id !== null) {
        activeDragId.value = id
        runOnJS(startDrag)(id)
      } else {
        activeDragId.value = null
        savedX.value = translateX.value
        savedY.value = translateY.value
      }
    })
    .onUpdate((event) => {
      const id = activeDragId.value
      if (id !== null) {
        const contentX = (event.x - width / 2 - translateX.value) / scale.value
        const contentY = (event.y - height / 2 - translateY.value) / scale.value
        for (const target of hitTargets) {
          if (target.id === id) {
            target.x.value = contentX
            target.y.value = contentY
          }
        }
      } else {
        translateX.value = savedX.value + event.translationX
        translateY.value = savedY.value + event.translationY
      }
    })
    .onEnd(() => {
      const id = activeDragId.value
      if (id !== null) {
        runOnJS(endDrag)(id)
        activeDragId.value = null
      }
    })

  const pinch = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value
      savedX.value = translateX.value
      savedY.value = translateY.value
    })
    .onUpdate((event) => {
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, savedScale.value * event.scale))
      const ratio = next / savedScale.value
      const focalX = event.focalX - width / 2
      const focalY = event.focalY - height / 2
      translateX.value = focalX - (focalX - savedX.value) * ratio
      translateY.value = focalY - (focalY - savedY.value) * ratio
      scale.value = next
    })

  const tap = Gesture.Tap().onEnd((event, success) => {
    if (!success) return
    runOnJS(onSelectNode)(hitTest(event.x, event.y))
  })

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(300)
    .onEnd((event, success) => {
      if (!success) return
      const id = hitTest(event.x, event.y)
      if (id !== null) runOnJS(togglePin)(id)
    })

  const gesture = Gesture.Race(
    Gesture.Exclusive(doubleTap, tap),
    Gesture.Simultaneous(pan, pinch)
  )

  const contentStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }))

  const centerX = width / 2
  const centerY = height / 2

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={styles.viewport}
        onLayout={(event) => {
          const { width: w, height: h } = event.nativeEvent.layout
          if (w > 0 && h > 0) setSize({ width: w, height: h })
        }}
        accessibilityLabel="Relationship map"
      >
        {size !== null && (
          <Animated.View style={[StyleSheet.absoluteFill, contentStyle]}>
            <Canvas style={StyleSheet.absoluteFill}>
              {visibleEdges.map((edge) => {
                const a = positions.get(edge.person1_id)
                const b = positions.get(edge.person2_id)
                if (a === undefined || b === undefined) return null
                return (
                  <EdgeLine
                    key={edge.id}
                    a={a}
                    b={b}
                    color={RELATIONSHIP_COLORS[edge.type]}
                    centerX={centerX}
                    centerY={centerY}
                  />
                )
              })}
            </Canvas>
            {people.map((person) => {
              const position = positions.get(person.id)
              if (position === undefined) return null
              return (
                <GraphNode
                  key={person.id}
                  person={person}
                  position={position}
                  centerX={centerX}
                  centerY={centerY}
                  dimmed={filtering && !connectedIds.has(person.id)}
                  selected={person.id === selectedId}
                  pinned={pinnedIds.has(person.id)}
                  reducedMotion={reducedMotion}
                />
              )
            })}
          </Animated.View>
        )}
      </View>
    </GestureDetector>
  )
}

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    overflow: 'hidden',
  },
  node: {
    position: 'absolute',
    left: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  ring: {
    position: 'absolute',
  },
  staticRing: {
    opacity: 0.6,
  },
})
