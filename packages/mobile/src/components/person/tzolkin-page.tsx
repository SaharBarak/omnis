import { formatLongCount, type LongCountData } from '@pleiad/engine/calculations/long-count'
import { StyleSheet, View } from 'react-native'

import { Glyph } from '@/components/glyph'
import { Text } from '@/components/m3'
import { DataRow, PageSection, ReadingPage } from '@/components/person/scaffold'
import { SPACE } from '@/theme/m3'
import { FLAVORS } from '@/theme/tokens'

/**
 * Tzolkin + Long Count — the traditional Maya count: day sign, the long count
 * in dotted notation, Haab and Calendar Round.
 */

const FLAVOR = FLAVORS.tzolkin

export function TzolkinPage({ mayan }: { mayan: LongCountData | null }) {
  if (mayan === null) {
    return (
      <ReadingPage>
        <PageSection index={0} flavor={FLAVOR} eyebrow="Tzolkin">
          <Text variant="bodyMedium" color="onSurfaceVariant">
            {"The count didn't resolve for this date. Edit the birth date to restore it."}
          </Text>
        </PageSection>
      </ReadingPage>
    )
  }

  const { tzolkin, longCount, haab, calendarRound, daysSinceCreation } = mayan

  return (
    <ReadingPage>
      <PageSection index={0} flavor={FLAVOR} eyebrow="Tzolkin">
        {/* A name, not a numeral — the brand face, not the tabular one. The
            nawal glyph is the traditional Kʼicheʼ day-sign for this count. */}
        <View style={styles.daySignRow}>
          <Glyph tzolkin={tzolkin.daySign.number} size={58} color={FLAVOR.accent} />
          <View style={styles.daySignText}>
            <Text variant="headlineSmall" color="onSurface">
              {tzolkin.tone} {tzolkin.daySign.yucatec}
            </Text>
            <Text variant="labelMedium" color="onSurfaceVariant">
              {tzolkin.daySign.english} · Tone {tzolkin.tone}
            </Text>
          </View>
        </View>
      </PageSection>

      <PageSection index={1} flavor={FLAVOR} eyebrow="Long count">
        <Text variant="dataLarge" color="onSurface">
          {formatLongCount(longCount)}
        </Text>
        <Text variant="labelMedium" color="onSurfaceVariant">
          Baktun · Katun · Tun · Winal · Kin
        </Text>
      </PageSection>

      <PageSection index={2} flavor={FLAVOR} eyebrow="Solar round">
        <DataRow label="Haab" value={`${haab.day} ${haab.monthName}`} />
        <DataRow label="Calendar round" value={calendarRound.formatted} mono />
        <DataRow
          label="Days since creation"
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
  daySignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
  },
  daySignText: {
    flex: 1,
  },
})
