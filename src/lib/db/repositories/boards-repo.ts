import { and, desc, eq, gt, isNull, or, sql } from 'drizzle-orm'

import { getDb } from '@/lib/db/client'
import { board_shares, boards, profiles } from '@/lib/db/schema'
import { serialize, serializeMany, toEntityId } from '@/lib/db/serialize'
import type { BoardTemplate } from '@/lib/types/board'

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

// Application-level defaults for new boards. The Postgres column defaults are
// the neutral `{}` / `[]`; these richer shapes were previously applied by the
// Mongoose schema defaults and are preserved here so createBoard semantics do
// not change.
const DEFAULT_CANVAS: Record<string, unknown> = {
  width: 1920,
  height: 1080,
  viewBox: { x: 0, y: 0, width: 1920, height: 1080, zoom: 1 },
  background: { type: 'solid', color: '#FFFFFF' },
  grid: { visible: true, size: 20, snap: true, color: '#E5E7EB' },
  nodes: [],
  connections: [],
  annotations: [],
}

const DEFAULT_LAYERS: Array<Record<string, unknown>> = [
  { id: 'background', name: 'רקע', visible: true, locked: false, opacity: 1, order: 0, color: '#9CA3AF' },
  { id: 'people', name: 'אנשים', visible: true, locked: false, opacity: 1, order: 1, color: '#3B82F6' },
  { id: 'connections', name: 'קשרים', visible: true, locked: false, opacity: 1, order: 2, color: '#10B981' },
  { id: 'annotations', name: 'הערות', visible: true, locked: false, opacity: 1, order: 3, color: '#F59E0B' },
]

// ---------------------------------------------------------------------------
// Owner-scoped board CRUD
// ---------------------------------------------------------------------------

export async function listBoards(userId: string) {
  const db = getDb()
  const rows = await db
    .select()
    .from(boards)
    .where(eq(boards.owner_id, userId))
    .orderBy(desc(boards.updated_at))
  return serializeMany(rows)
}

/** Returns the board, or null if it does not exist or is not owned by the user. */
export async function getBoard(userId: string, id: string) {
  const db = getDb()
  const [board] = await db
    .select()
    .from(boards)
    .where(and(eq(boards.id, toEntityId(id)), eq(boards.owner_id, userId)))
    .limit(1)
  return board ? serialize(board) : null
}

export async function createBoard(userId: string, input: BoardInput) {
  const db = getDb()
  // Rich canvas/layers defaults apply when omitted (see DEFAULT_CANVAS above).
  const [board] = await db
    .insert(boards)
    .values({
      owner_id: userId,
      name: input.name,
      description: input.description ?? null,
      template: input.template ?? null,
      canvas: input.canvas ?? { ...DEFAULT_CANVAS },
      layers: input.layers ?? DEFAULT_LAYERS.map((l) => ({ ...l })),
    })
    .returning()
  return serialize(board)
}

/** Returns the updated board, or null if it is not owned by the user. */
export async function updateBoard(
  userId: string,
  id: string,
  updates: BoardUpdateInput
) {
  const db = getDb()
  // Drop undefined keys so partial updates never null-out columns; always bump
  // updated_at (the Mongoose timestamps behavior the old model provided).
  const set: Record<string, unknown> = { updated_at: sql`now()` }
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) set[key] = value
  }
  const [board] = await db
    .update(boards)
    .set(set)
    .where(and(eq(boards.id, toEntityId(id)), eq(boards.owner_id, userId)))
    .returning()
  return board ? serialize(board) : null
}

export async function deleteBoard(userId: string, id: string) {
  const db = getDb()
  // board_shares rows are removed by the ON DELETE CASCADE FK (the manual
  // BoardShare.deleteMany the Mongo port needed).
  const deleted = await db
    .delete(boards)
    .where(and(eq(boards.id, toEntityId(id)), eq(boards.owner_id, userId)))
    .returning({ id: boards.id })
  return deleted.length > 0
}

// ---------------------------------------------------------------------------
// Owner-scoped board_shares ops (ownership proven via the parent board)
// ---------------------------------------------------------------------------

/** Confirm the board exists and belongs to the user. Returns its id or null. */
async function assertOwnedBoard(userId: string, boardId: string) {
  const db = getDb()
  const id = toEntityId(boardId)
  const [board] = await db
    .select({ id: boards.id })
    .from(boards)
    .where(and(eq(boards.id, id), eq(boards.owner_id, userId)))
    .limit(1)
  return board ? id : null
}

/** Creates a share link for a board the user owns. Returns null if not owned. */
export async function createBoardShare(
  userId: string,
  boardId: string,
  input: BoardShareInput
) {
  const db = getDb()
  const ownedBoardId = await assertOwnedBoard(userId, boardId)
  if (!ownedBoardId) return null

  const [share] = await db
    .insert(board_shares)
    .values({
      board_id: ownedBoardId,
      url_token: input.url_token,
      permissions: input.permissions ?? 'view',
      expires_at: input.expires_at ? new Date(input.expires_at).toISOString() : null,
      max_views: input.max_views ?? null,
      password_hash: input.password_hash ?? null,
    })
    .returning()
  return serialize(share)
}

