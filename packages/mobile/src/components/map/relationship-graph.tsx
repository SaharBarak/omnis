import type {
  PersonWithTags,
  RelationshipType,
  RelationshipWithPeople,
} from '@pleiad/api-client'
import { dateToKin, kinToSeal } from '@pleiad/engine/calculations/dreamspell'
import { getSeal } from '@pleiad/engine/data/seals'
import { Canvas, Line } from '@shopify/react-native-skia'
import { useEffect, useMemo, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
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

import { SEAL_COLOR_HEX } from '@/components/person/scaffold'
import { useForceLayout, type NodePosition } from '@/components/map/use-force-layout'
import { RELATIONSHIP_COLORS } from '@/lib/relationships/colors'
import { COLORS, TYPE } from '@/theme/tokens'

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

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter((part) => part.length > 0)
  const first = parts[0]?.[0] ?? ''
  const second = parts[1]?.[0] ?? ''
  return `${first}${second}`.toUpperCase() || '·'
}

/** Vivid dreamspell seal color for the node ring; neutral when uncomputable. */
function sealRingColor(birthDate: string): string {
  try {
    const seal = getSeal(kinToSeal(dateToKin(birthDate)))
    return SEAL_COLOR_HEX[seal.color] ?? COLORS.text50
  } catch {
    return COLORS.text50
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
        styles.pulseRing,
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
  reducedMotion,
}: {
  person: PersonWithTags
  position: NodePosition
  centerX: number
  centerY: number
  dimmed: boolean
  selected: boolean
  reducedMotion: boolean
}) {
  const size = person.is_self ? SELF_SIZE : NODE_SIZE
  const ringColor = useMemo(() => sealRingColor(person.birth_date), [person.birth_date])

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
            styles.pulseRing,
            styles.staticRing,
            { width: size + 12, height: size + 12, borderRadius: (size + 12) / 2 },
          ]}
        />
      )}
      {person.is_self && (
        <View
          style={[
            styles.selfRing,
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
            borderColor: ringColor,
            opacity: dimmed ? DIMMED_OPACITY : 1,
          },
        ]}
      >
        <Text style={styles.initials}>{initialsOf(person.name)}</Text>
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
}: {
  people: PersonWithTags[]
  relationships: RelationshipWithPeople[]
  /** Relationship types whose edges render. */
  visibleTypes: ReadonlySet<RelationshipType>
  /** True when any type chip is toggled off — orphan nodes dim. */
  filtering: boolean
  selectedId: string | null
  onSelectNode: (id: string | null) => void
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

  const positions = useForceLayout(people, layoutPairs, size, reducedMotion)

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

  const pan = Gesture.Pan()
    .averageTouches(true)
    .onStart(() => {
      savedX.value = translateX.value
      savedY.value = translateY.value
    })
    .onUpdate((event) => {
      translateX.value = savedX.value + event.translationX
      translateY.value = savedY.value + event.translationY
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
    const contentX = (event.x - width / 2 - translateX.value) / scale.value
    const contentY = (event.y - height / 2 - translateY.value) / scale.value
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
    runOnJS(onSelectNode)(hit)
  })

  const gesture = Gesture.Race(tap, Gesture.Simultaneous(pan, pinch))

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
    backgroundColor: COLORS.surface2,
    borderWidth: 2,
  },
  initials: {
    ...TYPE.eyebrow,
    color: COLORS.text70,
    letterSpacing: 1,
  },
  selfRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: COLORS.brandSoft,
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: COLORS.brandSoft,
  },
  staticRing: {
    opacity: 0.6,
  },
})
