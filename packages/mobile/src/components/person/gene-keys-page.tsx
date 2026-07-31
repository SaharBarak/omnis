import {
  geneKeysProfile,
  type GeneKeysSequence,
  type GeneKeysSphere,
} from '@pleiad/engine/calculations/gene-keys'
import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'

import { Card, Text } from '@/components/m3'
import { AddDataChip, PageSection, ReadingPage } from '@/components/person/scaffold'
import type { HumanDesignReading } from '@/lib/people/reading'
import { SPACE } from '@/theme/m3'
import type { SystemFlavor } from '@/theme/tokens'

/**
 * Gene Keys (#75) — the Golden Path hologenetic profile, read from the same
 * planetary activations the bodygraph already computed for this person. No
 * birth time means no activations, and a Golden Path invented without them
 * would be a lie, so that case says so instead.
 */

const FLAVOR: SystemFlavor = {
  name: 'Gene Keys',
  // Kin to Human Design's, because that is where the activations come from.
  accent: '#B9E8DD',
  accentSoft: '#D6F2EC',
}

const SEQUENCES: ReadonlyArray<{
  key: GeneKeysSequence
  title: string
  note: string
}> = [
  {
    key: 'activation',
    title: 'Activation Sequence',
    note: 'The Four Prime Gifts — your core purpose, read from the Sun and Earth on both sides of the chart.',
  },
  {
    key: 'venus',
    title: 'Venus Sequence',
    note: 'The relational path — the imprints of childhood and the patterns you bring to intimacy.',
  },
  {
    key: 'pearl',
    title: 'Pearl Sequence',
    note: 'The prosperity path — vocation, culture, and the pearl that rewards service.',
  },
]

/**
 * One sphere. The spectrum is the point of the system, so shadow → gift →
 * siddhi reads as one line with the siddhi carrying the accent — the note
 * the whole contemplation is aimed at.
 */
function SphereCard({ sphere }: { sphere: GeneKeysSphere }) {
  return (
    <Card variant="outlined">
      <View style={styles.sphereHead}>
        <View style={styles.sphereTitle}>
          <Text variant="titleMedium" color="onSurface">
            {sphere.sphere}
          </Text>
          <Text variant="bodySmall" color="onSurfaceVariant">
            {sphere.theme}
          </Text>
        </View>
        <Text variant="dataMedium" color={FLAVOR.accent}>
          {sphere.geneKey.key}.{sphere.line}
        </Text>
      </View>

      <View style={styles.spectrum}>
        <Text variant="bodyMedium" color="onSurfaceVariant">
          {sphere.geneKey.shadow}
        </Text>
        <Text variant="bodyMedium" color="onSurfaceVariant">
          →
        </Text>
        <Text variant="bodyMedium" color="onSurface">
          {sphere.geneKey.gift}
        </Text>
        <Text variant="bodyMedium" color="onSurfaceVariant">
          →
        </Text>
        <Text variant="bodyMedium" color={FLAVOR.accent}>
          {sphere.geneKey.siddhi}
        </Text>
      </View>

      <Text variant="labelSmall" color="onSurfaceVariant">
        Shadow → Gift → Siddhi
      </Text>
    </Card>
  )
}

export function GeneKeysPage({
  humanDesign,
  onAddBirthTime,
}: {
  humanDesign: HumanDesignReading | null
  onAddBirthTime: () => void
}) {
  const profile = useMemo(() => {
    if (humanDesign === null || !humanDesign.hasBirthTime) return null
    return geneKeysProfile(humanDesign.bodygraph.activations)
  }, [humanDesign])

  if (profile === null) {
    return (
      <ReadingPage>
        <PageSection index={0} flavor={FLAVOR} eyebrow="Golden Path">
          <Text variant="bodyMedium" color="onSurfaceVariant">
            The hologenetic profile is read from the planetary activations of
            the bodygraph, and those need a birth time.
          </Text>
          <AddDataChip label="Add birth time" onPress={onAddBirthTime} />
        </PageSection>
      </ReadingPage>
    )
  }

  return (
    <ReadingPage>
      {SEQUENCES.map((sequence, index) => (
        <PageSection
          key={sequence.key}
          index={index}
          flavor={FLAVOR}
          eyebrow={sequence.title}
        >
          <Text variant="bodyMedium" color="onSurfaceVariant">
            {sequence.note}
          </Text>
          <View style={styles.spheres}>
            {profile[sequence.key].map((sphere) => (
              <SphereCard key={sphere.sphere} sphere={sphere} />
            ))}
          </View>
        </PageSection>
      ))}

      <PageSection index={SEQUENCES.length} flavor={FLAVOR}>
        <Text variant="bodySmall" color="onSurfaceVariant">
          Gene Key n is Human Design gate n — the same sky, read as a
          contemplation path. Sphere-to-planet correlations follow the official
          Gene Keys documentation.
        </Text>
      </PageSection>
    </ReadingPage>
  )
}

const styles = StyleSheet.create({
  spheres: {
    gap: SPACE.md,
    paddingTop: SPACE.sm,
  },
  sphereHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACE.md,
  },
  sphereTitle: {
    flex: 1,
    gap: SPACE.xs,
  },
  spectrum: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingTop: SPACE.md,
  },
})
