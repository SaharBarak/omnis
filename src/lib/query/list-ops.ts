/**
 * Pure edits of cached values for the cache-mutation factory
 * (docs/perf/APP_PERFORMANCE_PROMPT.md "Mutations answer from the cache").
 * Nothing here mutates its input.
 *
 * A guess is an edited value plus its own undo. Undo is compare-and-swap: it
 * reverts only what the guess wrote and only while that is still in place,
 * so a failed mutation never erases another mutation's work.
 */

export interface Identified {
  readonly id: string
}

export interface Guess<T> {
  readonly data: T
  readonly undo: (current: T) => T
}

/** An optimistic edit: from the cached value to a guess. */
export type Edit<T> = (data: T) => Guess<T>

type Rows<T> = readonly T[]

/**
 * Equal by value. The cache stores a structurally shared copy of what it is
 * given, so a guess is recognised by its value, not its identity.
 */
export const sameValue = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) return true
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  const keys = Object.keys(a)
  return keys.length === Object.keys(b).length && keys.every((k) => sameValue((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]))
}

const unchanged = <T>(data: T): Guess<T> => ({ data, undo: (current) => current })

/** Merges `patch` into the row with `id`; undo puts the old row back while the row still holds the patch. */
export const patchRow =
  <T extends Identified>(id: string, patch: Partial<T>): Edit<Rows<T>> =>
  (list) => {
    const before = list.find((row) => row.id === id)
    if (before === undefined) return unchanged(list)
    const after: T = { ...before, ...patch }
    return {
      data: list.map((row) => (row === before ? after : row)),
      undo: (current) => current.map((row) => (row.id === id && sameValue(row, after) ? before : row)),
    }
  }

/** Drops the row with `id`; undo returns it before the row that followed it, while no row with its id is listed. */
export const dropRow =
  <T extends Identified>(id: string): Edit<Rows<T>> =>
  (list) => {
    const at = list.findIndex((row) => row.id === id)
    if (at === -1) return unchanged(list)
    const row = list[at]
    const nextId = list[at + 1]?.id
    return {
      data: list.filter((_, i) => i !== at),
      undo: (current) => {
        if (current.some((r) => r.id === id)) return current
        const before = current.findIndex((r) => r.id === nextId)
        const place = before === -1 ? current.length : before
        return [...current.slice(0, place), row, ...current.slice(place)]
      },
    }
  }

/** Replaces the whole value; undo restores the old one while the guess is still cached. */
export const swap =
  <T>(next: T): Edit<T> =>
  (data) => ({ data: next, undo: (current) => (sameValue(current, next) ? data : current) })

/** Puts the server's row in the list, replacing a row with its id or adding it. */
export const upsertRow =
  <T extends Identified>(row: T) =>
  (list: Rows<T>): Rows<T> =>
    list.some((r) => r.id === row.id) ? list.map((r) => (r.id === row.id ? row : r)) : [...list, row]

/** Aims an edit at one part of a larger value, such as the `people` array beside the `tags`. */
export const within =
  <S, T>(get: (whole: S) => T, set: (whole: S, part: T) => S) =>
  (edit: Edit<T>): Edit<S> =>
  (whole) => {
    const guess = edit(get(whole))
    return { data: set(whole, guess.data), undo: (current) => set(current, guess.undo(get(current))) }
  }

/** How a list shows: a comparator, with the id breaking ties so the order is total. */
export type ListOrder<T> = (a: T, b: T) => number

const byId = (a: Identified, b: Identified): number => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)

/** Ascending by a text field. */
export const ascendingBy =
  <T extends Identified>(field: (row: T) => string): ListOrder<T> =>
  (a, b) =>
    field(a).localeCompare(field(b)) || byId(a, b)

/** Newest first by an ISO timestamp. */
export const newestBy =
  <T extends Identified>(field: (row: T) => string): ListOrder<T> =>
  (a, b) =>
    field(b).localeCompare(field(a)) || byId(a, b)

/** A sorted copy, for a query's `select`. */
export const sortedBy =
  <T>(order: ListOrder<T>) =>
  (list: Rows<T>): T[] =>
    [...list].sort(order)
