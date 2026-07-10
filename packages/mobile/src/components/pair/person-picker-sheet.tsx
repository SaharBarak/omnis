import type { PersonWithTags } from '@pleiad/api-client'
import { dateToKin, kinToSeal, kinToTone } from '@pleiad/engine/calculations/dreamspell'
import { getSeal } from '@pleiad/engine/data/seals'
import { getTone } from '@pleiad/engine/data/tones'
import { XIcon } from 'phosphor-react-native'
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, { FadeIn, SlideInDown, useReducedMotion } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Divider, Eyebrow } from '@/components/ui/primitives'
import { COLORS, DURATION, RADII, SPACE, SPRING, TYPE } from '@/theme/tokens'

/**
 * S8 → S9 entry — pick the second chart for a compare. A calm list of
 * everyone else on the map; tapping routes straight into the pair reading.
 */

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter((part) => part.length > 0)
  const first = parts[0]?.[0] ?? ''
  const second = parts[1]?.[0] ?? ''
  return `${first}${second}`.toUpperCase() || '·'
}

function kinLine(birthDate: string): string {
  try {
    const kin = dateToKin(birthDate)
    const seal = getSeal(kinToSeal(kin))
    const tone = getTone(kinToTone(kin))
    return `KIN ${kin} · ${tone.name} ${seal.english}`.toUpperCase()
  } catch {
    return birthDate
  }
}

export function PersonPickerSheet({
  visible,
  people,
  onPick,
  onClose,
}: {
  visible: boolean
  /** Candidates — the caller excludes the person already on the left. */
  people: PersonWithTags[]
  onPick: (person: PersonWithTags) => void
  onClose: () => void
}) {
  const reduced = useReducedMotion()
  const insets = useSafeAreaInsets()

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
            <Eyebrow color={COLORS.brandSoft}>COMPARE WITH</Eyebrow>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <XIcon size={20} color={COLORS.text50} />
            </Pressable>
          </View>

          {people.length === 0 ? (
            <Text style={styles.empty}>
              Compare needs a second person on your map.
            </Text>
          ) : (
            <FlatList
              data={people}
              keyExtractor={(person) => person.id}
              ItemSeparatorComponent={Divider}
              style={styles.list}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => onPick(item)}
                  style={styles.row}
                  accessibilityRole="button"
                  accessibilityLabel={`Compare with ${item.name}`}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initialsOf(item.name)}</Text>
                  </View>
                  <View style={styles.rowBody}>
                    <Text style={TYPE.card} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.rowLine} numberOfLines={1}>
                      {kinLine(item.birth_date)}
                    </Text>
                  </View>
                </Pressable>
              )}
            />
          )}
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
    maxHeight: '70%',
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
  list: {
    flexGrow: 0,
  },
  empty: {
    ...TYPE.bodySm,
    color: COLORS.text50,
    paddingBottom: SPACE.cardPad,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  rowBody: {
    flex: 1,
    gap: 3,
  },
  rowLine: {
    ...TYPE.eyebrow,
    color: COLORS.text50,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarText: {
    ...TYPE.eyebrow,
    color: COLORS.text70,
    letterSpacing: 1,
  },
})
