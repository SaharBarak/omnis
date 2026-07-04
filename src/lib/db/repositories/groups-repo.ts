import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm'

import { getDb } from '@/lib/db/client'
import { group_members, groups, people } from '@/lib/db/schema'
import { filterOwnedPersonIds } from '@/lib/db/ownership'
import { serialize, serializeMany, toEntityId } from '@/lib/db/serialize'

/**
 * Groups domain repository. Every function is scoped to the authenticated
 * `userId` (Better Auth id). This is the only place tenant isolation for
 * groups/group_members is enforced — callers MUST pass the id from
 * requireUserId(), never from client input.
 *
 * Member operations verify the parent group is owned by the user before any
 * mutation of group_members, so a caller can never attach members to (or read
 * members of) a group they do not own.
 */

export interface GroupInput {
  name: string
  description?: string | null
}

export type GroupUpdateInput = Partial<GroupInput>

/** Confirm the group exists and belongs to the user. Returns its id or null. */
async function assertOwnedGroup(userId: string, groupId: string) {
  const db = getDb()
  const gid = toEntityId(groupId)
  const [group] = await db
    .select({ id: groups.id })
    .from(groups)
    .where(and(eq(groups.id, gid), eq(groups.owner_id, userId)))
    .limit(1)
  return group ? gid : null
}

export async function listGroups(userId: string) {
  const db = getDb()
  const rows = await db
    .select()
    .from(groups)
    .where(eq(groups.owner_id, userId))
    .orderBy(asc(groups.name))
  return serializeMany(rows)
}

/**
 * Reimplements the Postgres RPC `get_group_with_members(p_group_id)`.
 * Returns the group joined to its members (each member projected from the
 * people row plus the membership `added_at`), or null if the group does not
 * exist or is not owned by the user. The `members` array preserves the exact
 * JSON shape the old RPC returned:
 *   { id, name, hebrew_name, birth_date, added_at }
 */
export async function getGroupWithMembers(userId: string, groupId: string) {
  const db = getDb()
  const gid = toEntityId(groupId)

  const [group] = await db
    .select()
    .from(groups)
    .where(and(eq(groups.id, gid), eq(groups.owner_id, userId)))
    .limit(1)
  if (!group) return null

  const memberships = await db
    .select()
    .from(group_members)
    .where(eq(group_members.group_id, gid))
    .orderBy(asc(group_members.added_at))

  const personIds = memberships.map((m) => m.person_id)
  const persons = personIds.length
    ? await db
        .select({
          id: people.id,
          name: people.name,
          hebrew_name: people.hebrew_name,
          birth_date: people.birth_date,
          birth_time: people.birth_time,
          birth_place: people.birth_place,
        })
        .from(people)
        .where(
          and(
            inArray(people.id, personIds),
            eq(people.owner_id, userId),
            isNull(people.deleted_at)
          )
        )
    : []

  const personById = new Map(persons.map((p) => [p.id, p]))

  const members = memberships
    .map((m) => {
      const person = personById.get(m.person_id)
      if (!person) return null
      return {
        id: person.id,
        name: person.name,
        hebrew_name: person.hebrew_name ?? null,
        birth_date: person.birth_date,
        birth_time: person.birth_time ?? null,
        birth_place: person.birth_place
          ? { lat: person.birth_place.lat ?? null, lng: person.birth_place.lng ?? null }
          : null,
        added_at:
          (m.added_at as unknown) instanceof Date
            ? (m.added_at as unknown as Date).toISOString()
            : (m.added_at as unknown as string),
      }
    })
    .filter((m): m is NonNullable<typeof m> => m !== null)

  return { ...serialize(group), members }
}

export async function createGroup(
  userId: string,
  input: GroupInput,
  personIds: string[] = []
) {
  const db = getDb()
  const [group] = await db
    .insert(groups)
    .values({
      owner_id: userId,
      name: input.name,
      description: input.description ?? null,
    })
    .returning()

  const ownedIds = await filterOwnedPersonIds(userId, personIds)
  if (ownedIds.length) {
    await db
      .insert(group_members)
      .values(ownedIds.map((pid) => ({ group_id: group.id, person_id: pid })))
      .onConflictDoNothing()
  }

  return serialize(group)
}

/** Returns the updated group, or null if it is not owned by the user. */
export async function updateGroup(
  userId: string,
  id: string,
  updates: GroupUpdateInput
) {
  const db = getDb()
  const [group] = await db
    .update(groups)
    .set({ ...updates, updated_at: sql`now()` })
    .where(and(eq(groups.id, toEntityId(id)), eq(groups.owner_id, userId)))
    .returning()

  if (!group) return null
  return serialize(group)
}

/** Deletes a group owned by the user and its memberships. Returns true if removed. */
export async function deleteGroup(userId: string, id: string) {
  const db = getDb()
  const gid = toEntityId(id)
  const deleted = await db
    .delete(groups)
    .where(and(eq(groups.id, gid), eq(groups.owner_id, userId)))
    .returning({ id: groups.id })
  if (deleted.length > 0) {
    // Membership rows are already removed by the FK ON DELETE CASCADE; this
    // explicit delete mirrors the previous implementation and is harmless.
    await db.delete(group_members).where(eq(group_members.group_id, gid))
  }
  return deleted.length > 0
}

/**
 * Adds a member to a group the user owns.
 * Returns 'ok', 'not_found' (group missing/not owned), or 'duplicate'.
 */
export async function addMemberToGroup(
  userId: string,
  groupId: string,
  personId: string
): Promise<'ok' | 'not_found' | 'duplicate'> {
  const db = getDb()
  const gid = await assertOwnedGroup(userId, groupId)
  if (!gid) return 'not_found'

  // Reject a person the caller does not own (cross-tenant IDOR guard).
  const [pid] = await filterOwnedPersonIds(userId, [personId])
  if (!pid) return 'not_found'
  try {
    await db.insert(group_members).values({ group_id: gid, person_id: pid })
    return 'ok'
  } catch (error) {
    // Duplicate key on the (group_id, person_id) primary key.
    if ((error as { code?: string }).code === '23505') return 'duplicate'
    throw error
  }
}

/**
 * Removes a member from a group the user owns.
 * Returns false if the group is missing/not owned (membership left untouched).
 */
export async function removeMemberFromGroup(
  userId: string,
  groupId: string,
  personId: string
): Promise<boolean> {
  const db = getDb()
  const gid = await assertOwnedGroup(userId, groupId)
  if (!gid) return false

  await db
    .delete(group_members)
    .where(
      and(
        eq(group_members.group_id, gid),
        eq(group_members.person_id, toEntityId(personId))
      )
    )
  return true
}

/**
 * Replaces all members of a group the user owns with the given person ids.
 * Returns false if the group is missing/not owned.
 */
export async function setGroupMembers(
  userId: string,
  groupId: string,
  personIds: string[]
): Promise<boolean> {
  const db = getDb()
  const gid = await assertOwnedGroup(userId, groupId)
  if (!gid) return false

  const ownedIds = await filterOwnedPersonIds(userId, personIds)
  await db.delete(group_members).where(eq(group_members.group_id, gid))
  if (ownedIds.length) {
    await db
      .insert(group_members)
      .values(ownedIds.map((pid) => ({ group_id: gid, person_id: pid })))
      .onConflictDoNothing()
  }
  return true
}
