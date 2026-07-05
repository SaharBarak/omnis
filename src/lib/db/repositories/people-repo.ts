import { and, asc, eq, inArray, isNull, or } from 'drizzle-orm'

import { getDb } from '@/lib/db/client'
import { people, person_tags, tags } from '@/lib/db/schema'
import { filterAttachableTagIds } from '@/lib/db/ownership'
import { serialize, serializeMany, toEntityId } from '@/lib/db/serialize'

/**
 * People domain repository. Every function is scoped to the authenticated
 * `userId` (Better Auth id). This is the only place tenant isolation for
 * people/tags is enforced — Postgres RLS is not used — callers MUST pass the
 * id from requireUserId(), never from client input.
 */

export interface PersonInput {
  name: string
  hebrew_name?: string | null
  birth_date: string
  birth_time?: string | null
  birth_place?: { lat?: number; lng?: number; name?: string; city?: string; country?: string; timezone?: string } | null
  avatar_url?: string | null
  notes?: string | null
  is_self?: boolean
}

export type PersonUpdateInput = Partial<PersonInput> & {
  deleted_at?: string | null
}

export async function listPeopleWithTags(userId: string) {
  const db = getDb()

  const [peopleRows, tagRows] = await Promise.all([
    db
      .select()
      .from(people)
      .where(and(eq(people.owner_id, userId), isNull(people.deleted_at)))
      .orderBy(asc(people.name)),
    db
      .select()
      .from(tags)
      .where(or(eq(tags.is_system, true), eq(tags.owner_id, userId)))
      .orderBy(asc(tags.sort_order)),
  ])

  const peopleIds = peopleRows.map((p) => p.id)
  const personTagRows = peopleIds.length
    ? await db.select().from(person_tags).where(inArray(person_tags.person_id, peopleIds))
    : []

  const tagById = new Map(tagRows.map((t) => [t.id, t]))

  const peopleWithTags = peopleRows.map((person) => {
    const pTags = personTagRows
      .filter((pt) => pt.person_id === person.id)
      .map((pt) => tagById.get(pt.tag_id))
      .filter((t): t is NonNullable<typeof t> => Boolean(t))
    return { ...serialize(person), tags: serializeMany(pTags) }
  })

  return { people: peopleWithTags, tags: serializeMany(tagRows) }
}

/**
 * Owner-scoped fetch of a single, non-deleted person plus its tags. Returns
 * null if the person does not exist, is soft-deleted, or is not owned by the
 * user (same response in every case — no ownership leak). Shape matches the
 * `{ ...person, tags }` objects returned by listPeopleWithTags.
 */
export async function getPersonWithTags(userId: string, id: string) {
  const db = getDb()
  const personId = toEntityId(id)

  const [person] = await db
    .select()
    .from(people)
    .where(
      and(eq(people.id, personId), eq(people.owner_id, userId), isNull(people.deleted_at))
    )
    .limit(1)

  if (!person) return null

  const personTagRows = await db
    .select()
    .from(person_tags)
    .where(eq(person_tags.person_id, personId))
  const tagIds = personTagRows.map((pt) => pt.tag_id)
  const tagRows = tagIds.length
    ? await db
        .select()
        .from(tags)
        .where(inArray(tags.id, tagIds))
        .orderBy(asc(tags.sort_order))
    : []

  return { ...serialize(person), tags: serializeMany(tagRows) }
}

async function setPersonTags(userId: string, personId: string, tagIds: string[]) {
  const db = getDb()
  // Only the caller's own tags (plus system tags) may be attached — a foreign
  // tag id is silently dropped rather than persisted as a cross-tenant link.
  const attachable = await filterAttachableTagIds(userId, tagIds)
  await db.delete(person_tags).where(eq(person_tags.person_id, personId))
  if (attachable.length) {
    await db
      .insert(person_tags)
      .values(attachable.map((tagId) => ({ person_id: personId, tag_id: tagId })))
      .onConflictDoNothing()
  }
}

export async function createPerson(
  userId: string,
  input: PersonInput,
  tagIds: string[] = []
) {
  const db = getDb()
  const [person] = await db
    .insert(people)
    .values({ ...input, owner_id: userId })
    .returning()
  if (tagIds.length) {
    await setPersonTags(userId, person.id, tagIds)
  }
  return serialize(person)
}

/** Returns the updated person, or null if it is not owned by the user. */
export async function updatePerson(
  userId: string,
  id: string,
  updates: PersonUpdateInput,
  tagIds?: string[]
) {
  const db = getDb()
  const personId = toEntityId(id)

  const [person] = await db
    .update(people)
    .set({ ...updates, updated_at: new Date().toISOString() })
    .where(and(eq(people.id, personId), eq(people.owner_id, userId)))
    .returning()

  if (!person) return null

  if (tagIds !== undefined) {
    await setPersonTags(userId, personId, tagIds)
  }

  return serialize(person)
}

export async function softDeletePerson(userId: string, id: string) {
  const db = getDb()
  const res = await db
    .update(people)
    .set({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .where(and(eq(people.id, toEntityId(id)), eq(people.owner_id, userId)))
    .returning({ id: people.id })
  return res.length > 0
}

export async function restorePerson(userId: string, id: string) {
  const db = getDb()
  const res = await db
    .update(people)
    .set({ deleted_at: null, updated_at: new Date().toISOString() })
    .where(and(eq(people.id, toEntityId(id)), eq(people.owner_id, userId)))
    .returning({ id: people.id })
  return res.length > 0
}

/**
 * Creates or refreshes the owner's own "self" person from their profile so
 * the user appears on their map from the moment onboarding completes.
 * Server-side only (called from PATCH /api/profile) — bypasses the
 * profiles_count plan cap on purpose: the self entry is free on every plan.
 * A soft-deleted self row is restored rather than duplicated.
 */
export async function upsertSelfPerson(
  userId: string,
  input: Omit<PersonInput, 'is_self'>
) {
  const db = getDb()
  const [existing] = await db
    .select({ id: people.id })
    .from(people)
    .where(and(eq(people.owner_id, userId), eq(people.is_self, true)))
    .limit(1)

  if (existing) {
    const [person] = await db
      .update(people)
      .set({ ...input, deleted_at: null, updated_at: new Date().toISOString() })
      .where(and(eq(people.id, existing.id), eq(people.owner_id, userId)))
      .returning()
    return serialize(person)
  }

  const [person] = await db
    .insert(people)
    .values({ ...input, owner_id: userId, is_self: true })
    .returning()
  return serialize(person)
}

export async function permanentlyDeletePerson(userId: string, id: string) {
  const db = getDb()
  const personId = toEntityId(id)
  const res = await db
    .delete(people)
    .where(and(eq(people.id, personId), eq(people.owner_id, userId)))
    .returning({ id: people.id })
  // person_tags rows are removed by the ON DELETE CASCADE FK on person_id.
  return res.length > 0
}

