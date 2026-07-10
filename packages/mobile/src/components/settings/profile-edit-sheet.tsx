import type { Profile } from '@pleiad/api-client'
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { XIcon } from 'phosphor-react-native'
import { useEffect, useState } from 'react'
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
import Animated, { FadeIn, SlideInDown, useReducedMotion } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button, Eyebrow } from '@/components/ui/primitives'
import { TextField } from '@/components/ui/text-field'
import { api } from '@/lib/api'
import { formatBirthDate, formatBirthTime } from '@/lib/onboarding/draft-store'
import { PEOPLE_QUERY_KEY } from '@/lib/people/hooks'
import { showToast } from '@/lib/toast'
import { COLORS, DURATION, RADII, SPACE, SPRING, TYPE } from '@/theme/tokens'

/**
 * F12 profile edit — a minimal fields sheet over PATCH /api/profile. The
 * server mirrors the self person, so both ['profile'] and ['people'] refresh
 * after a save.
 */

const WHEEL_DEFAULT_DATE = new Date(1990, 0, 1)

function defaultNoon(): Date {
  const noon = new Date()
  noon.setHours(12, 0, 0, 0)
  return noon
}

function parseDate(isoDate: string | null): Date | null {
  if (isoDate === null) return null
  const [year, month, day] = isoDate.split('-').map(Number)
  if (year === undefined || month === undefined || day === undefined) return null
  return new Date(year, month - 1, day)
}

function parseTime(time: string | null): Date | null {
  if (time === null) return null
  const [hours, minutes] = time.split(':').map(Number)
  if (hours === undefined || minutes === undefined) return null
  const value = defaultNoon()
  value.setHours(hours, minutes, 0, 0)
  return value
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

  return (
    <>
      <Pressable
        onPress={() => setShow(true)}
        style={styles.wheelValueField}
        accessibilityRole="button"
        accessibilityLabel={mode === 'date' ? 'Pick a date' : 'Pick a time'}
      >
        <Text style={styles.wheelValueText}>
          {mode === 'date' ? formatBirthDate(value) : formatBirthTime(value)}
        </Text>
      </Pressable>
      {show && (
        <DateTimePicker
          value={value}
          mode={mode}
          maximumDate={maximumDate}
          onChange={(_event: DateTimePickerEvent, next?: Date) => {
            setShow(false)
            if (next !== undefined) onChange(next)
          }}
        />
      )}
    </>
  )
}

export function ProfileEditSheet({
  visible,
  onClose,
  profile,
}: {
  visible: boolean
  onClose: () => void
  profile: Profile
}) {
  const reduced = useReducedMotion()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()

  const [displayName, setDisplayName] = useState('')
  const [hebrewName, setHebrewName] = useState('')
  const [birthDate, setBirthDate] = useState<Date>(WHEEL_DEFAULT_DATE)
  const [birthTime, setBirthTime] = useState<Date>(defaultNoon())
  const [timeUnknown, setTimeUnknown] = useState(true)
  const [nameError, setNameError] = useState<string | undefined>(undefined)

  // Re-seed from the profile every time the sheet opens.
  useEffect(() => {
    if (!visible) return
    setDisplayName(profile.display_name)
    setHebrewName(profile.hebrew_name ?? '')
    setBirthDate(parseDate(profile.birth_date) ?? WHEEL_DEFAULT_DATE)
    const time = parseTime(profile.birth_time)
    setBirthTime(time ?? defaultNoon())
    setTimeUnknown(time === null)
    setNameError(undefined)
  }, [visible, profile])

  const mutation = useMutation({
    mutationFn: () =>
      api.profile.update({
        display_name: displayName.trim(),
        hebrew_name: hebrewName.trim().length > 0 ? hebrewName.trim() : null,
        birth_date: formatBirthDate(birthDate),
        birth_time: timeUnknown ? null : formatBirthTime(birthTime),
      }),
    onSuccess: (profileNext) => {
      queryClient.setQueryData(['profile'], profileNext)
      void queryClient.invalidateQueries({ queryKey: ['profile'] })
      // The server mirrors the self person — its reading may have changed.
      void queryClient.invalidateQueries({ queryKey: PEOPLE_QUERY_KEY })
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      showToast('Profile updated.')
      onClose()
    },
    onError: () => {
      showToast("The change didn't hold. Try again.")
    },
  })

  const save = () => {
    if (displayName.trim().length === 0) {
      setNameError('A name keeps the map yours.')
      return
    }
    setNameError(undefined)
    mutation.mutate()
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
            <Eyebrow color={COLORS.brandSoft}>EDIT YOUR PROFILE</Eyebrow>
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
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            <TextField
              label="NAME"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="How the map greets you"
              error={nameError}
              maxLength={200}
            />

            <View style={styles.field}>
              <Eyebrow>BIRTH DATE</Eyebrow>
              <WheelField
                mode="date"
                value={birthDate}
                onChange={setBirthDate}
                maximumDate={new Date()}
              />
            </View>

            <View style={styles.field}>
              <View style={styles.fieldHeader}>
                <Eyebrow>BIRTH TIME</Eyebrow>
                <Pressable
                  onPress={() => setTimeUnknown((previous) => !previous)}
                  style={[styles.unknownChip, timeUnknown && styles.unknownChipActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: timeUnknown }}
                  accessibilityLabel="Birth time unknown"
                >
                  <Text
                    style={[
                      styles.unknownText,
                      timeUnknown && styles.unknownTextActive,
                    ]}
                  >
                    UNKNOWN
                  </Text>
                </Pressable>
              </View>
              {!timeUnknown && (
                <WheelField mode="time" value={birthTime} onChange={setBirthTime} />
              )}
              {timeUnknown && (
                <Text style={styles.quietLine}>
                  Honest state — the bodygraph waits until the hour is known.
                </Text>
              )}
            </View>

            <TextField
              label="HEBREW NAME"
              value={hebrewName}
              onChangeText={setHebrewName}
              placeholder="Optional — unlocks Kabbalah"
              maxLength={200}
            />

            <Button onPress={save} disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scrollContent: {
    gap: SPACE.cardPad,
    paddingBottom: SPACE.unit * 2,
  },
  field: {
    gap: 10,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wheelValueField: {
    height: 52,
    borderRadius: RADII.input,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface2,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  wheelValueText: {
    ...TYPE.body,
    color: COLORS.text90,
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
    backgroundColor: COLORS.surface2,
  },
  unknownText: {
    ...TYPE.eyebrow,
    color: COLORS.text50,
  },
  unknownTextActive: {
    color: COLORS.brandSoft,
  },
  quietLine: {
    ...TYPE.bodySm,
    color: COLORS.text50,
  },
})
