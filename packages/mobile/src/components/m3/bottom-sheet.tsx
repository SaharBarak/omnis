import type { PropsWithChildren } from 'react'
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useReducedMotion,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { SurfaceColorProvider } from './surface-context'
import { Text } from './text'
import { DURATION, EASING, SHAPE, SPACE, alpha, useTheme } from '@/theme/m3'

/**
 * The M3 modal bottom sheet.
 *
 * Three details carry it, and all three are spec:
 *
 *   the drag handle — a 32×4 bar of `onSurfaceVariant` at 40%, which is the
 *   only affordance telling the user the sheet can be dismissed by dragging;
 *
 *   corners rounded to `extraLarge` (28dp) on the top edge *only*, so the sheet
 *   reads as having risen from the bottom of the screen rather than as a card;
 *
 *   a scrim of `scrim` at 32%, which dims the page without hiding it — the user
 *   should still know what they were looking at.
 *
 * The sheet enters on `emphasizedDecelerate`: fast off the mark, slow as it
 * lands. That asymmetry is what makes it feel like it has weight.
 */
export interface BottomSheetProps extends PropsWithChildren {
  visible: boolean
  onClose: () => void
  /** Optional headline. Sheets that are a form should have one. */
  title?: string
}

export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const reduced = useReducedMotion()

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/*
       * A sheet that holds a form must rise above the keyboard, and a Modal
       * gets no keyboard inset for free on iOS. Android resizes the window
       * itself, so it wants no padding on top of that.
       */}
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View
          entering={reduced ? undefined : FadeIn.duration(DURATION.medium1)}
          exiting={reduced ? undefined : FadeOut.duration(DURATION.short4)}
          style={StyleSheet.absoluteFill}
        >
          <Pressable
            style={[styles.scrim, { backgroundColor: alpha(theme.colors.scrim, 0.32) }]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
          />
        </Animated.View>

        <Animated.View
          entering={
            reduced
              ? undefined
              : SlideInDown.duration(DURATION.long1).easing(
                  Easing.bezier(...EASING.emphasizedDecelerate).factory()
                )
          }
          exiting={
            reduced
              ? undefined
              : SlideOutDown.duration(DURATION.medium2).easing(
                  Easing.bezier(...EASING.emphasizedAccelerate).factory()
                )
          }
          style={[
            styles.sheet,
            {
              backgroundColor: theme.surfaceAt(1),
              paddingBottom: insets.bottom + SPACE.lg,
            },
          ]}
        >
          <View style={styles.handleRow}>
            <View
              style={[
                styles.handle,
                { backgroundColor: alpha(theme.colors.onSurfaceVariant, 0.4) },
              ]}
            />
          </View>

          {title !== undefined && (
            <Text variant="headlineSmall" color="onSurface" style={styles.title}>
              {title}
            </Text>
          )}

          {/* Publish the sheet's own surface so text fields inside it notch
              their floating label against the right colour. */}
          <SurfaceColorProvider color={theme.surfaceAt(1)}>{children}</SurfaceColorProvider>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: SHAPE.extraLarge,
    borderTopRightRadius: SHAPE.extraLarge,
    paddingHorizontal: SPACE.margin,
    maxHeight: '92%',
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: SPACE.md,
    paddingBottom: SPACE.lg,
  },
  handle: {
    width: 32,
    height: 4,
    borderRadius: SHAPE.full,
  },
  title: {
    marginBottom: SPACE.lg,
  },
})
