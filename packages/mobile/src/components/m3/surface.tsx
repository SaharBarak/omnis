import type { PropsWithChildren } from 'react'
import { View, type StyleProp, type ViewStyle } from 'react-native'

import { SHADOW, SHAPE, type ElevationLevel } from '@/theme/m3'
import { useLantern } from '@/theme/lantern'

/**
 * A surface at an elevation, in the bento / Lantern language
 * (docs/redesign/MOBILE_V2_MATCH.md). Depth is a discrete tier, not an M3
 * tint: a surface rises ground → surface1 → surface2 → chip as its level
 * climbs, rather than compositing `surfaceTint` over itself. `outlined` draws
 * the hairline wall that gives the bento edge.
 *
 * `shadow` stays opt-in and belongs only to the components that truly float
 * above the page — the FAB, menus, the snackbar.
 */
export interface SurfaceProps extends PropsWithChildren {
  level?: ElevationLevel
  radius?: number
  /** Draw the hairline wall. Outlined cards and outlined text fields use this. */
  outlined?: boolean
  /** Cast a real shadow. Floating components only. */
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
  const { colors } = useLantern()
  const tiers = [colors.surface1, colors.surface2, colors.chip] as const
  const background = tiers[Math.min(level, tiers.length - 1)]

  return (
    <View
      style={[
        { backgroundColor: background, borderRadius: radius },
        outlined && { borderWidth: 1, borderColor: colors.line },
        shadow && SHADOW[`level${level}`],
        style,
      ]}
    >
      {children}
    </View>
  )
}
