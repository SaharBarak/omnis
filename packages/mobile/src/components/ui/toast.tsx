import { useEffect } from 'react'
import { StyleSheet, Text } from 'react-native'
import Animated, { FadeInUp, FadeOutDown, useReducedMotion } from 'react-native-reanimated'

import { useToastStore } from '@/lib/toast'
import { COLORS, DURATION, RADII, SPACE, TYPE } from '@/theme/tokens'

const TOAST_DISMISS_MS = 3500

/**
 * Bottom toast — one at a time, auto-dismissed. Mount once per screen that
 * raises toasts (people tab). Never blocks touches.
 */
export function ToastHost() {
  const message = useToastStore((state) => state.message)
  const seq = useToastStore((state) => state.seq)
  const dismiss = useToastStore((state) => state.dismiss)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (message === null) return
    const timer = setTimeout(dismiss, TOAST_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [message, seq, dismiss])

  if (message === null) return null

  return (
    <Animated.View
      key={seq}
      entering={reduced ? undefined : FadeInUp.duration(DURATION.normal)}
      exiting={reduced ? undefined : FadeOutDown.duration(DURATION.fast)}
      style={styles.toast}
      pointerEvents="none"
      accessibilityLiveRegion="polite"
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: SPACE.gutter,
    right: SPACE.gutter,
    bottom: SPACE.section,
    backgroundColor: COLORS.surface2,
    borderRadius: RADII.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACE.cardPad,
    paddingVertical: 14,
  },
  text: {
    ...TYPE.bodySm,
    color: COLORS.text90,
    textAlign: 'center',
  },
})
