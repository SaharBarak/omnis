import {
  CENTER_LABELS,
  DEFINITION_LABELS,
  type CenterId,
} from '@pleiad/engine/types/human-design'
import { StyleSheet, Text, View } from 'react-native'

import { AddDataChip, DataRow, PageSection, ReadingPage } from '@/components/person/scaffold'
import type { HumanDesignReading } from '@/lib/people/reading'
import { COLORS, FLAVORS, TYPE } from '@/theme/tokens'

/**
 * S8 Human Design page — type, authority, profile, the nine centers and
 * full channels as text layout (the bodygraph GRAPHIC is M2). Without a
 * birth time: the honest partial state with a path to the edit sheet.
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

function CenterRow({
  centerId,
  defined,
  last,
}: {
  centerId: CenterId
  defined: boolean
  last: boolean
}) {
  return (
    <View style={[styles.centerRow, !last && styles.centerRowBorder]}>
      <View
        style={[
          styles.centerDot,
          defined
            ? { backgroundColor: FLAVOR.accent }
            : { borderWidth: 1, borderColor: COLORS.borderHover },
        ]}
      />
      <Text style={styles.centerName}>{CENTER_LABELS[centerId]}</Text>
      <Text style={[styles.centerState, defined && { color: FLAVOR.accentSoft }]}>
        {defined ? 'DEFINED' : 'OPEN'}
      </Text>
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
        <PageSection index={0} flavor={FLAVOR} eyebrow="HUMAN DESIGN">
          <Text style={TYPE.section}>The bodygraph draws from the exact hour.</Text>
          <Text style={styles.quietBody}>
            Type, authority and the nine centers all hinge on birth time. Add it and
            this page fills in.
          </Text>
          <AddDataChip label="ADD BIRTH TIME" flavor={FLAVOR} onPress={onAddBirthTime} />
        </PageSection>
      </ReadingPage>
    )
  }

  const { bodygraph } = humanDesign
  const definedSet = new Set<CenterId>(bodygraph.definedCenters)
  const channels = [...bodygraph.channels]

  return (
    <ReadingPage>
      <PageSection index={0} flavor={FLAVOR} eyebrow="HUMAN DESIGN">
        <Text style={TYPE.zone}>{bodygraph.typeDefinition.name}</Text>
        <View>
          <DataRow label="STRATEGY" value={bodygraph.typeDefinition.strategy} />
          <DataRow label="AUTHORITY" value={bodygraph.authorityDefinition.name} />
          <DataRow
            label="PROFILE"
            value={bodygraph.profile.id}
            detail={bodygraph.profile.name}
            mono
          />
          <DataRow
            label="DEFINITION"
            value={DEFINITION_LABELS[bodygraph.definition]}
            last
          />
        </View>
      </PageSection>

      <PageSection index={1} flavor={FLAVOR} eyebrow="CENTERS">
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

      <PageSection index={2} flavor={FLAVOR} eyebrow="CHANNELS">
        {channels.length === 0 ? (
          <Text style={styles.quietBody}>
            No complete channels — the definition rests in single gates.
          </Text>
        ) : (
          <View>
            {channels.map((channel, index) => (
              <View
                key={channel.id}
                style={[
                  styles.channelRow,
                  index < channels.length - 1 && styles.centerRowBorder,
                ]}
              >
                <Text style={styles.channelId}>{channel.id}</Text>
                <Text style={styles.channelName}>{channel.name}</Text>
              </View>
            ))}
          </View>
        )}
      </PageSection>
    </ReadingPage>
  )
}

const styles = StyleSheet.create({
  centerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
  },
  centerRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  centerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  centerName: {
    ...TYPE.bodySm,
    color: COLORS.text90,
    flex: 1,
  },
  centerState: {
    ...TYPE.statLabel,
    letterSpacing: 1.4,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
  },
  channelId: {
    ...TYPE.stat,
    fontSize: 14,
    lineHeight: 20,
    width: 56,
  },
  channelName: {
    ...TYPE.bodySm,
    color: COLORS.text70,
    flex: 1,
  },
  quietBody: {
    ...TYPE.bodySm,
    color: COLORS.text50,
  },
})
