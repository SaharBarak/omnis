import {
  DIGITAL_ROOT_LABELS,
  GEMATRIA_METHOD_LABELS,
  type GematriaMethod,
  type GematriaResult,
} from '@pleiad/engine/types/gematria'
import { StyleSheet, Text, View } from 'react-native'

import { AddDataChip, DataRow, PageSection, ReadingPage } from '@/components/person/scaffold'
import { StatNumber } from '@/components/ui/primitives'
import type { PersonWithTags } from '@pleiad/api-client'
import { COLORS, FLAVORS, TYPE } from '@/theme/tokens'

/**
 * S8 Kabbalah page — gematria of the Hebrew name: digital root, the letter
 * breakdown, and all seven calculation methods. Without a Hebrew name: an
 * honest empty state with a path to the edit sheet.
 */

const FLAVOR = FLAVORS.gematria

const METHOD_ORDER: GematriaMethod[] = [
  'standard',
  'ordinal',
  'atbash',
  'full',
  'small',
  'avgad',
  'albam',
]

export function KabbalahPage({
  person,
  gematria,
  onAddHebrewName,
}: {
  person: PersonWithTags
  gematria: GematriaResult | null
  onAddHebrewName: () => void
}) {
  if (gematria === null) {
    const hasName = (person.hebrew_name ?? '').trim().length > 0
    return (
      <ReadingPage>
        <PageSection index={0} flavor={FLAVOR} eyebrow="KABBALAH">
          <Text style={TYPE.section}>Every letter carries a number.</Text>
          <Text style={styles.quietBody}>
            {hasName
              ? "The Hebrew name on file didn't resolve into letters. Check its spelling."
              : 'Gematria reads the Hebrew name. Add one and seven counting methods open.'}
          </Text>
          <AddDataChip
            label={hasName ? 'EDIT HEBREW NAME' : 'ADD HEBREW NAME'}
            flavor={FLAVOR}
            onPress={onAddHebrewName}
          />
        </PageSection>
      </ReadingPage>
    )
  }

  const rootMeaning = DIGITAL_ROOT_LABELS[gematria.methods.standard.digitalRoot]
  const breakdown = [...gematria.methods.standard.breakdown]

  return (
    <ReadingPage>
      <PageSection index={0} flavor={FLAVOR} eyebrow="KABBALAH">
        <Text style={styles.hebrewName}>{gematria.cleanedText}</Text>
        <StatNumber
          value={String(gematria.methods.standard.value)}
          label="STANDARD VALUE — MISPAR HECHRACHI"
        />
      </PageSection>

      <PageSection index={1} flavor={FLAVOR} eyebrow="LETTERS">
        <View style={styles.letterRow}>
          {breakdown.map((letter, index) => (
            <View key={`${letter.letterId}-${index}`} style={styles.letterCell}>
              <Text style={styles.letterGlyph}>{letter.letter}</Text>
              <Text style={styles.letterValue}>{letter.value}</Text>
            </View>
          ))}
        </View>
      </PageSection>

      <PageSection index={2} flavor={FLAVOR} eyebrow="DIGITAL ROOT">
        <StatNumber
          value={String(gematria.methods.standard.digitalRoot)}
          label={rootMeaning !== undefined ? rootMeaning.meaning.toUpperCase() : 'REDUCTION'}
        />
      </PageSection>

      <PageSection index={3} flavor={FLAVOR} eyebrow="SEVEN METHODS">
        <View>
          {METHOD_ORDER.map((method, index) => (
            <DataRow
              key={method}
              label={GEMATRIA_METHOD_LABELS[method].label.toUpperCase()}
              value={String(gematria.methods[method].value)}
              detail={GEMATRIA_METHOD_LABELS[method].labelHebrew}
              mono
              last={index === METHOD_ORDER.length - 1}
            />
          ))}
        </View>
      </PageSection>
    </ReadingPage>
  )
}

const styles = StyleSheet.create({
  hebrewName: {
    ...TYPE.zone,
    writingDirection: 'rtl',
  },
  letterRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
  },
  letterCell: {
    alignItems: 'center',
    gap: 2,
    minWidth: 44,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardFill,
  },
  letterGlyph: {
    ...TYPE.section,
    color: FLAVOR.accentSoft,
  },
  letterValue: {
    ...TYPE.statLabel,
    letterSpacing: 0.5,
  },
  quietBody: {
    ...TYPE.bodySm,
    color: COLORS.text50,
  },
})
