import { useEffect } from 'react'
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native'
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'

import { COLORS, RADII, SPACE, SPRING, TYPE, type SystemFlavor } from '@/theme/tokens'

/**
 * S8 segmented flavor tabs — horizontally scrolling pills, one per system.
 * The active pill's border springs to its flavor accent (stiffness 100,
 * damping 20 — nothing bounces) and the text lifts to accentSoft.
 */

export interface FlavorTab {
  key: string
  label: string
  flavor: SystemFlavor
}

function FlavorPill({
  tab,
  active,
  onPress,
}: {
  tab: FlavorTab
  active: boolean
  onPress: () => void
}) {
  const progress = useSharedValue(active ? 1 : 0)

  useEffect(() => {
    progress.value = withSpring(active ? 1 : 0, SPRING)
  }, [active, progress])

  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [COLORS.border, tab.flavor.accent]
    ),
  }))

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={tab.label}
    >
      <Animated.View style={[styles.pill, animatedStyle]}>
        <Text
          style={[TYPE.eyebrow, active && { color: tab.flavor.accentSoft }]}
          numberOfLines={1}
        >
          {tab.label.toUpperCase()}
        </Text>
      </Animated.View>
    </Pressable>
  )
}

export function FlavorTabs({
  tabs,
  activeIndex,
  onSelect,
}: {
  tabs: FlavorTab[]
  activeIndex: number
  onSelect: (index: number) => void
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityRole="tablist"
    >
      {tabs.map((tab, index) => (
        <FlavorPill
          key={tab.key}
          tab={tab}
          active={index === activeIndex}
          onPress={() => onSelect(index)}
        />
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingHorizontal: SPACE.gutter,
    paddingVertical: 2,
  },
  pill: {
    borderRadius: RADII.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
  },
})
