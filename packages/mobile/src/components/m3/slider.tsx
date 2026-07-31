import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  clamp,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'

import { Text } from './text'
import { SHAPE, SPACE, alpha, useTheme } from '@/theme/m3'

/**
 * The M3 continuous slider.
 *
 * Hand-built rather than pulled in as a native dependency: the app already
 * owns its M3 kit, and one more native module in the dev client is a worse
 * trade than eighty lines of gesture handling.
 *
 * The handle position is a shared value written only inside the gesture's
 * worklets — never from a JS callback, which the React Compiler forbids — so
 * the track follows the finger at display rate and JS only hears the
 * committed number. That makes it *uncontrolled*: `value` seeds the handle on
 * mount and the parent is told where it landed. A parent that re-seeds a
 * mounted slider must remount it with a `key`.
 */

const TRACK_HEIGHT = 16
const HANDLE_WIDTH = 4
const HANDLE_HEIGHT = 44

export function Slider({
  value,
  min = 0,
  max = 100,
  onChange,
  label,
  format = (v) => String(Math.round(v)),
}: {
  /** Seeds the handle. Changes after mount are ignored — see the note above. */
  value: number
  min?: number
  max?: number
  /** Fires continuously while dragging, with the value under the finger. */
  onChange: (value: number) => void
  label: string
  format?: (value: number) => string
}) {
  const theme = useTheme()
  const [width, setWidth] = useState(0)
  const [display, setDisplay] = useState(value)

  const fraction = useSharedValue((value - min) / (max - min))
  const startFraction = useSharedValue(0)

  const report = (next: number) => {
    setDisplay(next)
    onChange(next)
  }

  const move = (x: number, trackWidth: number) => {
    'worklet'
    if (trackWidth <= 0) return
    fraction.value = clamp(x / trackWidth, 0, 1)
    runOnJS(report)(min + fraction.value * (max - min))
  }

  const pan = Gesture.Pan()
    .onBegin((event) => {
      startFraction.value = fraction.value
      move(event.x, width)
    })
    .onUpdate((event) => {
      move(event.x, width)
    })

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fraction.value * 100}%`,
  }))
  const handleStyle = useAnimatedStyle(() => ({
    left: `${fraction.value * 100}%`,
  }))

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text variant="bodyMedium" color="onSurfaceVariant">
          {label}
        </Text>
        <Text variant="dataMedium" color="onSurface">
          {format(display)}
        </Text>
      </View>

      <GestureDetector gesture={pan}>
        {/* The hit area is the full row height, not the 16dp track — a 16dp
            target misses M3's 48dp floor by two thirds. */}
        <View
          style={styles.hitArea}
          onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={label}
          accessibilityValue={{ min, max, now: Math.round(display) }}
        >
          <View
            style={[
              styles.track,
              { backgroundColor: alpha(theme.colors.onSurface, 0.12) },
            ]}
          >
            <Animated.View
              style={[
                styles.fill,
                { backgroundColor: theme.colors.primary },
                fillStyle,
              ]}
            />
          </View>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.handle,
              { backgroundColor: theme.colors.primary },
              handleStyle,
            ]}
          />
        </View>
      </GestureDetector>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    gap: SPACE.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: SPACE.md,
  },
  hitArea: {
    height: HANDLE_HEIGHT + SPACE.xs,
    justifyContent: 'center',
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: SHAPE.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: SHAPE.full,
  },
  handle: {
    position: 'absolute',
    width: HANDLE_WIDTH,
    height: HANDLE_HEIGHT,
    marginLeft: -HANDLE_WIDTH / 2,
    borderRadius: SHAPE.full,
  },
})
