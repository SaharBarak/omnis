import { StyleSheet, View } from 'react-native'

import { Glyph } from '@/components/glyph'
import { Text } from '@/components/m3'
import {
  DataRow,
  PageSection,
  ReadingPage,
  SEAL_COLOR_HEX,
} from '@/components/person/scaffold'
import type { DreamspellReading, OracleMember } from '@/lib/people/reading'
import { SHAPE, SPACE, useTheme } from '@/theme/m3'
import { FLAVORS } from '@/theme/tokens'
import { sentenceCase } from '@/lib/text'

/**
 * Dreamspell — the identity: big kin, oracle cross, cycles, galactic birthday.
 * Never entitlement-locked; it is the free tier's one open system.
 */

const FLAVOR = FLAVORS.dreamspell

const ORACLE_LABELS: Record<OracleMember['role'], string> = {
  guide: 'Guide',
  analog: 'Analog',
  antipode: 'Antipode',
  occult: 'Occult',
  destiny: 'Destiny',
}

function OracleCell({ member }: { member: OracleMember }) {
  const theme = useTheme()
  const center = member.role === 'destiny'
  const sealColor = SEAL_COLOR_HEX[member.seal.color] ?? theme.colors.onSurfaceVariant

  return (
    <View
      style={[
        styles.oracleCell,
        {
          backgroundColor: theme.surfaceAt(1),
          // The destiny kin is the cross's centre, so its cell takes the seal's
          // own colour; the four around it stay on the theme's outline.
          borderColor: center ? sealColor : theme.colors.outlineVariant,
        },
      ]}
    >
      <Text variant="labelSmall" color={center ? sealColor : 'onSurfaceVariant'}>
        {ORACLE_LABELS[member.role]}
      </Text>
      <Glyph
        seal={member.seal.number}
        size={26}
        color={center ? sealColor : theme.colors.onSurfaceVariant}
      />
      <Text variant="dataMedium" color="onSurface">
        Kin {member.kin}
      </Text>
      <Text variant="labelMedium" color="onSurfaceVariant" numberOfLines={1}>
        {member.seal.english}
      </Text>
    </View>
  )
}

function OracleCross({ members }: { members: OracleMember[] }) {
  const byRole = (role: OracleMember['role']) =>
    members.find((member) => member.role === role)
  const guide = byRole('guide')
  const antipode = byRole('antipode')
  const destiny = byRole('destiny')
  const analog = byRole('analog')
  const occult = byRole('occult')

  return (
    <View style={styles.oracleGrid}>
      <View style={styles.oracleRow}>
        <View style={styles.oracleSpacer} />
        {guide !== undefined && <OracleCell member={guide} />}
        <View style={styles.oracleSpacer} />
      </View>
      <View style={styles.oracleRow}>
        {antipode !== undefined && <OracleCell member={antipode} />}
        {destiny !== undefined && <OracleCell member={destiny} />}
        {analog !== undefined && <OracleCell member={analog} />}
      </View>
      <View style={styles.oracleRow}>
        <View style={styles.oracleSpacer} />
        {occult !== undefined && <OracleCell member={occult} />}
        <View style={styles.oracleSpacer} />
      </View>
    </View>
  )
}

export function DreamspellPage({ reading }: { reading: DreamspellReading | null }) {
  const theme = useTheme()

  if (reading === null) {
    return (
      <ReadingPage>
        <PageSection index={0} flavor={FLAVOR} eyebrow="Dreamspell">
          <Text variant="bodyMedium" color="onSurfaceVariant">
            {"This birth date didn't compute. Edit the date and the kin returns."}
          </Text>
        </PageSection>
      </ReadingPage>
    )
  }

  const sealColor = SEAL_COLOR_HEX[reading.seal.color] ?? theme.colors.onSurfaceVariant
  const { galacticBirthday } = reading

  return (
    <ReadingPage>
      <PageSection index={0} flavor={FLAVOR} eyebrow="Dreamspell">
        {/* The seal glyph carries the reading's identity, so it wears the seal's
            own colour; the tone mark stays quiet on the theme's variant. */}
        <View style={styles.identityRow}>
          <Glyph seal={reading.seal.number} size={60} color={sealColor} />
          <View style={styles.identityText}>
            <Text variant="dataLarge" color="onSurface">
              Kin {reading.kin}
            </Text>
            <Text variant="titleLarge" color="onSurface">
              {reading.tone.name} {reading.seal.english}
            </Text>
          </View>
          <Glyph
            tone={reading.tone.number}
            size={34}
            color={theme.colors.onSurfaceVariant}
          />
        </View>
        {/* The seal's colour is the reading, so this badge is painted in it —
            domain colour, exempt from the theme. */}
        <View style={[styles.colorChip, { borderColor: sealColor }]}>
          <View style={[styles.colorDot, { backgroundColor: sealColor }]} />
          <Text variant="labelLarge" color={sealColor}>
            {sentenceCase(reading.seal.color)} · {reading.colorFamily.direction} ·{' '}
            {reading.colorFamily.action}
          </Text>
        </View>
      </PageSection>

      <PageSection index={1} flavor={FLAVOR} eyebrow="Destiny oracle">
        <OracleCross members={reading.oracleMembers} />
      </PageSection>

      <PageSection index={2} flavor={FLAVOR} eyebrow="Cycles">
        <View>
          <DataRow
            label="Wavespell"
            value={`${reading.wavespell.number} of 20 — ${reading.wavespellSeal.english}`}
            detail={`Kin ${reading.wavespell.startKin}–${reading.wavespell.endKin} · Day ${reading.tone.number}: ${reading.wavespellRole}`}
          />
          <DataRow
            label="Castle"
            value={reading.castle.name}
            detail={reading.castle.theme}
          />
          <DataRow label="Earth family" value={reading.earthFamily.name} last />
        </View>
      </PageSection>

      <PageSection index={3} flavor={FLAVOR} eyebrow="Galactic birthday">
        <Text variant="dataMedium" color="onSurface">
          Kin {reading.kin} returns {galacticBirthday.date}
        </Text>
        <Text variant="bodyMedium" color="onSurfaceVariant">
          {galacticBirthday.daysUntil === 0
            ? 'Today — the 260-day spiral completes.'
            : `In ${galacticBirthday.daysUntil} days. The kin recurs every 260 days.`}
        </Text>
      </PageSection>
    </ReadingPage>
  )
}

const styles = StyleSheet.create({
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
  },
  identityText: {
    flex: 1,
  },
  colorChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    borderRadius: SHAPE.full,
    borderWidth: 1,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.xs,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  oracleGrid: {
    gap: SPACE.sm,
  },
  oracleRow: {
    flexDirection: 'row',
    gap: SPACE.sm,
  },
  oracleSpacer: {
    flex: 1,
  },
  oracleCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.xs,
    borderRadius: SHAPE.medium,
    borderWidth: 1,
  },
})
