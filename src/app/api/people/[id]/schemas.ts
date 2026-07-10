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
    })
    .default({}),
  tagIds: z.array(z.string()).optional(),
  // action: 'restore' clears the soft-delete flag
  action: z.enum(['restore']).optional(),
})
