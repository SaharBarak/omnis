import { useRouter } from 'expo-router'
import { CaretRightIcon } from 'phosphor-react-native'
import { useEffect, useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'

import { Divider, Text } from '@/components/m3'
import type { LibrarySystemKey } from '@/lib/library/content'
import { DURATION, EASING, SPACE, useTheme } from '@/theme/m3'

/**
 * The split-flap board — the one theatrical moment on Today, and the only
 * place in the app that gets a set-piece animation.
 *
 * Each row flips down on its own delay, the way a departures board does. The
 * jitter is derived from the index rather than randomised, so the cascade is
 * identical on every mount and doesn't shimmer differently each time you open
 * the app.
 *
 * Values are `dataMedium` — tabular figures — because a kin number that
 * re-flows its width as it flips would ruin the effect.
 */

export interface BoardRow {
  label: string
  value: string
  /** Bundled doc this row taps through to (#69); rows without one are inert. */
  system?: LibrarySystemKey
}

function FlapCell({ row, index, last }: { row: BoardRow; index: number; last: boolean }) {
  const reduced = useReducedMotion()
  const router = useRouter()
  const theme = useTheme()
  const progress = useSharedValue(reduced ? 1 : 0)
  const delay = useMemo(() => index * 90 + (index % 3) * 8 + 15, [index])

  useEffect(() => {
    if (reduced) return
    progress.value = withDelay(
      delay,
      withTiming(1, {
        duration: DURATION.medium4,
        easing: Easing.bezier(...EASING.emphasizedDecelerate),
      })
    )
  }, [delay, progress, reduced])

  const flapStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ perspective: 600 }, { rotateX: `${(1 - progress.value) * -85}deg` }],
  }))

  const { system } = row
  const cell = (
    <View style={styles.row}>
      <Text variant="labelMedium" color="onSurfaceVariant">
        {row.label}
      </Text>
      <View style={styles.value}>
        <Animated.View style={flapStyle}>
          <Text
            variant="dataMedium"
            color="primary"
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {row.value}
          </Text>
        </Animated.View>
        {system !== undefined && (
          <CaretRightIcon size={14} color={theme.colors.onSurfaceVariant} />
        )}
      </View>
    </View>
  )

  return (
    <View>
      {system !== undefined ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${row.label}: ${row.value}. Open the ${row.label} page.`}
          onPress={() => {
            router.push({ pathname: '/learn/[system]', params: { system } })
          }}
        >
          {cell}
        </Pressable>
      ) : (
        cell
      )}
      {!last && <Divider />}
    </View>
  )
}

export function TodayBoard({ rows }: { rows: BoardRow[] }) {
  return (
    <View>
      {rows.map((row, index) => (
        <FlapCell
          key={row.label}
          row={row}
          index={index}
          last={index === rows.length - 1}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.lg,
    paddingVertical: SPACE.md,
  },
  value: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    flexShrink: 1,
  },
})
