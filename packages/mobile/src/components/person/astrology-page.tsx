import type { Element, Modality, PlanetPosition } from '@pleiad/engine/types/astrology'
import { StyleSheet, Text, View } from 'react-native'

import {
  AddDataChip,
  MeterBar,
  PageSection,
  ReadingPage,
  StatWord,
} from '@/components/person/scaffold'
import { StatNumber } from '@/components/ui/primitives'
import type { AstrologyReading } from '@/lib/people/reading'
import { COLORS, FLAVORS, RADII, SPACE, TYPE } from '@/theme/tokens'

/**
 * S8 Astrology page — sun/moon/rising summary, the planets table, and
 * element/modality balance bars. Without a birth time it stays honest:
 * sun sign only, with the path back to the edit sheet.
 */

const FLAVOR = FLAVORS.astrology

const ELEMENT_ORDER: Element[] = ['fire', 'earth', 'air', 'water']
const MODALITY_ORDER: Modality[] = ['cardinal', 'fixed', 'mutable']

function PlanetRow({ position, last }: { position: PlanetPosition; last: boolean }) {
  return (
    <View style={[styles.planetRow, !last && styles.planetRowBorder]}>
      <Text style={styles.planetName}>{position.planet.name}</Text>
      <Text style={styles.planetSign}>{position.position.sign.name}</Text>
      <View style={styles.planetRight}>
        <Text style={styles.planetDegree}>
          {position.position.degree}°{String(position.position.minute).padStart(2, '0')}′
        </Text>
        {position.retrograde && (
          <View style={styles.retroChip}>
            <Text style={styles.retroText}>R</Text>
          </View>
        )}
      </View>
    </View>
  )
}

export function AstrologyPage({
  astrology,
  onAddBirthTime,
}: {
  astrology: AstrologyReading | null
  onAddBirthTime: () => void
}) {
  if (astrology === null) {
    return (
      <ReadingPage>
        <PageSection index={0} flavor={FLAVOR} eyebrow="ASTROLOGY">
          <Text style={styles.quietBody}>
            The sky didn't compute for this date. Edit the birth data to redraw it.
          </Text>
        </PageSection>
      </ReadingPage>
    )
  }

  if (!astrology.hasBirthTime) {
    return (
      <ReadingPage>
        <PageSection index={0} flavor={FLAVOR} eyebrow="ASTROLOGY">
          <StatNumber value={astrology.sunSign.name.toUpperCase()} label="SUN SIGN" />
          <Text style={styles.quietBody}>
            Without the hour, only the sun is certain. Moon, rising and the houses
            wait on a birth time.
          </Text>
          <AddDataChip label="ADD BIRTH TIME" flavor={FLAVOR} onPress={onAddBirthTime} />
        </PageSection>
      </ReadingPage>
    )
  }

  const { chart } = astrology
  const planets = [...chart.planets]
  const bigThree: Array<{ label: string; value: string }> = [
    { label: 'SUN', value: chart.sunSign.name },
    { label: 'MOON', value: chart.moonSign.name },
    { label: 'RISING', value: chart.risingSign?.name ?? '—' },
  ]

  return (
    <ReadingPage>
      <PageSection index={0} flavor={FLAVOR} eyebrow="ASTROLOGY">
        <View style={styles.summaryRow}>
          {bigThree.map((entry) => (
            <StatWord
              key={entry.label}
              value={entry.value.toUpperCase()}
              label={entry.label}
              style={styles.summaryCell}
            />
          ))}
        </View>
      </PageSection>

      <PageSection index={1} flavor={FLAVOR} eyebrow="PLANETS">
        <View>
          {planets.map((position, index) => (
            <PlanetRow
              key={position.planet.id}
              position={position}
              last={index === planets.length - 1}
            />
          ))}
        </View>
      </PageSection>

      <PageSection index={2} flavor={FLAVOR} eyebrow="ELEMENTS">
        {ELEMENT_ORDER.map((element) => (
          <MeterBar
            key={element}
            label={element.toUpperCase()}
            value={chart.elementBalance[element]}
            max={planets.length}
            flavor={FLAVOR}
          />
        ))}
      </PageSection>

      <PageSection index={3} flavor={FLAVOR} eyebrow="MODALITIES">
        {MODALITY_ORDER.map((modality) => (
          <MeterBar
            key={modality}
            label={modality.toUpperCase()}
            value={chart.modalityBalance[modality]}
            max={planets.length}
            flavor={FLAVOR}
          />
        ))}
      </PageSection>
    </ReadingPage>
  )
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    gap: SPACE.cardPad,
  },
  summaryCell: {
    flex: 1,
    gap: 3,
  },
  planetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  planetRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  planetName: {
    ...TYPE.bodySm,
    color: COLORS.text90,
    width: 96,
  },
  planetSign: {
    ...TYPE.bodySm,
    color: COLORS.text70,
    flex: 1,
  },
  planetRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planetDegree: {
    ...TYPE.statLabel,
    letterSpacing: 0.5,
    color: COLORS.text50,
  },
  retroChip: {
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: FLAVOR.accent,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  retroText: {
    ...TYPE.statLabel,
    fontSize: 9,
    letterSpacing: 1,
    color: FLAVOR.accentSoft,
  },
  quietBody: {
    ...TYPE.bodySm,
    color: COLORS.text50,
  },
})
