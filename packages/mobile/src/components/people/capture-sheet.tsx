import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker'
import { getSunSign } from '@pleiad/engine/calculations/astrology'
import { dateToKin, kinToSeal, kinToTone } from '@pleiad/engine/calculations/dreamspell'
import { getSeal } from '@pleiad/engine/data/seals'
import { getTone } from '@pleiad/engine/data/tones'
import * as Haptics from 'expo-haptics'
import { XIcon } from 'phosphor-react-native'
import { useMemo, useState } from 'react'
import { Platform, ScrollView, StyleSheet, View } from 'react-native'
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated'

import {
  BottomSheet,
  Button,
  Card,
  Chip,
  IconButton,
  Text,
  TextField,
  Touchable,
} from '@/components/m3'
import { PlaceField } from '@/components/ui/place-field'
import { formatBirthDate, formatBirthTime } from '@/lib/onboarding/draft-store'
import { TIMEZONES } from '@/lib/onboarding/timezones'
import { usePersonDraft } from '@/lib/people/draft-store'
import {
  useCreatePerson,
  useUpdatePerson,
  type PersonDraftInput,
  type PersonUpdates,
} from '@/lib/people/hooks'
import { DURATION, SHAPE, SPACE, useTheme } from '@/theme/m3'
import { FLAVORS } from '@/theme/tokens'
import { sentenceCase } from '@/lib/text'

/**
 * S7 capture sheet — the 30-second add (F3). Draft lives in a store so the
 * limit_exceeded → paywall path retains every field. Save is optimistic:
 * haptic + close immediately; rollback/paywall arrive from the hook.
 */

const WHEEL_DEFAULT_DATE = new Date(1990, 0, 1)

function defaultNoon(): Date {
  const noon = new Date()
  noon.setHours(12, 0, 0, 0)
  return noon
}

/**
 * Inline spinner on iOS; field + native dialog on Android.
 *
 * `value` is nullable and an unset value must LOOK unset. Rendering a fallback
 * date in an untouched field is a lie the form then contradicts: the field read
 * "1990-01-01" while the draft was still null, so Save failed with "we need
 * their birth date" pointing at a field that appeared filled in. The fallback
 * only seeds where the picker opens.
 */
function WheelField({
  mode,
  value,
  onChange,
  fallback,
  placeholder,
  maximumDate,
}: {
  mode: 'date' | 'time'
  value: Date | null
  onChange: (next: Date) => void
  fallback: Date
  placeholder: string
  maximumDate?: Date
}) {
  const theme = useTheme()
  const [show, setShow] = useState(false)

  if (Platform.OS === 'ios' && value !== null) {
    return (
      <DateTimePicker
        value={value}
        mode={mode}
        display="spinner"
        themeVariant={theme.dark ? 'dark' : 'light'}
        maximumDate={maximumDate}
        onChange={(_event: DateTimePickerEvent, next?: Date) => {
          if (next !== undefined) onChange(next)
        }}
      />
    )
  }

  const label =
    value === null
      ? placeholder
      : mode === 'date'
        ? formatBirthDate(value)
        : formatBirthTime(value)

  return (
    <>
      <Touchable
        onPress={() => {
          // iOS has no dialog: committing the seed swaps this field for the
          // inline spinner, which the person then scrolls.
          if (Platform.OS === 'ios') onChange(fallback)
          else setShow(true)
        }}
        radius={SHAPE.extraSmall}
        stateLayerColor={theme.colors.onSurface}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[styles.pickerField, { borderColor: theme.colors.outline }]}
      >
        <Text variant="bodyLarge" color={value === null ? 'onSurfaceVariant' : 'onSurface'}>
          {label}
        </Text>
      </Touchable>
      {show && (
        <DateTimePicker
          value={value ?? fallback}
          mode={mode}
          display="spinner"
          maximumDate={maximumDate}
          onChange={(event: DateTimePickerEvent, next?: Date) => {
            setShow(false)
            if (event.type === 'set' && next !== undefined) onChange(next)
          }}
        />
      )}
    </>
  )
}

/**
 * The wow moment — kin/seal/tone + sun sign, live on-device as the date
 * moves. Dreamspell-flavored accent, mono numerals.
 */
