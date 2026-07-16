import type { PropsWithChildren } from 'react'
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native'

import { Surface } from './surface'
import { SurfaceColorProvider } from './surface-context'
import { Touchable } from './touchable'
import { SHAPE, SPACE, useTheme, type ElevationLevel } from '@/theme/m3'

/**
 * The three M3 cards. They differ only in how they separate from the page:
 *
 *   filled    a tonal block — the quietest, for content that isn't clickable
 *   elevated  lifted by tint (and a soft shadow) — for content that is
 *   outlined  a hairline border — the clearest boundary, the least weight
 *
 * A card that does nothing when tapped should not look tappable, so `onPress`
 * is what promotes a card from a container to a control (and only then does it
 * get a state layer).
 */
export type CardVariant = 'filled' | 'elevated' | 'outlined'

const LEVEL: Record<CardVariant, ElevationLevel> = {
  filled: 0,
  elevated: 1,
  outlined: 0,
}

export interface CardProps extends PropsWithChildren {
  variant?: CardVariant
  onPress?: () => void
  accessibilityLabel?: string
  style?: StyleProp<ViewStyle>
}

export function Card({
  children,
  variant = 'filled',
  onPress,
  accessibilityLabel,
  style,
}: CardProps) {
  const theme = useTheme()
  const level = LEVEL[variant]

  // A filled card is surfaceContainerHighest, which is *not* the same as
  // surface at elevation 0 — M3 gives it its own role.
  const background =
    variant === 'filled' ? theme.colors.surfaceContainerHighest : theme.surfaceAt(level)

  if (onPress !== undefined) {
    return (
      <Touchable
        onPress={onPress}
        radius={SHAPE.medium}
        stateLayerColor={theme.colors.onSurface}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={[
          styles.card,
          { backgroundColor: background },
          variant === 'outlined' && {
            borderWidth: 1,
            borderColor: theme.colors.outlineVariant,
          },
          style,
        ]}
      >
        {children}
      </Touchable>
    )
  }

  return (
    <Surface
      level={level}
      radius={SHAPE.medium}
      outlined={variant === 'outlined'}
      shadow={variant === 'elevated'}
      style={[styles.card, variant === 'filled' && { backgroundColor: background }, style]}
    >
      {/* Same reason as the sheet: a text field inside a card notches its
          floating label against the card's fill, not the screen's. */}
      <SurfaceColorProvider color={background}>{children}</SurfaceColorProvider>
    </Surface>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: SHAPE.medium,
    padding: SPACE.lg,
  },
})
