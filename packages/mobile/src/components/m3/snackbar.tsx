import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  Easing,
  FadeOutDown,
  SlideInDown,
  useReducedMotion,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Text } from './text'
import { Touchable } from './touchable'
import { DURATION, EASING, SHADOW, SHAPE, SPACE, useTheme } from '@/theme/m3'
import { useToastStore } from '@/lib/toast'

/**
 * The M3 snackbar.
 *
 * It is drawn in *inverse* colours — `inverseSurface` under `inverseOnSurface`
 * — so that it reads as a message from the app rather than as another card in
 * the page. That inversion is the entire visual idea, and it's why a snackbar
 * doesn't need a border to separate itself.
 *
 * One at a time, four seconds, dismissible. Mounted once at the root; every
 * screen used to mount its own, which meant a toast raised from a sheet could
 * be torn down with the sheet before it was read.
 */

const DISMISS_MS = 4000

export function SnackbarHost() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const reduced = useReducedMotion()

  const message = useToastStore((state) => state.message)
  const seq = useToastStore((state) => state.seq)
  const dismiss = useToastStore((state) => state.dismiss)

  useEffect(() => {
    if (message === null) return
    const timer = setTimeout(dismiss, DISMISS_MS)
    return () => clearTimeout(timer)
  }, [message, seq, dismiss])

  if (message === null) return null

  return (
    <Animated.View
      key={seq}
      entering={
        reduced
          ? undefined
          : SlideInDown.duration(DURATION.medium2).easing(
              Easing.bezier(...EASING.emphasizedDecelerate).factory()
            )
      }
      exiting={reduced ? undefined : FadeOutDown.duration(DURATION.short4)}
      style={[
        styles.root,
        SHADOW.level3,
        {
          backgroundColor: theme.colors.inverseSurface,
          bottom: insets.bottom + SPACE.margin,
        },
      ]}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.body}>
        <Text variant="bodyMedium" color={theme.colors.inverseOnSurface}>
          {message}
        </Text>
      </View>

      <Touchable
        onPress={dismiss}
        radius={SHAPE.extraSmall}
        stateLayerColor={theme.colors.inversePrimary}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
        hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
        style={styles.action}
      >
        <Text variant="labelLarge" color={theme.colors.inversePrimary}>
          Dismiss
        </Text>
      </Touchable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: SPACE.margin,
    right: SPACE.margin,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingLeft: SPACE.lg,
    paddingRight: SPACE.sm,
    paddingVertical: SPACE.md,
    borderRadius: SHAPE.extraSmall,
  },
  body: {
    flex: 1,
  },
  action: {
    paddingHorizontal: SPACE.sm,
    paddingVertical: SPACE.sm,
  },
})
