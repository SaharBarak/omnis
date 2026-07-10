import { describe, expect, it } from 'vitest'

import { patchSchema } from './schemas'

describe('people PATCH schema (API-M3 regression)', () => {
  it('preserves city/country/timezone in birth_place', () => {
    const birthPlace = {
      lat: 32.794,
      lng: 34.9896,
      name: 'Haifa',
      city: 'Haifa',
      country: 'IL',
      timezone: 'Asia/Jerusalem',
    }
    const parsed = patchSchema.parse({ updates: { birth_place: birthPlace } })
    expect(parsed.updates.birth_place).toEqual(birthPlace)
  })

  it('still accepts the legacy lat/lng/name-only shape and null', () => {
    expect(
      patchSchema.parse({
        updates: { birth_place: { lat: 1, lng: 2, name: 'x' } },
      }).updates.birth_place
    ).toEqual({ lat: 1, lng: 2, name: 'x' })
    expect(
      patchSchema.parse({ updates: { birth_place: null } }).updates.birth_place
    ).toBeNull()
  })

  it('rejects wrong types', () => {
    expect(() =>
      patchSchema.parse({ updates: { birth_place: { city: 42 } } })
    ).toThrow()
  })
})
