import type { SystemInfo } from '@/lib/system-preferences'

/**
 * Pure rules behind the signed-in system pages (template T12). Each one
 * reads the table that owns the fact: billing plans, the system catalog,
 * the route table.
 */

/**
 * Engine copy joins clauses with a spaced em dash ("The initiator — drive").
 * The site's copy rules ban the dash, so clauses are set as sentences.
 */
export function undash(text: string): string {
  const clauses = text.split(/\s+—\s+/).map((c) => c.trim()).filter(Boolean)
  return clauses
    .map((clause, i) => {
      const opened = i === 0 ? clause : clause.charAt(0).toUpperCase() + clause.slice(1)
      const last = i === clauses.length - 1
      return last || /[.!?:;]$/.test(opened) ? opened : `${opened}.`
    })
    .join(' ')
}

/** Prose keeps its flow: a spaced em dash becomes a comma. */
export const undashProse = (text: string): string => text.replace(/\s+—\s+/g, ', ')

export interface PickablePerson {
  readonly id: string
  readonly is_self: boolean
}

/** The account's own person when saved, else the first person listed. */
export const defaultPersonId = (people: readonly PickablePerson[]): string | null =>
  (people.find((p) => p.is_self) ?? people[0])?.id ?? null

export type BirthPart = 'time' | 'place'

/** The birth parts a system needs, from the catalog's requirement flags. */
export const requiredParts = (system: Pick<SystemInfo, 'requiresTime' | 'requiresLocation'>): readonly BirthPart[] =>
  [system.requiresTime ? 'time' : null, system.requiresLocation ? 'place' : null].filter((p): p is BirthPart => p !== null)

/** The cheapest plan whose limits include the system, or null when no plan does. */
/** "a", "a and b", "a, b and c". */
export function listAnd(items: readonly string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

/** Whole years from a birth date to a day, both YYYY-MM-DD. */
export function ageOn(birth: string, day: string): number {
  const [by, bm, bd] = birth.split('-').map(Number)
  const [ty, tm, td] = day.split('-').map(Number)
  const beforeBirthday = tm < bm || (tm === bm && td < bd)
  return ty - by - (beforeBirthday ? 1 : 0)
}

const NUMERALS: readonly (readonly [number, string])[] = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
  [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
]

/** Roman numeral for a whole number; 0 stays "0" (The Fool). */
export function roman(n: number): string {
  if (n <= 0) return '0'
  let rest = n
  return NUMERALS.reduce((out, [value, glyph]) => {
    const times = Math.floor(rest / value)
    rest -= times * value
    return out + glyph.repeat(times)
  }, '')
}
