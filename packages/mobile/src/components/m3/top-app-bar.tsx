import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Text } from './text'
import { SPACE, TYPE, useTheme } from '@/theme/m3'

/**
 * The M3 top app bar, in its small and large forms.
 *
 * The large bar is the one worth having: it opens with a headline on its own
 * line and, as the page scrolls, collapses into the small bar with the title
 * sitting inline. Two things happen together during that collapse, and both
 * are M3 rules:
 *
 *   the tall headline fades out while the inline title fades in, and
 *   the bar takes on a surface tint — that tint is the *only* thing separating
 *   the bar from the content sliding under it. M3 uses no shadow here.
 *
 * Pass `progress` from `useScrollProgress(LARGE_TITLE_COLLAPSE_DISTANCE)`.
 */

const SMALL_HEIGHT = 64
const LARGE_HEADLINE_HEIGHT = 88

/** How far the user scrolls before a large bar is fully collapsed. */
export const LARGE_TITLE_COLLAPSE_DISTANCE = 96

export interface TopAppBarProps {
  title: string
  variant?: 'small' | 'large'
  /** Back arrow, close, etc. Sits at the leading edge. */
  navigationIcon?: ReactNode
  /** Up to three. Anything more belongs behind an overflow menu. */
  actions?: ReactNode
  /** Required for `large` — without it the bar can't collapse. */
  progress?: SharedValue<number>
}

export function TopAppBar({
  title,
  variant = 'small',
  navigationIcon,
  actions,
  progress,
}: TopAppBarProps) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  // Resolved on the JS thread: `surfaceAt` is a plain closure, and calling it
  // inside the worklet below would throw on the UI thread.
  const scrolledSurface = theme.surfaceAt(2)

  // Level 0 at rest, level 2 once anything has scrolled beneath it. The tint is
  // the only thing separating the bar from the content — M3 uses no shadow here.
  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor: (progress?.value ?? 0) > 0.01 ? scrolledSurface : 'transparent',
  }))

  const headlineStyle = useAnimatedStyle(() => {
    const value = progress?.value ?? 0
    return {
      opacity: interpolate(value, [0, 0.6], [1, 0]),
      height: interpolate(value, [0, 1], [LARGE_HEADLINE_HEIGHT, 0]),
      transform: [{ translateY: interpolate(value, [0, 1], [0, -16]) }],
    }
  })

  const inlineTitleStyle = useAnimatedStyle(() => ({
    opacity: variant === 'large' ? interpolate(progress?.value ?? 0, [0.6, 1], [0, 1]) : 1,
  }))

  return (
    <Animated.View style={[{ paddingTop: insets.top }, containerStyle]}>
      <View style={styles.row}>
        {navigationIcon !== undefined && <View style={styles.nav}>{navigationIcon}</View>}

        <Animated.View style={[styles.inlineTitle, inlineTitleStyle]}>
          <Text
            variant="titleLarge"
            color="onSurface"
            numberOfLines={1}
            // The small bar's title is 22dp; the collapsed large bar's is too,
            // which is what lets one cross-fade into the other without a jump.
            style={variant === 'large' ? styles.collapsedTitle : undefined}
          >
            {title}
          </Text>
        </Animated.View>

        {actions !== undefined && <View style={styles.actions}>{actions}</View>}
      </View>

      {variant === 'large' && (
        <Animated.View style={[styles.headline, headlineStyle]}>
          <Text variant="displaySmall" color="onSurface" numberOfLines={2} style={styles.headlineText}>
            {title}
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  row: {
    height: SMALL_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.xs,
  },
  nav: {
    width: 48,
    alignItems: 'center',
  },
  inlineTitle: {
    flex: 1,
    paddingHorizontal: SPACE.md,
  },
  collapsedTitle: {
    ...TYPE.titleLarge,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headline: {
    justifyContent: 'flex-end',
    paddingHorizontal: SPACE.margin,
    overflow: 'hidden',
  },
  headlineText: {
    paddingBottom: SPACE.xl,
  },
})
