import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { SPACE, useTheme } from '@/theme/m3'

/**
 * The M3 divider — always `outlineVariant`, never a translucent white.
 *
 * `inset` indents it past a list item's leading element, so the rule starts
 * where the text starts rather than cutting under the avatars.
 */
export function Divider({
  inset = false,
  style,
}: {
  inset?: boolean
  style?: StyleProp<ViewStyle>
}) {
  const theme = useTheme()
  return (
    <View
      style={[
        styles.divider,
        { backgroundColor: theme.colors.outlineVariant },
        inset && styles.inset,
        style,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  inset: {
    marginLeft: SPACE.margin + 40 + SPACE.lg,
  },
})
