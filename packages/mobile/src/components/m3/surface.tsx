import type { PropsWithChildren } from 'react'
import { View, type StyleProp, type ViewStyle } from 'react-native'

import { SHADOW, SHAPE, useTheme, type ElevationLevel } from '@/theme/m3'

/**
 * A surface at an elevation.
 *
 * In M3 elevation is expressed as colour: level 3 is not "level 0 with a
 * shadow", it is `surfaceTint` composited over `surface` at 11%. `surfaceAt()`
 * does that blend, so raising a Surface makes it *lighter*, not shadowed.
 *
 * `shadow` is opt-in and belongs only to the components M3 says truly float
 * above the page — the FAB, menus, the snackbar.
 */
export interface SurfaceProps extends PropsWithChildren {
  level?: ElevationLevel
  radius?: number
  /** Draw the M3 outline. Outlined cards and outlined text fields use this. */
  outlined?: boolean
  /** Cast a real shadow in addition to the tint. Floating components only. */
  shadow?: boolean
  style?: StyleProp<ViewStyle>
}

export function Surface({
  children,
  level = 0,
  radius = SHAPE.medium,
  outlined = false,
  shadow = false,
  style,
}: SurfaceProps) {
  const theme = useTheme()

  return (
    <View
      style={[
        {
          backgroundColor: theme.surfaceAt(level),
          borderRadius: radius,
        },
        outlined && {
          borderWidth: 1,
          borderColor: theme.colors.outlineVariant,
        },
        shadow && SHADOW[`level${level}`],
        style,
      ]}
    >
      {children}
    </View>
  )
}
