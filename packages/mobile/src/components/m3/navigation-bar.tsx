import type { TabTriggerSlotProps } from 'expo-router/ui'
import { forwardRef, type PropsWithChildren, type ReactNode } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Text } from './text'
import {
  DURATION,
  EASING,
  SHAPE,
  SPACE,
  SPRING,
  TOUCH_TARGET,
  alpha,
  useTheme,
} from '@/theme/m3'

/**
 * The M3 navigation bar.
 *
 * Its defining element is the active indicator: a 32dp pill of
 * `secondaryContainer` that sits *behind the icon* of the selected
 * destination. That pill is what tells the user where they are — a colour
 * change alone is too quiet, and it is the piece a hand-rolled tab bar always
 * leaves out.
 *
 * Built on `expo-router/ui`'s headless tabs (`TabList` + `TabTrigger asChild`)
 * rather than the navigator's `tabBar` prop, because that prop's types live at
 * an internal vendored path that upgrades would move under us. Here the layout
 * composes the bar declaratively and each destination is a real `TabTrigger`.
 */

const INDICATOR_WIDTH = 64
const INDICATOR_HEIGHT = 32
const BAR_HEIGHT = 80

/** Exported so scrollable screens can pad past the bar instead of under it. */
export const NAVIGATION_BAR_HEIGHT = BAR_HEIGHT

/** The bar itself. Goes inside `<TabList asChild>`; children are TabTriggers. */
export function NavigationBar({ children }: PropsWithChildren) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: theme.surfaceAt(2),
          paddingBottom: insets.bottom,
          height: BAR_HEIGHT + insets.bottom,
        },
      ]}
    >
      {children}
    </View>
  )
}

export interface NavItemProps extends TabTriggerSlotProps {
  /** Receives the resolved content colour and whether this is the active tab. */
  icon: (color: string, focused: boolean) => ReactNode
  label: string
}

/**
 * One destination. Goes inside `<TabTrigger asChild>`, which injects
 * `isFocused` and the press handlers.
 */
export const NavItem = forwardRef<View, NavItemProps>(function NavItem(
  /*
   * `style` is pulled out of the spread on purpose. TabTrigger hands its own
   * down through asChild — a row layout meant for a bare text trigger — and
   * letting it through would lay the label out beside the icon instead of under
   * it, and push the fifth destination off the edge of the screen.
   */
  { icon, label, isFocused = false, style: _triggerStyle, ...pressableProps },
  ref
) {
  const theme = useTheme()

  // The indicator grows from the centre as the destination becomes active, and
  // leaves on a shorter, accelerating curve — M3 asks for asymmetry here.
  const progress = useDerivedValue(
    () =>
      isFocused
        ? withSpring(1, SPRING.spatialFast)
        : withTiming(0, {
            duration: DURATION.short4,
            easing: Easing.bezier(...EASING.standardAccelerate),
          }),
    [isFocused]
  )

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scaleX: 0.4 + progress.value * 0.6 }],
  }))

  const iconColor = isFocused
    ? theme.colors.onSecondaryContainer
    : theme.colors.onSurfaceVariant
  const labelColor = isFocused ? theme.colors.onSurface : theme.colors.onSurfaceVariant

  return (
    <Pressable
      ref={ref}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
      android_ripple={{ color: alpha(theme.colors.onSurface, 0.12), borderless: true }}
      {...pressableProps}
      style={styles.item}
    >
      <View style={styles.iconSlot}>
        <Animated.View
          style={[
            styles.indicator,
            { backgroundColor: theme.colors.secondaryContainer },
            indicatorStyle,
          ]}
        />
        {icon(iconColor, isFocused)}
      </View>
      <Text variant="labelMedium" color={labelColor} numberOfLines={1} style={styles.label}>
        {label}
      </Text>
    </Pressable>
  )
})

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: SPACE.md,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: SPACE.xs,
    minHeight: TOUCH_TARGET,
  },
  iconSlot: {
    width: INDICATOR_WIDTH,
    height: INDICATOR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: SHAPE.full,
  },
  label: {
    textAlign: 'center',
  },
})
