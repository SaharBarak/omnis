import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker'
import type { Profile, ProfileUpdateInput } from '@pleiad/api-client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import { CaretLeftIcon } from 'phosphor-react-native'
import { useEffect, useMemo, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import Animated, {
  FadeInLeft,
  FadeInRight,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Button } from '@/components/ui/primitives'
import { TextField } from '@/components/ui/text-field'
import { api } from '@/lib/api'
import {
  ONBOARDING_STEP_COUNT,
  formatBirthDate,
  formatBirthTime,
  useOnboardingDraft,
} from '@/lib/onboarding/draft-store'
import { TIMEZONES } from '@/lib/onboarding/timezones'
import { COLORS, DURATION, RADII, SPACE, SPRING, TYPE } from '@/theme/tokens'

/**
 * S4 onboarding ritual — USER_FLOWS F2. Five paged steps in one screen;
 * centered content is the sanctioned exception (DESIGN_LANGUAGE §6).
 * TODO(asset bundle): paint each step on its system mural backdrop.
 */

const DEFAULT_BIRTH_DATE = new Date(1990, 0, 1)

function defaultNoon(): Date {
  const noon = new Date()
  noon.setHours(12, 0, 0, 0)
  return noon
}

const STEP_META: ReadonlyArray<{ eyebrow: string; title: string; helper: string }> = [
  {
    eyebrow: 'STEP 1 · YOU',
    title: 'What should we call you?',
    helper: 'Your name sits at the center of the map.',
  },
  {
    eyebrow: 'STEP 2 · DREAMSPELL',
    title: 'When were you born?',
    helper: 'One date unlocks your kin, seal, and tone.',
  },
  {
    eyebrow: 'STEP 3 · HUMAN DESIGN',
    title: 'What time of day?',
    helper: 'The birth hour draws your bodygraph. Honest answer only — skipping is fine.',
  },
  {
    eyebrow: 'STEP 4 · ASTROLOGY',
    title: 'Where were you born?',
    helper: 'Place sharpens your rising sign and houses.',
  },
  {
    eyebrow: 'STEP 5 · KABBALAH',
    title: 'Do you carry a Hebrew name?',
    helper: 'Its letters carry a number. We read both.',
  },
]

/** Inline on iOS; field + native dialog on Android. Spinner style, dark. */
function WheelPicker({
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

  const label =
    mode === 'date'
      ? formatBirthDate(value)
      : formatBirthTime(value)
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

function TimezoneList({
  selected,
  onSelect,
}: {
  selected: string | null
  onSelect: (id: string | null) => void
}) {
  return (
    <View style={styles.timezoneBlock}>
      <Text style={TYPE.eyebrow}>TIMEZONE</Text>
      <ScrollView
        style={styles.timezoneList}
        contentContainerStyle={styles.timezoneListContent}
        nestedScrollEnabled
      >
        {TIMEZONES.map((zone) => {
          const active = zone.id === selected
          return (
            <Pressable
              key={zone.id}
              onPress={() => onSelect(active ? null : zone.id)}
              style={[styles.timezoneRow, active && styles.timezoneRowActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.timezoneLabel, active && styles.timezoneLabelActive]}>
                {zone.label}
              </Text>
              <Text style={styles.timezoneId}>{zone.id}</Text>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}

export default function OnboardingScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const reduced = useReducedMotion()
  const draft = useOnboardingDraft()

  const [direction, setDirection] = useState<1 | -1>(1)
  const [nameError, setNameError] = useState<string | null>(null)

  // Local wheel values — committed to the draft on Continue.
  const [dateValue, setDateValue] = useState<Date>(draft.birthDate ?? DEFAULT_BIRTH_DATE)
  const [timeValue, setTimeValue] = useState<Date>(draft.birthTime ?? defaultNoon())

  const step = draft.step
  const meta = STEP_META[step] ?? STEP_META[0]
  const isLast = step === ONBOARDING_STEP_COUNT - 1

  // Progress hairline — springs to (step+1)/5, scaleX from the left edge.
  const progress = useSharedValue((step + 1) / ONBOARDING_STEP_COUNT)
  useEffect(() => {
    const target = (step + 1) / ONBOARDING_STEP_COUNT
    progress.value = reduced ? target : withSpring(target, SPRING)
  }, [step, reduced, progress])
  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
  }))

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
      birth_date: formatBirthDate(draft.birthDate ?? dateValue),
      ...(draft.birthTime !== null ? { birth_time: formatBirthTime(draft.birthTime) } : {}),
      ...(hasPlace
        ? {
            birth_place: {
              ...(city.length > 0 ? { city } : {}),
              ...(country.length > 0 ? { country } : {}),
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
        draft.setBirthDate(dateValue)
        goTo(2, 1)
        return
      }
      case 2: {
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
    return (direction === 1 ? FadeInRight : FadeInLeft).duration(DURATION.slow)
  }, [direction, reduced])
  const exiting = reduced ? undefined : FadeOut.duration(DURATION.fast)

  const skippable = step >= 2
  const skipLabel = step === 2 ? "I don't know" : 'Skip for now'
  const continueLabel = isLast
    ? finish.isPending
      ? 'Weaving your chart…'
      : 'Finish'
    : 'Continue'

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable
            onPress={handleBack}
            disabled={step === 0 || finish.isPending}
            style={[styles.backButton, step === 0 && styles.backHidden]}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <CaretLeftIcon size={20} color={COLORS.text70} />
          </Pressable>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, progressStyle]} />
          </View>
          <Text style={styles.stepCounter}>
            {step + 1}/{ONBOARDING_STEP_COUNT}
          </Text>
        </View>

        <Animated.View
          key={step}
          entering={entering}
          exiting={exiting}
          style={styles.stepBody}
        >
          <Text style={[TYPE.eyebrow, styles.centered]}>{meta.eyebrow}</Text>
          <Text style={[TYPE.zone, styles.centered, styles.title]}>{meta.title}</Text>
          <Text style={[TYPE.bodySm, styles.centered, styles.helper]}>{meta.helper}</Text>

          <View style={styles.fieldArea}>
            {step === 0 && (
              <TextField
                label="YOUR NAME"
                value={draft.displayName}
                onChangeText={(value) => {
                  draft.setDisplayName(value)
                  if (nameError !== null && value.trim().length > 0) setNameError(null)
                }}
                placeholder="The name people know you by"
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
              <WheelPicker
                mode="date"
                value={dateValue}
                onChange={setDateValue}
                maximumDate={new Date()}
              />
            )}

            {step === 2 && (
              <WheelPicker mode="time" value={timeValue} onChange={setTimeValue} />
            )}

            {step === 3 && (
              <View style={styles.placeFields}>
                <TextField
                  label="CITY"
                  value={draft.birthCity}
                  onChangeText={draft.setBirthCity}
                  placeholder="Haifa"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                <TextField
                  label="COUNTRY"
                  value={draft.birthCountry}
                  onChangeText={draft.setBirthCountry}
                  placeholder="Israel"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                <TimezoneList
                  selected={draft.birthTimezone}
                  onSelect={draft.setBirthTimezone}
                />
              </View>
            )}

            {step === 4 && (
              <TextField
                label="HEBREW NAME"
                value={draft.hebrewName}
                onChangeText={draft.setHebrewName}
                placeholder="שם עברי"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleContinue}
              />
            )}
          </View>
        </Animated.View>

        <View style={styles.footer}>
          {finish.isError && (
            <Text style={styles.finishError}>
              {finish.error instanceof Error
                ? finish.error.message
                : 'Something went wrong. Try again.'}
            </Text>
          )}
          <Button onPress={handleContinue} disabled={finish.isPending}>
            {continueLabel}
          </Button>
          {skippable && (
            <Button variant="secondary" onPress={handleSkip} disabled={finish.isPending}>
              {skipLabel}
            </Button>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: SPACE.gutter,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backHidden: {
    opacity: 0,
  },
  progressTrack: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.border,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: 2,
    width: '100%',
    backgroundColor: COLORS.brand,
    transformOrigin: 'left',
  },
  stepCounter: {
    ...TYPE.statLabel,
  },
  stepBody: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  centered: {
    textAlign: 'center',
  },
  title: {
    marginTop: SPACE.unit,
  },
  helper: {
    color: COLORS.text50,
  },
  fieldArea: {
    marginTop: SPACE.section,
  },
  placeFields: {
    gap: SPACE.cardPad,
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
  timezoneBlock: {
    gap: 8,
  },
  timezoneList: {
    maxHeight: 176,
    borderRadius: RADII.input,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface2,
  },
  timezoneListContent: {
    paddingVertical: 4,
  },
  timezoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  timezoneRowActive: {
    backgroundColor: COLORS.surface,
  },
  timezoneLabel: {
    ...TYPE.bodySm,
    color: COLORS.text70,
  },
  timezoneLabelActive: {
    color: COLORS.text90,
  },
  timezoneId: {
    ...TYPE.statLabel,
    textTransform: 'none',
    letterSpacing: 0,
  },
  footer: {
    gap: 12,
    paddingBottom: SPACE.cardPad,
  },
  finishError: {
    ...TYPE.bodySm,
    color: COLORS.destructive,
    textAlign: 'center',
  },
})
