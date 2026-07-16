import type { ReactNode } from 'react'
import { StyleSheet } from 'react-native'

import { Touchable } from './touchable'
import {
  SHAPE,
  STATE_LAYER_OPACITY,
  TOUCH_TARGET,
  alpha,
  useTheme,
  type M3ColorScheme,
} from '@/theme/m3'

/**
 * The four M3 icon buttons. All of them are 48×48 — the accessibility floor is
 * not negotiable, and an icon button has no label to widen its target.
 *
 * `toggled` drives the selected/unselected pair the spec defines for each
 * variant (a filled icon button inverts to a tonal one when off, and so on).
 */
export type IconButtonVariant = 'standard' | 'filled' | 'tonal' | 'outlined'

export interface IconButtonProps {
  /** Receives the resolved content colour — pass it straight to the glyph. */
  icon: (color: string) => ReactNode
  onPress?: () => void
  variant?: IconButtonVariant
  toggled?: boolean
  disabled?: boolean
  /** Required: an icon button has no visible label to name it. */
  accessibilityLabel: string
}

function colorsFor(
  variant: IconButtonVariant,
  toggled: boolean,
  colors: M3ColorScheme
): { container: string; content: string; outline?: string } {
  switch (variant) {
    case 'standard':
      return {
        container: 'transparent',
        content: toggled ? colors.primary : colors.onSurfaceVariant,
      }
    case 'filled':
      return toggled
        ? { container: colors.primary, content: colors.onPrimary }
        : { container: colors.surfaceContainerHighest, content: colors.primary }
    case 'tonal':
      return toggled
        ? { container: colors.secondaryContainer, content: colors.onSecondaryContainer }
        : { container: colors.surfaceContainerHighest, content: colors.onSurfaceVariant }
    case 'outlined':
      return toggled
        ? { container: colors.inverseSurface, content: colors.inverseOnSurface }
        : {
            container: 'transparent',
            content: colors.onSurfaceVariant,
            outline: colors.outline,
          }
  }
}

export function IconButton({
  icon,
  onPress,
  variant = 'standard',
  toggled = false,
  disabled = false,
  accessibilityLabel,
}: IconButtonProps) {
  const theme = useTheme()
  const { container, content, outline } = colorsFor(variant, toggled, theme.colors)

  const containerColor = disabled
    ? container === 'transparent'
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
      borderless={variant === 'standard'}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, selected: toggled }}
      style={[
        styles.root,
        { backgroundColor: containerColor },
        outline !== undefined && { borderWidth: 1, borderColor: outline },
      ]}
    >
      {icon(contentColor)}
    </Touchable>
  )
}

const styles = StyleSheet.create({
  root: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
