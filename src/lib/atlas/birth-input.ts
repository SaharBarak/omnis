import { z } from 'zod'
import type { BirthInput, BirthPlace, MissingInput } from './types'
import type { PlaceHit } from '@/lib/geo/place-search'

const isRealDate = (iso: string): boolean => {
  const d = new Date(`${iso}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso
}

const DATE = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
  .refine(isRealDate, 'Not a calendar date')

const TIME = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM, 24-hour')

/** Longest free text each field keeps: a full name, a geocoder's place line. */
export const TEXT_MAX = Object.freeze({ name: 80, place: 160 })

const CONTROL = /[\u0000-\u001f\u007f]/
/** Half of a surrogate pair standing alone: no character, and JSON writes it as a six-byte escape that no length cap foresees. */
const LONE_SURROGATE = /[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/
const CONTROLS = new RegExp(`${CONTROL.source}+`, 'g')
const LONE_SURROGATES = new RegExp(LONE_SURROGATE.source, 'g')
const REPLACEMENT = '\ufffd'
const TRAILING_HIGH_SURROGATE = /[\ud800-\udbff]$/

const ELLIPSIS = '\u2026'

/** Clips to `max` UTF-16 units, the unit zod's `.max` counts, without splitting a surrogate pair. */
const clip = (text: string, max: number): string => {
  if (text.length <= max) return text
  const cut = text.slice(0, max - ELLIPSIS.length).replace(TRAILING_HIGH_SURROGATE, '')
  return `${cut.trimEnd()}${ELLIPSIS}`
}

/**
 * Text from outside the form (a geocoder, a stored row) made fit for the
 * schema: control characters become spaces, half a surrogate pair becomes
 * the replacement character, the ends are trimmed and the rest is clipped to
 * `max`. Null when nothing readable is left.
 */
export const plainText = (raw: string | null | undefined, max: number): string | null => {
  const text = clip((raw ?? '').replace(CONTROLS, ' ').replace(LONE_SURROGATES, REPLACEMENT).trim(), max)
  return text.length > 0 ? text : null
}

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine((s) => !CONTROL.test(s) && !LONE_SURROGATE.test(s), 'Plain text only')

const PLACE = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  label: text(TEXT_MAX.place).pipe(z.string().min(1)).nullable().default(null),
})

const optionalText = text(TEXT_MAX.name)
  .transform((s) => (s.length > 0 ? s : null))
  .nullable()
  .default(null)

export const BirthInputSchema = z.object({
  date: DATE,
  time: TIME.nullable().default(null),
  place: PLACE.nullable().default(null),
  name: optionalText,
  hebrewName: optionalText,
})

export type BirthInputRaw = z.input<typeof BirthInputSchema>

export const BIRTH_FIELDS = ['date', 'time', 'place', 'name', 'hebrewName'] as const satisfies readonly (keyof BirthInput)[]

export type BirthField = (typeof BIRTH_FIELDS)[number]

export const isBirthField = (key: PropertyKey | undefined): key is BirthField => BIRTH_FIELDS.some((f) => f === key)

/** Each field as a sentence names it. */
export const BIRTH_FIELD_LABEL: Readonly<Record<BirthField, string>> = Object.freeze({
  date: 'birth date',
  time: 'birth time',
  place: 'birth place',
  name: 'name',
  hebrewName: 'Hebrew name',
})

/** The first schema issue, as the field it names and the schema's message. */
export interface BirthIssue {
  readonly field: BirthField
  readonly message: string
}

export const birthIssueOf = (issues: readonly { readonly path: readonly PropertyKey[]; readonly message: string }[]): BirthIssue => {
  const issue = issues.find((i) => isBirthField(i.path[0])) ?? issues[0]
  const field = issue?.path[0]
  return { field: isBirthField(field) ? field : 'date', message: issue?.message ?? 'Not readable' }
}

/** A geocoder hit as a birth place: the town and country when known, its full line otherwise, always within `TEXT_MAX.place`. */
export const birthPlaceOf = (hit: PlaceHit): BirthPlace => ({
  lat: hit.lat,
  lng: hit.lng,
  label: plainText([hit.city, hit.country].filter(Boolean).join(', ') || hit.label, TEXT_MAX.place),
})

export const parseBirthInput = (raw: BirthInputRaw) => BirthInputSchema.safeParse(raw)

/** What the exact layers still need, or null when time and place are both known. */
export const missingForExact = (input: BirthInput): MissingInput | null => {
  if (!input.time && !input.place) return 'time-and-place'
  if (!input.time) return 'time'
  if (!input.place) return 'place'
  return null
}
