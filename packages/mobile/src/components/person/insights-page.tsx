import { StyleSheet, View } from 'react-native'

import { Text } from '@/components/m3'
import { AddDataChip, PageSection, ReadingPage } from '@/components/person/scaffold'
import type { InsightLine } from '@/lib/people/reading'
import { SPACE } from '@/theme/m3'
import { FLAVORS } from '@/theme/tokens'

/**
 * Insights — cross-system lines computed on-device, each one an assertion
 * derivable from the reading itself. Sparse charts get an invitation to
 * complete the data, never filler.
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
        <PageSection index={0} flavor={FLAVOR} eyebrow="Insights">
          <Text variant="titleLarge" color="onSurface">
            {"The systems haven't crossed yet."}
          </Text>
          <Text variant="bodyMedium" color="onSurfaceVariant">
            Cross-readings surface where two systems agree. Complete the chart and
            the threads appear.
          </Text>
          {missingAnything && (
            <View style={styles.chipRow}>
              {missingBirthTime && (
                <AddDataChip label="Add birth time" onPress={onAddData} />
              )}
              {missingHebrewName && (
                <AddDataChip label="Add Hebrew name" onPress={onAddData} />
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
          <Text variant="bodyLarge" color="onSurfaceVariant">
            {line.body}
          </Text>
        </PageSection>
      ))}

      {missingAnything && (
        <PageSection index={lines.length} flavor={FLAVOR} eyebrow="Complete the chart">
          <Text variant="bodyMedium" color="onSurfaceVariant">
            More data, more threads: each field opens another cross-reading.
          </Text>
          <View style={styles.chipRow}>
            {missingBirthTime && (
              <AddDataChip label="Add birth time" onPress={onAddData} />
            )}
            {missingHebrewName && (
              <AddDataChip label="Add Hebrew name" onPress={onAddData} />
            )}
          </View>
        </PageSection>
      )}
    </ReadingPage>
  )
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.sm,
  },
})
