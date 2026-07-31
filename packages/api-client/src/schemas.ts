import { z } from 'zod'

/**
 * Request-body schemas, mirroring the server zod EXACTLY (route handlers
 * under src/app/api/**). Validate at the client edge before a byte leaves
 * the device — anything these accept, the server accepts.
 *
 * Server sources of truth:
 * - people:          src/app/api/people/route.ts, src/app/api/people/[id]/schemas.ts
 * - relationships:   src/app/api/relationships/route.ts, [id]/route.ts
 * - groups:          src/app/api/groups/route.ts, [id]/route.ts, [id]/members/route.ts
 * - shares:          src/app/api/shares/route.ts, [id]/route.ts
 * - computed-results src/app/api/computed-results/route.ts
 * - profile:         src/app/api/profile/schemas.ts
 */

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

/**
 * Full birth-place shape — kept in sync with POST /api/people, the person
 * PATCH schema and the profile schema. Zod strips unknown keys, so every
 * field must be declared or it silently never persists.
 */
export const birthPlaceSchema = z
  .object({
    lat: z.number().optional(),
    lng: z.number().optional(),
    name: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    timezone: z.string().optional(),
  })
  .nullable()

export const systemSchema = z.enum([
  'dreamspell',
  'tzolkin',
  'longcount',
  'humandesign',
  'astrology',
  'gematria',
])

export const relationshipTypeSchema = z.enum([
  'family',
  'romantic',
  'friend',
  'professional',
  'other',
])

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

/** Body of POST /api/people. 403 code 'limit_exceeded' at the plan cap. */
export const personCreateSchema = z.object({
  person: z.object({
    name: z.string().min(1).max(200),
    hebrew_name: z.string().nullable().optional(),
    birth_date: z.string(),
    birth_time: z.string().nullable().optional(),
    birth_place: birthPlaceSchema.optional(),
    avatar_url: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
  }),
  tagIds: z.array(z.string()).optional(),
})

/** MBTI's sixteen types — the server rejects anything else (#75). */
export const mbtiSchema = z.enum([
  'INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP',
])

export const discSchema = z.enum(['D', 'I', 'S', 'C'])

export const attachmentSchema = z.enum([
  'secure',
  'anxious',
  'avoidant',
  'fearful-avoidant',
])

export const loveLanguageSchema = z.enum([
  'words of affirmation',
  'quality time',
  'receiving gifts',
  'acts of service',
  'physical touch',
])

/**
 * User-entered personality frameworks (#75) — the client-side mirror of
 * `src/app/api/people/[id]/schemas.ts`. Kept enum-strict here too so an
 * invalid selection fails before the round trip instead of coming back
 * as a 400.
 */
export const personalitySchema = z
  .object({
    mbti: mbtiSchema.nullable().optional(),
    enneagram: z.string().regex(/^[1-9](w[1-9])?$/).nullable().optional(),
    disc: discSchema.nullable().optional(),
    attachment: attachmentSchema.nullable().optional(),
    loveLanguages: z.array(loveLanguageSchema).max(5).nullable().optional(),
    bigFive: z
      .object({
        openness: z.number().min(0).max(100).optional(),
        conscientiousness: z.number().min(0).max(100).optional(),
        extraversion: z.number().min(0).max(100).optional(),
        agreeableness: z.number().min(0).max(100).optional(),
        neuroticism: z.number().min(0).max(100).optional(),
      })
      .nullable()
      .optional(),
    viaStrengths: z.array(z.string().max(40)).max(24).nullable().optional(),
  })
  .nullable()

/** Body of PATCH /api/people/[id]. `action: 'restore'` clears soft delete. */
export const personPatchSchema = z.object({
  updates: z
    .object({
      name: z.string().min(1).max(200).optional(),
      hebrew_name: z.string().nullable().optional(),
      birth_date: z.string().optional(),
      birth_time: z.string().nullable().optional(),
      birth_place: birthPlaceSchema.optional(),
      avatar_url: z.string().nullable().optional(),
      notes: z.string().nullable().optional(),
      is_self: z.boolean().optional(),
      deleted_at: z.string().nullable().optional(),
      personality: personalitySchema.optional(),
    })
    .default({}),
  tagIds: z.array(z.string()).optional(),
  action: z.enum(['restore']).optional(),
})

