import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker'
import type { Profile, ProfileUpdateInput } from '@pleiad/api-client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import { CaretLeftIcon, CheckIcon } from 'phosphor-react-native'
import { useMemo, useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native'
import Animated, {
  FadeIn,
  FadeInLeft,
  FadeInRight,
  FadeOut,
  useReducedMotion,
} from 'react-native-reanimated'
import { Image } from 'expo-image'
import { SafeAreaView } from 'react-native-safe-area-context'

import {
  Button,
  IconButton,
  LinearProgress,
  ListItem,
  Text,
  TextField,
  Touchable,
} from '@/components/m3'
import { PlaceField } from '@/components/ui/place-field'
import { api } from '@/lib/api'
import {
  ONBOARDING_STEP_COUNT,
  formatBirthDate,
  formatBirthTime,
  useOnboardingDraft,
} from '@/lib/onboarding/draft-store'
import { TIMEZONES } from '@/lib/onboarding/timezones'
import { DURATION, SHAPE, SPACE, useTheme } from '@/theme/m3'

/**
 * S4 onboarding ritual — USER_FLOWS F2. Five paged steps in one screen;
 * centered content is the sanctioned exception (DESIGN_LANGUAGE §4).
 * Each step is painted on the mural of the system it unlocks — a very
 * faint full-bleed backdrop scrimmed into the background so the type ramp holds.
 */

const DEFAULT_BIRTH_DATE = new Date(1990, 0, 1)

/**
 * Per-step ritual backdrop — the mural of the system each answer unlocks:
 * name → hero sky, date → Dreamspell, hour → Human Design (the bodygraph),
 * place → Astrology (rising sign and houses), Hebrew name → Kabbalah.
 */
const STEP_MURALS = [
  require('../../../assets/mural/hero-sky.webp'),
  require('../../../assets/mural/zone-dreamspell.webp'),
  require('../../../assets/mural/zone-human-design.webp'),
  require('../../../assets/mural/zone-astrology.webp'),
  require('../../../assets/mural/zone-gematria.webp'),
] as const

function defaultNoon(): Date {
  const noon = new Date()
  noon.setHours(12, 0, 0, 0)
  return noon
}

const STEP_META: ReadonlyArray<{ eyebrow: string; title: string; helper: string }> = [
  {
    eyebrow: 'Step 1 · You',
    title: 'What should we call you?',
    helper: 'Your name sits at the center of the map.',
  },
  {
    eyebrow: 'Step 2 · Dreamspell',
    title: 'When were you born?',
    helper: 'One date unlocks your kin, seal, and tone.',
  },
  {
    eyebrow: 'Step 3 · Human Design',
    title: 'What time of day?',
    helper: 'The birth hour draws your bodygraph. Honest answer only — skipping is fine.',
  },
  {
    eyebrow: 'Step 4 · Astrology',
    title: 'Where were you born?',
    helper: 'Place sharpens your rising sign and houses.',
  },
  {
    eyebrow: 'Step 5 · Kabbalah',
    title: 'Do you carry a Hebrew name?',
    helper: 'Its letters carry a number. We read both.',
  },
]

/** Inline on iOS; field + native dialog on Android. Spinner style. */
function WheelPicker({
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
      {/* The unanswered state of a wheel — an M3 field that opens the picker. */}
      <Touchable
        onPress={() => {
          if (Platform.OS === 'ios') onChange(fallback)
          else setShow(true)
        }}
        radius={SHAPE.extraSmall}
        stateLayerColor={theme.colors.onSurface}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[styles.pickerField, { borderColor: theme.colors.outline }]}
      >
        <Text
          variant="bodyLarge"
          color={value === null ? 'onSurfaceVariant' : 'onSurface'}
        >
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

function TimezoneList({
  selected,
  onSelect,
}: {
  selected: string | null
  onSelect: (id: string | null) => void
}) {
  const theme = useTheme()

  return (
    <View style={styles.timezoneBlock}>
      <Text variant="labelLarge" color="onSurfaceVariant">
        Timezone
      </Text>
      <ScrollView
        style={[styles.timezoneList, { borderColor: theme.colors.outline }]}
        nestedScrollEnabled
      >
        {TIMEZONES.map((zone) => {
          const active = zone.id === selected
          return (
            <View
              key={zone.id}
              style={active && { backgroundColor: theme.colors.secondaryContainer }}
            >
              <ListItem
                headline={zone.label}
                onPress={() => onSelect(active ? null : zone.id)}
                accessibilityLabel={zone.label}
                trailing={
                  <View style={styles.timezoneTrailing}>
                    {/* The check, not the fill, is what a colour-blind user reads. */}
                    {active && <CheckIcon size={18} color={theme.colors.onSecondaryContainer} />}
                    <Text variant="dataSmall" color="onSurfaceVariant">
                      {zone.id}
                    </Text>
                  </View>
                }
              />
            </View>
          )
        })}
      </ScrollView>
    </View>
  )
}

export default function OnboardingScreen() {
  const router = useRouter()
  const theme = useTheme()
  const queryClient = useQueryClient()
  const reduced = useReducedMotion()
  const draft = useOnboardingDraft()

  const [direction, setDirection] = useState<1 | -1>(1)
  const [nameError, setNameError] = useState<string | null>(null)

  // Local wheel values — committed to the draft on Continue. Null means the
  // person has not answered yet, which is NOT the same as the default that
  // happens to be showing: committing an untouched wheel silently wrote
  // 1990-01-01 as a real birthday, and every reading downstream believed it.
  const [dateValue, setDateValue] = useState<Date | null>(draft.birthDate)
  const [timeValue, setTimeValue] = useState<Date | null>(draft.birthTime)
  const [dateError, setDateError] = useState<string | null>(null)

  const step = draft.step
  const meta = STEP_META[step] ?? STEP_META[0]
  const isLast = step === ONBOARDING_STEP_COUNT - 1

  const finish = useMutation({
    mutationFn: (input: ProfileUpdateInput) => api.profile.update(input),
    onSuccess: (profile: Profile) => {
      queryClient.setQueryData(['profile'], profile)
      void queryClient.invalidateQueries({ queryKey: ['profile'] })
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      draft.reset()
      router.replace('/')
    },
  })

  const goTo = (next: number, dir: 1 | -1) => {
    setDirection(dir)
    draft.setStep(next)
  }

  const submit = () => {
    const displayName = draft.displayName.trim()
    const city = draft.birthCity.trim()
    const country = draft.birthCountry.trim()
    const hebrewName = draft.hebrewName.trim()
    const hasPlace = city.length > 0 || country.length > 0 || draft.birthTimezone !== null

    const input: ProfileUpdateInput = {
      display_name: displayName,
      birth_date: formatBirthDate(draft.birthDate ?? dateValue ?? DEFAULT_BIRTH_DATE),
      ...(draft.birthTime !== null ? { birth_time: formatBirthTime(draft.birthTime) } : {}),
      ...(hasPlace
        ? {
            birth_place: {
              ...(city.length > 0 ? { city } : {}),
              ...(country.length > 0 ? { country } : {}),
              ...(draft.birthCoords !== null
                ? { lat: draft.birthCoords.lat, lng: draft.birthCoords.lng }
                : {}),
              ...(draft.birthTimezone !== null ? { timezone: draft.birthTimezone } : {}),
              ...(city.length > 0 || country.length > 0
                ? { name: [city, country].filter((part) => part.length > 0).join(', ') }
                : {}),
            },
          }
        : {}),
      ...(hebrewName.length > 0 ? { hebrew_name: hebrewName } : {}),
      onboarding_completed: true,
    }
    finish.mutate(input)
  }

  const handleContinue = () => {
    switch (step) {
      case 0: {
        if (draft.displayName.trim().length === 0) {
          setNameError('Enter a name to continue.')
          return
        }
        setNameError(null)
        goTo(1, 1)
        return
      }
      case 1: {
        if (dateValue === null) {
          setDateError('Pick your birth date — the whole reading starts there.')
          return
        }
        setDateError(null)
        draft.setBirthDate(dateValue)
        goTo(2, 1)
        return
      }
      case 2: {
        // The hour is optional and skippable. Untouched means unknown — the
        // engine suppresses Moon/houses rather than guessing at noon.
        draft.setBirthTime(timeValue)
        goTo(3, 1)
        return
      }
      case 3: {
        goTo(4, 1)
        return
      }
      default:
        submit()
    }
  }

  const handleSkip = () => {
    switch (step) {
      case 2: {
        draft.setBirthTime(null)
        goTo(3, 1)
        return
      }
      case 3: {
        draft.setBirthCity('')
        draft.setBirthCountry('')
        draft.setBirthTimezone(null)
        goTo(4, 1)
        return
      }
      default: {
        // Last step: skipping the Hebrew name still finishes the ritual.
        draft.setHebrewName('')
        submit()
      }
    }
  }

  const handleBack = () => {
    if (step === 0 || finish.isPending) return
    goTo(step - 1, -1)
  }

  const entering = useMemo(() => {
    if (reduced) return undefined
    return (direction === 1 ? FadeInRight : FadeInLeft).duration(DURATION.medium4)
  }, [direction, reduced])
  const exiting = reduced ? undefined : FadeOut.duration(DURATION.short4)

  const skippable = step >= 2
  const skipLabel = step === 2 ? "I don't know" : 'Skip for now'
  const continueLabel = isLast
    ? finish.isPending
      ? 'Weaving your chart…'
      : 'Finish'
    : 'Continue'

  return (
    <View style={styles.root}>
      <Animated.View
        key={`mural-${step}`}
        entering={reduced ? undefined : FadeIn.duration(DURATION.long2)}
        exiting={reduced ? undefined : FadeOut.duration(DURATION.long2)}
        style={styles.muralHost}
      >
        <Image
          source={STEP_MURALS[step] ?? STEP_MURALS[0]}
          contentFit="cover"
          style={styles.mural}
          accessible={false}
        />
        {/* A veil in the background role, so the type ramp keeps its contrast. */}
        <View
          style={[styles.muralScrim, { backgroundColor: theme.colors.background }]}
        />
      </Animated.View>
      <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <View style={step === 0 && styles.backHidden}>
            <IconButton
              icon={(color) => <CaretLeftIcon size={24} color={color} />}
              onPress={handleBack}
              disabled={step === 0 || finish.isPending}
              accessibilityLabel="Back"
            />
          </View>
          <LinearProgress
            progress={(step + 1) / ONBOARDING_STEP_COUNT}
            style={styles.progress}
            accessibilityLabel={`Step ${step + 1} of ${ONBOARDING_STEP_COUNT}`}
          />
          <Text variant="dataSmall" color="onSurfaceVariant">
            {step + 1}/{ONBOARDING_STEP_COUNT}
          </Text>
        </View>

        <Animated.View
          key={step}
          entering={entering}
          exiting={exiting}
          style={styles.stepBody}
        >
          <Text variant="labelLarge" color="primary" style={styles.centered}>
            {meta.eyebrow}
          </Text>
          <Text
            variant="headlineMedium"
            color="onSurface"
            style={[styles.centered, styles.title]}
          >
            {meta.title}
          </Text>
          <Text variant="bodyMedium" color="onSurfaceVariant" style={styles.centered}>
            {meta.helper}
          </Text>

          <View style={styles.fieldArea}>
            {step === 0 && (
              <TextField
                label="Your name"
                supportingText="The name people know you by"
                value={draft.displayName}
                onChangeText={(value) => {
                  draft.setDisplayName(value)
                  if (nameError !== null && value.trim().length > 0) setNameError(null)
                }}
                autoFocus
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                maxLength={200}
                onSubmitEditing={handleContinue}
                error={nameError ?? undefined}
              />
            )}

            {step === 1 && (
              <>
                <WheelPicker
                  mode="date"
                  value={dateValue}
                  fallback={DEFAULT_BIRTH_DATE}
                  placeholder="Pick your birth date"
                  onChange={(next) => {
                    setDateValue(next)
                    setDateError(null)
                  }}
                  maximumDate={new Date()}
                />
                {dateError !== null && (
                  <Text variant="bodySmall" color="error">
                    {dateError}
                  </Text>
                )}
              </>
            )}

            {step === 2 && (
              <WheelPicker
                mode="time"
                value={timeValue}
                fallback={defaultNoon()}
                placeholder="Set the hour"
                onChange={setTimeValue}
              />
            )}

            {step === 3 && (
              <View style={styles.placeFields}>
                <PlaceField
                  selected={
                    draft.birthCoords === null
                      ? null
                      : {
                          name: [draft.birthCity, draft.birthCountry]
                            .filter((part) => part.length > 0)
                            .join(', '),
                          city: draft.birthCity,
                          country: draft.birthCountry,
                          lat: draft.birthCoords.lat,
                          lng: draft.birthCoords.lng,
                          timezone: draft.birthTimezone ?? 'UTC',
                        }
                  }
                  onSelect={(place) =>
                    draft.setBirthPlace({
                      city: place.city,
                      country: place.country,
                      timezone: place.timezone,
                      coords: { lat: place.lat, lng: place.lng },
                    })
                  }
                  onClear={draft.clearBirthPlace}
                />
                <TimezoneList
                  selected={draft.birthTimezone}
                  onSelect={draft.setBirthTimezone}
                />
              </View>
            )}

            {step === 4 && (
              <TextField
                label="Hebrew name"
                supportingText="שם עברי"
                value={draft.hebrewName}
                onChangeText={draft.setHebrewName}
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleContinue}
              />
            )}
          </View>
        </Animated.View>

        <View style={styles.footer}>
          {finish.isError && (
            <Text variant="bodySmall" color="error" style={styles.centered}>
              {finish.error instanceof Error
                ? finish.error.message
                : 'Something went wrong. Try again.'}
            </Text>
          )}
          <Button fullWidth onPress={handleContinue} disabled={finish.isPending}>
            {continueLabel}
          </Button>
          {skippable && (
            <Button
              fullWidth
              variant="text"
              onPress={handleSkip}
              disabled={finish.isPending}
            >
              {skipLabel}
            </Button>
          )}
        </View>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  /** Full-bleed backdrop layer — crossfades per step, never catches touches. */
  muralHost: {
    ...StyleSheet.absoluteFill,
    pointerEvents: 'none',
  },
  /** VERY faint — the mural is atmosphere, not content. */
  mural: {
    ...StyleSheet.absoluteFill,
    opacity: 0.28,
  },
  muralScrim: {
    ...StyleSheet.absoluteFill,
    opacity: 0.55,
  },
  screen: {
    flex: 1,
    paddingHorizontal: SPACE.margin,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    paddingVertical: SPACE.sm,
  },
  backHidden: {
    opacity: 0,
  },
  progress: {
    flex: 1,
  },
  stepBody: {
    flex: 1,
    justifyContent: 'center',
    gap: SPACE.sm,
  },
  centered: {
    textAlign: 'center',
  },
  title: {
    marginTop: SPACE.xs,
  },
  fieldArea: {
    marginTop: SPACE.xxl,
    gap: SPACE.sm,
  },
  placeFields: {
    gap: SPACE.lg,
  },
  pickerField: {
    height: 56,
    borderWidth: 1,
    borderRadius: SHAPE.extraSmall,
    paddingHorizontal: SPACE.lg,
    justifyContent: 'center',
  },
  timezoneBlock: {
    gap: SPACE.sm,
  },
  timezoneList: {
    maxHeight: 176,
    borderWidth: 1,
    borderRadius: SHAPE.extraSmall,
  },
  timezoneTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  footer: {
    gap: SPACE.sm,
    paddingBottom: SPACE.lg,
  },
})
