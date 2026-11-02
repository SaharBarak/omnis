import { describe, expect, it } from 'vitest'
import { atlasPeopleOf, birthInputOf, issueLine, missingOf, personInsertOf, type SavedPersonLike } from './saved-person'
import { TEXT_MAX } from '../birth-input'

const readInput = (p: SavedPersonLike) => {
  const read = birthInputOf(p)
  if (!read.success) throw new Error(`fixture must parse: ${read.error.field}`)
  return read.data
}

const maya: SavedPersonLike = {
  id: 'p1',
  name: 'Maya',
  hebrew_name: 'מאיה',
  birth_date: '1991-03-14',
  birth_time: '08:20:00',
  birth_place: { lat: 32.08, lng: 34.78, name: 'Tel Aviv' },
}

describe('saved person adapter', () => {
  it('reads stored times with seconds and keeps the place label', () => {
    expect(birthInputOf(maya)).toEqual({
      success: true,
      data: {
        date: '1991-03-14',
        time: '08:20',
        place: { lat: 32.08, lng: 34.78, label: 'Tel Aviv' },
        name: 'Maya',
        hebrewName: 'מאיה',
      },
    })
  })

  it('drops a place without both coordinates and an empty Hebrew name', () => {
    const input = readInput({ ...maya, birth_time: null, birth_place: { lat: 32.08, lng: null }, hebrew_name: '' })
    expect(input.place).toBeNull()
    expect(input.time).toBeNull()
    expect(input.hebrewName).toBeNull()
  })

  it('names what is missing', () => {
    expect(missingOf(maya)).toEqual([])
    expect(missingOf({ ...maya, birth_time: null, birth_place: null, hebrew_name: null })).toEqual(['time', 'place', 'hebrewName'])
  })

  it('keeps people whose stored date is not a calendar date apart, naming the field', () => {
    const read = atlasPeopleOf([maya, { ...maya, id: 'bad', birth_date: '1991-02-30' }])
    expect(read.people.map((p) => p.id)).toEqual(['p1'])
    expect(read.unreadable).toEqual([{ id: 'bad', name: 'Maya', error: { field: 'date', message: 'Not a calendar date' } }])
    expect(issueLine(read.unreadable[0].error)).toBe('The saved birth date cannot be read. Not a calendar date.')
  })

  it('reads a person whose stored text is long or carries control characters', () => {
    const long = 'x'.repeat(TEXT_MAX.place + 40)
    const input = readInput({ ...maya, name: `Ma\u0007ya ${'y'.repeat(TEXT_MAX.name)}`, birth_place: { lat: 1, lng: 2, name: long } })
    expect(input.name?.length).toBeLessThanOrEqual(TEXT_MAX.name)
    expect(input.name?.startsWith('Ma ya')).toBe(true)
    expect(input.place?.label?.length).toBeLessThanOrEqual(TEXT_MAX.place)
    expect(input.place?.label?.endsWith('\u2026')).toBe(true)
  })

  it('drops a place label with nothing readable in it', () => {
    expect(readInput({ ...maya, birth_place: { lat: 1, lng: 2, name: '\u0000\u0001 ' } }).place).toEqual({ lat: 1, lng: 2, label: null })
  })

  it('names the field when stored data breaks the schema', () => {
    expect(birthInputOf({ ...maya, birth_place: { lat: 120, lng: 2 } })).toMatchObject({ success: false, error: { field: 'place' } })
    expect(birthInputOf({ ...maya, birth_time: '25:10' })).toMatchObject({ success: false, error: { field: 'time' } })
  })

  it('writes a parsed input back as a people API row and reads it again unchanged', () => {
    const input = readInput(maya)
    if (!input.name) throw new Error('fixture must carry a name')
    const row = personInsertOf({ ...input, name: input.name })
    expect(row).toEqual({
      name: 'Maya',
      hebrew_name: 'מאיה',
      birth_date: '1991-03-14',
      birth_time: '08:20',
      birth_place: { lat: 32.08, lng: 34.78, name: 'Tel Aviv' },
    })
    expect(readInput({ id: 'p1', ...row, hebrew_name: row.hebrew_name ?? null })).toEqual(input)
  })

  it('writes no place name when the place has no label', () => {
    const row = personInsertOf({ date: '2000-01-01', time: null, place: { lat: 1, lng: 2, label: null }, name: 'Noa', hebrewName: null })
    expect(row.birth_place).toEqual({ lat: 1, lng: 2 })
    expect(row.hebrew_name).toBeNull()
  })
})
