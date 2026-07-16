import type { ReactNode } from 'react'
import { StyleSheet } from 'react-native'
import Animated, {
  interpolate,
  useAnimatedStyle,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated'

import { Text } from './text'
import { Touchable } from './touchable'
import { SHADOW, SHAPE, SPACE, SPRING, useTheme, type M3ColorScheme } from '@/theme/m3'

/**
 * The floating action button — and the extended one, which is the version this
 * app should almost always use: an unlabelled disc asks the user to guess.
 *
 * The FAB is one of the few components M3 lets cast a genuine shadow, because
 * it genuinely floats above the content it acts on.
 *
 * Pass `collapseProgress` (a scroll-driven 0→1) to get the M3 scroll behaviour:
 * the extended FAB shrinks to its icon as the user scrolls down and grows its
 * label back when they scroll up, so it never sits on top of what they're
 * reading.
 */
export type FabColor = 'primary' | 'secondary' | 'tertiary' | 'surface'
export type FabSize = 'small' | 'medium' | 'large'

const SIZE: Record<FabSize, { box: number; radius: number }> = {
  small: { box: 40, radius: SHAPE.medium },
  medium: { box: 56, radius: SHAPE.large },
  large: { box: 96, radius: SHAPE.extraLarge },
}

function colorsFor(
  color: FabColor,
  colors: M3ColorScheme,
  surface3: string
): { container: string; content: string } {
  switch (color) {
    case 'primary':
      return { container: colors.primaryContainer, content: colors.onPrimaryContainer }
    case 'secondary':
      return { container: colors.secondaryContainer, content: colors.onSecondaryContainer }
    case 'tertiary':
      return { container: colors.tertiaryContainer, content: colors.onTertiaryContainer }
    case 'surface':
      return { container: surface3, content: colors.primary }
  }
}

export interface FabProps {
  icon: (color: string) => ReactNode
  onPress?: () => void
  /** Omit for a plain disc FAB; provide it and the FAB extends to fit. */
  label?: string
  color?: FabColor
  size?: FabSize
  /** 0 = extended, 1 = collapsed to the icon. Only meaningful with a label. */
  collapseProgress?: SharedValue<number>
  accessibilityLabel: string
}

export function Fab({
  icon,
  onPress,
  label,
  color = 'primary',
  size = 'medium',
  collapseProgress,
  accessibilityLabel,
}: FabProps) {
  const theme = useTheme()
  const { container, content } = colorsFor(color, theme.colors, theme.surfaceAt(3))
  const { box, radius } = SIZE[size]
  const extended = label !== undefined

  // The label fades and its space closes together, so the container width
  // animates from "icon + label" down to a square without a jump.
  const labelStyle = useAnimatedStyle(() => {
    const progress = collapseProgress?.value ?? 0
    return {
      opacity: withSpring(interpolate(progress, [0, 1], [1, 0]), SPRING.effects),
      maxWidth: withSpring(interpolate(progress, [0, 1], [200, 0]), SPRING.spatial),
      marginLeft: withSpring(interpolate(progress, [0, 1], [SPACE.md, 0]), SPRING.spatial),
    }
  })

  return (
    <Touchable
      onPress={onPress}
      radius={radius}
      stateLayerColor={content}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.root,
        SHADOW.level3,
        {
          backgroundColor: container,
          borderRadius: radius,
          minWidth: box,
          height: box,
          paddingHorizontal: extended ? SPACE.lg : 0,
        },
      ]}
    >
      {icon(content)}
      {extended && (
        <Animated.View style={labelStyle}>
          <Text variant="labelLarge" color={content} numberOfLines={1}>
            {label}
          </Text>
        </Animated.View>
      )}
    </Touchable>
  )
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