function PreviewChip({ birthDate }: { birthDate: Date }) {
  const reduced = useReducedMotion()
  const preview = useMemo(() => {
    const iso = formatBirthDate(birthDate)
    const kin = dateToKin(iso)
    const seal = getSeal(kinToSeal(kin))
    const tone = getTone(kinToTone(kin))
    const sun = getSunSign(iso)
    return {
      kin: Number(kin),
      line: `${sentenceCase(seal.color)} ${tone.name} ${seal.english}`,
      sun: `${sun.name} sun`,
    }
  }, [birthDate])

  return (
    <Animated.View
      key={preview.kin}
      entering={reduced ? undefined : FadeIn.duration(DURATION.medium1)}
    >
      {/* The border is the Dreamspell accent — a domain colour, not a role. */}
      <Card variant="filled" style={[styles.preview, { borderColor: FLAVORS.dreamspell.accent }]}>
        <Text variant="dataLarge">KIN {preview.kin}</Text>
        <View style={styles.previewLines}>
          <Text variant="labelMedium" color={FLAVORS.dreamspell.accentSoft} numberOfLines={1}>
            {preview.line}
          </Text>
          <Text variant="labelMedium" color="onSurfaceVariant" numberOfLines={1}>
            {preview.sun}
          </Text>
        </View>
      </Card>
    </Animated.View>
  )
}

