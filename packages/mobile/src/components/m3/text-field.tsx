import type { ReactNode } from 'react'
import { useState } from 'react'
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native'
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated'

import { useSurfaceColor } from './surface-context'
import { Text } from './text'
import { DURATION, EASING, SHAPE, SPACE, TYPE, useTheme } from '@/theme/m3'

/**
 * The M3 outlined text field.
 *
 * The label is the whole design: it starts as the placeholder, and on focus (or
 * once there's a value) it floats up and *notches into the outline* rather than
 * sitting above it. That notch is why the label is absolutely positioned over a
 * gap in the border instead of being a separate row — and it's the detail that
 * makes a field read as Material rather than as a generic dark input.
 *
 * Supporting text and error text share one slot below, so a field never changes
 * height when it goes invalid.
 */
export interface TextFieldProps extends Omit<TextInputProps, 'style' | 'placeholder'> {
  label: string
  /** Hint under the field. Replaced by `error` when there is one. */
  supportingText?: string
  /** Non-empty turns the field red and takes over the supporting slot. */
  error?: string
  leadingIcon?: (color: string) => ReactNode
  trailingIcon?: ReactNode
}

export function TextField({
  label,
  supportingText,
  error,
  leadingIcon,
  trailingIcon,
  value,
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps) {
  const theme = useTheme()
  const surface = useSurfaceColor()
  const [focused, setFocused] = useState(false)

  const hasError = error !== undefined && error.length > 0
  const filled = value !== undefined && value.length > 0
  const floating = focused || filled

  const progress = useDerivedValue(
    () =>
      withTiming(floating ? 1 : 0, {
        duration: DURATION.short4,
        easing: Easing.bezier(...EASING.standard),
      }),
    [floating]
  )

  const labelStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -28]) },
      { scale: interpolate(progress.value, [0, 1], [1, 0.75]) },
    ],
  }))

  const borderColor = hasError
    ? theme.colors.error
    : focused
      ? theme.colors.primary
      : theme.colors.outline
  const labelColor = hasError
    ? theme.colors.error
    : focused
      ? theme.colors.primary
      : theme.colors.onSurfaceVariant

  return (
    <View>
      <View
        style={[
          styles.field,
          {
            borderColor,
            // The focused field thickens to 2dp — M3's focus indicator.
            borderWidth: focused || hasError ? 2 : 1,
          },
        ]}
      >
        {leadingIcon !== undefined && (
          <View style={styles.leading}>{leadingIcon(theme.colors.onSurfaceVariant)}</View>
        )}

        <View style={styles.inputWrap}>
          {/*
           * The label rides on a chip of whatever surface is behind the field,
           * and that chip is what punches the notch through the outline as the
           * label floats up. It must match the real surface — a field in a
           * sheet sits on surfaceAt(1), not on the screen background — so the
           * colour comes from the container, not from a guess.
           */}
          <Animated.View
            pointerEvents="none"
            style={[styles.label, floating && { backgroundColor: surface }, labelStyle]}
          >
            <Text variant="bodyLarge" color={labelColor}>
              {label}
            </Text>
          </Animated.View>

          <TextInput
            value={value}
            onFocus={(event) => {
              setFocused(true)
              onFocus?.(event)
            }}
            onBlur={(event) => {
              setFocused(false)
              onBlur?.(event)
            }}
            style={[styles.input, { color: theme.colors.onSurface }]}
            cursorColor={theme.colors.primary}
            selectionColor={theme.colors.primary}
            keyboardAppearance={theme.dark ? 'dark' : 'light'}
            accessibilityLabel={label}
            {...rest}
          />
        </View>

        {trailingIcon !== undefined && <View style={styles.trailing}>{trailingIcon}</View>}
      </View>

      {(hasError || supportingText !== undefined) && (
        <Text
          variant="bodySmall"
          color={hasError ? 'error' : 'onSurfaceVariant'}
          style={styles.supporting}
        >
          {hasError ? error : supportingText}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: SHAPE.extraSmall,
    paddingHorizontal: SPACE.lg,
    gap: SPACE.md,
  },
  inputWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    left: 0,
    // Anchored left so the scale-down shrinks toward the leading edge, which
    // is what keeps the floated label aligned with the text below it.
    transformOrigin: 'left center',
    paddingHorizontal: SPACE.xs,
    marginLeft: -SPACE.xs,
  },
  input: {
    ...TYPE.bodyLarge,
    padding: 0,
  },
  leading: {
    width: 24,
    alignItems: 'center',
  },
  trailing: {
    minWidth: 24,
    alignItems: 'center',
  },
  supporting: {
    marginTop: SPACE.xs,
    marginHorizontal: SPACE.lg,
  },
})