/** Lists active share links for a board the user owns. Returns null if not owned. */
export async function listBoardShares(userId: string, boardId: string) {
  const db = getDb()
  const ownedBoardId = await assertOwnedBoard(userId, boardId)
  if (!ownedBoardId) return null

  const shares = await db
    .select()
    .from(board_shares)
    .where(and(eq(board_shares.board_id, ownedBoardId), eq(board_shares.active, true)))
    .orderBy(desc(board_shares.created_at))
  return serializeMany(shares)
}

/**
 * Deactivates a share link. Ownership is enforced by joining the share to a
 * board owned by the user before flipping `active`. Returns true if updated.
 */
export async function deactivateBoardShare(userId: string, shareId: string) {
  const db = getDb()
  const id = toEntityId(shareId)

  const [share] = await db
    .select({ board_id: board_shares.board_id })
    .from(board_shares)
    .where(eq(board_shares.id, id))
    .limit(1)
  if (!share) return false

  const [owned] = await db
    .select({ id: boards.id })
    .from(boards)
    .where(and(eq(boards.id, share.board_id), eq(boards.owner_id, userId)))
    .limit(1)
  if (!owned) return false

  const updated = await db
    .update(board_shares)
    .set({ active: false })
    .where(eq(board_shares.id, id))
    .returning({ id: board_shares.id })
  return updated.length > 0
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
/**
 * PUBLIC — resolves a board by share token. `candidateHash` is the viewer's
 * supplied password hash (null when none). If the share is password-protected
 * and the candidate does not match, returns `{ locked: true }` WITHOUT board
 * content and without incrementing the view count — the hash never leaves the
 * server. owner_id is never returned (only the owner's display name).
 */
export async function getBoardByShareToken(
  token: string,
  candidateHash: string | null = null
) {
  const db = getDb()

  const now = new Date().toISOString()
  const [share] = await db
    .select()
    .from(board_shares)
    .where(
      and(
        eq(board_shares.url_token, token),
        eq(board_shares.active, true),
        or(isNull(board_shares.expires_at), gt(board_shares.expires_at, now)),
        or(
          isNull(board_shares.max_views),
          sql`${board_shares.view_count} < ${board_shares.max_views}`
        )
      )
    )
    .limit(1)

  if (!share) return null

  if (share.password_hash != null && candidateHash !== share.password_hash) {
    return { locked: true as const }
  }

  const [board] = await db
    .select({
      id: boards.id,
      name: boards.name,
      description: boards.description,
      template: boards.template,
      canvas: boards.canvas,
      layers: boards.layers,
      owner_id: boards.owner_id,
    })
    .from(boards)
    .where(eq(boards.id, share.board_id))
    .limit(1)
  if (!board) return null

  // Atomically increment the view count (mirrors the RPC side effect).
  await db
    .update(board_shares)
    .set({ view_count: sql`${board_shares.view_count} + 1` })
    .where(eq(board_shares.id, share.id))

  // Resolve the owner's display name. owner_id is used internally only and is
  // never returned to the public caller.
  const [ownerProfile] = await db
    .select({ display_name: profiles.display_name })
    .from(profiles)
    .where(eq(profiles.user_id, board.owner_id))
    .limit(1)
  const ownerName = ownerProfile?.display_name ?? null

  return {
    id: board.id,
    name: board.name,
    description: board.description ?? null,
    template: (board.template ?? null) as string | null,
    canvas: (board.canvas ?? {}) as Record<string, unknown>,
    layers: (board.layers ?? []) as Array<Record<string, unknown>>,
    permissions: share.permissions,
    expires_at: share.expires_at ?? null,
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
  const db = getDb()
  const [source] = await db
    .select()
    .from(boards)
    .where(and(eq(boards.id, toEntityId(boardId)), eq(boards.owner_id, userId)))
    .limit(1)
  if (!source) return null

  const name = newTitle ?? `${source.name} (העתק)`
  const [copy] = await db
    .insert(boards)
    .values({
      owner_id: userId,
      name,
      description: source.description ?? null,
      template: source.template ?? null,
      canvas: source.canvas,
      layers: source.layers,
    })
    .returning({ id: boards.id })
  return copy.id
}

/**
 * Ports `get_recent_boards(INT)` (00003_boards_schema.sql).
 *
 * Owner-scoped: most-recently-updated boards for the user, each with a derived
 * `node_count` (`canvas.nodes.length`). Matches the old RPC's return columns.
 */
export async function getRecentBoards(userId: string, limit = 10) {
  const db = getDb()
  const rows = await db
    .select({
      id: boards.id,
      name: boards.name,
      description: boards.description,
      template: boards.template,
      thumbnail: boards.thumbnail,
      is_public: boards.is_public,
      node_count: sql<number>`jsonb_array_length(coalesce(${boards.canvas}->'nodes', '[]'::jsonb))`,
      updated_at: boards.updated_at,
    })
    .from(boards)
    .where(eq(boards.owner_id, userId))
    .orderBy(desc(boards.updated_at))
    .limit(limit)

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: (row.description ?? null) as string | null,
    template: (row.template ?? null) as string | null,
    thumbnail: (row.thumbnail ?? null) as string | null,
    is_public: Boolean(row.is_public),
    node_count: Number(row.node_count ?? 0),
    updated_at: String(row.updated_at),
  }))
}
