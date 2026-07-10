import type { PersonWithTags, RelationshipWithPeople } from '@pleiad/api-client'
import { dateToKin, kinToSeal, kinToTone } from '@pleiad/engine/calculations/dreamspell'
import { getSeal } from '@pleiad/engine/data/seals'
import { getTone } from '@pleiad/engine/data/tones'
import { XIcon } from 'phosphor-react-native'
import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, { SlideInDown, SlideOutDown, useReducedMotion } from 'react-native-reanimated'

import { Button, Eyebrow } from '@/components/ui/primitives'
import { RELATIONSHIP_COLORS, RELATIONSHIP_LABELS } from '@/lib/relationships/colors'
import { COLORS, FLAVORS, RADII, SPACE, SPRING, TYPE } from '@/theme/tokens'

/**
 * S10 node card — the bottom sheet that answers a tap on a star: who they
 * are, their kin, their three strongest bonds, and the two ways onward
 * (open the chart, start a compare).
 */

const TOP_CONNECTIONS = 3

function kinLine(birthDate: string): string {
  try {
    const kin = dateToKin(birthDate)
    const seal = getSeal(kinToSeal(kin))
    const tone = getTone(kinToTone(kin))
    return `KIN ${kin} · ${seal.color} ${tone.name} ${seal.english}`.toUpperCase()
  } catch {
    return birthDate
  }
}

interface Connection {
  edge: RelationshipWithPeople
  other: PersonWithTags
}

export function NodeCard({
  person,
  people,
  relationships,
  onOpenChart,
  onCompare,
  onDismiss,
}: {
  person: PersonWithTags
  people: PersonWithTags[]
  relationships: RelationshipWithPeople[]
  onOpenChart: () => void
  onCompare: () => void
  onDismiss: () => void
}) {
  const reduced = useReducedMotion()

  const connections = useMemo<Connection[]>(() => {
    const byId = new Map(people.map((candidate) => [candidate.id, candidate]))
    return relationships
      .filter((edge) => edge.person1_id === person.id || edge.person2_id === person.id)
      .sort((a, b) => b.strength - a.strength)
      .flatMap((edge) => {
        const otherId = edge.person1_id === person.id ? edge.person2_id : edge.person1_id
        const other = byId.get(otherId)
        return other !== undefined ? [{ edge, other }] : []
      })
      .slice(0, TOP_CONNECTIONS)
  }, [person.id, people, relationships])

  return (
    <Animated.View
      entering={
        reduced
          ? undefined
          : SlideInDown.springify().damping(SPRING.damping).stiffness(SPRING.stiffness)
      }
      exiting={reduced ? undefined : SlideOutDown.duration(200)}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={TYPE.card} numberOfLines={1}>
            {person.name}
          </Text>
          <Eyebrow color={FLAVORS.dreamspell.accentSoft}>
            {kinLine(person.birth_date)}
          </Eyebrow>
        </View>
        <Pressable
          onPress={onDismiss}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        >
          <XIcon size={18} color={COLORS.text50} />
        </Pressable>
      </View>

      {connections.length > 0 ? (
        <View style={styles.connections}>
          {connections.map(({ edge, other }) => (
            <View key={edge.id} style={styles.connectionRow}>
              <View
                style={[styles.dot, { backgroundColor: RELATIONSHIP_COLORS[edge.type] }]}
              />
              <Text style={styles.connectionName} numberOfLines={1}>
                {other.name}
              </Text>
              <Text style={styles.connectionMeta}>
                {`${RELATIONSHIP_LABELS[edge.type]} · ${edge.strength}`.toUpperCase()}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.noBonds}>No bonds drawn yet — compare to begin one.</Text>
      )}

      <View style={styles.actions}>
        <View style={styles.action}>
          <Button variant="secondary" onPress={onOpenChart}>
            Open chart
          </Button>
        </View>
        <View style={styles.action}>
          <Button onPress={onCompare}>Compare</Button>
        </View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: SPACE.gutter,
    right: SPACE.gutter,
    bottom: SPACE.gutter,
    backgroundColor: COLORS.cardFill,
    borderRadius: RADII.feature,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACE.cardPad,
    gap: SPACE.cardPad - 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 5,
  },
  connections: {
    gap: 10,
  },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  connectionName: {
    ...TYPE.bodySm,
    color: COLORS.text90,
    flex: 1,
  },
  connectionMeta: {
    ...TYPE.statLabel,
  },
  noBonds: {
    ...TYPE.bodySm,
    color: COLORS.text50,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  action: {
    flex: 1,
  },
})
