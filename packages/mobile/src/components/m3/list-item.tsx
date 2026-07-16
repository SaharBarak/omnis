import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'

import { Text } from './text'
import { Touchable } from './touchable'
import { SPACE, useTheme } from '@/theme/m3'

/**
 * The M3 list item — one, two, or three lines, sized by how much it carries.
 *
 * The heights are the spec's (56 / 72 / 88), and they are why a list of people
 * scans as a list rather than as a stack of rows that each guessed their own
 * padding.
 */
export interface ListItemProps {
  headline: string
  supportingText?: string
  /** A third line. Bumps the item to the 88dp height. */
  overline?: string
  leading?: ReactNode
  trailing?: ReactNode
  onPress?: () => void
  accessibilityLabel?: string
  /**
   * Paints the headline in `error`. For the one or two rows in a list that
   * destroy something — sign out, delete account. Without it a destructive row
   * is indistinguishable from a navigation row until the confirm dialog fires,
   * which is one tap too late to be a warning.
   */
  destructive?: boolean
}

export function ListItem({
  headline,
  supportingText,
  overline,
  leading,
  trailing,
  onPress,
  accessibilityLabel,
  destructive = false,
}: ListItemProps) {
  const theme = useTheme()

  const lines = 1 + (supportingText !== undefined ? 1 : 0) + (overline !== undefined ? 1 : 0)
  const minHeight = lines === 1 ? 56 : lines === 2 ? 72 : 88

  const content = (
    <View style={[styles.row, { minHeight }]}>
      {leading !== undefined && <View style={styles.leading}>{leading}</View>}

      <View style={styles.body}>
        {overline !== undefined && (
          <Text variant="labelSmall" color="onSurfaceVariant" numberOfLines={1}>
            {overline}
          </Text>
        )}
        <Text
          variant="bodyLarge"
          color={destructive ? 'error' : 'onSurface'}
          numberOfLines={1}
        >
          {headline}
        </Text>
        {supportingText !== undefined && (
          <Text variant="bodyMedium" color="onSurfaceVariant" numberOfLines={1}>
            {supportingText}
          </Text>
        )}
      </View>

      {trailing !== undefined && <View style={styles.trailing}>{trailing}</View>}
    </View>
  )

  if (onPress === undefined) return content

  return (
    <Touchable
      onPress={onPress}
      stateLayerColor={destructive ? theme.colors.error : theme.colors.onSurface}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? headline}
    >
      {content}
    </Touchable>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.lg,
    paddingHorizontal: SPACE.margin,
    paddingVertical: SPACE.sm,
  },
  leading: {
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  trailing: {
    justifyContent: 'center',
  },
})
