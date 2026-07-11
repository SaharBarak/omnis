import { and, eq, inArray, sql } from 'drizzle-orm'

import { getDb } from '@/lib/db/client'
import { computed_results, people } from '@/lib/db/schema'
import { serialize, serializeMany, toEntityId } from '@/lib/db/serialize'

/**
 * Computed-results domain repository. computed_results cache the symbolic-system
 * calculations (dreamspell/astrology/human-design/etc.) for each person.
 *
 * SECURITY: computed_results have no `owner_id` of their own — ownership is
 * derived from the parent person row. Every function therefore verifies that
 * the person belongs to the authenticated `userId` (via people.owner_id) before
 * reading or writing. This is the only place tenant isolation for computed
 * results is enforced — Postgres RLS is not used — callers MUST pass the id
 * from requireUserId(), never from client input.
 */

export type ComputedSystem =
  | 'dreamspell'
  | 'tzolkin'
  | 'longcount'
  | 'humandesign'
  | 'astrology'
  | 'gematria'

export interface ComputedResultInput {
  system: ComputedSystem
  version: string
  data: Record<string, unknown>
  computed_at?: string
}

/** Returns the ids of the given person ids that the user actually owns. */
async function ownedPersonIds(userId: string, personIds: string[]): Promise<string[]> {
  if (personIds.length === 0) return []
  const db = getDb()
  const owned = await db
    .select({ id: people.id })
    .from(people)
    .where(and(inArray(people.id, personIds), eq(people.owner_id, userId)))
  return owned.map((p) => p.id)
}

/** True if the person exists and is owned by the user. */
async function userOwnsPerson(userId: string, personId: string): Promise<boolean> {
  const db = getDb()
  const [person] = await db
    .select({ id: people.id })
    .from(people)
    .where(and(eq(people.id, personId), eq(people.owner_id, userId)))
    .limit(1)
  return Boolean(person)
}

/**
 * Cached results for a single person. Returns [] if the person is not owned by
 * the user (no leak — same response as "person has no results").
 * Equivalent to: select * from computed_results where person_id = $1
 */
export async function getResultsForPerson(userId: string, personId: string) {
  const db = getDb()
  const id = toEntityId(personId)

  if (!(await userOwnsPerson(userId, id))) return []

  const results = await db
    .select()
    .from(computed_results)
    .where(eq(computed_results.person_id, id))
  return serializeMany(results)
}

/**
 * Cached results for many people at once, filtered to the people the user owns.
 * Returns a flat list across all owned people.
 */
export async function getResultsForPeople(userId: string, personIds: string[]) {
  const db = getDb()
  const requested = personIds.map(toEntityId)
  const allowed = await ownedPersonIds(userId, requested)
  if (allowed.length === 0) return []

  const results = await db
    .select()
    .from(computed_results)
    .where(inArray(computed_results.person_id, allowed))
  return serializeMany(results)
}

/**
 * Upsert a computed result for a person, keyed on (person_id, system, version)
 * to match the unique constraint. Returns null if the person is not owned by
 * the user (never stores a result for a person the user does not own).
 * Uses insert ... on conflict (person_id, system, version) do update.
 */
export async function upsertResult(
  userId: string,
  personId: string,
  input: ComputedResultInput
) {
  const db = getDb()
  const id = toEntityId(personId)

  if (!(await userOwnsPerson(userId, id))) return null

  const computedAt = (
    input.computed_at ? new Date(input.computed_at) : new Date()
  ).toISOString()

  const [result] = await db
    .insert(computed_results)
    .values({
      person_id: id,
      system: input.system,
      version: input.version,
      data: input.data,
      computed_at: computedAt,
    })
    .onConflictDoUpdate({
      target: [computed_results.person_id, computed_results.system, computed_results.version],
      set: { data: input.data, computed_at: computedAt },
    })
    .returning()

  return serialize(result)
}

/**
 * Cached results of one system across many people, filtered to the people the
 * user owns. Used by the resonance matrix to load every pair-cache row in a
 * single query (system = 'compat_pair', person_id = lower id of the pair).
 */
export async function getResultsBySystemForPeople(
  userId: string,
  personIds: string[],
  system: string
) {
  const db = getDb()
  const requested = personIds.map(toEntityId)
  const allowed = await ownedPersonIds(userId, requested)
  if (allowed.length === 0) return []

  const results = await db
    .select()
    .from(computed_results)
    .where(
      and(
        inArray(computed_results.person_id, allowed),
        eq(computed_results.system, system)
      )
    )
  return serializeMany(results)
}

export interface BulkResultInput {
  person_id: string
  system: string
  version: string
  data: Record<string, unknown>
}

/**
 * Upsert many computed results in one statement, keyed on the
 * (person_id, system, version) unique index. Rows whose person is not owned
 * by the user are silently dropped (never stores under a foreign person).
 * Returns the number of rows written.
 */
export async function bulkUpsertResults(
  userId: string,
  rows: BulkResultInput[]
): Promise<number> {
  if (rows.length === 0) return 0
  const db = getDb()

  const requested = [...new Set(rows.map((r) => toEntityId(r.person_id)))]
  const allowed = new Set(await ownedPersonIds(userId, requested))

  const computedAt = new Date().toISOString()
  const values = rows
    .filter((r) => allowed.has(toEntityId(r.person_id)))
    .map((r) => ({
      person_id: toEntityId(r.person_id),
      system: r.system,
      version: r.version,
      data: r.data,
      computed_at: computedAt,
    }))
  if (values.length === 0) return 0

  await db
    .insert(computed_results)
    .values(values)
    .onConflictDoUpdate({
      target: [computed_results.person_id, computed_results.system, computed_results.version],
      set: {
        data: sql`excluded.data`,
        computed_at: sql`excluded.computed_at`,
      },
    })
  return values.length
}

/**
 * Delete (invalidate) all cached results for a person. Returns the number of
 * rows removed; 0 if the person is not owned by the user.
 * Equivalent to: delete from computed_results where person_id = $1
 */
export async function deleteResultsForPerson(
  userId: string,
  personId: string
): Promise<number> {
  const db = getDb()
  const id = toEntityId(personId)

  if (!(await userOwnsPerson(userId, id))) return 0

  const res = await db
    .delete(computed_results)
    .where(eq(computed_results.person_id, id))
    .returning({ id: computed_results.id })
  return res.length
}
