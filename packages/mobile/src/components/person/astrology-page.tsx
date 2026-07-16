import type { Element, Modality, PlanetPosition } from '@pleiad/engine/types/astrology'
import { StyleSheet, View } from 'react-native'

import { Glyph } from '@/components/glyph'
import { Divider, Text } from '@/components/m3'
import {
  AddDataChip,
  MeterBar,
  PageSection,
  ReadingPage,
  StatWord,
} from '@/components/person/scaffold'
import type { AstrologyReading } from '@/lib/people/reading'
import { sentenceCase } from '@/lib/text'
import { SHAPE, SPACE, useTheme } from '@/theme/m3'
import { FLAVORS } from '@/theme/tokens'

/**
 * Astrology — sun/moon/rising summary, the planets table, and element/modality
 * balance bars. Without a birth time it stays honest: sun sign only, with the
 * path back to the edit sheet.
 */

const FLAVOR = FLAVORS.astrology

const ELEMENT_ORDER: Element[] = ['fire', 'earth', 'air', 'water']
const MODALITY_ORDER: Modality[] = ['cardinal', 'fixed', 'mutable']

function PlanetRow({ position, last }: { position: PlanetPosition; last: boolean }) {
  const theme = useTheme()

  return (
    <View>
      <View style={styles.planetRow}>
        <View style={styles.planetNameCell}>
          <Glyph
            planet={position.planet.name}
            size={20}
            color={theme.colors.onSurface}
          />
          <Text variant="bodyMedium" color="onSurface">
            {position.planet.name}
          </Text>
        </View>
        <View style={styles.planetSignCell}>
          <Glyph
            sign={position.position.sign.number}
            size={18}
            color={theme.colors.onSurfaceVariant}
          />
          <Text variant="bodyMedium" color="onSurfaceVariant">
            {position.position.sign.name}
          </Text>
        </View>
        <View style={styles.planetRight}>
          <Text variant="dataSmall" color="onSurfaceVariant">
            {position.position.degree}°
            {String(position.position.minute).padStart(2, '0')}′
          </Text>
          {position.retrograde && (
            // Retrograde is an astrological fact, not a UI state, so the badge
            // wears the system's own accent rather than a theme role.
            <View style={[styles.retroChip, { borderColor: FLAVOR.accent }]}>
              <Text
                variant="labelSmall"
                color={FLAVOR.accentSoft}
                style={styles.retroText}
              >
                R
              </Text>
            </View>
          )}
        </View>
      </View>
      {!last && <Divider />}
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
        <PageSection index={0} flavor={FLAVOR} eyebrow="Astrology">
          <Text variant="bodyMedium" color="onSurfaceVariant">
            {"The sky didn't compute for this date. Edit the birth data to redraw it."}
          </Text>
        </PageSection>
      </ReadingPage>
    )
  }

  if (!astrology.hasBirthTime) {
    return (
      <ReadingPage>
        <PageSection index={0} flavor={FLAVOR} eyebrow="Astrology">
          <View style={styles.sunStat}>
            <Glyph
              sign={astrology.sunSign.number}
              size={34}
              color={FLAVOR.accent}
              style={styles.summaryGlyph}
            />
            <StatWord value={astrology.sunSign.name} label="Sun sign" />
          </View>
          <Text variant="bodyMedium" color="onSurfaceVariant">
            Without the hour, only the sun is certain. Moon, rising and the houses
            wait on a birth time.
          </Text>
          <AddDataChip label="Add birth time" onPress={onAddBirthTime} />
        </PageSection>
      </ReadingPage>
    )
  }

  const { chart } = astrology
  const planets = [...chart.planets]
  const bigThree: Array<{ label: string; value: string; sign?: number }> = [
    { label: 'Sun', value: chart.sunSign.name, sign: chart.sunSign.number },
    { label: 'Moon', value: chart.moonSign.name, sign: chart.moonSign.number },
    { label: 'Rising', value: chart.risingSign?.name ?? '—', sign: chart.risingSign?.number },
  ]

  return (
    <ReadingPage>
      <PageSection index={0} flavor={FLAVOR} eyebrow="Astrology">
        <View style={styles.summaryRow}>
          {bigThree.map((entry) => (
            <View key={entry.label} style={styles.summaryCell}>
              {entry.sign !== undefined && (
                <Glyph
                  sign={entry.sign}
                  size={30}
                  color={FLAVOR.accent}
                  style={styles.summaryGlyph}
                />
              )}
              <StatWord value={entry.value} label={entry.label} />
            </View>
          ))}
        </View>
      </PageSection>

      <PageSection index={1} flavor={FLAVOR} eyebrow="Planets">
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

      <PageSection index={2} flavor={FLAVOR} eyebrow="Elements">
        {ELEMENT_ORDER.map((element) => (
          <MeterBar
            key={element}
            label={sentenceCase(element)}
            value={chart.elementBalance[element]}
            max={planets.length}
            flavor={FLAVOR}
          />
        ))}
      </PageSection>

      <PageSection index={3} flavor={FLAVOR} eyebrow="Modalities">
        {MODALITY_ORDER.map((modality) => (
          <MeterBar
            key={modality}
            label={sentenceCase(modality)}
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
    gap: SPACE.lg,
  },
  summaryCell: {
    flex: 1,
  },
  summaryGlyph: {
    marginBottom: SPACE.xs,
  },
  sunStat: {
    alignItems: 'flex-start',
    gap: SPACE.xs,
  },
  planetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    paddingVertical: SPACE.md,
  },
  planetNameCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    width: 120,
  },
  planetSignCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  planetRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  retroChip: {
    borderRadius: SHAPE.full,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  retroText: {
    // A single glyph: labelSmall's tracking would push the R off-centre.
    letterSpacing: 0,
  },
})
