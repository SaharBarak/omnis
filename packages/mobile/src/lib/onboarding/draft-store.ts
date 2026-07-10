import { create } from 'zustand'

/**
 * Onboarding ritual draft — F2. In-memory for now.
 * TODO(SYNC-M2): persist with MMKV so an app kill mid-ritual resumes at the
 * same step (USER_FLOWS F2).
 */

export const ONBOARDING_STEP_COUNT = 5

interface OnboardingDraft {
  step: number
  displayName: string
  /** Local calendar date of birth; required before finishing. */
  birthDate: Date | null
  /** Time of birth; null = unknown / skipped (honest partial state). */
  birthTime: Date | null
  birthCity: string
  birthCountry: string
  /** IANA zone id from the static shortlist; null = not chosen. */
  birthTimezone: string | null
  hebrewName: string

  setStep: (step: number) => void
  setDisplayName: (value: string) => void
  setBirthDate: (value: Date) => void
  setBirthTime: (value: Date | null) => void
  setBirthCity: (value: string) => void
  setBirthCountry: (value: string) => void
  setBirthTimezone: (value: string | null) => void
  setHebrewName: (value: string) => void
  reset: () => void
}

const initialDraft = {
  step: 0,
  displayName: '',
  birthDate: null,
  birthTime: null,
  birthCity: '',
  birthCountry: '',
  birthTimezone: null,
  hebrewName: '',
} as const

export const useOnboardingDraft = create<OnboardingDraft>()((set) => ({
  ...initialDraft,
  setStep: (step) => set({ step }),
  setDisplayName: (displayName) => set({ displayName }),
  setBirthDate: (birthDate) => set({ birthDate }),
  setBirthTime: (birthTime) => set({ birthTime }),
  setBirthCity: (birthCity) => set({ birthCity }),
  setBirthCountry: (birthCountry) => set({ birthCountry }),
  setBirthTimezone: (birthTimezone) => set({ birthTimezone }),
  setHebrewName: (hebrewName) => set({ hebrewName }),
  reset: () => set({ ...initialDraft }),
}))

/** ISO date (YYYY-MM-DD) in the device's local calendar. */
export function formatBirthDate(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** 24h HH:MM. */
export function formatBirthTime(time: Date): string {
  const hours = String(time.getHours()).padStart(2, '0')
  const minutes = String(time.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}
