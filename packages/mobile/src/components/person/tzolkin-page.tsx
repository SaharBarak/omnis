import { formatLongCount, type LongCountData } from '@pleiad/engine/calculations/long-count'
import { StyleSheet, Text } from 'react-native'

import { DataRow, PageSection, ReadingPage } from '@/components/person/scaffold'
import { StatNumber } from '@/components/ui/primitives'
import { COLORS, FLAVORS, TYPE } from '@/theme/tokens'

/**
 * S8 Tzolkin + Long Count page — traditional Maya count: day sign, the long
 * count in dotted notation, Haab and Calendar Round.
 */

const FLAVOR = FLAVORS.tzolkin

export function TzolkinPage({ mayan }: { mayan: LongCountData | null }) {
  if (mayan === null) {
    return (
      <ReadingPage>
        <PageSection index={0} flavor={FLAVOR} eyebrow="TZOLKIN">
          <Text style={styles.quietBody}>
            The count didn't resolve for this date. Edit the birth date to restore it.
          </Text>
        </PageSection>
      </ReadingPage>
    )
  }

  const { tzolkin, longCount, haab, calendarRound, daysSinceCreation } = mayan

  return (
    <ReadingPage>
      <PageSection index={0} flavor={FLAVOR} eyebrow="TZOLKIN">
        <StatNumber
          value={`${tzolkin.tone} ${tzolkin.daySign.yucatec}`}
          label={`${tzolkin.daySign.english} · TONE ${tzolkin.tone}`}
        />
      </PageSection>

      <PageSection index={1} flavor={FLAVOR} eyebrow="LONG COUNT">
        <Text style={styles.longCount}>{formatLongCount(longCount)}</Text>
        <Text style={TYPE.statLabel}>BAKTUN · KATUN · TUN · WINAL · KIN</Text>
      </PageSection>

      <PageSection index={2} flavor={FLAVOR} eyebrow="SOLAR ROUND">
        <DataRow label="HAAB" value={`${haab.day} ${haab.monthName}`} />
        <DataRow label="CALENDAR ROUND" value={calendarRound.formatted} mono />
        <DataRow
          label="DAYS SINCE CREATION"
          value={daysSinceCreation.toLocaleString('en-US')}
          detail="Counted from 4 Ajaw 8 Kumk'u"
          mono
          last
        />
      </PageSection>
    </ReadingPage>
  )
}

const styles = StyleSheet.create({
  longCount: {
    ...TYPE.stat,
    fontSize: 34,
    lineHeight: 40,
  },
  quietBody: {
    ...TYPE.bodySm,
    color: COLORS.text50,
  },
})
