import { connectMongo } from '@/lib/db/connection'
import { SharedView } from '@/lib/db/models'
import type { ShareType } from '@/lib/db/models'
import { serialize, serializeMany, toObjectId } from '@/lib/db/serialize'

/**
 * Shares domain repository (shared_views). Owner-scoped CRUD is keyed to the
 * authenticated `userId` (Better Auth id) and is the only place tenant
 * isolation for shared_views is enforced now that Postgres RLS is gone —
 * callers MUST pass the id from requireUserId(), never from client input.
 *
 * The ONLY functions that read/mutate without an owner filter are
 * `getSharedViewByToken` and `incrementSharedViewCount`, which match on the
 * unguessable `url_token` plus the `active` flag (and expiry / max-view caps).
 */

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
  await connectMongo()
  const views = await SharedView.find({ owner_id: userId })
    .sort({ created_at: -1 })
    .lean()
  return serializeMany(views)
}

export async function createSharedView(userId: string, input: SharedViewInput) {
  await connectMongo()
  const view = await SharedView.create({
    owner_id: userId,
    share_type: input.share_type,
    options: input.options ?? {},
    url_token: input.url_token,
    expires_at: input.expires_at ? new Date(input.expires_at) : null,
    max_views: input.max_views ?? null,
    password_hash: input.password_hash ?? null,
    active: true,
  })
  return serialize(view.toObject())
}

/** Returns the updated view, or null if it is not owned by the user. */
export async function updateSharedView(
  userId: string,
  id: string,
  updates: SharedViewUpdateInput
) {
  await connectMongo()
  const view = await SharedView.findOneAndUpdate(
    { _id: toObjectId(id), owner_id: userId },
    { $set: updates },
    { new: true }
  ).lean()
  return view ? serialize(view) : null
}

export async function deleteSharedView(userId: string, id: string) {
  await connectMongo()
  const res = await SharedView.deleteOne({ _id: toObjectId(id), owner_id: userId })
  return res.deletedCount > 0
}

// ---------------------------------------------------------------------------
// PUBLIC token access
// ---------------------------------------------------------------------------

/**
 * PUBLIC — no owner filter. Reads a shared_view only by the unguessable
 * `url_token` plus the `active` flag. Returns the serialized view (including
 * its `password_hash` so the caller can challenge), or null if not found. The
 * route layer is responsible for expiry / max-view / password gating.
 */
export async function getSharedViewByToken(token: string) {
  await connectMongo()
  const view = await SharedView.findOne({ url_token: token, active: true }).lean()
  return view ? serialize(view) : null
}

/**
 * Ports `increment_shared_view_count(TEXT)` (00002_relationships_schema.sql).
 *
 * PUBLIC — no owner filter. Matches by `url_token` + `active` + unexpired,
 * deactivates the share when the max-view cap is reached (returning false), and
 * otherwise atomically `$inc`s `view_count`. Returns true on a successful
 * increment, false when the share is missing/expired/capped.
 */
export async function incrementSharedViewCount(token: string): Promise<boolean> {
  await connectMongo()
  const now = new Date()

  const view = await SharedView.findOne({
    url_token: token,
    active: true,
    $or: [{ expires_at: null }, { expires_at: { $gt: now } }],
  })
    .select('view_count max_views')
    .lean()

  if (!view) return false

  if (view.max_views !== null && view.max_views !== undefined && view.view_count >= view.max_views) {
    await SharedView.updateOne({ url_token: token }, { $set: { active: false } })
    return false
  }

  await SharedView.updateOne({ url_token: token }, { $inc: { view_count: 1 } })
  return true
}
