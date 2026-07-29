import { useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import type { PersonWithTags } from '@pleiad/api-client'
import {
  baziChart,
  luckPillars,
  type BaziElement,
  type StemBranch,
} from '@pleiad/engine/calculations/bazi'
import { SegmentedButton, Text } from '@/components/m3'
import { AddDataChip, DataRow, PageSection, ReadingPage } from '@/components/person/scaffold'
import { SPACE, useTheme, alpha } from '@/theme/m3'
import type { SystemFlavor } from '@/theme/tokens'

/**
 * BaZi (#73) — the four pillars, day master, element balance, and luck
 * decades. Computed in place from birth date + optional birth time; the
 * decade direction needs a gender people don't carry, so it's a toggle.
 */

const FLAVOR: SystemFlavor = {
  name: 'BaZi',
  accent: '#CF6F6F',
  accentSoft: '#E5A9A9',
}

const ELEMENT_COLORS: Record<BaziElement, string> = {
  Wood: '#86C89B',
  Fire: '#D98E5F',
  Earth: '#D9B36A',
  Metal: '#C9CDD4',
  Water: '#7FA8D4',
}

function PillarRow({ label, pillar, last }: { label: string; pillar: StemBranch; last?: boolean }) {
  return (
    <DataRow
      label={label}
      value={`${pillar.stemName} ${pillar.branchName}`}
      detail={`${pillar.polarity} ${pillar.element} ${pillar.animal}`}
      mono
      last={last === true}
    />
  )
}

export function BaziPage({
  person,
  onAddBirthTime,
}: {
  person: PersonWithTags
  onAddBirthTime: () => void
}) {
  const theme = useTheme()
  const [genderIndex, setGenderIndex] = useState(0)
  const gender = genderIndex === 0 ? ('male' as const) : ('female' as const)

  const chart = useMemo(
    () => baziChart(person.birth_date, person.birth_time),
    [person.birth_date, person.birth_time]
  )
  const decades = useMemo(
    () => luckPillars(person.birth_date, gender),
    [person.birth_date, gender]
  )

  return (
    <ReadingPage>
      <PageSection index={0} flavor={FLAVOR} eyebrow="Day Master">
        <View style={styles.hero}>
          <Text variant="displaySmall" color="primary">
            {chart.dayMaster.name}
          </Text>
          <Text variant="bodyMedium" color="onSurfaceVariant">
            {chart.dayMaster.polarity} {chart.dayMaster.element} — the self the
            chart is read against
          </Text>
        </View>
      </PageSection>

      <PageSection index={1} flavor={FLAVOR} eyebrow="The four pillars">
        <PillarRow label="Year" pillar={chart.year} />
        <PillarRow label="Month" pillar={chart.month} />
        <PillarRow label="Day" pillar={chart.day} last={chart.hour === null} />
        {chart.hour !== null && <PillarRow label="Hour" pillar={chart.hour} last />}
        {chart.hour === null && (
          <View style={styles.addChip}>
            <AddDataChip label="Add birth time for the hour pillar" onPress={onAddBirthTime} />
          </View>
        )}
      </PageSection>

      <PageSection index={2} flavor={FLAVOR} eyebrow="Five elements">
        {(Object.entries(chart.elementCounts) as [BaziElement, number][]).map(
          ([element, count], i, all) => (
            <View
              key={element}
              style={[
                styles.elementRow,
                i < all.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: alpha(theme.colors.outline, 0.4),
                },
              ]}
            >
              <Text variant="bodyMedium" color="onSurfaceVariant" style={styles.elementName}>
                {element}
              </Text>
              <View style={styles.elementBars}>
                {Array.from({ length: count }, (_, j) => (
                  <View
                    key={j}
                    style={[styles.elementBar, { backgroundColor: ELEMENT_COLORS[element] }]}
                  />
                ))}
                {count === 0 && (
                  <Text variant="labelSmall" color="onSurfaceVariant">
                    absent
                  </Text>
                )}
              </View>
              <Text variant="dataSmall" color="onSurface">
                {count}
              </Text>
            </View>
          )
        )}
      </PageSection>

      <PageSection index={3} flavor={FLAVOR} eyebrow="Luck decades">
        <View style={styles.genderToggle}>
          <SegmentedButton
            segments={[
              { key: 'male', label: 'Male direction' },
              { key: 'female', label: 'Female direction' },
            ]}
            selectedIndex={genderIndex}
            onSelect={setGenderIndex}
          />
        </View>
        {decades.map((d, i) => (
          <DataRow
            key={`${d.startAge}-${d.name}`}
            label={`Ages ${d.startAge}–${d.endAge}`}
            value={`${d.stemName} ${d.branchName}`}
            detail={`${d.polarity} ${d.element} ${d.animal}`}
            mono
            last={i === decades.length - 1}
          />
        ))}
      </PageSection>
    </ReadingPage>
  )
}

const styles = StyleSheet.create({
  hero: {
    gap: SPACE.xs,
  },
  addChip: {
    paddingTop: SPACE.md,
  },
  elementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    paddingVertical: SPACE.md,
  },
  elementName: {
    width: 56,
  },
  elementBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
  },
  elementBar: {
    height: 8,
    width: 22,
    borderRadius: 4,
  },
  genderToggle: {
    paddingBottom: SPACE.md,
  },
})
