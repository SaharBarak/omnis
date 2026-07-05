import { describe, it, expect } from 'vitest'
import { birthPlaceSchema, updateSchema } from './schemas'

describe('birthPlaceSchema', () => {
  it('preserves city, country and timezone (regression: fields were stripped)', () => {
    const place = {
      name: 'Tel Aviv, Israel',
      city: 'Tel Aviv',
      country: 'Israel',
      lat: 32.0853,
      lng: 34.7818,
      timezone: 'Asia/Jerusalem',
    }
    expect(birthPlaceSchema.parse(place)).toEqual(place)
  })

  it('accepts null', () => {
    expect(birthPlaceSchema.parse(null)).toBeNull()
  })

  it('accepts a minimal legacy payload (lat/lng/name only)', () => {
    const legacy = { lat: 1, lng: 2, name: 'Somewhere' }
    expect(birthPlaceSchema.parse(legacy)).toEqual(legacy)
  })

  it('rejects wrong field types', () => {
    expect(() => birthPlaceSchema.parse({ lat: 'not-a-number' })).toThrow()
    expect(() => birthPlaceSchema.parse({ city: 42 })).toThrow()
  })
})

describe('updateSchema', () => {
  it('round-trips the full onboarding payload including nested birth place fields', () => {
    const payload = {
      display_name: 'Sahar',
      birth_date: '1990-05-14',
      birth_time: '08:30',
      birth_place: {
        name: 'Haifa, Israel',
        city: 'Haifa',
        country: 'Israel',
        lat: 32.794,
        lng: 34.9896,
        timezone: 'Asia/Jerusalem',
      },
      hebrew_name: 'שחר',
      onboarding_completed: true,
    }
    expect(updateSchema.parse(payload)).toEqual(payload)
  })

  it('allows clearing birth place with null', () => {
    expect(updateSchema.parse({ birth_place: null })).toEqual({ birth_place: null })
  })

  it('strips unknown top-level keys instead of failing', () => {
    const parsed = updateSchema.parse({ display_name: 'A', role: 'admin' })
    expect(parsed).toEqual({ display_name: 'A' })
  })

  it('rejects an empty display_name', () => {
    expect(() => updateSchema.parse({ display_name: '' })).toThrow()
  })
})
