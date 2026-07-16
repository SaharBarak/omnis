import type { Profile } from '@pleiad/api-client'
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { XIcon } from 'phosphor-react-native'
import { useEffect, useState } from 'react'
import { Platform, ScrollView, StyleSheet, View } from 'react-native'

import {
  BottomSheet,
  Button,
  Chip,
  IconButton,
  Text,
  TextField,
  Touchable,
} from '@/components/m3'
import { api } from '@/lib/api'
import { formatBirthDate, formatBirthTime } from '@/lib/onboarding/draft-store'
import { PEOPLE_QUERY_KEY } from '@/lib/people/hooks'
import { showToast } from '@/lib/toast'
import { SHAPE, SPACE, useTheme } from '@/theme/m3'

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
  const theme = useTheme()
  const [show, setShow] = useState(false)

  if (Platform.OS === 'ios') {
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

  return (
    <>
      <Touchable
        onPress={() => setShow(true)}
        radius={SHAPE.extraSmall}
        stateLayerColor={theme.colors.onSurface}
        accessibilityRole="button"
        accessibilityLabel={mode === 'date' ? 'Pick a date' : 'Pick a time'}
        style={[styles.wheelValueField, { borderColor: theme.colors.outline }]}
      >
        <Text variant="bodyLarge">
          {mode === 'date' ? formatBirthDate(value) : formatBirthTime(value)}
        </Text>
      </Touchable>
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
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <Text variant="labelLarge" color="primary">
          Edit your profile
        </Text>
        <IconButton
          icon={(color) => <XIcon size={24} color={color} />}
          onPress={onClose}
          accessibilityLabel="Close"
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <TextField
          label="Name"
          value={displayName}
          onChangeText={setDisplayName}
          supportingText="How the map greets you"
          error={nameError}
          maxLength={200}
        />

        <View style={styles.field}>
          <Text variant="labelLarge" color="onSurfaceVariant">
            Birth date
          </Text>
          <WheelField
            mode="date"
            value={birthDate}
            onChange={setBirthDate}
            maximumDate={new Date()}
          />
        </View>

        <View style={styles.field}>
          <View style={styles.fieldHeader}>
            <Text variant="labelLarge" color="onSurfaceVariant">
              Birth time
            </Text>
            <Chip
              variant="filter"
              label="Unknown"
              selected={timeUnknown}
              onPress={() => setTimeUnknown((previous) => !previous)}
            />
          </View>
          {!timeUnknown && (
            <WheelField mode="time" value={birthTime} onChange={setBirthTime} />
          )}
          {timeUnknown && (
            <Text variant="bodySmall" color="onSurfaceVariant">
              Honest state — the bodygraph waits until the hour is known.
            </Text>
          )}
        </View>

        <TextField
          label="Hebrew name"
          value={hebrewName}
          onChangeText={setHebrewName}
          supportingText="Optional — unlocks Kabbalah"
          maxLength={200}
        />

        <Button fullWidth onPress={save} disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : 'Save'}
        </Button>
      </ScrollView>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACE.sm,
  },
  scrollContent: {
    gap: SPACE.xl,
    paddingBottom: SPACE.xl,
  },
  field: {
    gap: SPACE.sm,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wheelValueField: {
    height: 56,
    borderWidth: 1,
    paddingHorizontal: SPACE.lg,
    justifyContent: 'center',
  },
})
