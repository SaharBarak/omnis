import type { RelationshipStrength, RelationshipType } from '@pleiad/api-client'
import { XIcon } from 'phosphor-react-native'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { BottomSheet, Button, IconButton, Text, Touchable } from '@/components/m3'
import {
  RELATIONSHIP_COLORS,
  RELATIONSHIP_LABELS,
  RELATIONSHIP_TYPES,
} from '@/lib/relationships/colors'
import { SHAPE, SPACE, useTheme } from '@/theme/m3'

/**
 * S9 "Keep this bond" sheet — pick the bond's type (5 colors) and strength
 * (5 dots). Confirming hands both back to the pair screen, which mutates
 * optimistically and returns to the map.
 */

const STRENGTHS: readonly RelationshipStrength[] = [1, 2, 3, 4, 5]

export function BondSheet({
  visible,
  onClose,
  onKeep,
}: {
  visible: boolean
  onClose: () => void
  onKeep: (type: RelationshipType, strength: RelationshipStrength) => void
}) {
  const theme = useTheme()
  const [type, setType] = useState<RelationshipType>('friend')
  const [strength, setStrength] = useState<RelationshipStrength>(3)

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <Text variant="labelLarge" color="primary">
          Name this bond
        </Text>
        <IconButton
          icon={(color) => <XIcon size={24} color={color} />}
          onPress={onClose}
          accessibilityLabel="Close"
        />
      </View>

      <View style={styles.types}>
        {RELATIONSHIP_TYPES.map((candidate) => {
          const selected = candidate === type
          // The type's own colour — content, not theme: a romantic edge is that
          // colour on the map, and the row has to say so.
          const color = RELATIONSHIP_COLORS[candidate]
          return (
            <Touchable
              key={candidate}
              onPress={() => setType(candidate)}
              radius={SHAPE.small}
              stateLayerColor={theme.colors.onSurface}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={RELATIONSHIP_LABELS[candidate]}
              style={[
                styles.typeRow,
                {
                  backgroundColor: theme.colors.surfaceContainerHighest,
                  borderColor: selected ? color : theme.colors.outlineVariant,
                  borderWidth: selected ? 2 : 1,
                },
              ]}
            >
              <View style={[styles.typeDot, { backgroundColor: color }]} />
              <Text variant="bodyLarge" color={selected ? 'onSurface' : 'onSurfaceVariant'}>
                {RELATIONSHIP_LABELS[candidate]}
              </Text>
            </Touchable>
          )
        })}
      </View>

      <View style={styles.strengthBlock}>
        <Text variant="labelLarge" color="onSurfaceVariant">
          Strength
        </Text>
        <View style={styles.strengthRow}>
          {STRENGTHS.map((value) => (
            <Touchable
              key={value}
              onPress={() => setStrength(value)}
              stateLayerColor={RELATIONSHIP_COLORS[type]}
              borderless
              minTouchTarget
              accessibilityRole="button"
              accessibilityState={{ selected: value === strength }}
              accessibilityLabel={`Strength ${value}`}
            >
              <View
                style={[
                  styles.strengthDot,
                  { borderColor: theme.colors.outline },
                  value <= strength && {
                    backgroundColor: RELATIONSHIP_COLORS[type],
                    borderColor: RELATIONSHIP_COLORS[type],
                  },
                ]}
              />
            </Touchable>
          ))}
          <Text variant="dataMedium" color="onSurfaceVariant" style={styles.strengthValue}>
            {strength}
          </Text>
        </View>
      </View>

      <Button fullWidth onPress={() => onKeep(type, strength)}>
        Keep this bond
      </Button>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACE.sm,
  },
  types: {
    gap: SPACE.sm,
    marginBottom: SPACE.lg,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    height: 56,
    paddingHorizontal: SPACE.lg,
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: SHAPE.full,
  },
  strengthBlock: {
    gap: SPACE.sm,
    marginBottom: SPACE.lg,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  strengthDot: {
    width: 14,
    height: 14,
    borderRadius: SHAPE.full,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  strengthValue: {
    marginLeft: SPACE.sm,
  },
})
