import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'

import { Text } from './text'
import { Touchable } from './touchable'
import {
  SHADOW,
  SHAPE,
  SPACE,
  STATE_LAYER_OPACITY,
  alpha,
  useTheme,
  type M3ColorScheme,
} from '@/theme/m3'

/**
 * The five M3 buttons, in the order the spec ranks their emphasis:
 *
 *   filled    the one unmissable action on a screen
 *   tonal     a strong action that isn't *the* action
 *   elevated  a filled-tonal that needs separation from a busy background
 *   outlined  a real alternative to the primary action
 *   text      the lowest-stakes action; lives in dialogs and card corners
 *
 * A screen gets at most one filled button. That constraint is the whole point
 * of the hierarchy — if everything is emphasised, nothing is.
 */
export type ButtonVariant = 'filled' | 'tonal' | 'elevated' | 'outlined' | 'text'

export interface ButtonProps {
  children: string
  onPress?: () => void
  variant?: ButtonVariant
  /** Rendered before the label, at 18dp per the spec. */
  icon?: (color: string) => ReactNode
  disabled?: boolean
  /** Stretch to the container's width. Common for sheet and dialog actions. */
  fullWidth?: boolean
}

interface ButtonColors {
  container: string
  content: string
  shadow: boolean
  outline?: string
}

function colorsFor(
  variant: ButtonVariant,
  colors: M3ColorScheme,
  surface1: string
): ButtonColors {
  switch (variant) {
    case 'filled':
      return { container: colors.primary, content: colors.onPrimary, shadow: false }
    case 'tonal':
      return {
        container: colors.secondaryContainer,
        content: colors.onSecondaryContainer,
        shadow: false,
      }
    case 'elevated':
      return { container: surface1, content: colors.primary, shadow: true }
    case 'outlined':
      return {
        container: 'transparent',
        content: colors.primary,
        shadow: false,
        outline: colors.outline,
      }
    case 'text':
      return { container: 'transparent', content: colors.primary, shadow: false }
  }
}

export function Button({
  children,
  onPress,
  variant = 'filled',
  icon,
  disabled = false,
  fullWidth = false,
}: ButtonProps) {
  const theme = useTheme()
  const { container, content, shadow, outline } = colorsFor(
    variant,
    theme.colors,
    theme.surfaceAt(1)
  )

  // M3 disables by opacity on the tokens themselves — a 12% container of
  // onSurface, a 38% onSurface label — rather than by dimming the whole node.
  const containerColor = disabled
    ? variant === 'outlined' || variant === 'text'
      ? 'transparent'
      : alpha(theme.colors.onSurface, STATE_LAYER_OPACITY.disabledContainer)
    : container
  const contentColor = disabled
    ? alpha(theme.colors.onSurface, STATE_LAYER_OPACITY.disabledContent)
    : content

  return (
    <Touchable
      onPress={onPress}
      disabled={disabled}
      radius={SHAPE.full}
      stateLayerColor={contentColor}
      // The visual stays 40dp — the spec's height — while the tap area grows
      // to the 48dp floor. Padding would have made the button taller instead.
      hitSlop={{ top: 4, bottom: 4 }}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={[
        styles.root,
        { backgroundColor: containerColor },
        // Text buttons are narrower: 12dp of padding, not 24dp.
        variant === 'text' && styles.textRoot,
        outline !== undefined && {
          borderWidth: 1,
          borderColor: disabled
            ? alpha(theme.colors.onSurface, STATE_LAYER_OPACITY.disabledContainer)
            : outline,
        },
        shadow && !disabled && SHADOW.level1,
        fullWidth && styles.fullWidth,
      ]}
    >
      <View style={styles.content}>
        {icon !== undefined && <View style={styles.icon}>{icon(contentColor)}</View>}
        <Text variant="labelLarge" color={contentColor} numberOfLines={1}>
          {children}
        </Text>
      </View>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  root: {
    height: 40,
    paddingHorizontal: SPACE.xl,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  textRoot: {
    paddingHorizontal: SPACE.md,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  icon: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
