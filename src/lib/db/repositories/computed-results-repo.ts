import { connectMongo } from '@/lib/db/connection'
import { ComputedResult, Person } from '@/lib/db/models'
import type { ComputedSystem } from '@/lib/db/models'
import { serialize, serializeMany, toObjectId } from '@/lib/db/serialize'

/**
 * Computed-results domain repository. computed_results cache the symbolic-system
 * calculations (dreamspell/astrology/human-design/etc.) for each person.
 *
 * SECURITY: computed_results have no `owner_id` of their own — ownership is
 * derived from the parent Person. Every function therefore verifies that the
 * person belongs to the authenticated `userId` (via Person.owner_id) before
 * reading or writing. This is the only place tenant isolation for computed
 * results is enforced now that Postgres RLS is gone — callers MUST pass the id
 * from requireUserId(), never from client input.
 */

export interface ComputedResultInput {
  system: ComputedSystem
  version: string
  data: Record<string, unknown>
  computed_at?: string
}

/** Returns the ObjectIds of the given person ids that the user actually owns. */
async function ownedPersonIds(
  userId: string,
  personIds: ReturnType<typeof toObjectId>[]
): Promise<ReturnType<typeof toObjectId>[]> {
  if (personIds.length === 0) return []
  const owned = await Person.find({ _id: { $in: personIds }, owner_id: userId })
    .select('_id')
    .lean()
  return owned.map((p) => p._id)
}

/** True if the person exists and is owned by the user. */
async function userOwnsPerson(
  userId: string,
  personObjId: ReturnType<typeof toObjectId>
): Promise<boolean> {
  const person = await Person.findOne({ _id: personObjId, owner_id: userId })
    .select('_id')
    .lean()
  return Boolean(person)
}

/**
 * Cached results for a single person. Returns [] if the person is not owned by
 * the user (no leak — same response as "person has no results").
 * Replaces: supabase.from('computed_results').select('*').eq('person_id', id)
 */
export async function getResultsForPerson(userId: string, personId: string) {
  await connectMongo()
  const personObjId = toObjectId(personId)

  if (!(await userOwnsPerson(userId, personObjId))) return []

  const results = await ComputedResult.find({ person_id: personObjId }).lean()
  return serializeMany(results)
}

/**
 * Cached results for many people at once, filtered to the people the user owns.
 * Returns a flat list across all owned people.
 */
export async function getResultsForPeople(userId: string, personIds: string[]) {
  await connectMongo()
  const requested = personIds.map(toObjectId)
  const allowed = await ownedPersonIds(userId, requested)
  if (allowed.length === 0) return []

  const results = await ComputedResult.find({
    person_id: { $in: allowed },
  }).lean()
  return serializeMany(results)
}

/**
 * Upsert a computed result for a person, keyed on (person_id, system, version)
 * to match the unique constraint. Returns null if the person is not owned by
 * the user (never stores a result for a person the user does not own).
 * Replaces: supabase.from('computed_results').upsert(..., { onConflict:
 * 'person_id,system,version' })
 */
export async function upsertResult(
  userId: string,
  personId: string,
  input: ComputedResultInput
) {
  await connectMongo()
  const personObjId = toObjectId(personId)

  if (!(await userOwnsPerson(userId, personObjId))) return null

  const computedAt = input.computed_at ? new Date(input.computed_at) : new Date()

  const result = await ComputedResult.findOneAndUpdate(
    { person_id: personObjId, system: input.system, version: input.version },
    { $set: { data: input.data, computed_at: computedAt } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean()

  return serialize(result)
}

/**
 * Delete (invalidate) all cached results for a person. Returns the number of
 * documents removed; 0 if the person is not owned by the user.
 * Replaces: supabase.from('computed_results').delete().eq('person_id', id)
 */
export async function deleteResultsForPerson(
  userId: string,
  personId: string
): Promise<number> {
  await connectMongo()
  const personObjId = toObjectId(personId)

  if (!(await userOwnsPerson(userId, personObjId))) return 0

  const res = await ComputedResult.deleteMany({ person_id: personObjId })
  return res.deletedCount ?? 0
}
