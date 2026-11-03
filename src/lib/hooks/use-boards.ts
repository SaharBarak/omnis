'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { fetchJson, jsonInit } from '@/lib/http/json'
import { cacheMutation } from '@/lib/query/cache-mutation'
import { QUERY_KEYS } from '@/lib/query/keys'
import { dropRow, newestBy, patchRow, sortedBy, upsertRow, within } from '@/lib/query/list-ops'
import type {
  CanvasState,
  Layer,
  BoardTemplate,
  CreateBoardInput,
  UpdateBoardInput,
  CreateBoardShareInput,
  BoardWithStats,
} from '@/lib/types/board'

// Client-facing shapes mirror the original Supabase row contract (nullable,
// never undefined) so existing consumers keep type-checking. The server
// serializer guarantees these shapes at runtime. These intentionally duplicate
// the original Board/BoardShare row contracts so the public API of this hook
// is unchanged after the Mongo migration.
type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Board {
  id: string
  owner_id: string
  name: string
  description: string | null
  template:
    | 'blank'
    | 'relationship-map'
    | 'family-tree'
    | 'yearly-overview'
    | 'personal-profile'
    | 'group-analysis'
    | null
  canvas: Json
  layers: Json
  thumbnail: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface BoardShare {
  id: string
  board_id: string
  url_token: string
  permissions: 'view' | 'comment' | 'edit'
  expires_at: string | null
  max_views: number | null
  view_count: number
  password_hash: string | null
  active: boolean
  created_at: string
}

/** A board as the list returns it: everything but the drawing, which loads with `getBoard`. */
export type BoardSummary = Omit<Board, 'canvas' | 'layers'>

interface UseBoardsState {
  boards: BoardSummary[]
  loading: boolean
  error: string | null
}

interface UseBoardsReturn extends UseBoardsState {
  fetchBoards: () => Promise<void>
  getBoard: (id: string) => Promise<Board | null>
  createBoard: (input: CreateBoardInput) => Promise<Board>
  updateBoard: (id: string, input: UpdateBoardInput) => Promise<Board>
  deleteBoard: (id: string) => Promise<void>
  duplicateBoard: (id: string, newName?: string) => Promise<string>
  getRecentBoards: (limit?: number) => Promise<BoardWithStats[]>
  // Canvas operations
  updateCanvas: (id: string, canvas: CanvasState) => Promise<void>
  updateLayers: (id: string, layers: Layer[]) => Promise<void>
  // Share operations
  createShare: (boardId: string, input: CreateBoardShareInput) => Promise<BoardShare>
  getShares: (boardId: string) => Promise<BoardShare[]>
  deleteShare: (shareId: string) => Promise<void>
  // Public board access
  getBoardByShareToken: (token: string) => Promise<{
    board: Board
    permissions: string
    ownerName: string | null
  } | null>
}

/** The cached shape, as persisted in browsers; kept so restored caches stay readable. */
type Summaries = { boards: BoardSummary[] }

const inBoards = within<Summaries, readonly BoardSummary[]>(
  (data) => data.boards,
  (data, boards) => ({ ...data, boards: [...boards] })
)

/** A board as the list shows it: the server's row without its drawing. */
const summaryOf = ({ canvas: _canvas, layers: _layers, ...summary }: BoardSummary & Partial<Pick<Board, 'canvas' | 'layers'>>): BoardSummary => summary

const BOARD_ORDER = sortedBy(newestBy<BoardSummary>((b) => b.updated_at))

/** Newest change first, fetched and settled rows alike; module-level so the query memoises it. */
const showBoards = (data: Summaries): Summaries => ({ ...data, boards: BOARD_ORDER(data.boards) })

/** The fields of an update the list shows, in the API's names. */
type ShownChanges = Partial<Pick<BoardSummary, 'name' | 'description' | 'thumbnail' | 'is_public'>>

function shownChanges(input: UpdateBoardInput): ShownChanges {
  const changes: ShownChanges = {}
  if (input.name !== undefined) changes.name = input.name
  if (input.description !== undefined) changes.description = input.description
  if (input.thumbnail !== undefined) changes.thumbnail = input.thumbnail
  if (input.isPublic !== undefined) changes.is_public = input.isPublic
  return changes
}

/** The whole update in the API's names: what the list shows, plus the drawing. */
const boardChanges = (input: UpdateBoardInput) => ({
  ...shownChanges(input),
  ...(input.canvas !== undefined ? { canvas: input.canvas } : {}),
  ...(input.layers !== undefined ? { layers: input.layers } : {}),
})

const settleBoard = (board: Board | BoardSummary) => (data: Summaries): Summaries => ({
  ...data,
  boards: [...upsertRow(summaryOf(board))(data.boards)],
})

const CREATE = cacheMutation<Summaries, CreateBoardInput, Board>({
  key: QUERY_KEYS.boards,
  request: async (input) =>
    (
      await fetchJson<{ board: Board }>(
        '/api/boards',
        jsonInit('POST', {
          name: input.name,
          description: input.description ?? null,
          template: input.template ?? 'blank',
          ...(input.canvas !== undefined ? { canvas: input.canvas } : {}),
        })
      )
    ).board,
  settle: settleBoard,
})

const UPDATE = cacheMutation<Summaries, { id: string; input: UpdateBoardInput }, Board>({
  key: QUERY_KEYS.boards,
  request: async ({ id, input }) => (await fetchJson<{ board: Board }>(`/api/boards/${id}`, jsonInit('PATCH', boardChanges(input)))).board,
  optimistic: ({ id, input }) => inBoards(patchRow<BoardSummary>(id, shownChanges(input))),
  settle: settleBoard,
})

const REMOVE = cacheMutation<Summaries, string, unknown>({
  key: QUERY_KEYS.boards,
  request: (id) => fetchJson(`/api/boards/${id}`, { method: 'DELETE' }),
  optimistic: (id) => inBoards(dropRow<BoardSummary>(id)),
})

const DUPLICATE = cacheMutation<Summaries, { id: string; newName?: string }, { id: string; board: BoardSummary }>({
  key: QUERY_KEYS.boards,
  request: ({ id, newName }) => fetchJson(`/api/boards/${id}/duplicate`, jsonInit('POST', { newName: newName ?? null })),
  settle: ({ board }) => settleBoard(board),
})

export function useBoards(): UseBoardsReturn {
  const queryClient = useQueryClient()

  // Cached (and persisted — see query-provider) server state. `loading` is
  // true only when there's nothing to show yet: a restored cache renders
  // immediately while a background refetch runs.
  const query = useQuery({
    queryKey: QUERY_KEYS.boards,
    queryFn: ({ signal }) => fetchJson<Summaries>('/api/boards', { signal }),
    select: showBoards,
  })

  // Fetch failures surface through `error`, not the returned promise,
  // matching the old fetchBoards which never threw.
  const fetchBoards = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: QUERY_KEYS.boards })
  }, [queryClient])

  // Get a single board by ID
  const getBoard = useCallback(async (id: string): Promise<Board | null> => {
    const res = await fetch(`/api/boards/${id}`, { credentials: 'include' })
    if (res.status === 404) return null
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || `Request failed: ${res.status}`)
    }
    const { board } = (await res.json()) as { board: Board }
    return board
  }, [])

  // Mutators resolve on the server's answer, already written into the list
  // (docs/perf/APP_PERFORMANCE_PROMPT.md "Mutations answer from the cache").
  const { mutateAsync: create } = useMutation(CREATE)
  const { mutateAsync: update } = useMutation(UPDATE)
  const { mutateAsync: remove } = useMutation(REMOVE)
  const { mutateAsync: duplicate } = useMutation(DUPLICATE)

  const createBoard = useCallback((input: CreateBoardInput) => create(input), [create])
  const updateBoard = useCallback((id: string, input: UpdateBoardInput) => update({ id, input }), [update])
  const deleteBoard = useCallback(async (id: string) => {
    await remove(id)
  }, [remove])
  const duplicateBoard = useCallback(async (id: string, newName?: string) => (await duplicate({ id, newName })).id, [duplicate])

  // Get recent boards with stats
  const getRecentBoards = useCallback(async (limit = 10): Promise<BoardWithStats[]> => {
    interface RecentBoardRow {
      id: string
      name: string
      description: string | null
      template: string | null
      thumbnail: string | null
      is_public: boolean
      node_count: number
      updated_at: string
    }

    const { boards } = await fetchJson<{ boards: RecentBoardRow[] }>(
      `/api/boards/recent?limit=${limit}`
    )

    return boards.map((row) => ({
      id: row.id,
      owner_id: '', // Not returned by the recent-boards projection
      name: row.name,
      description: row.description,
      template: row.template as BoardTemplate | null,
      canvas: {} as Json,
      layers: [] as unknown as Json,
      thumbnail: row.thumbnail,
      is_public: row.is_public,
      created_at: '',
      updated_at: row.updated_at,
      nodeCount: row.node_count,
    }))
  }, [])

  // Update just the canvas state (for auto-save)
  const updateCanvas = useCallback(async (id: string, canvas: CanvasState): Promise<void> => {
    await fetchJson(`/api/boards/${id}`, jsonInit('PATCH', { canvas }))
  }, [])

  // Update just the layers
  const updateLayers = useCallback(async (id: string, layers: Layer[]): Promise<void> => {
    await fetchJson(`/api/boards/${id}`, jsonInit('PATCH', { layers }))
  }, [])

  // Create a share link for a board. Token generation and password hashing
  // happen SERVER-SIDE in POST /api/boards/[id]/shares; the minted url_token
  // comes back on the returned share.
  const createShare = useCallback(async (boardId: string, input: CreateBoardShareInput): Promise<BoardShare> => {
    const { share } = await fetchJson<{ share: BoardShare }>(
      `/api/boards/${boardId}/shares`,
      jsonInit('POST', {
        permissions: input.permissions || 'view',
        expires_at: input.expiresAt ?? null,
        max_views: input.maxViews ?? null,
        password: input.password || null,
      })
    )
    return share
  }, [])

  // Get all shares for a board
  const getShares = useCallback(async (boardId: string): Promise<BoardShare[]> => {
    const { shares } = await fetchJson<{ shares: BoardShare[] }>(
      `/api/boards/${boardId}/shares`
    )
    return shares
  }, [])

  // Delete (deactivate) a share
  const deleteShare = useCallback(async (shareId: string): Promise<void> => {
    await fetchJson(`/api/boards/shares/${shareId}`, { method: 'DELETE' })
  }, [])

  // Get board by share token (public access)
  const getBoardByShareToken = useCallback(async (token: string): Promise<{
    board: Board
    permissions: string
    ownerName: string | null
  } | null> => {
    const res = await fetch(`/api/boards/shared/${token}`)
    if (res.status === 404) return null
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || `Request failed: ${res.status}`)
    }

    const row = (await res.json()) as {
      id: string
      name: string
      description: string | null
      template: string | null
      canvas: Json
      layers: Json
      permissions: string
      expires_at: string | null
      owner_name: string | null
    }

    return {
      board: {
        id: row.id,
        owner_id: '', // Not exposed in public view
        name: row.name,
        description: row.description,
        template: row.template as BoardTemplate | null,
        canvas: row.canvas,
        layers: row.layers,
        thumbnail: null,
        is_public: false,
        created_at: '',
        updated_at: '',
      },
      permissions: row.permissions,
      ownerName: row.owner_name,
    }
  }, [])

  return {
    boards: query.data?.boards ?? [],
    loading: query.isPending,
    error: query.error ? query.error.message : null,
    fetchBoards,
    getBoard,
    createBoard,
    updateBoard,
    deleteBoard,
    duplicateBoard,
    getRecentBoards,
    updateCanvas,
    updateLayers,
    createShare,
    getShares,
    deleteShare,
    getBoardByShareToken,
  }
}

