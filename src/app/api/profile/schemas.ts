import { z } from 'zod'

/**
 * Birth place payload — mirrors the `BirthPlace` shape produced by
 * `LocationPicker` (name/city/country/lat/lng/timezone). Zod objects strip
 * unknown keys by default, so every field the onboarding form sends must be
 * declared here or it silently never persists.
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

export const updateSchema = z.object({
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

export type ProfileUpdate = z.infer<typeof updateSchema>
