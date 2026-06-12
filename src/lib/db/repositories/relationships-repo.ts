import { connectMongo } from '@/lib/db/connection'
import { Relationship, Person } from '@/lib/db/models'
import { serialize, toObjectId } from '@/lib/db/serialize'
import type { RelationshipType } from '@/lib/db/models'

/**
 * Relationships domain repository. Every function is scoped to the authenticated
 * `userId` (Better Auth id). This is the only place tenant isolation for
 * relationships is enforced now that Postgres RLS is gone — callers MUST pass the
 * id from requireUserId(), never from client input.
 *
 * Relationship rows carry their own `owner_id`, so the primary tenant filter is
 * `owner_id === userId` on the relationships collection. On create we additionally
 * verify both referenced people belong to the user (mirroring the old Postgres
 * INSERT policy's EXISTS checks) so a relationship can never point at someone
 * else's person.
 */

export interface RelationshipInput {
  person1_id: string
  person2_id: string
  type: RelationshipType
  subtype?: string | null
  bidirectional?: boolean
  strength?: number
  start_date?: string | null
  end_date?: string | null
  notes?: string | null
}

export interface RelationshipUpdateInput {
  type?: RelationshipType
  subtype?: string | null
  bidirectional?: boolean
  strength?: number
  start_date?: string | null
  end_date?: string | null
  notes?: string | null
}

/**
 * List all of the user's relationships, newest first, each enriched with its two
 * people. Mirrors the old hook's fetchRelationships: it pulled every relationship
 * then joined people. People are themselves owner-scoped so a relationship whose
 * referenced person is missing/not owned is dropped (no cross-tenant leak).
 */
export async function listRelationshipsWithPeople(userId: string) {
  await connectMongo()

  const relationships = await Relationship.find({ owner_id: userId })
    .sort({ created_at: -1 })
    .lean()

  if (relationships.length === 0) return []

  const personIds = new Set<string>()
  for (const r of relationships) {
    personIds.add(String(r.person1_id))
    personIds.add(String(r.person2_id))
  }

  const people = await Person.find({
    _id: { $in: Array.from(personIds).map((id) => toObjectId(id)) },
    owner_id: userId,
    deleted_at: null,
  }).lean()

  const peopleById = new Map(people.map((p) => [String(p._id), p]))

  return relationships
    .filter(
      (r) =>
        peopleById.has(String(r.person1_id)) &&
        peopleById.has(String(r.person2_id))
    )
    .map((r) => ({
      ...serialize(r),
      person1: serialize(peopleById.get(String(r.person1_id))!),
      person2: serialize(peopleById.get(String(r.person2_id))!),
    }))
}

/**
 * Create a relationship owned by the user. Verifies both people belong to the
 * user first (replaces the Postgres INSERT WITH CHECK EXISTS clauses).
 * Throws if either person is missing/not owned, or on the duplicate-key error
 * from the unique (owner_id, person1_id, person2_id, type) index.
 */
export async function createRelationship(userId: string, input: RelationshipInput) {
  await connectMongo()

  const person1ObjId = toObjectId(input.person1_id)
  const person2ObjId = toObjectId(input.person2_id)

  const ownedCount = await Person.countDocuments({
    _id: { $in: [person1ObjId, person2ObjId] },
    owner_id: userId,
    deleted_at: null,
  })
  if (ownedCount < 2) {
    throw new RelationshipPeopleError(
      'Both people must belong to the current user'
    )
  }

  try {
    const created = await Relationship.create({
      owner_id: userId,
      person1_id: person1ObjId,
      person2_id: person2ObjId,
      type: input.type,
      subtype: input.subtype ?? null,
      bidirectional: input.bidirectional ?? true,
      strength: input.strength ?? 3,
      start_date: input.start_date ?? null,
      end_date: input.end_date ?? null,
      notes: input.notes ?? null,
    })
    return serialize(created.toObject())
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new DuplicateRelationshipError(
        'A relationship of this type already exists between these people'
      )
    }
    throw error
  }
}

/** Returns the updated relationship, or null if it is not owned by the user. */
export async function updateRelationship(
  userId: string,
  id: string,
  updates: RelationshipUpdateInput
) {
  await connectMongo()
  const relObjId = toObjectId(id)

  const $set: Record<string, unknown> = {}
  if (updates.type !== undefined) $set.type = updates.type
  if (updates.subtype !== undefined) $set.subtype = updates.subtype
  if (updates.bidirectional !== undefined) $set.bidirectional = updates.bidirectional
  if (updates.strength !== undefined) $set.strength = updates.strength
  if (updates.start_date !== undefined) $set.start_date = updates.start_date
  if (updates.end_date !== undefined) $set.end_date = updates.end_date
  if (updates.notes !== undefined) $set.notes = updates.notes

  const relationship = await Relationship.findOneAndUpdate(
    { _id: relObjId, owner_id: userId },
    { $set },
    { new: true }
  ).lean()

  if (!relationship) return null
  return serialize(relationship)
}

