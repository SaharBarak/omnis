import type { PropsWithChildren } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import { COLORS, DURATION, RADII, SPACE, TYPE } from '@/theme/tokens'

/** Panel — DESIGN_LANGUAGE §3: cardFill, radius 16, refraction border. */
export function Panel({
  children,
  style,
  feature = false,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle>; feature?: boolean }>) {
  return (
    <View
      style={[
        styles.panel,
        feature && { borderRadius: RADII.feature, padding: SPACE.featurePad },
        style,
      ]}
    >
      <View style={styles.refractionEdge} />
      {children}
    </View>
  )
}

/** Mono uppercase micro-label. */
export function Eyebrow({
  children,
  color,
  style,
}: PropsWithChildren<{ color?: string; style?: StyleProp<TextStyle> }>) {
  return (
    <Text style={[TYPE.eyebrow, color != null && { color }, style]}>{children}</Text>
  )
}

/** Small rounded-full tag. Flavored via accent color. */
export function Pill({
  children,
  accent = COLORS.brandSoft,
}: PropsWithChildren<{ accent?: string }>) {
  return (
    <View style={[styles.pill, { borderColor: accent }]}>
      <Text style={[TYPE.eyebrow, { color: accent }]}>{children}</Text>
    </View>
  )
}

/** Tabular mono numeral in brandBright — the split-flap treatment. */
export function StatNumber({
  value,
  label,
  style,
}: {
  value: string
  label?: string
  style?: StyleProp<ViewStyle>
}) {
  return (
    <View style={style}>
      <Text style={TYPE.stat}>{value}</Text>
      {label != null && <Text style={TYPE.statLabel}>{label}</Text>}
    </View>
  )
}

interface ButtonProps extends PropsWithChildren {
  onPress?: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

/**
 * Buttons — brand fill / bordered ghost. Pressed: scale 0.98 (spec §3) +
 * light haptic on primary.
 */
export function Button({
  children,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}: ButtonProps) {
  const scale = useSharedValue(1)
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))
  const primary = variant === 'primary'
  return (
    <Pressable
      disabled={disabled}
      onPressIn={() => {
        scale.value = withTiming(0.98, { duration: DURATION.fast })
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: DURATION.fast })
      }}
      onPress={() => {
        if (primary) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onPress?.()
      }}
      accessibilityRole="button"
    >
      <Animated.View
        style={[
          styles.button,
          primary ? styles.buttonPrimary : styles.buttonSecondary,
          disabled && styles.buttonDisabled,
          animatedStyle,
          style,
        ]}
      >
        <Text style={primary ? styles.buttonTextPrimary : styles.buttonTextSecondary}>
          {children}
        </Text>
      </Animated.View>
    </Pressable>
  )
}

/** Hairline divider — lists group with dividers, not boxes. */
export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: COLORS.cardFill,
    borderRadius: RADII.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACE.cardPad,
    overflow: 'hidden',
  },
  refractionEdge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: RADII.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  button: {
    height: 52,
    borderRadius: RADII.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACE.cardPad,
  },
  buttonPrimary: {
    backgroundColor: COLORS.brand,
  },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonTextPrimary: {
    ...TYPE.body,
    fontFamily: 'Barlow_600SemiBold',
    color: '#FFFFFF',
  },
  buttonTextSecondary: {
    ...TYPE.body,
    color: COLORS.text70,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
  },
})
