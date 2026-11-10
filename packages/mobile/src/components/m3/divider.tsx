import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { SPACE } from '@/theme/m3'
import { useLantern } from '@/theme/lantern'

/**
 * The divider — the bento hairline wall (`line`) drawn as a horizontal rule,
 * the same edge the Card, Chip, and Surface draw, never a translucent white.
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
  const { colors } = useLantern()
  return (
    <View
      style={[
        styles.divider,
        { backgroundColor: colors.line },
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
