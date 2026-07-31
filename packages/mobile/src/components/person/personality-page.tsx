import type { PersonalityInput, PersonWithTags } from '@pleiad/api-client'
import {
  ATTACHMENT_NAMES,
  ATTACHMENT_STYLES,
  BIG_FIVE_DIMENSIONS,
  DISC_NAMES,
  DISC_STYLES,
  ENNEAGRAM_TYPES,
  LOVE_LANGUAGES,
  MBTI_TYPES,
  cognitiveFunctions,
  mbtiNickname,
  type LoveLanguage,
  type MbtiType,
} from '@pleiad/engine/calculations/personality'
import { useMemo, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'

import {
  BottomSheet,
  Button,
  Chip,
  Divider,
  ListItem,
  Slider,
  Text,
} from '@/components/m3'
import { DataRow, PageSection, ReadingPage } from '@/components/person/scaffold'
import { useUpdatePerson } from '@/lib/people/hooks'
import { showToast } from '@/lib/toast'
import { SPACE } from '@/theme/m3'
import type { SystemFlavor } from '@/theme/tokens'

/**
 * Personality frameworks (#75) — MBTI, Enneagram, DISC, attachment, love
 * languages, Big Five. Nothing here is derived from a birth date: it is what
 * the person says about themselves, which is why this is the one reading page
 * that is an editor. The couple map reads it back.
 *
 * Flavour is deliberately neutral grey. Every other page wears the colour of
 * the tradition it reads; these frameworks belong to no tradition on the map.
 */

const FLAVOR: SystemFlavor = {
  name: 'Personality',
  accent: '#C9CDD4',
  accentSoft: '#E2E5E9',
}

const FUNCTION_ROLES = ['Dominant', 'Auxiliary', 'Tertiary', 'Inferior'] as const

/** A row that opens a sheet of options — mobile's answer to a `<select>`. */
function PickerRow({
  label,
  value,
  placeholder,
  onPress,
}: {
  label: string
  value: string | null
  placeholder: string
  onPress: () => void
}) {
  return (
    <ListItem
      headline={label}
      supportingText={value ?? placeholder}
      onPress={onPress}
      accessibilityLabel={`${label}: ${value ?? placeholder}`}
    />
  )
}

function ChoiceSheet<T extends string>({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean
  title: string
  options: ReadonlyArray<{ value: T; label: string }>
  selected: T | null
  onSelect: (value: T | null) => void
  onClose: () => void
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      <ScrollView style={styles.sheetList}>
        <ListItem
          headline="Not set"
          onPress={() => {
            onSelect(null)
            onClose()
          }}
        />
        <Divider />
        {options.map((option, index) => (
          <View key={option.value}>
            <ListItem
              headline={option.label}
              trailing={
                option.value === selected ? (
                  <Text variant="labelLarge" color="primary">
                    ✓
                  </Text>
                ) : undefined
              }
              onPress={() => {
                onSelect(option.value)
                onClose()
              }}
            />
            {index < options.length - 1 && <Divider />}
          </View>
        ))}
      </ScrollView>
    </BottomSheet>
  )
}

type PickerKey = 'mbti' | 'enneagram' | 'love-primary' | 'love-secondary'

export function PersonalityPage({ person }: { person: PersonWithTags }) {
  const updatePerson = useUpdatePerson()
  // The fetched row types its personality loosely (it is jsonb); the draft is
  // held in the strict write shape so an invalid value can't be built here.
  const stored = useMemo(
    () => (person.personality ?? {}) as NonNullable<PersonalityInput>,
    [person.personality]
  )
  const [draft, setDraft] = useState<NonNullable<PersonalityInput>>(stored)
  const [picker, setPicker] = useState<PickerKey | null>(null)

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(stored),
    [draft, stored]
  )

  const patch = (partial: Partial<NonNullable<PersonalityInput>>) => {
    setDraft((current) => ({ ...current, ...partial }))
  }

  const mbti = (draft.mbti ?? null) as MbtiType | null
  const functions =
    mbti !== null && (MBTI_TYPES as readonly string[]).includes(mbti)
      ? cognitiveFunctions(mbti)
      : null

  const primaryLanguage: LoveLanguage | null = draft.loveLanguages?.[0] ?? null
  const secondaryLanguage: LoveLanguage | null = draft.loveLanguages?.[1] ?? null

  const setLoveLanguages = (
    primary: LoveLanguage | null,
    secondary: LoveLanguage | null
  ) => {
    const next = [primary, secondary].filter(
      (language): language is LoveLanguage => language !== null
    )
    patch({ loveLanguages: next.length > 0 ? next : null })
  }

  const save = () => {
    updatePerson.mutate(
      { id: person.id, updates: { personality: draft } },
      { onSuccess: () => showToast('Saved.') }
    )
  }

  const enneagramLabel =
    draft.enneagram !== null && draft.enneagram !== undefined
      ? (ENNEAGRAM_TYPES.find((t) => String(t.number) === draft.enneagram)?.name ??
        draft.enneagram)
      : null

  return (
    <ReadingPage>
      <PageSection index={0} flavor={FLAVOR} eyebrow="Frameworks">
        <Text variant="bodyMedium" color="onSurfaceVariant">
          These aren&rsquo;t computed from a birth date — they&rsquo;re
          self-reported. Enter what {person.name} knows about themselves and the
          couple map can read the pair.
        </Text>

        <View style={styles.rows}>
          <PickerRow
            label="MBTI"
            value={mbti === null ? null : `${mbti} · ${mbtiNickname(mbti)}`}
            placeholder="Not set"
            onPress={() => setPicker('mbti')}
          />
          <Divider />
          <PickerRow
            label="Enneagram"
            value={
              enneagramLabel === null ? null : `${draft.enneagram} · ${enneagramLabel}`
            }
            placeholder="Not set"
            onPress={() => setPicker('enneagram')}
          />
          <Divider />
          <PickerRow
            label="Primary love language"
            value={primaryLanguage}
            placeholder="Not set"
            onPress={() => setPicker('love-primary')}
          />
          <Divider />
          <PickerRow
            label="Secondary love language"
            value={secondaryLanguage}
            placeholder="Not set"
            onPress={() => setPicker('love-secondary')}
          />
        </View>
      </PageSection>

      {/* Four options each — chips beat a sheet, because the whole choice is
          visible without opening anything. */}
      <PageSection index={1} flavor={FLAVOR} eyebrow="DISC">
        <View style={styles.chips}>
          {DISC_STYLES.map((style) => (
            <Chip
              key={style}
              variant="filter"
              label={DISC_NAMES[style]}
              selected={draft.disc === style}
              onPress={() => patch({ disc: draft.disc === style ? null : style })}
            />
          ))}
        </View>
      </PageSection>

      <PageSection index={2} flavor={FLAVOR} eyebrow="Attachment style">
        <View style={styles.chips}>
          {ATTACHMENT_STYLES.map((style) => (
            <Chip
              key={style}
              variant="filter"
              label={ATTACHMENT_NAMES[style]}
              selected={draft.attachment === style}
              onPress={() =>
                patch({ attachment: draft.attachment === style ? null : style })
              }
            />
          ))}
        </View>
      </PageSection>

      <PageSection index={3} flavor={FLAVOR} eyebrow="Big Five">
        <View style={styles.sliders}>
          {BIG_FIVE_DIMENSIONS.map((dimension) => (
            <Slider
              key={dimension.key}
              label={dimension.label}
              value={draft.bigFive?.[dimension.key] ?? 50}
              onChange={(next) =>
                patch({
                  bigFive: { ...draft.bigFive, [dimension.key]: Math.round(next) },
                })
              }
            />
          ))}
        </View>
        <Text variant="bodySmall" color="onSurfaceVariant">
          Zero to a hundred, as reported by whichever inventory they took.
        </Text>
      </PageSection>

      {functions !== null && (
        <PageSection index={4} flavor={FLAVOR} eyebrow="Cognitive functions">
          {functions.map((fn, index) => (
            <DataRow
              key={fn}
              label={FUNCTION_ROLES[index] ?? `Function ${index + 1}`}
              value={fn}
              last={index === functions.length - 1}
            />
          ))}
          <Text variant="bodySmall" color="onSurfaceVariant" style={styles.note}>
            The Grant stack for {mbti} — how this type takes in the world and
            decides about it, in order of confidence.
          </Text>
        </PageSection>
      )}

      <PageSection index={5} flavor={FLAVOR}>
        <Button
          variant="filled"
          fullWidth
          disabled={!dirty || updatePerson.isPending}
          onPress={save}
        >
          {updatePerson.isPending ? 'Saving…' : 'Save profile'}
        </Button>
        {dirty && !updatePerson.isPending && (
          <Text variant="bodySmall" color="onSurfaceVariant" style={styles.note}>
            Unsaved changes
          </Text>
        )}
      </PageSection>

      <ChoiceSheet
        visible={picker === 'mbti'}
        title="MBTI type"
        selected={draft.mbti ?? null}
        options={MBTI_TYPES.map((type) => ({
          value: type,
          label: `${type} · ${mbtiNickname(type)}`,
        }))}
        onSelect={(value) => patch({ mbti: value })}
        onClose={() => setPicker(null)}
      />

      <ChoiceSheet
        visible={picker === 'enneagram'}
        title="Enneagram type"
        selected={draft.enneagram ?? null}
        options={ENNEAGRAM_TYPES.map((type) => ({
          value: String(type.number),
          label: `${type.number} · ${type.name}`,
        }))}
        onSelect={(value) => patch({ enneagram: value })}
        onClose={() => setPicker(null)}
      />

      <ChoiceSheet
        visible={picker === 'love-primary'}
        title="Primary love language"
        selected={primaryLanguage}
        options={LOVE_LANGUAGES.map((language) => ({
          value: language,
          label: language,
        }))}
        onSelect={(value) => setLoveLanguages(value, secondaryLanguage)}
        onClose={() => setPicker(null)}
      />

      <ChoiceSheet
        visible={picker === 'love-secondary'}
        title="Secondary love language"
        selected={secondaryLanguage}
        options={LOVE_LANGUAGES.filter((language) => language !== primaryLanguage).map(
          (language) => ({ value: language, label: language })
        )}
        onSelect={(value) => setLoveLanguages(primaryLanguage, value)}
        onClose={() => setPicker(null)}
      />
    </ReadingPage>
  )
}

const styles = StyleSheet.create({
  rows: {
    paddingTop: SPACE.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.sm,
    paddingTop: SPACE.sm,
  },
  sliders: {
    gap: SPACE.md,
    paddingTop: SPACE.sm,
  },
  sheetList: {
    maxHeight: 420,
  },
  note: {
    paddingTop: SPACE.sm,
  },
})
