import { useEffect, useState } from 'react'
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Circle } from 'react-native-svg'

import { EASING, SHAPE, SPRING, useTheme } from '@/theme/m3'

/**
 * The M3 progress indicators — linear and circular.
 *
 * Each is determinate when handed a `progress` (0→1) and indeterminate when
 * not; that is the only distinction M3 draws between the two states.
 *
 * Their motion is functional, not decorative: an indicator that stops moving
 * has stopped saying anything. So — unlike every other animation in the app —
 * the indeterminate sweep keeps running under reduced motion. What reduced
 * motion *does* switch off is the spring on a determinate value: the fill
 * lands on its new length instead of settling into it.
 */

const TRACK_HEIGHT = 4
/** The share of the track the indeterminate bar occupies as it sweeps. */
const SWEEP_FRACTION = 0.4
const SWEEP_MS = 1400
const SPIN_MS = 1200

export interface LinearProgressProps {
  /** 0→1. Omit for an indeterminate sweep. */
  progress?: number
  style?: StyleProp<ViewStyle>
  accessibilityLabel?: string
}

function clamp01(value: number): number {
  'worklet'
  return Math.max(0, Math.min(1, value))
}

function DeterminateBar({ progress, style, accessibilityLabel }: LinearProgressProps & { progress: number }) {
  const theme = useTheme()
  const reduced = useReducedMotion()
  const value = useSharedValue(clamp01(progress))

  useEffect(() => {
    value.value = reduced ? clamp01(progress) : withSpring(clamp01(progress), SPRING.spatial)
  }, [progress, reduced, value])

  // scaleX from the leading edge, so the bar grows rather than being re-laid out.
  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: value.value }],
  }))

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamp01(progress) * 100) }}
      style={[
        styles.track,
        { backgroundColor: theme.colors.surfaceContainerHighest },
        style,
      ]}
    >
      <Animated.View
        style={[styles.fill, { backgroundColor: theme.colors.primary }, fillStyle]}
      />
    </View>
  )
}

function IndeterminateBar({ style, accessibilityLabel }: LinearProgressProps) {
  const theme = useTheme()
  const [width, setWidth] = useState(0)
  const sweep = useSharedValue(0)

  useEffect(() => {
    sweep.value = 0
    sweep.value = withRepeat(
      withTiming(1, { duration: SWEEP_MS, easing: Easing.bezier(...EASING.standard) }),
      -1,
      false
    )
  }, [sweep])

  const fillStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          -width * SWEEP_FRACTION + sweep.value * width * (1 + SWEEP_FRACTION),
      },
    ],
  }))

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      style={[
        styles.track,
        { backgroundColor: theme.colors.surfaceContainerHighest },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.sweep,
          { backgroundColor: theme.colors.primary, width: width * SWEEP_FRACTION },
          fillStyle,
        ]}
      />
    </View>
  )
}

export function LinearProgress({ progress, style, accessibilityLabel }: LinearProgressProps) {
  if (progress === undefined) {
    return <IndeterminateBar style={style} accessibilityLabel={accessibilityLabel} />
  }
  return (
    <DeterminateBar
      progress={progress}
      style={style}
      accessibilityLabel={accessibilityLabel}
    />
  )
}

export interface CircularProgressProps {
  /** 0→1. Omit for an indeterminate spin. */
  progress?: number
  size?: number
  /** Defaults to `primary`. A flavour accent is the only reason to override. */
  color?: string
  accessibilityLabel?: string
}

export function CircularProgress({
  progress,
  size = 48,
  color,
  accessibilityLabel,
}: CircularProgressProps) {
  const theme = useTheme()
  const spin = useSharedValue(0)
  const indeterminate = progress === undefined

  useEffect(() => {
    if (!indeterminate) return
    spin.value = 0
    spin.value = withRepeat(
      withTiming(1, { duration: SPIN_MS, easing: Easing.linear }),
      -1,
      false
    )
  }, [indeterminate, spin])

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }))

  const stroke = color ?? theme.colors.primary
  const radius = (size - TRACK_HEIGHT) / 2
  const circumference = 2 * Math.PI * radius
  // The indeterminate arc is a fixed quarter-turn of the circle, spun; the
  // determinate one is the fraction itself, drawn from twelve o'clock.
  const arc = indeterminate ? 0.25 : clamp01(progress)

  return (
    <Animated.View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={
        indeterminate ? undefined : { min: 0, max: 100, now: Math.round(arc * 100) }
      }
      style={[{ width: size, height: size }, spinStyle]}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.surfaceContainerHighest}
          strokeWidth={TRACK_HEIGHT}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={stroke}
          strokeWidth={TRACK_HEIGHT}
          strokeLinecap="round"
          strokeDasharray={`${circumference * arc} ${circumference}`}
          fill="none"
          // The arc starts at twelve o'clock, not three, which is where SVG
          // would otherwise begin drawing it.
          rotation={-90}
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  track: {
    height: TRACK_HEIGHT,
    borderRadius: SHAPE.full,
    overflow: 'hidden',
  },
  fill: {
    height: TRACK_HEIGHT,
    width: '100%',
    borderRadius: SHAPE.full,
    transformOrigin: 'left',
  },
  sweep: {
    height: TRACK_HEIGHT,
    borderRadius: SHAPE.full,
  },
})
