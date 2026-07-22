import type { PersonWithTags, RelationshipWithPeople } from '@pleiad/api-client'
import { dateToKin, kinToSeal, kinToTone } from '@pleiad/engine/calculations/dreamspell'
import { getSeal } from '@pleiad/engine/data/seals'
import { getTone } from '@pleiad/engine/data/tones'
import { XIcon } from 'phosphor-react-native'
import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { SlideInDown, SlideOutDown, useReducedMotion } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Glyph } from '@/components/glyph'
import {
  Button,
  Card,
  IconButton,
  NAVIGATION_BAR_HEIGHT,
  Text,
} from '@/components/m3'
import { RELATIONSHIP_COLORS, RELATIONSHIP_LABELS } from '@/lib/relationships/colors'
import { DURATION, SPACE, SPRING } from '@/theme/m3'
import { FLAVORS } from '@/theme/tokens'
import { sentenceCase } from '@/lib/text'

/**
 * S10 node card — the sheet that answers a tap on a star: who they are, their
 * kin, their three strongest bonds, and the two ways onward (open the chart,
 * start a compare).
 *
 * An elevated card, because this is the one thing on the map that genuinely
 * floats above the canvas rather than sitting in the page.
 */

const TOP_CONNECTIONS = 3
const DOT_SIZE = 8

function kinLine(birthDate: string): string {
  try {
    const kin = dateToKin(birthDate)
    const seal = getSeal(kinToSeal(kin))
    const tone = getTone(kinToTone(kin))
    return `Kin ${kin} · ${sentenceCase(seal.color)} ${tone.name} ${seal.english}`
  } catch {
    return birthDate
  }
}

/** The person's Dreamspell seal number, or null for an uncomputable date. */
function sealNumberOf(birthDate: string): number | null {
  try {
    return kinToSeal(dateToKin(birthDate))
  } catch {
    return null
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
  const insets = useSafeAreaInsets()

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

  const sealNumber = sealNumberOf(person.birth_date)

  return (
    <Animated.View
      entering={
        reduced
          ? undefined
          : SlideInDown.springify()
              .damping(SPRING.spatial.damping)
              .stiffness(SPRING.spatial.stiffness)
      }
      exiting={reduced ? undefined : SlideOutDown.duration(DURATION.short4)}
      // The navigation bar is absolute, so the card has to clear it itself.
      style={[styles.root, { bottom: NAVIGATION_BAR_HEIGHT + insets.bottom + SPACE.md }]}
    >
      <Card variant="elevated" style={styles.card}>
        <View style={styles.header}>
          {sealNumber !== null && (
            <Glyph seal={sealNumber} size={40} color={FLAVORS.dreamspell.accent} />
          )}
          <View style={styles.headerText}>
            <Text variant="titleMedium" color="onSurface" numberOfLines={1}>
              {person.name}
            </Text>
            <Text variant="labelLarge" color={FLAVORS.dreamspell.accentSoft}>
              {kinLine(person.birth_date)}
            </Text>
          </View>
          {/*
           * The 48dp target is wider than the glyph, so it is pulled back into
           * the card's padding — otherwise the X sits visibly inboard of the
           * card's right edge while the name sits flush with its left.
           */}
          <View style={styles.dismiss}>
            <IconButton
              icon={(color) => <XIcon size={20} color={color} />}
              onPress={onDismiss}
              accessibilityLabel="Dismiss"
            />
          </View>
        </View>

        {connections.length > 0 ? (
          <View style={styles.connections}>
            {connections.map(({ edge, other }) => (
              <View key={edge.id} style={styles.connectionRow}>
                <View
                  style={[styles.dot, { backgroundColor: RELATIONSHIP_COLORS[edge.type] }]}
                />
                <Text
                  variant="bodyMedium"
                  color="onSurface"
                  numberOfLines={1}
                  style={styles.connectionName}
                >
                  {other.name}
                </Text>
                <Text variant="labelMedium" color="onSurfaceVariant">
                  {`${RELATIONSHIP_LABELS[edge.type]} · ${edge.strength}`}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text variant="bodyMedium" color="onSurfaceVariant">
            No bonds drawn yet. Compare to begin one.
          </Text>
        )}

        <View style={styles.actions}>
          <View style={styles.action}>
            <Button variant="outlined" onPress={onOpenChart} fullWidth>
              Open chart
            </Button>
          </View>
          <View style={styles.action}>
            <Button onPress={onCompare} fullWidth>
              Compare
            </Button>
          </View>
        </View>
      </Card>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: SPACE.margin,
    right: SPACE.margin,
  },
  card: {
    gap: SPACE.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACE.md,
  },
  headerText: {
    flex: 1,
    gap: SPACE.xs,
  },
  dismiss: {
    marginTop: -SPACE.sm,
    marginRight: -SPACE.sm,
  },
  connections: {
    gap: SPACE.md,
  },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  connectionName: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACE.md,
  },
  action: {
    flex: 1,
  },
})
