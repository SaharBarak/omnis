import { describe, expect, it } from 'vitest'
import { birthPlaceOf, parseBirthInput, plainText, TEXT_MAX } from './birth-input'
import { draftErrors, rawOf, type BirthDraft } from './use-atlas-draft'

const hit = { label: 'Somewhere', city: null, country: null, lat: 31.77, lng: 35.21 }

describe('plainText', () => {
  it('turns control characters into spaces, trims, and returns null when nothing is left', () => {
    expect(plainText(' Tel\u0000Aviv \n', 40)).toBe('Tel Aviv')
    expect(plainText('\u0001\u0002', 40)).toBeNull()
    expect(plainText(null, 40)).toBeNull()
  })

  it('clips to the limit without splitting a surrogate pair', () => {
    const clipped = plainText(`${'a'.repeat(8)}\u{1F30D}rest`, 10)
    expect(clipped).toBe(`${'a'.repeat(8)}…`)
    expect(clipped?.length).toBeLessThanOrEqual(10)
  })
})

describe('birthPlaceOf', () => {
  it('prefers the town and country', () => {
    expect(birthPlaceOf({ ...hit, city: 'Jerusalem', country: 'Israel' }).label).toBe('Jerusalem, Israel')
  })

  it('keeps a long geocoder line within the schema, so the place still parses', () => {
    const place = birthPlaceOf({ ...hit, label: 'Street, '.repeat(40) })
    expect(place.label?.length).toBeLessThanOrEqual(TEXT_MAX.place)
    expect(parseBirthInput({ date: '2000-01-01', place }).success).toBe(true)
  })
})

describe('draftErrors', () => {
  const draft: BirthDraft = { date: '2000-01-01', time: '', place: null, name: '', hebrewName: '' }
  const errorsOf = (d: BirthDraft) => {
    const parsed = parseBirthInput(rawOf(d))
    return parsed.success ? {} : draftErrors(d, parsed.error.issues)
  }

  it('names every field the schema refuses, not only date and time', () => {
    const errors = errorsOf({
      ...draft,
      name: 'x'.repeat(TEXT_MAX.name + 1),
      hebrewName: 'שם\u0007',
      place: { lat: 1, lng: 2, label: 'y'.repeat(TEXT_MAX.place + 1) },
    })
    expect(Object.keys(errors).sort()).toEqual(['hebrewName', 'name', 'place'])
  })

  it('stays quiet about a date nobody has typed yet', () => {
    expect(errorsOf({ ...draft, date: '' })).toEqual({})
    expect(errorsOf({ ...draft, date: '2023-02-30' })).toEqual({ date: 'Not a calendar date' })
  })
})