// Hook for a single board with auto-save. Deliberately NOT a useQuery: its
// state is a mutable editor draft (canvas/layers/dirty/saving) loaded
// imperatively, and caching full canvases would bloat the persisted query
// cache (see query-provider) for no read reuse.
interface UseBoardState {
  board: Board | null
  canvas: CanvasState | null
  layers: Layer[]
  loading: boolean
  saving: boolean
  error: string | null
  dirty: boolean
}

interface UseBoardReturn extends UseBoardState {
  loadBoard: (id: string) => Promise<void>
  setCanvas: (canvas: CanvasState) => void
  setLayers: (layers: Layer[]) => void
  save: () => Promise<void>
}

export function useBoard(): UseBoardReturn {
  const [state, setState] = useState<UseBoardState>({
    board: null,
    canvas: null,
    layers: [],
    loading: false,
    saving: false,
    error: null,
    dirty: false,
  })

  const loadBoard = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const { board } = await fetchJson<{ board: Board }>(`/api/boards/${id}`)

      setState({
        board,
        canvas: board.canvas as unknown as CanvasState,
        layers: board.layers as unknown as Layer[],
        loading: false,
        saving: false,
        error: null,
        dirty: false,
      })
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Error loading board',
      }))
    }
  }, [])

  const setCanvas = useCallback((canvas: CanvasState) => {
    setState(prev => ({
      ...prev,
      canvas,
      dirty: true,
    }))
  }, [])

  const setLayers = useCallback((layers: Layer[]) => {
    setState(prev => ({
      ...prev,
      layers,
      dirty: true,
    }))
  }, [])

  const save = useCallback(async () => {
    if (!state.board || !state.canvas) return

    setState(prev => ({ ...prev, saving: true }))

    try {
      await fetchJson(
        `/api/boards/${state.board.id}`,
        jsonInit('PATCH', { canvas: state.canvas, layers: state.layers })
      )

      setState(prev => ({
        ...prev,
        saving: false,
        dirty: false,
      }))
    } catch (err) {
      setState(prev => ({
        ...prev,
        saving: false,
        error: err instanceof Error ? err.message : 'Error saving board',
      }))
    }
  }, [state.board, state.canvas, state.layers])

  return {
    ...state,
    loadBoard,
    setCanvas,
    setLayers,
    save,
  }
}
