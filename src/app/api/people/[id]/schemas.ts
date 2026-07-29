import { z } from 'zod'

/**
 * Full birth-place shape — must stay in sync with POST /api/people and the
 * profile schema. Zod strips unknown keys, so a narrower schema here would
 * silently drop city/country/timezone on every person edit (API-M3).
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

/**
 * User-entered personality frameworks (#75). Mirrors the engine's
 * PersonalityProfile; enums are enforced here so junk never reaches the
 * jsonb column.
 */
export const personalitySchema = z
  .object({
    mbti: z
      .enum([
        'INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP',
        'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP',
      ])
      .nullable()
      .optional(),
    enneagram: z.string().regex(/^[1-9](w[1-9])?$/).nullable().optional(),
    disc: z.enum(['D', 'I', 'S', 'C']).nullable().optional(),
    attachment: z
      .enum(['secure', 'anxious', 'avoidant', 'fearful-avoidant'])
      .nullable()
      .optional(),
    loveLanguages: z
      .array(
        z.enum([
          'words of affirmation', 'quality time', 'receiving gifts',
          'acts of service', 'physical touch',
        ])
      )
      .max(5)
      .nullable()
      .optional(),
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

export const patchSchema = z.object({
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
  // action: 'restore' clears the soft-delete flag
  action: z.enum(['restore']).optional(),
})
