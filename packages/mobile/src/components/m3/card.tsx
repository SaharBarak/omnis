import type { PropsWithChildren } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { SurfaceColorProvider } from './surface-context'
import { Touchable } from './touchable'
import { SPACE } from '@/theme/m3'
import { useLantern } from '@/theme/lantern'

/**
 * The card, migrated to the bento / Lantern language (docs/redesign/MOBILE_V2_MATCH.md,
 * BENTO_TYPE.md "The card"). Depth is a surface tier, not an M3 tint: a card
 * sits on `surface1`, an elevated one a tier above on `surface2`, and every
 * card carries the hairline wall (`line`) that gives the bento edge — no drop
 * shadow. The three variants keep their old meaning and the same props, so
 * every screen that renders a <Card> gets the v2 look without a change.
 *
 *   filled    a plain surface panel — the quietest, for content that isn't clickable
 *   elevated  a tier up — for content that is
 *   outlined  the same surface, read as a boundary by its wall
 */
export type CardVariant = 'filled' | 'elevated' | 'outlined'

export interface CardProps extends PropsWithChildren {
  variant?: CardVariant
  onPress?: () => void
  accessibilityLabel?: string
  style?: StyleProp<ViewStyle>
}

export function Card({ children, variant = 'filled', onPress, accessibilityLabel, style }: CardProps) {
  const { colors, radius } = useLantern()

  const background = variant === 'elevated' ? colors.surface2 : colors.surface1
  const base: StyleProp<ViewStyle> = [
    styles.card,
    { backgroundColor: background, borderRadius: radius.card, borderColor: colors.line },
    style,
  ]

  if (onPress !== undefined) {
    return (
      <Touchable
        onPress={onPress}
        radius={radius.card}
        stateLayerColor={colors.ink}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={base}
      >
        <SurfaceColorProvider color={background}>{children}</SurfaceColorProvider>
      </Touchable>
    )
  }

  return (
    <View style={base}>
      {/* A text field inside a card notches its floating label against the
          card's own fill, not the screen's. */}
      <SurfaceColorProvider color={background}>{children}</SurfaceColorProvider>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACE.lg,
  },
})