/** Deletes a relationship owned by the user. Returns true if removed. */
export async function deleteRelationship(userId: string, id: string) {
  await connectMongo()
  const res = await Relationship.deleteOne({
    _id: toObjectId(id),
    owner_id: userId,
  })
  return res.deletedCount > 0
}

/**
 * Ports the `get_person_relationships(UUID)` RPC.
 *
 * Returns every relationship in either direction for a person the user owns:
 *  - all relationships where the person is person1, plus
 *  - bidirectional relationships where the person is person2,
 * each shaped from that person's perspective (the "other" person resolved).
 *
 * Tenant scoping: the relationship query filters by `owner_id === userId`, and
 * the person we anchor on must itself be owned by the user. The other person is
 * resolved via an owner-scoped Person lookup, so a row whose other person is
 * missing/not owned is dropped.
 */
export async function getPersonRelationships(userId: string, personId: string) {
  await connectMongo()
  const personObjId = toObjectId(personId)

  // Anchor person must belong to the user.
  const anchor = await Person.findOne({
    _id: personObjId,
    owner_id: userId,
    deleted_at: null,
  }).lean()
  if (!anchor) return []

  // WHERE owner_id = userId AND (person1 = p OR (person2 = p AND bidirectional))
  const relationships = await Relationship.find({
    owner_id: userId,
    $or: [
      { person1_id: personObjId },
      { person2_id: personObjId, bidirectional: true },
    ],
  })
    .sort({ created_at: -1 })
    .lean()

  if (relationships.length === 0) return []

  const otherIds = relationships.map((r) =>
    String(r.person1_id) === String(personObjId) ? r.person2_id : r.person1_id
  )

  const otherPeople = await Person.find({
    _id: { $in: otherIds },
    owner_id: userId,
    deleted_at: null,
  }).lean()

  const peopleById = new Map(otherPeople.map((p) => [String(p._id), p]))

  return relationships
    .map((r) => {
      const otherId =
        String(r.person1_id) === String(personObjId)
          ? r.person2_id
          : r.person1_id
      const otherPerson = peopleById.get(String(otherId))
      if (!otherPerson) return null
      return {
        id: serialize<{ id: string }>(r).id,
        type: r.type,
        subtype: r.subtype ?? null,
        strength: r.strength,
        bidirectional: r.bidirectional,
        startDate: r.start_date ?? null,
        endDate: r.end_date ?? null,
        notes: r.notes ?? null,
        otherPerson: serialize(otherPerson),
        createdAt: serialize<{ created_at: string }>(r).created_at,
        updatedAt: serialize<{ updated_at: string }>(r).updated_at,
      }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
}

/**
 * Ports the `get_relationship_graph()` RPC.
 *
 * Returns `{ nodes, edges }` for the current user:
 *  - nodes: the user's non-deleted people, shaped { id, name, hebrew_name, birth_date }.
 *  - edges: the user's relationships, shaped { id, source, target, type, subtype, bidirectional, strength }.
 *
 * Same JSON shape the old SQL function returned (RawGraphData). Both queries are
 * owner-scoped, so no cross-tenant node or edge can appear.
 */
export async function getRelationshipGraph(userId: string) {
  await connectMongo()

  const [people, relationships] = await Promise.all([
    Person.find({ owner_id: userId, deleted_at: null })
      .select({ name: 1, hebrew_name: 1, birth_date: 1 })
      .lean(),
    Relationship.find({ owner_id: userId })
      .select({
        person1_id: 1,
        person2_id: 1,
        type: 1,
        subtype: 1,
        bidirectional: 1,
        strength: 1,
      })
      .lean(),
  ])

  const nodes = people.map((p) => {
    const s = serialize<{ id: string }>(p)
    return {
      id: s.id,
      name: p.name,
      hebrew_name: p.hebrew_name ?? null,
      birth_date: p.birth_date,
    }
  })

  const edges = relationships.map((r) => {
    const s = serialize<{ id: string }>(r)
    return {
      id: s.id,
      source: String(r.person1_id),
      target: String(r.person2_id),
      type: r.type,
      subtype: r.subtype ?? null,
      bidirectional: r.bidirectional,
      strength: r.strength,
    }
  })

  return { nodes, edges }
}

// ----------------------------------------------------------------------------
// Errors mapped to HTTP responses by the route handlers.
// ----------------------------------------------------------------------------

/** Thrown when a relationship references a person the user does not own. */
export class RelationshipPeopleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RelationshipPeopleError'
  }
}

/** Thrown on the unique-index violation (duplicate relationship). */
export class DuplicateRelationshipError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DuplicateRelationshipError'
  }
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: number }).code === 11000
  )
}
