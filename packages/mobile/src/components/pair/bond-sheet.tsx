import type { RelationshipStrength, RelationshipType } from '@pleiad/api-client'
import { XIcon } from 'phosphor-react-native'
import { useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, { FadeIn, SlideInDown, useReducedMotion } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button, Eyebrow } from '@/components/ui/primitives'
import {
  RELATIONSHIP_COLORS,
  RELATIONSHIP_LABELS,
  RELATIONSHIP_TYPES,
} from '@/lib/relationships/colors'
import { COLORS, DURATION, RADII, SPACE, SPRING, TYPE } from '@/theme/tokens'

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
  const reduced = useReducedMotion()
  const insets = useSafeAreaInsets()
  const [type, setType] = useState<RelationshipType>('friend')
  const [strength, setStrength] = useState<RelationshipStrength>(3)

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View
          entering={reduced ? undefined : FadeIn.duration(DURATION.normal)}
          style={StyleSheet.absoluteFill}
        >
          <Pressable
            style={[StyleSheet.absoluteFill, styles.scrim]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
          />
        </Animated.View>

        <Animated.View
          entering={
            reduced
              ? undefined
              : SlideInDown.springify().damping(SPRING.damping).stiffness(SPRING.stiffness)
          }
          style={[styles.sheet, { paddingBottom: insets.bottom + SPACE.cardPad }]}
        >
          <View style={styles.header}>
            <Eyebrow color={COLORS.brandSoft}>NAME THIS BOND</Eyebrow>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <XIcon size={20} color={COLORS.text50} />
            </Pressable>
          </View>

          <View style={styles.types}>
            {RELATIONSHIP_TYPES.map((candidate) => {
              const selected = candidate === type
              const color = RELATIONSHIP_COLORS[candidate]
              return (
                <Pressable
                  key={candidate}
                  onPress={() => setType(candidate)}
                  style={[styles.typeRow, selected && { borderColor: color }]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={RELATIONSHIP_LABELS[candidate]}
                >
                  <View style={[styles.typeDot, { backgroundColor: color }]} />
                  <Text style={[styles.typeLabel, selected && styles.typeLabelOn]}>
                    {RELATIONSHIP_LABELS[candidate]}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          <View style={styles.strengthBlock}>
            <Eyebrow>STRENGTH</Eyebrow>
            <View style={styles.strengthRow}>
              {STRENGTHS.map((value) => (
                <Pressable
                  key={value}
                  onPress={() => setStrength(value)}
                  hitSlop={8}
                  style={styles.strengthTarget}
                  accessibilityRole="button"
                  accessibilityState={{ selected: value === strength }}
                  accessibilityLabel={`Strength ${value}`}
                >
                  <View
                    style={[
                      styles.strengthDot,
                      value <= strength && {
                        backgroundColor: RELATIONSHIP_COLORS[type],
                        borderColor: RELATIONSHIP_COLORS[type],
                      },
                    ]}
                  />
                </Pressable>
              ))}
              <Text style={styles.strengthValue}>{strength}</Text>
            </View>
          </View>

          <Button onPress={() => onKeep(type, strength)}>Keep this bond</Button>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    backgroundColor: 'rgba(11,13,22,0.72)',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADII.feature,
    borderTopRightRadius: RADII.feature,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACE.featurePad,
    paddingTop: SPACE.featurePad,
    gap: SPACE.cardPad,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  types: {
    gap: 8,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: RADII.button,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface2,
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  typeLabel: {
    ...TYPE.body,
    color: COLORS.text70,
  },
  typeLabelOn: {
    color: COLORS.text90,
  },
  strengthBlock: {
    gap: 10,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  strengthTarget: {
    padding: 4,
  },
  strengthDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: COLORS.borderHover,
    backgroundColor: 'transparent',
  },
  strengthValue: {
    ...TYPE.statLabel,
    marginLeft: 8,
  },
})
