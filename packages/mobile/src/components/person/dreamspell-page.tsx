import { StyleSheet, Text, View } from 'react-native'

import {
  DataRow,
  PageSection,
  ReadingPage,
  SEAL_COLOR_HEX,
} from '@/components/person/scaffold'
import { StatNumber } from '@/components/ui/primitives'
import type { DreamspellReading, OracleMember } from '@/lib/people/reading'
import { COLORS, FLAVORS, RADII, TYPE } from '@/theme/tokens'

/**
 * S8 Dreamspell page — the identity: big kin, oracle cross, cycles,
 * galactic birthday. Never entitlement-locked (free tier's one open system).
 */

const FLAVOR = FLAVORS.dreamspell

const ORACLE_LABELS: Record<OracleMember['role'], string> = {
  guide: 'GUIDE',
  analog: 'ANALOG',
  antipode: 'ANTIPODE',
  occult: 'OCCULT',
  destiny: 'DESTINY',
}

function OracleCell({ member }: { member: OracleMember }) {
  const center = member.role === 'destiny'
  const sealColor = SEAL_COLOR_HEX[member.seal.color] ?? COLORS.text50
  return (
    <View style={[styles.oracleCell, center && { borderColor: sealColor }]}>
      <Text style={[styles.oracleRole, center && { color: sealColor }]}>
        {ORACLE_LABELS[member.role]}
      </Text>
      <Text style={styles.oracleKin}>KIN {member.kin}</Text>
      <Text style={styles.oracleSeal} numberOfLines={1}>
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
  if (reading === null) {
    return (
      <ReadingPage>
        <PageSection index={0} flavor={FLAVOR} eyebrow="DREAMSPELL">
          <Text style={styles.quietBody}>
            This birth date didn't compute. Edit the date and the kin returns.
          </Text>
        </PageSection>
      </ReadingPage>
    )
  }

  const sealColor = SEAL_COLOR_HEX[reading.seal.color] ?? COLORS.text50
  const { galacticBirthday } = reading

  return (
    <ReadingPage>
      <PageSection index={0} flavor={FLAVOR} eyebrow="DREAMSPELL">
        <StatNumber value={`KIN ${reading.kin}`} />
        <Text style={TYPE.section}>
          {reading.tone.name} {reading.seal.english}
        </Text>
        <View style={[styles.colorChip, { borderColor: sealColor }]}>
          <View style={[styles.colorDot, { backgroundColor: sealColor }]} />
          <Text style={[TYPE.eyebrow, { color: sealColor }]}>
            {reading.seal.color} · {reading.colorFamily.direction} ·{' '}
            {reading.colorFamily.action}
          </Text>
        </View>
      </PageSection>

      <PageSection index={1} flavor={FLAVOR} eyebrow="DESTINY ORACLE">
        <OracleCross members={reading.oracleMembers} />
      </PageSection>

      <PageSection index={2} flavor={FLAVOR} eyebrow="CYCLES">
        <View>
          <DataRow
            label="WAVESPELL"
            value={`${reading.wavespell.number} of 20 — ${reading.wavespellSeal.english}`}
            detail={`Kin ${reading.wavespell.startKin}–${reading.wavespell.endKin} · Day ${reading.tone.number}: ${reading.wavespellRole}`}
          />
          <DataRow
            label="CASTLE"
            value={reading.castle.name}
            detail={reading.castle.theme}
          />
          <DataRow label="EARTH FAMILY" value={reading.earthFamily.name} last />
        </View>
      </PageSection>

      <PageSection index={3} flavor={FLAVOR} eyebrow="GALACTIC BIRTHDAY">
        <Text style={styles.birthdayLine}>
          KIN {reading.kin} RETURNS {galacticBirthday.date}
        </Text>
        <Text style={styles.quietBody}>
          {galacticBirthday.daysUntil === 0
            ? 'Today — the 260-day spiral completes.'
            : `In ${galacticBirthday.daysUntil} days. The kin recurs every 260 days.`}
        </Text>
      </PageSection>
    </ReadingPage>
  )
}

const styles = StyleSheet.create({
  colorChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: RADII.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  oracleGrid: {
    gap: 8,
  },
  oracleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  oracleSpacer: {
    flex: 1,
  },
  oracleCell: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: RADII.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardFill,
  },
  oracleRole: {
    ...TYPE.statLabel,
    fontSize: 9,
    letterSpacing: 1.4,
  },
  oracleKin: {
    ...TYPE.stat,
    fontSize: 16,
    lineHeight: 20,
  },
  oracleSeal: {
    ...TYPE.bodySm,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.text70,
  },
  birthdayLine: {
    ...TYPE.stat,
    fontSize: 18,
    lineHeight: 24,
  },
  quietBody: {
    ...TYPE.bodySm,
    color: COLORS.text50,
  },
})
