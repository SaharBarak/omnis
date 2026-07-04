import { and, eq, inArray, isNull } from 'drizzle-orm'

import { getDb } from '@/lib/db/client'
import { people, tags } from '@/lib/db/schema'
import { toEntityId } from '@/lib/db/serialize'

/**
 * Cross-tenant write guards. With Postgres RLS gone, write paths that accept
 * client-supplied entity ids (group members, person tags, relationship
 * endpoints) MUST verify those ids belong to the caller before persisting —
 * UUID-shape validation alone is not enough. These helpers are the single
 * audited home for that check so it is written once, not per repo.
 */

/**
 * Validate + reduce client-supplied person ids to those the user actually
 * owns (and that are not soft-deleted). Throws BadIdError on malformed ids
 * (via toEntityId); silently drops ids owned by another tenant.
 */
export async function filterOwnedPersonIds(
  userId: string,
  personIds: string[]
): Promise<string[]> {
  if (personIds.length === 0) return []
  const ids = personIds.map(toEntityId)
  const db = getDb()
  const rows = await db
    .select({ id: people.id })
    .from(people)
    .where(
      and(
        inArray(people.id, ids),
        eq(people.owner_id, userId),
        isNull(people.deleted_at)
      )
    )
  return rows.map((r) => r.id)
}

/** True when every supplied person id is owned by the user (non-deleted). */
export async function ownsAllPeople(
  userId: string,
  personIds: string[]
): Promise<boolean> {
  const owned = await filterOwnedPersonIds(userId, personIds)
  return owned.length === personIds.length
}

/**
 * Reduce client-supplied tag ids to those the user may attach: their own
 * tags plus system tags (owner_id null). Drops foreign-owned tag ids.
 */
export async function filterAttachableTagIds(
  userId: string,
  tagIds: string[]
): Promise<string[]> {
  if (tagIds.length === 0) return []
  const ids = tagIds.map(toEntityId)
  const db = getDb()
  const rows = await db
    .select({ id: tags.id, owner_id: tags.owner_id, is_system: tags.is_system })
    .from(tags)
    .where(inArray(tags.id, ids))
  return rows
    .filter((t) => t.is_system || t.owner_id === userId)
    .map((t) => t.id)
}
