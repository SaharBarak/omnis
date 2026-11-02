import { BIRTH_FIELD_LABEL, birthIssueOf, parseBirthInput, plainText, TEXT_MAX, type BirthIssue } from '../birth-input'
import type { AtlasPerson } from '../pair'
import type { BirthInput } from '../types'
import type { PersonInsert } from '@/lib/hooks/use-people'

/**
 * Saved people as atlas inputs. Covers the people API rows (PersonWithTags)
 * and group members, which carry the same birth fields with nullable parts.
 * Stored times may carry seconds; the atlas reads HH:MM. Stored text was
 * written by older forms and imports, so it is made plain and clipped to the
 * schema's limits before parsing: a long name never hides a valid person.
 */
export interface SavedPersonLike {
  readonly id: string
  readonly name: string
  readonly hebrew_name: string | null
  readonly birth_date: string
  readonly birth_time?: string | null
  readonly birth_place?: { readonly lat?: number | null; readonly lng?: number | null; readonly name?: string | null } | null
}

export type MissingField = 'time' | 'place' | 'hebrewName'

const HH_MM = /^(\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?$/

const timeOf = (raw: string | null | undefined): string | null => (raw ? (HH_MM.exec(raw.trim())?.[1] ?? null) : null)

const placeOf = (p: SavedPersonLike) => {
  const lat = p.birth_place?.lat
  const lng = p.birth_place?.lng
  if (typeof lat !== 'number' || typeof lng !== 'number') return null
  return { lat, lng, label: plainText(p.birth_place?.name, TEXT_MAX.place) }
}

/** A read of stored data: the value, or the field that could not be read and why. */
export type SavedRead<T> = { readonly success: true; readonly data: T } | { readonly success: false; readonly error: BirthIssue }

/** The person's birth data as an atlas input, or the first field the schema refuses. */
export function birthInputOf(p: SavedPersonLike): SavedRead<BirthInput> {
  const parsed = parseBirthInput({
    date: p.birth_date.slice(0, 10),
    time: timeOf(p.birth_time),
    place: placeOf(p),
    name: plainText(p.name, TEXT_MAX.name) ?? '',
    hebrewName: plainText(p.hebrew_name, TEXT_MAX.name) ?? '',
  })
  return parsed.success ? { success: true, data: parsed.data } : { success: false, error: birthIssueOf(parsed.error.issues) }
}

export function atlasPersonOf(p: SavedPersonLike): SavedRead<AtlasPerson> {
  const read = birthInputOf(p)
  return read.success ? { success: true, data: { id: p.id, name: read.data.name ?? p.name, input: read.data } } : read
}

/** What a page says about a field it cannot read: the field, then the schema's reason. */
export const issueLine = (issue: BirthIssue): string => `The saved ${BIRTH_FIELD_LABEL[issue.field]} cannot be read. ${issue.message.replace(/\.$/, '')}.`

export interface UnreadablePerson {
  readonly id: string
  readonly name: string
  readonly error: BirthIssue
}

export interface SavedPeople {
  /** People whose birth data parses, in the order given. */
  readonly people: readonly AtlasPerson[]
  /** Everyone else, with the field that stopped them. */
  readonly unreadable: readonly UnreadablePerson[]
}

export function atlasPeopleOf(rows: readonly SavedPersonLike[]): SavedPeople {
  const reads = rows.map((row) => ({ row, read: atlasPersonOf(row) }))
  return {
    people: reads.flatMap(({ read }) => (read.success ? [read.data] : [])),
    unreadable: reads.flatMap(({ row, read }) => (read.success ? [] : [{ id: row.id, name: row.name, error: read.error }])),
  }
}

/** What a saved person still lacks for the exact layers and for gematria. */
export function missingOf(p: SavedPersonLike): readonly MissingField[] {
  return [
    timeOf(p.birth_time) ? null : ('time' as const),
    placeOf(p) ? null : ('place' as const),
    p.hebrew_name?.trim() ? null : ('hebrewName' as const),
  ].filter((m): m is MissingField => m !== null)
}

export const MISSING_LABEL: Readonly<Record<MissingField, string>> = {
  time: 'No birth time',
  place: 'No birth place',
  hebrewName: 'No Hebrew name',
}

/** A new saved person from a parsed atlas input. The name is required by the people API. */
export function personInsertOf(input: BirthInput & { readonly name: string }): Omit<PersonInsert, 'owner_id'> {
  return {
    name: input.name.trim(),
    hebrew_name: input.hebrewName?.trim() || null,
    birth_date: input.date,
    birth_time: input.time,
    birth_place: input.place ? { lat: input.place.lat, lng: input.place.lng, ...(input.place.label ? { name: input.place.label } : {}) } : null,
  }
}
