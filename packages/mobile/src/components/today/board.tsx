import { useEffect, useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'

import { COLORS, FONTS, SPACE } from '@/theme/tokens'

/**
 * "Today, across the systems" split-flap board — the ONE theatrical set
 * piece on this screen (MOTION spec). Each cell flips in (rotateX) with a
 * 15–25ms cascade jitter; reduced motion renders static values.
 */

export interface BoardRow {
  label: string
  value: string
}

function FlapCell({ row, index }: { row: BoardRow; index: number }) {
  const reduced = useReducedMotion()
  const progress = useSharedValue(reduced ? 1 : 0)
  // Deterministic per-index jitter (15–25ms) — no Math.random, replay-stable.
  const delay = useMemo(() => index * 90 + (index % 3) * 8 + 15, [index])

  useEffect(() => {
    if (reduced) return
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 380, easing: Easing.bezier(0.4, 0, 0.2, 1) })
    )
  }, [delay, progress, reduced])

  const flapStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { perspective: 600 },
      { rotateX: `${(1 - progress.value) * -85}deg` },
    ],
  }))

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{row.label}</Text>
      <Animated.View style={flapStyle}>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
          {row.value}
        </Text>
      </Animated.View>
    </View>
  )
}

export function TodayBoard({ rows }: { rows: BoardRow[] }) {
  return (
    <View style={styles.board}>
      {rows.map((row, index) => (
        <FlapCell key={row.label} row={row} index={index} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  board: {
    gap: 14,
  },
  row: {
    gap: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    paddingBottom: 14,
  },
  label: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: COLORS.text50,
  },
  value: {
    fontFamily: FONTS.monoMedium,
    fontSize: 22,
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
    color: COLORS.brandBright,
    paddingRight: SPACE.unit,
  },
})
