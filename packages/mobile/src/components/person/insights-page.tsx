import { StyleSheet, Text, View } from 'react-native'

import { AddDataChip, PageSection, ReadingPage } from '@/components/person/scaffold'
import type { InsightLine } from '@/lib/people/reading'
import { COLORS, FLAVORS, TYPE } from '@/theme/tokens'

/**
 * S8 Insights page — cross-system lines computed on-device, each one an
 * assertion derivable from the reading itself. Sparse charts get an
 * invitation to complete the data, never filler.
 */

const FLAVOR = FLAVORS.integration

export function InsightsPage({
  lines,
  missingBirthTime,
  missingHebrewName,
  onAddData,
}: {
  lines: InsightLine[]
  missingBirthTime: boolean
  missingHebrewName: boolean
  onAddData: () => void
}) {
  const missingAnything = missingBirthTime || missingHebrewName

  if (lines.length === 0) {
    return (
      <ReadingPage>
        <PageSection index={0} flavor={FLAVOR} eyebrow="INSIGHTS">
          <Text style={TYPE.section}>The systems haven't crossed yet.</Text>
          <Text style={styles.quietBody}>
            Cross-readings surface where two systems agree. Complete the chart and
            the threads appear.
          </Text>
          {missingAnything && (
            <View style={styles.chipRow}>
              {missingBirthTime && (
                <AddDataChip label="ADD BIRTH TIME" flavor={FLAVOR} onPress={onAddData} />
              )}
              {missingHebrewName && (
                <AddDataChip label="ADD HEBREW NAME" flavor={FLAVOR} onPress={onAddData} />
              )}
            </View>
          )}
        </PageSection>
      </ReadingPage>
    )
  }

  return (
    <ReadingPage>
      {lines.map((line, index) => (
        <PageSection key={line.eyebrow} index={index} flavor={FLAVOR} eyebrow={line.eyebrow}>
          <Text style={styles.insightBody}>{line.body}</Text>
        </PageSection>
      ))}

      {missingAnything && (
        <PageSection index={lines.length} flavor={FLAVOR} eyebrow="COMPLETE THE CHART">
          <Text style={styles.quietBody}>
            More data, more threads — each field opens another cross-reading.
          </Text>
          <View style={styles.chipRow}>
            {missingBirthTime && (
              <AddDataChip label="ADD BIRTH TIME" flavor={FLAVOR} onPress={onAddData} />
            )}
            {missingHebrewName && (
              <AddDataChip label="ADD HEBREW NAME" flavor={FLAVOR} onPress={onAddData} />
            )}
          </View>
        </PageSection>
      )}
    </ReadingPage>
  )
}

const styles = StyleSheet.create({
  insightBody: {
    ...TYPE.body,
    color: COLORS.text70,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quietBody: {
    ...TYPE.bodySm,
    color: COLORS.text50,
  },
})
