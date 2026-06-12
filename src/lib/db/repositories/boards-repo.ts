import { connectMongo } from '@/lib/db/connection'
import { Board, BoardShare, Profile } from '@/lib/db/models'
import type { BoardTemplate } from '@/lib/db/models'
import { serialize, serializeMany, toObjectId } from '@/lib/db/serialize'

/**
 * Boards domain repository. Every owner-scoped function is keyed to the
 * authenticated `userId` (Better Auth id) and is the only place tenant
 * isolation for boards/board_shares is enforced now that Postgres RLS is gone —
 * callers MUST pass the id from requireUserId(), never from client input.
 *
 * The ONLY function that reads without an owner filter is
 * `getBoardByShareToken`, which matches on the unguessable `url_token` plus the
 * `active` flag (and expiry / max-view caps) and returns the minimum a public
 * viewer needs. It must never expose `owner_id` or other tenants' boards.
 */

export interface BoardInput {
  name: string
  description?: string | null
  template?: BoardTemplate | null
  canvas?: Record<string, unknown>
  layers?: Array<Record<string, unknown>>
}

export interface BoardUpdateInput {
  name?: string
  description?: string | null
  canvas?: Record<string, unknown>
  layers?: Array<Record<string, unknown>>
  thumbnail?: string | null
  is_public?: boolean
}

export interface BoardShareInput {
  permissions?: 'view' | 'comment' | 'edit'
  url_token: string
  expires_at?: string | null
  max_views?: number | null
  password_hash?: string | null
}

// ---------------------------------------------------------------------------
// Owner-scoped board CRUD
// ---------------------------------------------------------------------------

export async function listBoards(userId: string) {
  await connectMongo()
  const boards = await Board.find({ owner_id: userId })
    .sort({ updated_at: -1 })
    .lean()
  return serializeMany(boards)
}

/** Returns the board, or null if it does not exist or is not owned by the user. */
export async function getBoard(userId: string, id: string) {
  await connectMongo()
  const board = await Board.findOne({ _id: toObjectId(id), owner_id: userId }).lean()
  return board ? serialize(board) : null
}

export async function createBoard(userId: string, input: BoardInput) {
  await connectMongo()
  // Mixed canvas/layers default to the schema defaults when omitted.
  const board = await Board.create({ ...input, owner_id: userId })
  return serialize(board.toObject())
}

/** Returns the updated board, or null if it is not owned by the user. */
export async function updateBoard(
  userId: string,
  id: string,
  updates: BoardUpdateInput
) {
  await connectMongo()
  const board = await Board.findOneAndUpdate(
    { _id: toObjectId(id), owner_id: userId },
    { $set: updates },
    { new: true }
  ).lean()
  return board ? serialize(board) : null
}

export async function deleteBoard(userId: string, id: string) {
  await connectMongo()
  const boardObjId = toObjectId(id)
  const res = await Board.deleteOne({ _id: boardObjId, owner_id: userId })
  if (res.deletedCount > 0) {
    // Clean up dependent share links for the board we just removed.
    await BoardShare.deleteMany({ board_id: boardObjId })
  }
  return res.deletedCount > 0
}

// ---------------------------------------------------------------------------
// Owner-scoped board_shares ops (ownership proven via the parent board)
// ---------------------------------------------------------------------------

/** Confirm the board exists and belongs to the user. Returns its ObjectId or null. */
async function assertOwnedBoard(userId: string, boardId: string) {
  const boardObjId = toObjectId(boardId)
  const board = await Board.findOne({ _id: boardObjId, owner_id: userId })
    .select('_id')
    .lean()
  return board ? boardObjId : null
}

/** Creates a share link for a board the user owns. Returns null if not owned. */
export async function createBoardShare(
  userId: string,
  boardId: string,
  input: BoardShareInput
) {
  await connectMongo()
  const boardObjId = await assertOwnedBoard(userId, boardId)
  if (!boardObjId) return null

  const share = await BoardShare.create({
    board_id: boardObjId,
    url_token: input.url_token,
    permissions: input.permissions ?? 'view',
    expires_at: input.expires_at ? new Date(input.expires_at) : null,
    max_views: input.max_views ?? null,
    password_hash: input.password_hash ?? null,
  })
  return serialize(share.toObject())
}

/** Lists active share links for a board the user owns. Returns null if not owned. */
export async function listBoardShares(userId: string, boardId: string) {
  await connectMongo()
  const boardObjId = await assertOwnedBoard(userId, boardId)
  if (!boardObjId) return null

  const shares = await BoardShare.find({ board_id: boardObjId, active: true })
    .sort({ created_at: -1 })
    .lean()
  return serializeMany(shares)
}

