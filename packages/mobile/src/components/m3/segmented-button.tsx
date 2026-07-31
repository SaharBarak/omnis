import { ScrollView, StyleSheet, View } from 'react-native'
import { CheckIcon } from 'phosphor-react-native'

import { Text } from './text'
import { Touchable } from './touchable'
import { SHAPE, SPACE, TOUCH_TARGET, useTheme } from '@/theme/m3'

/**
 * M3 single-select segmented button.
 *
 * The segments share one outlined track and one border between neighbours —
 * they are a single control, not a row of buttons. The selected segment fills
 * with `secondaryContainer` and takes a leading checkmark, exactly like a
 * selected filter chip, because it is making the same kind of statement.
 *
 * M3 caps a segmented button at five segments. Past that the control is meant
 * to scroll rather than shrink its labels into unreadability, which is what
 * `scrollable` does — the person screen carries up to nine systems plus
 * Personality and Insights.
 */
export interface Segment {
  key: string
  label: string
}

export interface SegmentedButtonProps {
  segments: Segment[]
  selectedIndex: number
  onSelect: (index: number) => void
  scrollable?: boolean
}

export function SegmentedButton({
  segments,
  selectedIndex,
  onSelect,
  scrollable = false,
}: SegmentedButtonProps) {
  const theme = useTheme()

  const track = (
    <View style={[styles.track, { borderColor: theme.colors.outline }]}>
      {segments.map((segment, index) => {
        const selected = index === selectedIndex
        const content = selected
          ? theme.colors.onSecondaryContainer
          : theme.colors.onSurface

        return (
          <Touchable
            key={segment.key}
            onPress={() => onSelect(index)}
            stateLayerColor={content}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={segment.label}
            style={[
              styles.segment,
              !scrollable && styles.segmentFlex,
              selected && { backgroundColor: theme.colors.secondaryContainer },
              index > 0 && { borderLeftWidth: 1, borderLeftColor: theme.colors.outline },
            ]}
          >
            {selected && <CheckIcon size={18} color={content} />}
            <Text variant="labelLarge" color={content} numberOfLines={1}>
              {segment.label}
            </Text>
          </Touchable>
        )
      })}
    </View>
  )

  if (!scrollable) return track

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {track}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    height: TOUCH_TARGET,
    borderWidth: 1,
    borderRadius: SHAPE.full,
    // Clips the selected segment's fill to the track's rounded ends.
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
    paddingHorizontal: SPACE.md,
  },
  segmentFlex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACE.margin,
  },
})
