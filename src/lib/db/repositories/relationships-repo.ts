import { and, desc, eq, inArray, isNull, or } from 'drizzle-orm'

import { getDb } from '@/lib/db/client'
import { people, relationships } from '@/lib/db/schema'
import { isUniqueViolation } from '@/lib/db/errors'
import { serialize, toEntityId } from '@/lib/db/serialize'
import type { RelationshipType } from '@/lib/types/relationship'

/**
 * Relationships domain repository. Every function is scoped to the authenticated
 * `userId` (Auth0 subject). This is the only place tenant isolation for
 * relationships is enforced — callers MUST pass the id from requireUserId(),
 * never from client input.
 *
 * Relationship rows carry their own `owner_id`, so the primary tenant filter is
 * `owner_id = userId` on the relationships table. On create we additionally
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
  const db = getDb()

  const rels = await db
    .select()
    .from(relationships)
    .where(eq(relationships.owner_id, userId))
    .orderBy(desc(relationships.created_at))

  if (rels.length === 0) return []

  const personIds = new Set<string>()
  for (const r of rels) {
    personIds.add(r.person1_id)
    personIds.add(r.person2_id)
  }

  const persons = await db
    .select()
    .from(people)
    .where(
      and(
        inArray(people.id, Array.from(personIds)),
        eq(people.owner_id, userId),
        isNull(people.deleted_at)
      )
    )

  const peopleById = new Map(persons.map((p) => [p.id, p]))

  return rels
    .filter((r) => peopleById.has(r.person1_id) && peopleById.has(r.person2_id))
    .map((r) => ({
      ...serialize(r),
      person1: serialize(peopleById.get(r.person1_id)!),
      person2: serialize(peopleById.get(r.person2_id)!),
    }))
}

/**
 * Create a relationship owned by the user. Verifies both people belong to the
 * user first (replaces the Postgres INSERT WITH CHECK EXISTS clauses).
 * Throws if either person is missing/not owned, or on the unique-constraint
 * violation from the (owner_id, person1_id, person2_id, type) index.
 */
