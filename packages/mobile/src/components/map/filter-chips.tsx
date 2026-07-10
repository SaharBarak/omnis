import type { RelationshipType } from '@pleiad/api-client'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import {
  RELATIONSHIP_COLORS,
  RELATIONSHIP_LABELS,
  RELATIONSHIP_TYPES,
} from '@/lib/relationships/colors'
import { COLORS, RADII, SPACE, TYPE } from '@/theme/tokens'

/**
 * S10 filter chips — one toggle per relationship type. Toggling a type off
 * hides its edges; nodes left with no visible edge dim on the graph.
 */
export function TypeFilterChips({
  active,
  onToggle,
}: {
  active: ReadonlySet<RelationshipType>
  onToggle: (type: RelationshipType) => void
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {RELATIONSHIP_TYPES.map((type) => {
        const on = active.has(type)
        const color = RELATIONSHIP_COLORS[type]
        return (
          <Pressable
            key={type}
            onPress={() => onToggle(type)}
            style={[styles.chip, on && { borderColor: color }]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${RELATIONSHIP_LABELS[type]} edges ${on ? 'shown' : 'hidden'}`}
          >
            <View
              style={[styles.dot, { backgroundColor: color }, !on && styles.dotOff]}
            />
            <Text style={[styles.label, on && styles.labelOn]}>
              {RELATIONSHIP_LABELS[type].toUpperCase()}
            </Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingHorizontal: SPACE.gutter,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardFill,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotOff: {
    opacity: 0.35,
  },
  label: {
    ...TYPE.eyebrow,
    color: COLORS.text35,
  },
  labelOn: {
    color: COLORS.text90,
  },
})
