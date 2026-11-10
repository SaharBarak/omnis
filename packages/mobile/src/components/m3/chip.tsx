import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'

import { Text } from './text'
import { Touchable } from './touchable'
import { SPACE } from '@/theme/m3'
import { useLantern } from '@/theme/lantern'

/**
 * Chips — assist, filter, and suggestion — in the bento / Lantern language
 * (docs/redesign/MOBILE_V2_MATCH.md). A resting chip is a hairline-walled pill
 * on the page; a selected filter chip fills with the chip surface and carries
 * the cyan accent, plus the leading checkmark (colour alone fails for users who
 * can't tell selected from unselected).
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
  const { colors, radius } = useLantern()
  const isSelected = variant === 'filter' && selected

  const container = isSelected ? colors.chip : 'transparent'
  const content = isSelected ? colors.accent : colors.ink2

  return (
    <Touchable
      onPress={onPress}
      disabled={disabled}
      radius={radius.control}
      stateLayerColor={content}
      accessibilityRole={variant === 'filter' ? 'checkbox' : 'button'}
      accessibilityState={{ checked: isSelected, disabled }}
      accessibilityLabel={label}
      // 32dp is the chip's drawn height; the tap area is padded out to 48.
      hitSlop={{ top: 8, bottom: 8 }}
      style={[
        styles.root,
        { backgroundColor: container, borderRadius: radius.control },
        !isSelected && { borderWidth: 1, borderColor: colors.line },
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
