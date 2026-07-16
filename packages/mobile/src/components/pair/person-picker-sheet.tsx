import type { PersonWithTags } from '@pleiad/api-client'
import { dateToKin, kinToSeal, kinToTone } from '@pleiad/engine/calculations/dreamspell'
import { getSeal } from '@pleiad/engine/data/seals'
import { getTone } from '@pleiad/engine/data/tones'
import { XIcon } from 'phosphor-react-native'
import { FlatList, StyleSheet, View } from 'react-native'

import { BottomSheet, Divider, IconButton, ListItem, Text } from '@/components/m3'
import { SHAPE, SPACE, useTheme } from '@/theme/m3'
import { initialsOf } from '@/lib/text'

/**
 * S8 → S9 entry — pick the second chart for a compare. A calm list of
 * everyone else on the map; tapping routes straight into the pair reading.
 */

function kinLine(birthDate: string): string {
  try {
    const kin = dateToKin(birthDate)
    const seal = getSeal(kinToSeal(kin))
    const tone = getTone(kinToTone(kin))
    return `Kin ${kin} · ${tone.name} ${seal.english}`
  } catch {
    return birthDate
  }
}

function Avatar({ name }: { name: string }) {
  const theme = useTheme()
  return (
    <View
      style={[
        styles.avatar,
        {
          backgroundColor: theme.colors.surfaceContainerHighest,
          borderColor: theme.colors.outlineVariant,
        },
      ]}
    >
      <Text variant="labelLarge" color="onSurfaceVariant">
        {initialsOf(name)}
      </Text>
    </View>
  )
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
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <Text variant="labelLarge" color="primary">
          Compare with
        </Text>
        <IconButton
          icon={(color) => <XIcon size={24} color={color} />}
          onPress={onClose}
          accessibilityLabel="Close"
        />
      </View>

      {people.length === 0 ? (
        <Text variant="bodyMedium" color="onSurfaceVariant" style={styles.empty}>
          Compare needs a second person on your map.
        </Text>
      ) : (
        <FlatList
          data={people}
          keyExtractor={(person) => person.id}
          ItemSeparatorComponent={Divider}
          style={styles.list}
          renderItem={({ item }) => (
            <ListItem
              headline={item.name}
              supportingText={kinLine(item.birth_date)}
              leading={<Avatar name={item.name} />}
              onPress={() => onPick(item)}
              accessibilityLabel={`Compare with ${item.name}`}
            />
          )}
        />
      )}
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
  /**
   * The list runs to the sheet's edges: a ListItem carries the 16dp margin as
   * its own padding, so its state layer reaches the edge rather than stopping
   * short of it.
   */
  list: {
    flexGrow: 0,
    marginHorizontal: -SPACE.margin,
  },
  empty: {
    paddingBottom: SPACE.lg,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: SHAPE.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
})
