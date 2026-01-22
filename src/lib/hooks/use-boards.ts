'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  Board,
  BoardInsert,
  BoardUpdate,
  BoardShare,
  BoardShareInsert,
  Json,
} from '@/lib/supabase/database.types'
import type {
  CanvasState,
  Layer,
  BoardTemplate,
  CreateBoardInput,
  UpdateBoardInput,
  CreateBoardShareInput,
  BoardWithStats,
  DEFAULT_CANVAS_STATE,
  DEFAULT_LAYERS,
} from '@/lib/types/board'

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

export function useBoards(): UseBoardsReturn {
  const [state, setState] = useState<UseBoardsState>({
    boards: [],
    loading: true,
    error: null,
  })

  const supabase = createClient()

  // Fetch all boards for current user
  const fetchBoards = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const { data: boards, error } = await supabase
        .from('boards')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error

      setState({
        boards: boards || [],
        loading: false,
        error: null,
      })
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Error fetching boards',
      }))
    }
  }, [supabase])

  // Get a single board by ID
  const getBoard = useCallback(async (id: string): Promise<Board | null> => {
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    return data
  }, [supabase])

  // Create a new board
  const createBoard = useCallback(async (input: CreateBoardInput): Promise<Board> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Import defaults dynamically to avoid circular dependencies
    const { DEFAULT_CANVAS_STATE, DEFAULT_LAYERS } = await import('@/lib/types/board')

    const insertData: BoardInsert = {
      owner_id: user.id,
      name: input.name,
      description: input.description,
      template: input.template || 'blank',
      canvas: DEFAULT_CANVAS_STATE as unknown as Json,
      layers: DEFAULT_LAYERS as unknown as Json,
    }

    const { data: board, error } = await supabase
      .from('boards')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error

    await fetchBoards()
    return board
  }, [supabase, fetchBoards])

  // Update a board
  const updateBoard = useCallback(async (id: string, input: UpdateBoardInput): Promise<Board> => {
    const updateData: BoardUpdate = {}

    if (input.name !== undefined) updateData.name = input.name
    if (input.description !== undefined) updateData.description = input.description
    if (input.canvas !== undefined) updateData.canvas = input.canvas as unknown as Json
    if (input.layers !== undefined) updateData.layers = input.layers as unknown as Json
    if (input.thumbnail !== undefined) updateData.thumbnail = input.thumbnail
    if (input.isPublic !== undefined) updateData.is_public = input.isPublic

    const { data, error } = await supabase
      .from('boards')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    await fetchBoards()
    return data
  }, [supabase, fetchBoards])

  // Delete a board
  const deleteBoard = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('boards')
      .delete()
      .eq('id', id)

    if (error) throw error

    await fetchBoards()
  }, [supabase, fetchBoards])

  // Duplicate a board
  const duplicateBoard = useCallback(async (id: string, newName?: string): Promise<string> => {
    const { data, error } = await supabase
      .rpc('duplicate_board', {
        p_board_id: id,
        p_new_name: newName || null,
      })

    if (error) throw error

    await fetchBoards()
    return data as string
  }, [supabase, fetchBoards])

  // Get recent boards with stats
  const getRecentBoards = useCallback(async (limit = 10): Promise<BoardWithStats[]> => {
    const { data, error } = await supabase
      .rpc('get_recent_boards', { p_limit: limit })

    if (error) throw error

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

    return (data || []).map((row: RecentBoardRow) => ({
      id: row.id,
      owner_id: '', // Not returned by function
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
  }, [supabase])

  // Update just the canvas state (for auto-save)
  const updateCanvas = useCallback(async (id: string, canvas: CanvasState): Promise<void> => {
    const { error } = await supabase
      .from('boards')
      .update({ canvas: canvas as unknown as Json })
      .eq('id', id)

    if (error) throw error
  }, [supabase])

  // Update just the layers
  const updateLayers = useCallback(async (id: string, layers: Layer[]): Promise<void> => {
    const { error } = await supabase
      .from('boards')
      .update({ layers: layers as unknown as Json })
      .eq('id', id)

    if (error) throw error
  }, [supabase])

  // Create a share link for a board
  const createShare = useCallback(async (boardId: string, input: CreateBoardShareInput): Promise<BoardShare> => {
    // Generate unique token
    const token = crypto.randomUUID().replace(/-/g, '').slice(0, 16)

    const insertData: BoardShareInsert = {
      board_id: boardId,
      url_token: token,
      permissions: input.permissions || 'view',
      expires_at: input.expiresAt,
      max_views: input.maxViews,
      // Note: password hashing should be done server-side
      // For now, we store it as-is (in production, use a server function)
      password_hash: input.password || null,
    }

    const { data, error } = await supabase
      .from('board_shares')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error

    return data
  }, [supabase])

  // Get all shares for a board
  const getShares = useCallback(async (boardId: string): Promise<BoardShare[]> => {
    const { data, error } = await supabase
      .from('board_shares')
      .select('*')
      .eq('board_id', boardId)
      .eq('active', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data || []
  }, [supabase])

  // Delete (deactivate) a share
  const deleteShare = useCallback(async (shareId: string): Promise<void> => {
    const { error } = await supabase
      .from('board_shares')
      .update({ active: false })
      .eq('id', shareId)

    if (error) throw error
  }, [supabase])

  // Get board by share token (public access)
  const getBoardByShareToken = useCallback(async (token: string): Promise<{
    board: Board
    permissions: string
    ownerName: string | null
  } | null> => {
    const { data, error } = await supabase
      .rpc('get_board_by_share_token', { p_token: token })

    if (error) throw error

    if (!data || data.length === 0) return null

    const row = data[0]
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
  }, [supabase])

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

  const supabase = createClient()

  const loadBoard = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      setState({
        board: data,
        canvas: data.canvas as unknown as CanvasState,
        layers: data.layers as unknown as Layer[],
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
  }, [supabase])

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
      const { error } = await supabase
        .from('boards')
        .update({
          canvas: state.canvas as unknown as Json,
          layers: state.layers as unknown as Json,
        })
        .eq('id', state.board.id)

      if (error) throw error

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
  }, [supabase, state.board, state.canvas, state.layers])

  return {
    ...state,
    loadBoard,
    setCanvas,
    setLayers,
    save,
  }
}
