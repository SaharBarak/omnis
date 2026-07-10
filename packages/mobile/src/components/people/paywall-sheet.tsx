import { XIcon } from 'phosphor-react-native'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, { FadeIn, SlideInDown, useReducedMotion } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button, Eyebrow } from '@/components/ui/primitives'
import { COLORS, DURATION, RADII, SPACE, SPRING, TYPE } from '@/theme/tokens'

/**
 * S18 paywall — M1 placeholder. Reached from the people cap
 * (403 limit_exceeded, F3). Real tier ladder + hosted checkout land with M3;
 * until then this states the limit calmly and promises the path.
 */
export function PaywallSheet({
  visible,
  onClose,
  limit,
  planName,
}: {
  visible: boolean
  onClose: () => void
  /** The plan's profile cap — the N in the headline. */
  limit: number
  planName: string
}) {
  const reduced = useReducedMotion()
  const insets = useSafeAreaInsets()

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View
          entering={reduced ? undefined : FadeIn.duration(DURATION.normal)}
          style={StyleSheet.absoluteFill}
        >
          <Pressable
            style={[StyleSheet.absoluteFill, styles.scrim]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
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
          <View style={styles.header}>
            <Eyebrow color={COLORS.brandSoft}>YOUR MAP IS FULL</Eyebrow>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <XIcon size={20} color={COLORS.text50} />
            </Pressable>
          </View>

          <Text style={TYPE.zone}>
            Your map holds {limit} people on {planName}.
          </Text>
          <Text style={styles.body}>
            Every person you keep gets the full five-system reading. Larger maps —
            and every locked system — open with a plan.
          </Text>

          <Button disabled style={styles.cta}>
            See plans
          </Button>
          <Text style={styles.note}>CHECKOUT ARRIVES WITH M3</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  body: {
    ...TYPE.body,
    color: COLORS.text70,
  },
  cta: {
    marginTop: SPACE.unit,
  },
  note: {
    ...TYPE.statLabel,
    textAlign: 'center',
  },
})