/**
 * Deactivates a share link. Ownership is enforced by joining the share to a
 * board owned by the user before flipping `active`. Returns true if updated.
 */
export async function deactivateBoardShare(userId: string, shareId: string) {
  await connectMongo()
  const shareObjId = toObjectId(shareId)

  const share = await BoardShare.findOne({ _id: shareObjId }).select('board_id').lean()
  if (!share) return false

  const owned = await Board.findOne({ _id: share.board_id, owner_id: userId })
    .select('_id')
    .lean()
  if (!owned) return false

  const res = await BoardShare.updateOne(
    { _id: shareObjId },
    { $set: { active: false } }
  )
  return res.matchedCount > 0
}

// ---------------------------------------------------------------------------
// Ported SQL RPCs
// ---------------------------------------------------------------------------

/**
 * Ports `get_board_by_share_token(TEXT)` (00003_boards_schema.sql).
 *
 * PUBLIC — no owner filter. Reads only by the unguessable `url_token` plus the
 * `active` flag, and rejects expired or view-capped shares. Atomically bumps the
 * share's `view_count` and returns the MINIMUM a public viewer needs: the
 * board's display fields, the share permissions/expiry, and the owner's display
 * name. The board's `owner_id` is never returned.
 */
export async function getBoardByShareToken(token: string) {
  await connectMongo()

  const now = new Date()
  const share = await BoardShare.findOne({
    url_token: token,
    active: true,
    $and: [
      { $or: [{ expires_at: null }, { expires_at: { $gt: now } }] },
      { $or: [{ max_views: null }, { $expr: { $lt: ['$view_count', '$max_views'] } }] },
    ],
  }).lean()

  if (!share) return null

  const board = await Board.findById(share.board_id)
    .select('name description template canvas layers owner_id')
    .lean()
  if (!board) return null

  // Atomically increment the view count (mirrors the RPC side effect).
  await BoardShare.updateOne({ _id: share._id }, { $inc: { view_count: 1 } })

  // Resolve the owner's display name. owner_id is used internally only and is
  // never returned to the public caller.
  const ownerProfile = await Profile.findOne({ user_id: board.owner_id })
    .select('display_name')
    .lean()
  const ownerName = ownerProfile?.display_name ?? null

  return {
    id: String(board._id),
    name: board.name,
    description: board.description ?? null,
    template: (board.template ?? null) as string | null,
    canvas: board.canvas ?? {},
    layers: board.layers ?? [],
    permissions: share.permissions,
    expires_at: share.expires_at ? share.expires_at.toISOString() : null,
    owner_name: ownerName,
  }
}

/**
 * Ports `duplicate_board(UUID, TEXT)` (00003_boards_schema.sql).
 *
 * Owner-scoped: only duplicates a board the user owns. Copies
 * description/template/canvas/layers into a fresh board owned by the same user.
 * Defaults the name to `"<original> (העתק)"` when `newTitle` is omitted. Returns
 * the new board id, or null if the source board is not owned by the user.
 */
export async function duplicateBoard(
  userId: string,
  boardId: string,
  newTitle?: string | null
) {
  await connectMongo()
  const source = await Board.findOne({ _id: toObjectId(boardId), owner_id: userId }).lean()
  if (!source) return null

  const name = newTitle ?? `${source.name} (העתק)`
  const copy = await Board.create({
    owner_id: userId,
    name,
    description: source.description ?? null,
    template: source.template ?? null,
    canvas: source.canvas,
    layers: source.layers,
  })
  return String(copy._id)
}

/**
 * Ports `get_recent_boards(INT)` (00003_boards_schema.sql).
 *
 * Owner-scoped: most-recently-updated boards for the user, each with a derived
 * `node_count` (`canvas.nodes.length`). Matches the old RPC's return columns.
 */
export async function getRecentBoards(userId: string, limit = 10) {
  await connectMongo()
  const rows = await Board.aggregate([
    { $match: { owner_id: userId } },
    { $sort: { updated_at: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        id: { $toString: '$_id' },
        name: 1,
        description: 1,
        template: 1,
        thumbnail: 1,
        is_public: 1,
        node_count: {
          $cond: [
            { $isArray: '$canvas.nodes' },
            { $size: '$canvas.nodes' },
            0,
          ],
        },
        updated_at: 1,
      },
    },
  ])

  return rows.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    description: (row.description ?? null) as string | null,
    template: (row.template ?? null) as string | null,
    thumbnail: (row.thumbnail ?? null) as string | null,
    is_public: Boolean(row.is_public),
    node_count: Number(row.node_count ?? 0),
    updated_at:
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at),
  }))
}
