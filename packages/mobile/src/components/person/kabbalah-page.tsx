import {
  DIGITAL_ROOT_LABELS,
  GEMATRIA_METHOD_LABELS,
  type GematriaMethod,
  type GematriaResult,
} from '@pleiad/engine/types/gematria'
import { StyleSheet, View } from 'react-native'

import type { PersonWithTags } from '@pleiad/api-client'
import { Glyph } from '@/components/glyph'
import { Text } from '@/components/m3'
import { AddDataChip, DataRow, PageSection, ReadingPage } from '@/components/person/scaffold'
import { SHAPE, SPACE, useTheme } from '@/theme/m3'
import { FLAVORS } from '@/theme/tokens'

/**
 * Kabbalah — gematria of the Hebrew name: digital root, the letter breakdown,
 * and all seven calculation methods. Without a Hebrew name: an honest empty
 * state with a path to the edit sheet.
 */

const FLAVOR = FLAVORS.gematria

/** The 22 base letters in order; a letter's position is its glyph number. */
const HEBREW_ORDER = [
  'aleph', 'bet', 'gimel', 'dalet', 'he', 'vav', 'zayin', 'chet', 'tet', 'yod',
  'kaf', 'lamed', 'mem', 'nun', 'samech', 'ayin', 'pe', 'tsadi', 'qof', 'resh',
  'shin', 'tav',
]

/** letterId → glyph number (1-22); a final form folds to its base letter. */
function letterGlyphNumber(letterId: string): number | undefined {
  const index = HEBREW_ORDER.indexOf(letterId.replace(/-final$/, ''))
  return index === -1 ? undefined : index + 1
}

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
  const theme = useTheme()

  if (gematria === null) {
    const hasName = (person.hebrew_name ?? '').trim().length > 0
    return (
      <ReadingPage>
        <PageSection index={0} flavor={FLAVOR} eyebrow="Kabbalah">
          <Text variant="titleLarge" color="onSurface">
            Every letter carries a number.
          </Text>
          <Text variant="bodyMedium" color="onSurfaceVariant">
            {hasName
              ? "The Hebrew name on file didn't resolve into letters. Check its spelling."
              : 'Gematria reads the Hebrew name. Add one and seven counting methods open.'}
          </Text>
          <AddDataChip
            label={hasName ? 'Edit Hebrew name' : 'Add Hebrew name'}
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
      <PageSection index={0} flavor={FLAVOR} eyebrow="Kabbalah">
        <Text variant="headlineMedium" color="onSurface" style={styles.hebrewName}>
          {gematria.cleanedText}
        </Text>
        <Text variant="dataLarge" color="onSurface">
          {gematria.methods.standard.value}
        </Text>
        <Text variant="labelMedium" color="onSurfaceVariant">
          Standard value — Mispar Hechrachi
        </Text>
      </PageSection>

      <PageSection index={1} flavor={FLAVOR} eyebrow="Letters">
        <View style={styles.letterRow}>
          {breakdown.map((letter, index) => {
            const glyphNumber = letterGlyphNumber(letter.letterId)
            return (
              <View
                key={`${letter.letterId}-${index}`}
                style={[
                  styles.letterCell,
                  {
                    backgroundColor: theme.surfaceAt(1),
                    borderColor: theme.colors.outlineVariant,
                  },
                ]}
              >
                {glyphNumber === undefined ? (
                  <Text variant="titleLarge" color={FLAVOR.accentSoft}>
                    {letter.letter}
                  </Text>
                ) : (
                  <Glyph letter={glyphNumber} size={30} color={FLAVOR.accentSoft} />
                )}
                <Text variant="dataSmall" color="onSurfaceVariant">
                  {letter.value}
                </Text>
              </View>
            )
          })}
        </View>
      </PageSection>

      <PageSection index={2} flavor={FLAVOR} eyebrow="Digital root">
        <Text variant="dataLarge" color="onSurface">
          {gematria.methods.standard.digitalRoot}
        </Text>
        <Text variant="labelMedium" color="onSurfaceVariant">
          {rootMeaning !== undefined ? rootMeaning.meaning : 'Reduction'}
        </Text>
      </PageSection>

      <PageSection index={3} flavor={FLAVOR} eyebrow="Seven methods">
        <View>
          {METHOD_ORDER.map((method, index) => (
            <DataRow
              key={method}
              label={GEMATRIA_METHOD_LABELS[method].label}
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
    writingDirection: 'rtl',
  },
  letterRow: {
    // The name reads right-to-left, so the cells must lay out that way too.
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: SPACE.sm,
  },
  letterCell: {
    alignItems: 'center',
    gap: 2,
    minWidth: 44,
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.sm,
    borderRadius: SHAPE.medium,
    borderWidth: 1,
  },
})
