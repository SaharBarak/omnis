import type { RelationshipType } from '@pleiad/api-client'
import { CheckIcon } from 'phosphor-react-native'
import { ScrollView, StyleSheet, View } from 'react-native'

import { Chip } from '@/components/m3'
import {
  RELATIONSHIP_COLORS,
  RELATIONSHIP_LABELS,
  RELATIONSHIP_TYPES,
} from '@/lib/relationships/colors'
import { SPACE } from '@/theme/m3'

/**
 * S10 filter chips — one toggle per relationship type. Toggling a type off
 * hides its edges; nodes left with no visible edge dim on the graph.
 *
 * The chips are M3 filter chips, and the type colour and the M3 selected state
 * do not share a slot. Selection is M3's alone: the `secondaryContainer` fill
 * plus the checkmark, which is the one cue that survives a colour-blind user.
 * The type colour lives in the leading dot of an *un*selected chip, where it is
 * the swatch for the family of light you have just hidden. Once the chip is on,
 * that colour is back out on the map in front of you and the slot is better
 * spent saying so.
 */

const DOT_SIZE = 8

function TypeDot({ color }: { color: string }) {
  return <View style={[styles.dot, { backgroundColor: color }]} />
}

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
        return (
          <Chip
            key={type}
            variant="filter"
            selected={on}
            label={RELATIONSHIP_LABELS[type]}
            onPress={() => onToggle(type)}
            icon={(content) =>
              on ? (
                <CheckIcon size={18} color={content} weight="bold" />
              ) : (
                <TypeDot color={RELATIONSHIP_COLORS[type]} />
              )
            }
          />
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  row: {
    gap: SPACE.sm,
    paddingHorizontal: SPACE.margin,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
})
