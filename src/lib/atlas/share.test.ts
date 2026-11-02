import { describe, expect, it } from 'vitest'
import { DEMO_ATLAS_PEOPLE } from './demo'
import { decodePeople, encodePeople, MAX_PEOPLE, MAX_SHARE_LENGTH } from './share'
import { TEXT_MAX } from './birth-input'

describe('share links', () => {
  it('round-trips people, Hebrew names included', () => {
    const people = DEMO_ATLAS_PEOPLE.slice(0, 3)
    expect(decodePeople(encodePeople(people))).toEqual(people)
  })

  it('refuses tampered or oversized payloads', () => {
    expect(decodePeople('not-base64!')).toBeNull()
    const bad = [{ ...DEMO_ATLAS_PEOPLE[0], input: { ...DEMO_ATLAS_PEOPLE[0].input, date: '2023-02-30' } }]
    expect(decodePeople(encodePeople(bad))).toBeNull()
    const many = Array.from({ length: MAX_PEOPLE + 1 }, (_, i) => ({ ...DEMO_ATLAS_PEOPLE[0], id: `p${i}` }))
    expect(decodePeople(encodePeople(many))).toBeNull()
  })

  it('accepts the largest valid link and refuses anything longer before parsing', () => {
    const wide = '\uffef'
    const largest = Array.from({ length: MAX_PEOPLE }, (_, i) => ({
      id: `p${i}`.padEnd(24, 'x'),
      name: wide.repeat(TEXT_MAX.name),
      input: {
        date: '1999-12-31',
        time: '23:59',
        place: { lat: -2.2250738585072014e-308, lng: -2.2250738585072014e-308, label: wide.repeat(TEXT_MAX.place) },
        name: wide.repeat(TEXT_MAX.name),
        hebrewName: wide.repeat(TEXT_MAX.name),
      },
    }))
    const code = encodePeople(largest)
    expect(code.length).toBeLessThanOrEqual(MAX_SHARE_LENGTH)
    expect(decodePeople(code)).toHaveLength(MAX_PEOPLE)
    expect(decodePeople('A'.repeat(MAX_SHARE_LENGTH + 1))).toBeNull()
  })

  it('refuses control characters and overlong text', () => {
    const person = DEMO_ATLAS_PEOPLE[0]
    const control = [{ ...person, input: { ...person.input, name: 'Ari\u0007' } }]
    expect(decodePeople(encodePeople(control))).toBeNull()
    const long = [{ ...person, input: { ...person.input, place: { lat: 1, lng: 1, label: 'x'.repeat(TEXT_MAX.place + 1) } } }]
    expect(decodePeople(encodePeople(long))).toBeNull()
  })

  it('refuses a link that names the same person id twice', () => {
    const [maya, ari] = DEMO_ATLAS_PEOPLE
    expect(decodePeople(encodePeople([maya, { ...ari, id: maya.id }]))).toBeNull()
    expect(decodePeople(encodePeople([maya, ari]))).toHaveLength(2)
  })

  it('labels each person from their birth input, the rule the tool cards use', () => {
    const [maya, ari] = DEMO_ATLAS_PEOPLE
    const unnamed = { ...ari, name: 'Bob', input: { ...ari.input, name: null } }
    expect(decodePeople(encodePeople([maya, unnamed]))?.map((p) => p.name)).toEqual([maya.input.name, 'Person B'])
  })
})
