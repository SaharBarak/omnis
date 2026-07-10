import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, { FadeIn, SlideInDown, useReducedMotion } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button, Eyebrow } from '@/components/ui/primitives'
import { usePushOptIn } from '@/lib/notifications/opt-in'
import { registerForPush } from '@/lib/notifications/push'
import { COLORS, DURATION, RADII, SPACE, SPRING, TYPE } from '@/theme/tokens'

/**
 * F9 opt-in moment — the one-time morning-digest invitation, shown after
 * the first person lands on the map (never on launch). Either answer
 * dismisses it for good; the permission dialog itself only appears on
 * accept.
 */
export function PushPromptHost() {
  const reduced = useReducedMotion()
  const insets = useSafeAreaInsets()
  const visible = usePushOptIn((state) => state.visible)
  const dismiss = usePushOptIn((state) => state.dismiss)

  const enable = () => {
    dismiss()
    // Permission dialog + token registration run behind the close; every
    // dead end (denied, Expo Go, simulator) resolves silently.
    void registerForPush()
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={dismiss}>
      <View style={styles.root}>
        <Animated.View
          entering={reduced ? undefined : FadeIn.duration(DURATION.normal)}
          style={StyleSheet.absoluteFill}
        >
          <Pressable
            style={[StyleSheet.absoluteFill, styles.scrim]}
            onPress={dismiss}
            accessibilityRole="button"
            accessibilityLabel="Not now"
          />
        </Animated.View>

        <Animated.View
          entering={
            reduced
              ? undefined
              : SlideInDown.springify().damping(SPRING.damping).stiffness(SPRING.stiffness)
          }
          style={[styles.sheet, { paddingBottom: insets.bottom + SPACE.cardPad }]}
        >
          <Eyebrow color={COLORS.brandSoft}>DAILY SKY</Eyebrow>
          <Text style={TYPE.zone}>The calendars move every morning.</Text>
          <Text style={styles.body}>
            One quiet note a day — today's kin, the moon, and which of your
            people resonate with the sky. Nothing else, ever.
          </Text>

          <Button onPress={enable} style={styles.cta}>
            Enable the morning digest
          </Button>
          <Button variant="secondary" onPress={dismiss}>
            Not now
          </Button>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    backgroundColor: 'rgba(11,13,22,0.72)',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADII.feature,
    borderTopRightRadius: RADII.feature,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACE.featurePad,
    paddingTop: SPACE.featurePad,
    gap: SPACE.cardPad,
  },
  body: {
    ...TYPE.body,
    color: COLORS.text70,
  },
  cta: {
    marginTop: SPACE.unit,
  },
})
