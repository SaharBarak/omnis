import { describe, it, expect } from 'vitest'
import {
  computedResultUpsertSchema,
  groupCreateSchema,
  groupMembersSchema,
  groupPatchSchema,
  personCreateSchema,
  personPatchSchema,
  profileUpdateSchema,
  relationshipCreateSchema,
  relationshipPatchSchema,
  shareCreateSchema,
} from './schemas'

describe('person schemas', () => {
  it('round-trips a full create payload including every birth_place field', () => {
    const input = {
      person: {
        name: 'Noa',
        hebrew_name: 'נועה',
        birth_date: '1990-05-17',
        birth_time: '08:30',
        birth_place: {
          lat: 32.08,
          lng: 34.78,
          name: 'Tel Aviv',
          city: 'Tel Aviv',
          country: 'Israel',
          timezone: 'Asia/Jerusalem',
        },
        avatar_url: null,
        notes: null,
      },
      tagIds: ['3c9e6c2a-1b2c-4d5e-8f90-abcdef012345'],
    }

    expect(personCreateSchema.parse(input)).toEqual(input)
  })

  it('rejects an empty name on create', () => {
    const result = personCreateSchema.safeParse({
      person: { name: '', birth_date: '1990-05-17' },
    })
    expect(result.success).toBe(false)
  })

  it('defaults patch updates to an empty object and accepts action restore', () => {
    expect(personPatchSchema.parse({})).toEqual({ updates: {} })
    expect(personPatchSchema.parse({ action: 'restore' })).toEqual({
      updates: {},
      action: 'restore',
    })
  })

  it('preserves the full birth_place shape on patch (API-M3 regression)', () => {
    const birth_place = {
      lat: 32.08,
      lng: 34.78,
      name: 'Tel Aviv',
      city: 'Tel Aviv',
      country: 'Israel',
      timezone: 'Asia/Jerusalem',
    }
    const parsed = personPatchSchema.parse({ updates: { birth_place } })
    expect(parsed.updates.birth_place).toEqual(birth_place)
  })
})

describe('relationship schemas', () => {
  it('round-trips a full create payload', () => {
    const input = {
      person1_id: 'a',
      person2_id: 'b',
      type: 'romantic' as const,
      subtype: 'partner',
      bidirectional: true,
      strength: 5,
      start_date: '2020-01-01',
      end_date: null,
      notes: null,
    }
    expect(relationshipCreateSchema.parse(input)).toEqual(input)
  })

  it('rejects out-of-range strength and unknown types', () => {
    const base = { person1_id: 'a', person2_id: 'b', type: 'friend' }
    expect(relationshipCreateSchema.safeParse({ ...base, strength: 6 }).success).toBe(
      false
    )
    expect(relationshipCreateSchema.safeParse({ ...base, strength: 0 }).success).toBe(
      false
    )
    expect(
      relationshipCreateSchema.safeParse({ ...base, type: 'enemy' }).success
    ).toBe(false)
  })

  it('round-trips a partial patch', () => {
    const input = { strength: 2, notes: 'grew apart' }
    expect(relationshipPatchSchema.parse(input)).toEqual(input)
  })
})

describe('group schemas', () => {
  it('round-trips create and patch payloads', () => {
    const create = { name: 'Family', description: null, personIds: ['a', 'b'] }
    expect(groupCreateSchema.parse(create)).toEqual(create)
    expect(groupPatchSchema.parse({ name: 'Extended family' })).toEqual({
      name: 'Extended family',
    })
  })

  it('accepts both member-mutation branches and rejects an empty body', () => {
    expect(groupMembersSchema.parse({ personId: 'a' })).toEqual({ personId: 'a' })
    expect(groupMembersSchema.parse({ personIds: ['a', 'b'] })).toEqual({
      personIds: ['a', 'b'],
    })
    expect(groupMembersSchema.safeParse({}).success).toBe(false)
  })
})

describe('share schema', () => {
  it('round-trips a create payload and strips server-owned fields', () => {
    const input = {
      share_type: 'group' as const,
      options: { groupId: 'g1' },
      expires_at: '2026-12-31T00:00:00.000Z',
      max_views: 10,
      password: 'hunter2',
    }
    expect(shareCreateSchema.parse(input)).toEqual(input)

    // url_token and password_hash are minted server-side — the schema must
    // strip them so a client can never smuggle either onto the wire.
    const parsed = shareCreateSchema.parse({
      share_type: 'person',
      url_token: 'forged',
      password_hash: 'forged',
    })
    expect(parsed).toEqual({ share_type: 'person' })
  })

  it('rejects a non-positive max_views', () => {
    expect(
      shareCreateSchema.safeParse({ share_type: 'graph', max_views: 0 }).success
    ).toBe(false)
  })
})

describe('computed result schema', () => {
  it('round-trips an upsert payload and rejects unknown systems', () => {
    const input = {
      personId: 'p1',
      system: 'dreamspell' as const,
      version: '1.1.0',
      data: { kin: 113 },
      computed_at: '2026-07-10T00:00:00.000Z',
    }
    expect(computedResultUpsertSchema.parse(input)).toEqual(input)
    expect(
      computedResultUpsertSchema.safeParse({ ...input, system: 'tarot' }).success
    ).toBe(false)
    expect(
      computedResultUpsertSchema.safeParse({ ...input, version: '' }).success
    ).toBe(false)
  })
})

describe('profile schema', () => {
  it('round-trips an update payload', () => {
    const input = {
      display_name: 'Sahar',
      birth_date: '1988-11-02',
      birth_time: null,
      birth_place: { city: 'Haifa', country: 'Israel', timezone: 'Asia/Jerusalem' },
      locale: 'en' as const,
      timezone: 'Asia/Jerusalem',
      preferences: { systems: ['dreamspell', 'gematria'] },
      onboarding_completed: true,
    }
    expect(profileUpdateSchema.parse(input)).toEqual(input)
  })

  it('rejects an unsupported locale', () => {
    expect(profileUpdateSchema.safeParse({ locale: 'fr' }).success).toBe(false)
  })
})
