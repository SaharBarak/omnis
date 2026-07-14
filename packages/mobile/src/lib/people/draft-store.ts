import { create } from 'zustand'

/**
 * Capture-sheet draft — S7. Lives outside the sheet so the entered values
 * survive the sheet closing (the limit_exceeded → paywall path must retain
 * the draft; F11 Scenario J re-submits without re-entry). Cleared only when
 * the server confirms the create.
 */

export interface PersonDraftValues {
  name: string
  birthDate: Date | null
  birthTime: Date | null
  timeUnknown: boolean
  city: string
  country: string
  timezone: string | null
  /** Real coordinates from place search; null when the place is unknown. */
  coords: { lat: number; lng: number } | null
  hebrewName: string
  notes: string
}

interface PersonDraft {
  name: string
  /** null until the wheel is touched — birth date is required and explicit. */
  birthDate: Date | null
  /** Time of birth; meaningful only when timeUnknown is false. */
  birthTime: Date | null
  /** "I don't know" — the honest partial state (F2/F3). */
  timeUnknown: boolean
  city: string
  country: string
  /** IANA zone id — from place search, or the static shortlist as an override. */
  timezone: string | null
  /**
   * Latitude/longitude of the birth place. Houses, the Ascendant and the Vertex
   * are functions of it; without it the engine leaves them out rather than
   * guessing. Only place search can set this — typed text never fabricates one.
   */
  coords: { lat: number; lng: number } | null
  hebrewName: string
  notes: string

  setName: (value: string) => void
  setBirthDate: (value: Date) => void
  setBirthTime: (value: Date | null) => void
  setTimeUnknown: (value: boolean) => void
  setCity: (value: string) => void
  setCountry: (value: string) => void
  setTimezone: (value: string | null) => void
  /** Set city, country, timezone and coordinates together — they are one fact. */
  setPlace: (value: {
    city: string
    country: string
    timezone: string
    coords: { lat: number; lng: number }
  }) => void
  clearPlace: () => void
  setHebrewName: (value: string) => void
  setNotes: (value: string) => void
  /** Replace the whole draft — S8 edit pre-fill (F4 → S7 reuse). */
  prefill: (values: PersonDraftValues) => void
  reset: () => void
}

const initialDraft = {
  name: '',
  birthDate: null,
  birthTime: null,
  timeUnknown: false,
  city: '',
  country: '',
  timezone: null,
  coords: null,
  hebrewName: '',
  notes: '',
} as const

export const usePersonDraft = create<PersonDraft>()((set) => ({
  ...initialDraft,
  setName: (name) => set({ name }),
  setBirthDate: (birthDate) => set({ birthDate }),
  setBirthTime: (birthTime) => set({ birthTime }),
  setTimeUnknown: (timeUnknown) => set({ timeUnknown }),
  setCity: (city) => set({ city }),
  setCountry: (country) => set({ country }),
  setTimezone: (timezone) => set({ timezone }),
  setPlace: ({ city, country, timezone, coords }) =>
    set({ city, country, timezone, coords }),
  clearPlace: () => set({ city: '', country: '', timezone: null, coords: null }),
  setHebrewName: (hebrewName) => set({ hebrewName }),
  setNotes: (notes) => set({ notes }),
  prefill: (values) => set({ ...values }),
  reset: () => set({ ...initialDraft }),
}))
