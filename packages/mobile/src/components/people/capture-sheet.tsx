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
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import Animated, {
  FadeIn,
  SlideInDown,
  useReducedMotion,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button, Eyebrow } from '@/components/ui/primitives'
import { TextField } from '@/components/ui/text-field'
import { formatBirthDate, formatBirthTime } from '@/lib/onboarding/draft-store'
import { TIMEZONES } from '@/lib/onboarding/timezones'
import { usePersonDraft } from '@/lib/people/draft-store'
import {
  useCreatePerson,
  useUpdatePerson,
  type PersonDraftInput,
  type PersonUpdates,
} from '@/lib/people/hooks'
import { COLORS, DURATION, FLAVORS, FONTS, RADII, SPACE, SPRING, TYPE } from '@/theme/tokens'

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

/** Inline spinner on iOS; field + native dialog on Android. */
function WheelField({
  mode,
  value,
  onChange,
  maximumDate,
}: {
  mode: 'date' | 'time'
  value: Date
  onChange: (next: Date) => void
  maximumDate?: Date
}) {
  const [show, setShow] = useState(false)

  if (Platform.OS === 'ios') {
    return (
      <DateTimePicker
        value={value}
        mode={mode}
        display="spinner"
        themeVariant="dark"
        maximumDate={maximumDate}
        onChange={(_event: DateTimePickerEvent, next?: Date) => {
          if (next !== undefined) onChange(next)
        }}
      />
    )
  }

  const label = mode === 'date' ? formatBirthDate(value) : formatBirthTime(value)
  return (
    <>
      <Pressable
        onPress={() => setShow(true)}
        style={styles.pickerField}
        accessibilityRole="button"
      >
        <Text style={styles.pickerFieldText}>{label}</Text>
      </Pressable>
      {show && (
        <DateTimePicker
          value={value}
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
      line: `${seal.color} ${tone.name} ${seal.english}`.toUpperCase(),
      sun: `${sun.name} SUN`.toUpperCase(),
    }
  }, [birthDate])

  return (
    <Animated.View
      key={preview.kin}
      entering={reduced ? undefined : FadeIn.duration(DURATION.normal)}
      style={styles.previewChip}
    >
      <Text style={styles.previewKin}>KIN {preview.kin}</Text>
      <View style={styles.previewLines}>
        <Text style={styles.previewLine}>{preview.line}</Text>
        <Text style={styles.previewSun}>{preview.sun}</Text>
      </View>
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
  const reduced = useReducedMotion()
  const insets = useSafeAreaInsets()
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
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View
          entering={reduced ? undefined : FadeIn.duration(DURATION.normal)}
          style={StyleSheet.absoluteFill}
        >
          <Pressable
            style={[StyleSheet.absoluteFill, styles.scrim]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
          />
        </Animated.View>

        <Animated.View
          entering={
            reduced
              ? undefined
              : SlideInDown.springify().damping(SPRING.damping).stiffness(SPRING.stiffness)
          }
          style={[styles.sheet, { paddingBottom: insets.bottom + SPACE.cardPad }]}
        >
          <View style={styles.header}>
            <View style={styles.headerTitles}>
              <Eyebrow color={FLAVORS.dreamspell.accentSoft}>
                {editing ? 'EDIT PERSON' : 'NEW PERSON'}
              </Eyebrow>
              <Text style={TYPE.section}>
                {editing ? 'Refine the chart.' : 'One birthday starts the reading.'}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <XIcon size={20} color={COLORS.text50} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TextField
              label="NAME"
              value={draft.name}
              onChangeText={(value) => {
                draft.setName(value)
                if (nameError !== undefined && value.trim().length > 0) {
                  setNameError(undefined)
                }
              }}
              placeholder="Who are they to you?"
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={200}
              error={nameError}
            />

            <View style={styles.fieldBlock}>
              <Text style={TYPE.eyebrow}>BIRTH DATE</Text>
              <WheelField
                mode="date"
                value={draft.birthDate ?? WHEEL_DEFAULT_DATE}
                maximumDate={new Date()}
                onChange={(next) => {
                  draft.setBirthDate(next)
                  setDateError(undefined)
                }}
              />
              {dateError !== undefined && <Text style={styles.fieldError}>{dateError}</Text>}
              {draft.birthDate !== null && <PreviewChip birthDate={draft.birthDate} />}
            </View>

            <View style={styles.fieldBlock}>
              <View style={styles.timeHeader}>
                <Text style={TYPE.eyebrow}>BIRTH TIME</Text>
                <Pressable
                  onPress={() => draft.setTimeUnknown(!draft.timeUnknown)}
                  style={[styles.unknownChip, draft.timeUnknown && styles.unknownChipActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: draft.timeUnknown }}
                >
                  <Text
                    style={[
                      styles.unknownChipText,
                      draft.timeUnknown && styles.unknownChipTextActive,
                    ]}
                  >
                    I don't know
                  </Text>
                </Pressable>
              </View>
              {!draft.timeUnknown && (
                <>
                  <WheelField
                    mode="time"
                    value={draft.birthTime ?? defaultNoon()}
                    onChange={draft.setBirthTime}
                  />
                  <Text style={styles.helper}>Optional — the hour draws the bodygraph.</Text>
                </>
              )}
            </View>

            <View style={styles.fieldBlock}>
              <Text style={TYPE.eyebrow}>BIRTH PLACE</Text>
              <View style={styles.placeRow}>
                <TextField
                  label="CITY"
                  value={draft.city}
                  onChangeText={draft.setCity}
                  placeholder="Haifa"
                  autoCapitalize="words"
                  autoCorrect={false}
                  style={styles.placeField}
                />
                <TextField
                  label="COUNTRY"
                  value={draft.country}
                  onChangeText={draft.setCountry}
                  placeholder="Israel"
                  autoCapitalize="words"
                  autoCorrect={false}
                  style={styles.placeField}
                />
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.timezoneRow}
              >
                {TIMEZONES.map((zone) => {
                  const active = zone.id === draft.timezone
                  return (
                    <Pressable
                      key={zone.id}
                      onPress={() => draft.setTimezone(active ? null : zone.id)}
                      style={[styles.zoneChip, active && styles.zoneChipActive]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={[styles.zoneChipText, active && styles.zoneChipTextActive]}>
                        {zone.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </ScrollView>
            </View>

            <TextField
              label="HEBREW NAME"
              value={draft.hebrewName}
              onChangeText={draft.setHebrewName}
              placeholder="שם עברי"
              autoCorrect={false}
              helper="Optional — its letters carry a number."
            />

            <TextField
              label="NOTES"
              value={draft.notes}
              onChangeText={draft.setNotes}
              placeholder="How you know them, what to remember"
              autoCapitalize="sentences"
            />
          </ScrollView>

          <Button onPress={save} disabled={create.isPending || update.isPending}>
            {editing ? 'Save changes' : 'Save to your map'}
          </Button>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    backgroundColor: 'rgba(11,13,22,0.72)',
  },
  sheet: {
    maxHeight: '90%',
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADII.feature,
    borderTopRightRadius: RADII.feature,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACE.featurePad,
    paddingTop: SPACE.featurePad,
    gap: SPACE.cardPad,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTitles: {
    flex: 1,
    gap: 6,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    gap: SPACE.cardPad,
    paddingBottom: SPACE.unit,
  },
  fieldBlock: {
    gap: 8,
  },
  fieldError: {
    ...TYPE.bodySm,
    color: COLORS.destructive,
  },
  helper: {
    ...TYPE.bodySm,
    color: COLORS.text50,
  },
  pickerField: {
    height: 52,
    borderRadius: RADII.input,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface2,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  pickerFieldText: {
    ...TYPE.stat,
    fontSize: 18,
    lineHeight: 24,
  },
  previewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.cardPad,
    marginTop: SPACE.unit,
    paddingHorizontal: SPACE.cardPad,
    paddingVertical: 14,
    borderRadius: RADII.panel,
    borderWidth: 1,
    borderColor: FLAVORS.dreamspell.accent,
    backgroundColor: COLORS.surface2,
  },
  previewKin: {
    ...TYPE.stat,
    fontSize: 24,
    lineHeight: 28,
  },
  previewLines: {
    flex: 1,
    gap: 2,
  },
  previewLine: {
    ...TYPE.eyebrow,
    color: FLAVORS.dreamspell.accentSoft,
  },
  previewSun: {
    ...TYPE.eyebrow,
    color: COLORS.text50,
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unknownChip: {
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  unknownChipActive: {
    borderColor: COLORS.brandSoft,
  },
  unknownChipText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.text50,
  },
  unknownChipTextActive: {
    color: COLORS.brandSoft,
  },
  placeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  placeField: {
    flex: 1,
  },
  timezoneRow: {
    gap: 8,
    paddingVertical: 2,
  },
  zoneChip: {
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  zoneChipActive: {
    borderColor: COLORS.brand,
    backgroundColor: COLORS.surface2,
  },
  zoneChipText: {
    ...TYPE.bodySm,
    color: COLORS.text50,
  },
  zoneChipTextActive: {
    color: COLORS.text90,
  },
})
