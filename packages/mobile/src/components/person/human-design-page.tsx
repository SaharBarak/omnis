import {
  CENTER_LABELS,
  DEFINITION_LABELS,
  type CenterId,
} from '@pleiad/engine/types/human-design'
import { StyleSheet, View } from 'react-native'

import { Glyph } from '@/components/glyph'
import { Divider, Text } from '@/components/m3'
import { BodygraphChart } from '@/components/person/bodygraph'
import { AddDataChip, DataRow, PageSection, ReadingPage } from '@/components/person/scaffold'
import type { HumanDesignReading } from '@/lib/people/reading'
import { SPACE, useTheme } from '@/theme/m3'
import { FLAVORS } from '@/theme/tokens'

/**
 * Human Design — type, authority, profile, the bodygraph graphic, the nine
 * centers and the full channels. The chart complements the text layout, never
 * replaces it. Without a birth time: the honest partial state with a path to
 * the edit sheet.
 */

const FLAVOR = FLAVORS.humanDesign

const CENTER_ORDER: CenterId[] = [
  'head',
  'ajna',
  'throat',
  'g',
  'heart',
  'spleen',
  'sacral',
  'solar',
  'root',
]

/** Engine centre ids → glyph slugs (the two multi-word centres differ). */
const CENTER_SLUG: Record<CenterId, string> = {
  head: 'head',
  ajna: 'ajna',
  throat: 'throat',
  g: 'g-center',
  heart: 'heart',
  spleen: 'spleen',
  sacral: 'sacral',
  solar: 'solar-plexus',
  root: 'root',
}

/** Type name ('Manifesting Generator') → glyph slug ('manifesting-generator'). */
const typeSlug = (name: string) => name.toLowerCase().replace(/\s+/g, '-')

function CenterRow({
  centerId,
  defined,
  last,
}: {
  centerId: CenterId
  defined: boolean
  last: boolean
}) {
  const theme = useTheme()

  return (
    <View>
      <View style={styles.centerRow}>
        <Glyph
          center={CENTER_SLUG[centerId]}
          defined={defined}
          size={26}
          color={defined ? FLAVOR.accent : theme.colors.outline}
        />
        <Text variant="bodyMedium" color="onSurface" style={styles.centerName}>
          {CENTER_LABELS[centerId]}
        </Text>
        <Text
          variant="labelMedium"
          color={defined ? FLAVOR.accentSoft : 'onSurfaceVariant'}
        >
          {defined ? 'Defined' : 'Open'}
        </Text>
      </View>
      {!last && <Divider />}
    </View>
  )
}

export function HumanDesignPage({
  humanDesign,
  onAddBirthTime,
}: {
  humanDesign: HumanDesignReading | null
  onAddBirthTime: () => void
}) {
  if (humanDesign === null || !humanDesign.hasBirthTime) {
    return (
      <ReadingPage>
        <PageSection index={0} flavor={FLAVOR} eyebrow="Human Design">
          <Text variant="titleLarge" color="onSurface">
            The bodygraph draws from the exact hour.
          </Text>
          <Text variant="bodyMedium" color="onSurfaceVariant">
            Type, authority and the nine centers all hinge on birth time. Add it and
            this page fills in.
          </Text>
          <AddDataChip label="Add birth time" onPress={onAddBirthTime} />
        </PageSection>
      </ReadingPage>
    )
  }

  const { bodygraph } = humanDesign
  const definedSet = new Set<CenterId>(bodygraph.definedCenters)
  const channels = [...bodygraph.channels]

  return (
    <ReadingPage>
      <PageSection index={0} flavor={FLAVOR} eyebrow="Human Design">
        <View style={styles.typeRow}>
          <Glyph
            hdType={typeSlug(bodygraph.typeDefinition.name)}
            size={40}
            color={FLAVOR.accent}
          />
          <Text variant="headlineSmall" color="onSurface" style={styles.typeName}>
            {bodygraph.typeDefinition.name}
          </Text>
        </View>
        <View>
          <DataRow label="Strategy" value={bodygraph.typeDefinition.strategy} />
          <DataRow label="Authority" value={bodygraph.authorityDefinition.name} />
          <DataRow
            label="Profile"
            value={bodygraph.profile.id}
            detail={bodygraph.profile.name}
            mono
          />
          <DataRow
            label="Definition"
            value={DEFINITION_LABELS[bodygraph.definition]}
            last
          />
        </View>
      </PageSection>

      {/* The graphic renders only from a full bodygraph (activations, centers,
          channels) — the same data the web chart requires; the hasBirthTime
          guard above already ensures it. */}
      <PageSection index={1} flavor={FLAVOR} eyebrow="Bodygraph">
        <BodygraphChart bodygraph={bodygraph} />
      </PageSection>

      <PageSection index={2} flavor={FLAVOR} eyebrow="Centers">
        <View>
          {CENTER_ORDER.map((centerId, index) => (
            <CenterRow
              key={centerId}
              centerId={centerId}
              defined={definedSet.has(centerId)}
              last={index === CENTER_ORDER.length - 1}
            />
          ))}
        </View>
      </PageSection>

      <PageSection index={3} flavor={FLAVOR} eyebrow="Channels">
        {channels.length === 0 ? (
          <Text variant="bodyMedium" color="onSurfaceVariant">
            No complete channels — the definition rests in single gates.
          </Text>
        ) : (
          <View>
            {channels.map((channel, index) => (
              <View key={channel.id}>
                <View style={styles.channelRow}>
                  <Text variant="dataSmall" color="onSurface" style={styles.channelId}>
                    {channel.id}
                  </Text>
                  <Text
                    variant="bodyMedium"
                    color="onSurfaceVariant"
                    style={styles.channelName}
                  >
                    {channel.name}
                  </Text>
                </View>
                {index < channels.length - 1 && <Divider />}
              </View>
            ))}
          </View>
        )}
      </PageSection>
    </ReadingPage>
  )
}

const styles = StyleSheet.create({
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
  },
  typeName: {
    flex: 1,
  },
  centerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.lg,
    paddingVertical: SPACE.md,
  },
  centerName: {
    flex: 1,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.lg,
    paddingVertical: SPACE.md,
  },
  channelId: {
    width: 56,
  },
  channelName: {
    flex: 1,
  },
})
