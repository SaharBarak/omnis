import { and, desc, eq, gt, isNull, or, sql } from 'drizzle-orm'

import { getDb } from '@/lib/db/client'
import { shared_views } from '@/lib/db/schema'
import { serialize, serializeMany, toEntityId } from '@/lib/db/serialize'

/**
 * Shares domain repository (shared_views). Owner-scoped CRUD is keyed to the
 * authenticated `userId` (Auth0 subject) and is the only place tenant
 * isolation for shared_views is enforced — callers MUST pass the id from
 * requireUserId(), never from client input.
 *
 * The ONLY functions that read/mutate without an owner filter are
 * `getSharedViewByToken` and `incrementSharedViewCount`, which match on the
 * unguessable `url_token` plus the `active` flag (and expiry / max-view caps).
 */

type ShareType = 'person' | 'relationship' | 'group' | 'graph'

export interface SharedViewInput {
  share_type: ShareType
  options?: Record<string, unknown>
  url_token: string
  expires_at?: string | null
  max_views?: number | null
  password_hash?: string | null
}

export type SharedViewUpdateInput = {
  active?: boolean
}

// ---------------------------------------------------------------------------
// Owner-scoped shared_views CRUD
// ---------------------------------------------------------------------------

export async function listSharedViews(userId: string) {
  const db = getDb()
  const views = await db
    .select()
    .from(shared_views)
    .where(eq(shared_views.owner_id, userId))
    .orderBy(desc(shared_views.created_at))
  return serializeMany(views)
}

export async function createSharedView(userId: string, input: SharedViewInput) {
  const db = getDb()
  const [view] = await db
    .insert(shared_views)
    .values({
      owner_id: userId,
      share_type: input.share_type,
      options: input.options ?? {},
      url_token: input.url_token,
      expires_at: input.expires_at ?? null,
      max_views: input.max_views ?? null,
      password_hash: input.password_hash ?? null,
      active: true,
    })
    .returning()
  return serialize(view)
}

/** Returns the updated view, or null if it is not owned by the user. */
export async function updateSharedView(
  userId: string,
  id: string,
  updates: SharedViewUpdateInput
) {
  const db = getDb()
  const ownedFilter = and(
    eq(shared_views.id, toEntityId(id)),
    eq(shared_views.owner_id, userId)
  )

  // Drizzle rejects an empty set; Mongo's empty $set was a no-op read.
  if (updates.active === undefined) {
    const [existing] = await db.select().from(shared_views).where(ownedFilter).limit(1)
    return existing ? serialize(existing) : null
  }

  const [view] = await db
    .update(shared_views)
    .set({ active: updates.active })
    .where(ownedFilter)
    .returning()
  return view ? serialize(view) : null
}

export async function deleteSharedView(userId: string, id: string) {
  const db = getDb()
  const deleted = await db
    .delete(shared_views)
    .where(
      and(eq(shared_views.id, toEntityId(id)), eq(shared_views.owner_id, userId))
    )
    .returning({ id: shared_views.id })
  return deleted.length > 0
}

// ---------------------------------------------------------------------------
// PUBLIC token access
// ---------------------------------------------------------------------------

/** Public-safe projection of a shared_view — never exposes password_hash
 *  or owner_id to unauthenticated callers. `requires_password` lets the page
 *  render a challenge without ever shipping the hash. */
export interface PublicSharedView {
  id: string
  share_type: ShareType
  options: Record<string, unknown>
  url_token: string
  expires_at: string | null
  max_views: number | null
  view_count: number
  requires_password: boolean
  active: boolean
  created_at: string
}

/**
 * PUBLIC — no owner filter. Reads a shared_view only by the unguessable
 * `url_token` plus the `active` flag. Returns a public-safe projection
 * (no password_hash, no owner_id), or null if not found. The route layer is
 * responsible for expiry / max-view gating; password gating uses
 * `verifySharePassword` so the hash never leaves the server.
 */
export async function getSharedViewByToken(
  token: string
): Promise<PublicSharedView | null> {
  const db = getDb()
  const [view] = await db
    .select({
      id: shared_views.id,
      share_type: shared_views.share_type,
      options: shared_views.options,
      url_token: shared_views.url_token,
      expires_at: shared_views.expires_at,
      max_views: shared_views.max_views,
      view_count: shared_views.view_count,
      password_hash: shared_views.password_hash,
      active: shared_views.active,
      created_at: shared_views.created_at,
    })
    .from(shared_views)
    .where(and(eq(shared_views.url_token, token), eq(shared_views.active, true)))
    .limit(1)
  if (!view) return null
  const { password_hash, ...safe } = view
  return {
    ...serialize<Omit<PublicSharedView, 'requires_password'>>(safe),
    requires_password: password_hash != null,
  }
}

/**
 * PUBLIC — server-side password check for a protected share. Compares the
 * candidate against the stored hash without ever returning the hash. Returns
 * true when the share has no password or the candidate matches.
 */
export async function verifySharePassword(
  token: string,
  candidateHash: string | null
): Promise<boolean> {
  const db = getDb()
  const [row] = await db
    .select({ password_hash: shared_views.password_hash })
    .from(shared_views)
    .where(and(eq(shared_views.url_token, token), eq(shared_views.active, true)))
    .limit(1)
  if (!row) return false
  if (row.password_hash == null) return true
  return candidateHash != null && candidateHash === row.password_hash
}

/**
 * Ports `increment_shared_view_count(TEXT)` (00002_relationships_schema.sql).
 *
 * PUBLIC — no owner filter. Matches by `url_token` + `active` + unexpired,
 * deactivates the share when the max-view cap is reached (returning false), and
 * otherwise atomically increments `view_count`. Returns true on a successful
 * increment, false when the share is missing/expired/capped.
 */
export async function incrementSharedViewCount(token: string): Promise<boolean> {
  const db = getDb()
  const now = new Date().toISOString()

  // Single conditional UPDATE — the cap check and increment happen atomically
  // so concurrent viewers cannot race past max_views (the guarantee the old
  // increment_shared_view_count RPC provided).
  const incremented = await db
    .update(shared_views)
    .set({ view_count: sql`${shared_views.view_count} + 1` })
    .where(
      and(
        eq(shared_views.url_token, token),
        eq(shared_views.active, true),
        or(isNull(shared_views.expires_at), gt(shared_views.expires_at, now)),
        or(
          isNull(shared_views.max_views),
          sql`${shared_views.view_count} < ${shared_views.max_views}`
        )
      )
    )
    .returning({ view_count: shared_views.view_count, max_views: shared_views.max_views })

  if (incremented.length === 0) return false

  // Deactivate once the cap is reached so the next read short-circuits.
  const [row] = incremented
  if (row.max_views !== null && row.view_count >= row.max_views) {
    await db
      .update(shared_views)
      .set({ active: false })
      .where(eq(shared_views.url_token, token))
  }
  return true
}
