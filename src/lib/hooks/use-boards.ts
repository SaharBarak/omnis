'use client'

import { useCallback, useEffect, useState } from 'react'
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

interface UseBoardsState {
  boards: Board[]
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

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...init })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

function jsonInit(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

export function useBoards(): UseBoardsReturn {
  const [state, setState] = useState<UseBoardsState>({
    boards: [],
    loading: true,
    error: null,
  })

  // Fetch all boards for current user
  const fetchBoards = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const { boards } = await fetchJson<{ boards: Board[] }>('/api/boards')
      setState({ boards, loading: false, error: null })
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Error fetching boards',
      }))
    }
  }, [])

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

  // Create a new board
  const createBoard = useCallback(async (input: CreateBoardInput): Promise<Board> => {
    const { board } = await fetchJson<{ board: Board }>(
      '/api/boards',
      jsonInit('POST', {
        name: input.name,
        description: input.description ?? null,
        template: input.template ?? 'blank',
      })
    )
    await fetchBoards()
    return board
  }, [fetchBoards])

  // Update a board
  const updateBoard = useCallback(async (id: string, input: UpdateBoardInput): Promise<Board> => {
    const updateData: Record<string, unknown> = {}
    if (input.name !== undefined) updateData.name = input.name
    if (input.description !== undefined) updateData.description = input.description
    if (input.canvas !== undefined) updateData.canvas = input.canvas
    if (input.layers !== undefined) updateData.layers = input.layers
    if (input.thumbnail !== undefined) updateData.thumbnail = input.thumbnail
    if (input.isPublic !== undefined) updateData.is_public = input.isPublic

    const { board } = await fetchJson<{ board: Board }>(
      `/api/boards/${id}`,
      jsonInit('PATCH', updateData)
    )
    await fetchBoards()
    return board
  }, [fetchBoards])

  // Delete a board
  const deleteBoard = useCallback(async (id: string): Promise<void> => {
    await fetchJson(`/api/boards/${id}`, { method: 'DELETE' })
    await fetchBoards()
  }, [fetchBoards])

  // Duplicate a board
  const duplicateBoard = useCallback(async (id: string, newName?: string): Promise<string> => {
    const { id: newId } = await fetchJson<{ id: string }>(
      `/api/boards/${id}/duplicate`,
      jsonInit('POST', { newName: newName ?? null })
    )
    await fetchBoards()
    return newId
  }, [fetchBoards])

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

  // Create a share link for a board
  const createShare = useCallback(async (boardId: string, input: CreateBoardShareInput): Promise<BoardShare> => {
    // Generate unique token client-side (unguessable).
    const token = crypto.randomUUID().replace(/-/g, '').slice(0, 16)

    const { share } = await fetchJson<{ share: BoardShare }>(
      `/api/boards/${boardId}/shares`,
      jsonInit('POST', {
        url_token: token,
        permissions: input.permissions || 'view',
        expires_at: input.expiresAt ?? null,
        max_views: input.maxViews ?? null,
        password_hash: input.password || null,
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

  // Initial fetch
  useEffect(() => {
    fetchBoards()
  }, [fetchBoards])

  return {
    ...state,
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

// Hook for a single board with auto-save
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