export function CaptureSheet({
  visible,
  onClose,
  onLimitExceeded,
  editPersonId,
}: {
  visible: boolean
  onClose: () => void
  /** 403 limit_exceeded — the screen opens the paywall; draft is retained. */
  onLimitExceeded: () => void
  /** When set the sheet PATCHes this person instead of creating — S8 edit (F4). */
  editPersonId?: string
}) {
  const draft = usePersonDraft()
  const editing = editPersonId !== undefined

  const [nameError, setNameError] = useState<string | undefined>(undefined)
  const [dateError, setDateError] = useState<string | undefined>(undefined)

  // Clear the retained draft only if it still belongs to this save.
  const clearDraftFor = (personName: string) => {
    if (usePersonDraft.getState().name.trim() === personName) {
      usePersonDraft.getState().reset()
    }
  }

  /**
   * Walking away is not the same as being stopped at the paywall.
   *
   * The draft survives a *save* so a 403 doesn't cost the person their typing
   * (it clears on server success). But dismissing the sheet by hand means "never
   * mind" — keeping the draft then greets the next capture with a stranger's
   * half-filled form, which is how a person named "MayaMaya" gets created.
   */
  const dismiss = () => {
    if (!editing) usePersonDraft.getState().reset()
    setNameError(undefined)
    setDateError(undefined)
    onClose()
  }

  const create = useCreatePerson({
    onLimitExceeded,
    onServerSuccess: (person) => clearDraftFor(person.name),
  })
  const update = useUpdatePerson({
    onLimitExceeded,
    onServerSuccess: (person) => clearDraftFor(person.name),
  })

  const save = () => {
    const name = draft.name.trim()
    if (name.length === 0) {
      setNameError('Give them a name.')
      return
    }
    if (draft.birthDate === null) {
      setDateError('Set their birth date — the reading starts there.')
      return
    }

    const city = draft.city.trim()
    const country = draft.country.trim()
    const hebrewName = draft.hebrewName.trim()
    const notes = draft.notes.trim()
    const hasPlace = city.length > 0 || country.length > 0 || draft.timezone !== null

    const birthPlace = hasPlace
      ? {
          ...(city.length > 0 ? { city } : {}),
          ...(country.length > 0 ? { country } : {}),
          ...(draft.coords !== null
            ? { lat: draft.coords.lat, lng: draft.coords.lng }
            : {}),
          ...(draft.timezone !== null ? { timezone: draft.timezone } : {}),
          ...(city.length > 0 || country.length > 0
            ? { name: [city, country].filter((part) => part.length > 0).join(', ') }
            : {}),
        }
      : null

    const birthTime =
      !draft.timeUnknown && draft.birthTime !== null ? formatBirthTime(draft.birthTime) : null

    if (editPersonId !== undefined) {
      // PATCH semantics: explicit nulls clear fields the person no longer has.
      const updates: PersonUpdates = {
        name,
        birth_date: formatBirthDate(draft.birthDate),
        birth_time: birthTime,
        birth_place: birthPlace,
        hebrew_name: hebrewName.length > 0 ? hebrewName : null,
        notes: notes.length > 0 ? notes : null,
      }
      update.mutate({ id: editPersonId, updates })
    } else {
      const input: PersonDraftInput = {
        name,
        birth_date: formatBirthDate(draft.birthDate),
        ...(birthTime !== null ? { birth_time: birthTime } : {}),
        ...(birthPlace !== null ? { birth_place: birthPlace } : {}),
        ...(hebrewName.length > 0 ? { hebrew_name: hebrewName } : {}),
        ...(notes.length > 0 ? { notes } : {}),
      }
      // Optimistic: the row is already in the list; errors roll back and either
      // toast or open the paywall (never both) from the mutation hook.
      create.mutate(input)
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    onClose()
  }

  return (
    <BottomSheet visible={visible} onClose={dismiss}>
      <View style={styles.header}>
        <View style={styles.headerTitles}>
          <Text variant="labelLarge" color="primary">
            {editing ? 'Edit person' : 'New person'}
          </Text>
          <Text variant="headlineSmall">
            {editing ? 'Refine the chart.' : 'One birthday starts the reading.'}
          </Text>
        </View>
        <IconButton
          icon={(color) => <XIcon size={24} color={color} />}
          onPress={dismiss}
          accessibilityLabel="Close"
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TextField
          label="Name"
          value={draft.name}
          onChangeText={(value) => {
            draft.setName(value)
            if (nameError !== undefined && value.trim().length > 0) {
              setNameError(undefined)
            }
          }}
          supportingText="Who are they to you?"
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={200}
          error={nameError}
        />

        <View style={styles.fieldBlock}>
          <Text variant="labelLarge" color="onSurfaceVariant">
            Birth date
          </Text>
          <WheelField
            mode="date"
            value={draft.birthDate}
            fallback={WHEEL_DEFAULT_DATE}
            placeholder="Pick their birth date"
            maximumDate={new Date()}
            onChange={(next) => {
              draft.setBirthDate(next)
              setDateError(undefined)
            }}
          />
          {dateError !== undefined && (
            <Text variant="bodySmall" color="error">
              {dateError}
            </Text>
          )}
          {draft.birthDate !== null && <PreviewChip birthDate={draft.birthDate} />}
        </View>

        <View style={styles.fieldBlock}>
          <View style={styles.timeHeader}>
            <Text variant="labelLarge" color="onSurfaceVariant">
              Birth time
            </Text>
            <Chip
              variant="filter"
              label="I don't know"
              selected={draft.timeUnknown}
              onPress={() => draft.setTimeUnknown(!draft.timeUnknown)}
            />
          </View>
          {!draft.timeUnknown && (
            <>
              <WheelField
                mode="time"
                value={draft.birthTime}
                fallback={defaultNoon()}
                placeholder="Set the hour"
                onChange={draft.setBirthTime}
              />
              <Text variant="bodySmall" color="onSurfaceVariant">
                Optional — the hour draws the bodygraph.
              </Text>
            </>
          )}
        </View>

        <View style={styles.fieldBlock}>
          <PlaceField
            selected={
              draft.coords === null
                ? null
                : {
                    name: [draft.city, draft.country]
                      .filter((part) => part.length > 0)
                      .join(', '),
                    city: draft.city,
                    country: draft.country,
                    lat: draft.coords.lat,
                    lng: draft.coords.lng,
                    timezone: draft.timezone ?? 'UTC',
                  }
            }
            onSelect={(place) =>
              draft.setPlace({
                city: place.city,
                country: place.country,
                timezone: place.timezone,
                coords: { lat: place.lat, lng: place.lng },
              })
            }
            onClear={draft.clearPlace}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.timezoneRow}
          >
            {TIMEZONES.map((zone) => (
              <Chip
                key={zone.id}
                variant="filter"
                label={zone.label}
                selected={zone.id === draft.timezone}
                onPress={() =>
                  draft.setTimezone(zone.id === draft.timezone ? null : zone.id)
                }
              />
            ))}
          </ScrollView>
        </View>

        <TextField
          label="Hebrew name"
          value={draft.hebrewName}
          onChangeText={draft.setHebrewName}
          supportingText="Optional — its letters carry a number."
          autoCorrect={false}
        />

        <TextField
          label="Notes"
          value={draft.notes}
          onChangeText={draft.setNotes}
          supportingText="How you know them, what to remember"
          autoCapitalize="sentences"
        />
      </ScrollView>

      <Button fullWidth onPress={save} disabled={create.isPending || update.isPending}>
        {editing ? 'Save changes' : 'Save to your map'}
      </Button>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACE.md,
    marginBottom: SPACE.lg,
  },
  headerTitles: {
    flex: 1,
    gap: SPACE.xs,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    gap: SPACE.xl,
    paddingBottom: SPACE.xl,
  },
  fieldBlock: {
    gap: SPACE.sm,
  },
  pickerField: {
    height: 56,
    borderWidth: 1,
    paddingHorizontal: SPACE.lg,
    justifyContent: 'center',
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.lg,
    borderWidth: 1,
    marginTop: SPACE.xs,
  },
  previewLines: {
    flex: 1,
    gap: 2,
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timezoneRow: {
    gap: SPACE.sm,
    paddingVertical: 2,
  },
})
