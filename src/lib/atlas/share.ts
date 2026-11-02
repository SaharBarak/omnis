import { z } from 'zod'
import { BirthInputSchema, TEXT_MAX } from './birth-input'
import type { AtlasPerson } from './pair'
import { personLabel } from './person-label'

/**
 * People in a share link: `?p=` carries their birth data as base64url JSON.
 * Decoding validates with the same schema as the form, so a link can never
 * hand the engine something the form would refuse. A link carries each
 * person's id and birth input only; the label is derived on read by
 * `personLabel`, the rule the tool's cards use, so a name has one source.
 */

/** Most people one map holds: past this the circle stops being readable. */
export const MAX_PEOPLE = 8

export const SHARE_PARAM = 'p'

const ID_MAX = 24

const isUnique = (ids: readonly string[]): boolean => new Set(ids).size === ids.length

export const SharedSchema = z
  .array(
    z.object({
      id: z.string().regex(new RegExp(`^[a-z0-9-]{1,${ID_MAX}}$`)),
      input: BirthInputSchema,
    }),
  )
  .min(1)
  .max(MAX_PEOPLE)
  .refine((people) => isUnique(people.map((p) => p.id)), 'Each person in a link needs their own id')
  .transform((people): AtlasPerson[] => people.map((p, i) => ({ id: p.id, name: personLabel(p.input.name, i), input: p.input })))

type SharedPerson = Pick<AtlasPerson, 'id' | 'input'>

const toBase64Url = (text: string): string => {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const fromBase64Url = (code: string): string => {
  const padded = code.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(code.length / 4) * 4, '=')
  const binary = atob(padded)
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)))
}

export const encodePeople = (people: readonly SharedPerson[]): string =>
  toBase64Url(JSON.stringify(people.map(({ id, input }): SharedPerson => ({ id, input }))))

/** A UTF-16 unit that costs three UTF-8 bytes, the most any unit the schema accepts can cost. */
const WIDEST = '\uffef'
/** The longest number JSON writes for a double. */
const LONGEST_NUMBER = -2.2250738585072014e-308

const widest = (n: number): string => WIDEST.repeat(n)

/** The largest payload the schema can accept, so the cap follows the schema instead of a guess. */
const LARGEST: readonly SharedPerson[] = Array.from({ length: MAX_PEOPLE }, () => ({
  id: 'x'.repeat(ID_MAX),
  input: {
    date: '2000-01-01',
    time: '00:00',
    place: { lat: LONGEST_NUMBER, lng: LONGEST_NUMBER, label: widest(TEXT_MAX.place) },
    name: widest(TEXT_MAX.name),
    hebrewName: widest(TEXT_MAX.name),
  },
}))

/** Longer than any valid link: refused before it is decoded or parsed. */
export const MAX_SHARE_LENGTH = encodePeople(LARGEST).length

/** Null for anything that is not a valid list of people. */
export function decodePeople(code: string | null | undefined): AtlasPerson[] | null {
  if (!code || code.length > MAX_SHARE_LENGTH) return null
  try {
    const parsed = SharedSchema.safeParse(JSON.parse(fromBase64Url(code)))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}