export async function createRelationship(userId: string, input: RelationshipInput) {
  const db = getDb()

  const rawP1 = toEntityId(input.person1_id)
  const rawP2 = toEntityId(input.person2_id)
  const bidirectional = input.bidirectional ?? true

  // Canonicalize endpoint order for bidirectional relationships so the reversed
  // pair (B,A) collides with the (owner_id, person1_id, person2_id, type) unique
  // index instead of being stored as a phantom duplicate. Directional links keep
  // the caller's order.
  const [person1Id, person2Id] =
    bidirectional && rawP1 > rawP2 ? [rawP2, rawP1] : [rawP1, rawP2]

  const owned = await db
    .select({ id: people.id })
    .from(people)
    .where(
      and(
        inArray(people.id, [person1Id, person2Id]),
        eq(people.owner_id, userId),
        isNull(people.deleted_at)
      )
    )
  if (owned.length < 2) {
    throw new RelationshipPeopleError(
      'Both people must belong to the current user'
    )
  }

  try {
    const [created] = await db
      .insert(relationships)
      .values({
        owner_id: userId,
        person1_id: person1Id,
        person2_id: person2Id,
        type: input.type,
        subtype: input.subtype ?? null,
        bidirectional,
        strength: input.strength ?? 3,
        start_date: input.start_date ?? null,
        end_date: input.end_date ?? null,
        notes: input.notes ?? null,
      })
      .returning()
    return serialize(created)
  } catch (error) {
    if (isUniqueViolation(error)) {
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
  const db = getDb()
  const relId = toEntityId(id)

  const set: Record<string, unknown> = {}
  if (updates.type !== undefined) set.type = updates.type
  if (updates.subtype !== undefined) set.subtype = updates.subtype
  if (updates.bidirectional !== undefined) set.bidirectional = updates.bidirectional
  if (updates.strength !== undefined) set.strength = updates.strength
  if (updates.start_date !== undefined) set.start_date = updates.start_date
  if (updates.end_date !== undefined) set.end_date = updates.end_date
  if (updates.notes !== undefined) set.notes = updates.notes

  const ownedFilter = and(eq(relationships.id, relId), eq(relationships.owner_id, userId))

  // Drizzle rejects an empty set; Mongo's empty $set was a no-op read.
  if (Object.keys(set).length === 0) {
    const [existing] = await db.select().from(relationships).where(ownedFilter).limit(1)
    return existing ? serialize(existing) : null
  }

  // Mongoose timestamps bumped updated_at on every update; do the same here.
  set.updated_at = new Date().toISOString()

  const [relationship] = await db
    .update(relationships)
    .set(set)
    .where(ownedFilter)
    .returning()

  if (!relationship) return null
  return serialize(relationship)
}

/** Deletes a relationship owned by the user. Returns true if removed. */
export async function deleteRelationship(userId: string, id: string) {
  const db = getDb()
  const deleted = await db
    .delete(relationships)
    .where(
      and(eq(relationships.id, toEntityId(id)), eq(relationships.owner_id, userId))
    )
    .returning({ id: relationships.id })
  return deleted.length > 0
}

/**
 * Ports the `get_person_relationships(UUID)` RPC.
 *
 * Returns every relationship in either direction for a person the user owns:
 *  - all relationships where the person is person1, plus
 *  - bidirectional relationships where the person is person2,
 * each shaped from that person's perspective (the "other" person resolved).
 *
 * Tenant scoping: the relationship query filters by `owner_id = userId`, and
 * the person we anchor on must itself be owned by the user. The other person is
 * resolved via an owner-scoped people lookup, so a row whose other person is
 * missing/not owned is dropped.
 */
export async function getPersonRelationships(userId: string, personId: string) {
  const db = getDb()
  const anchorId = toEntityId(personId)

  // Anchor person must belong to the user.
  const [anchor] = await db
    .select({ id: people.id })
    .from(people)
    .where(
      and(eq(people.id, anchorId), eq(people.owner_id, userId), isNull(people.deleted_at))
    )
    .limit(1)
  if (!anchor) return []

  // WHERE owner_id = userId AND (person1 = p OR (person2 = p AND bidirectional))
  const rels = await db
    .select()
    .from(relationships)
    .where(
      and(
        eq(relationships.owner_id, userId),
        or(
          eq(relationships.person1_id, anchorId),
          and(eq(relationships.person2_id, anchorId), eq(relationships.bidirectional, true))
        )
      )
    )
    .orderBy(desc(relationships.created_at))

  if (rels.length === 0) return []

  const otherIds = rels.map((r) =>
    r.person1_id === anchorId ? r.person2_id : r.person1_id
  )

  const otherPeople = await db
    .select()
    .from(people)
    .where(
      and(
        inArray(people.id, otherIds),
        eq(people.owner_id, userId),
        isNull(people.deleted_at)
      )
    )

  const peopleById = new Map(otherPeople.map((p) => [p.id, p]))

  return rels
    .map((r) => {
      const otherId = r.person1_id === anchorId ? r.person2_id : r.person1_id
      const otherPerson = peopleById.get(otherId)
      if (!otherPerson) return null
      return {
        id: r.id,
        type: r.type,
        subtype: r.subtype ?? null,
        strength: r.strength,
        bidirectional: r.bidirectional,
        startDate: r.start_date ?? null,
        endDate: r.end_date ?? null,
        notes: r.notes ?? null,
        otherPerson: serialize(otherPerson),
        createdAt: r.created_at,
        updatedAt: r.updated_at,
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
  const db = getDb()

  const [persons, rels] = await Promise.all([
    db
      .select({
        id: people.id,
        name: people.name,
        hebrew_name: people.hebrew_name,
        birth_date: people.birth_date,
      })
      .from(people)
      .where(and(eq(people.owner_id, userId), isNull(people.deleted_at))),
    db
      .select({
        id: relationships.id,
        person1_id: relationships.person1_id,
        person2_id: relationships.person2_id,
        type: relationships.type,
        subtype: relationships.subtype,
        bidirectional: relationships.bidirectional,
        strength: relationships.strength,
      })
      .from(relationships)
      .where(eq(relationships.owner_id, userId)),
  ])

  const nodes = persons.map((p) => ({
    id: p.id,
    name: p.name,
    hebrew_name: p.hebrew_name ?? null,
    birth_date: p.birth_date,
  }))

  const edges = rels.map((r) => ({
    id: r.id,
    source: r.person1_id,
    target: r.person2_id,
    type: r.type,
    subtype: r.subtype ?? null,
    bidirectional: r.bidirectional,
    strength: r.strength,
  }))

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

/** Postgres unique_violation (was Mongo duplicate-key code 11000). */
