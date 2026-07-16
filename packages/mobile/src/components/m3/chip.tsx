import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'

import { Text } from './text'
import { Touchable } from './touchable'
import { SHAPE, SPACE, useTheme } from '@/theme/m3'

/**
 * M3 chips — assist, filter, and suggestion.
 *
 * The filter chip is the one with real behaviour: when selected it fills with
 * `secondaryContainer`, drops its outline, and grows a leading checkmark. The
 * checkmark matters — colour alone fails for the users who can't see the
 * difference between a selected and unselected chip.
 */
export type ChipVariant = 'assist' | 'filter' | 'suggestion'

export interface ChipProps {
  label: string
  onPress?: () => void
  variant?: ChipVariant
  /** Only meaningful for `filter`. */
  selected?: boolean
  icon?: (color: string) => ReactNode
  disabled?: boolean
}

export function Chip({
  label,
  onPress,
  variant = 'assist',
  selected = false,
  icon,
  disabled = false,
}: ChipProps) {
  const theme = useTheme()
  const isSelected = variant === 'filter' && selected

  const container = isSelected ? theme.colors.secondaryContainer : 'transparent'
  const content = isSelected
    ? theme.colors.onSecondaryContainer
    : theme.colors.onSurfaceVariant

  return (
    <Touchable
      onPress={onPress}
      disabled={disabled}
      radius={SHAPE.small}
      stateLayerColor={content}
      accessibilityRole={variant === 'filter' ? 'checkbox' : 'button'}
      accessibilityState={{ checked: isSelected, disabled }}
      accessibilityLabel={label}
      // 32dp is the chip's drawn height; the tap area is padded out to 48.
      hitSlop={{ top: 8, bottom: 8 }}
      style={[
        styles.root,
        { backgroundColor: container },
        !isSelected && { borderWidth: 1, borderColor: theme.colors.outlineVariant },
        disabled && styles.disabled,
      ]}
    >
      {icon !== undefined && <View style={styles.icon}>{icon(content)}</View>}
      <Text variant="labelLarge" color={content} numberOfLines={1}>
        {label}
      </Text>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  root: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingHorizontal: SPACE.md,
    borderRadius: SHAPE.small,
  },
  icon: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.38,
  },
})