// ---------------------------------------------------------------------------
// Relationships
// ---------------------------------------------------------------------------

/** Body of POST /api/relationships. 409 on a duplicate pair+type. */
export const relationshipCreateSchema = z.object({
  person1_id: z.string(),
  person2_id: z.string(),
  type: relationshipTypeSchema,
  subtype: z.string().nullable().optional(),
  bidirectional: z.boolean().optional(),
  strength: z.number().int().min(1).max(5).optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/** Body of PATCH /api/relationships/[id]. */
export const relationshipPatchSchema = z.object({
  type: relationshipTypeSchema.optional(),
  subtype: z.string().nullable().optional(),
  bidirectional: z.boolean().optional(),
  strength: z.number().int().min(1).max(5).optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------

/** Body of POST /api/groups. */
export const groupCreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  personIds: z.array(z.string()).optional(),
})

/** Body of PATCH /api/groups/[id]. */
export const groupPatchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
})

/**
 * Body of POST /api/groups/[id]/members — `personId` adds one member,
 * `personIds` REPLACES the full membership set.
 */
export const groupMembersSchema = z.union([
  z.object({ personId: z.string() }),
  z.object({ personIds: z.array(z.string()) }),
])

// ---------------------------------------------------------------------------
// Shares
// ---------------------------------------------------------------------------

/**
 * Body of POST /api/shares. The client NEVER supplies url_token or
 * password_hash — the token is minted server-side and the raw password is
 * hashed there.
 */
export const shareCreateSchema = z.object({
  share_type: z.enum(['person', 'relationship', 'group', 'graph']),
  options: z.record(z.string(), z.unknown()).optional(),
  expires_at: z.string().nullable().optional(),
  max_views: z.number().int().positive().nullable().optional(),
  password: z.string().min(1).max(128).nullable().optional(),
})

/** Body of PATCH /api/shares/[id]. */
export const sharePatchSchema = z.object({
  active: z.boolean().optional(),
})

// ---------------------------------------------------------------------------
// Computed results
// ---------------------------------------------------------------------------

/** Body of POST /api/computed-results — upsert per (person, system, version). */
export const computedResultUpsertSchema = z.object({
  personId: z.string(),
  system: systemSchema,
  version: z.string().min(1),
  data: z.record(z.string(), z.unknown()),
  computed_at: z.string().optional(),
})

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

/** Body of PATCH /api/profile. */
export const profileUpdateSchema = z.object({
  display_name: z.string().min(1).max(200).optional(),
  birth_date: z.string().optional().nullable(),
  birth_time: z.string().optional().nullable(),
  birth_place: birthPlaceSchema.optional(),
  hebrew_name: z.string().optional().nullable(),
  avatar_url: z.string().optional().nullable(),
  locale: z.enum(['he', 'en']).optional(),
  timezone: z.string().optional(),
  preferences: z.record(z.string(), z.unknown()).optional(),
  onboarding_completed: z.boolean().optional(),
})

// ---------------------------------------------------------------------------
// Inferred input types
// ---------------------------------------------------------------------------

export type PersonCreateInput = z.infer<typeof personCreateSchema>
export type PersonPatchInput = z.infer<typeof personPatchSchema>
export type RelationshipCreateInput = z.infer<typeof relationshipCreateSchema>
export type RelationshipPatchInput = z.infer<typeof relationshipPatchSchema>
export type GroupCreateInput = z.infer<typeof groupCreateSchema>
export type GroupPatchInput = z.infer<typeof groupPatchSchema>
export type GroupMembersInput = z.infer<typeof groupMembersSchema>
export type ShareCreateInput = z.infer<typeof shareCreateSchema>
export type SharePatchInput = z.infer<typeof sharePatchSchema>
export type ComputedResultUpsertInput = z.infer<typeof computedResultUpsertSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
