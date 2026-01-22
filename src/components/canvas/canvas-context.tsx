'use client'

import { createContext, useContext, useCallback, useState, type ReactNode } from 'react'
import type {
  CanvasState,
  CanvasNode,
  CanvasConnection,
  Layer,
  ToolId,
  NodeId,
  LayerId,
  Position,
  Size,
  HistoryState,
} from '@/lib/types/board'
import { DEFAULT_CANVAS_STATE, DEFAULT_LAYERS } from '@/lib/types/board'

// ============================================================================
// CANVAS CONTEXT STATE
// ============================================================================

interface CanvasContextState {
  // Board state
  boardId: string | null
  boardName: string

  // Canvas state
  canvas: CanvasState
  layers: Layer[]

  // Selection & interaction
  selectedIds: Set<NodeId>
  activeTool: ToolId
  activeLayerId: LayerId

  // History
  history: HistoryState

  // UI state
  showGrid: boolean
  snapToGrid: boolean
  zoom: number

  // Dirty state
  isDirty: boolean
}

interface CanvasContextActions {
  // Board operations
  setBoardId: (id: string | null) => void
  setBoardName: (name: string) => void

  // Canvas operations
  setCanvas: (canvas: CanvasState) => void
  setLayers: (layers: Layer[]) => void

  // Node operations
  addNode: (node: CanvasNode) => void
  updateNode: (id: NodeId, changes: Partial<CanvasNode>) => void
  deleteNode: (id: NodeId) => void
  moveNode: (id: NodeId, position: Position) => void
  resizeNode: (id: NodeId, size: Size) => void
  duplicateNodes: (ids: NodeId[]) => void

  // Connection operations
  addConnection: (connection: CanvasConnection) => void
  updateConnection: (id: string, changes: Partial<CanvasConnection>) => void
  deleteConnection: (id: string) => void

  // Selection operations
  select: (ids: NodeId[]) => void
  addToSelection: (id: NodeId) => void
  removeFromSelection: (id: NodeId) => void
  clearSelection: () => void
  selectAll: () => void

  // Layer operations
  addLayer: (layer: Layer) => void
  updateLayer: (id: LayerId, changes: Partial<Layer>) => void
  deleteLayer: (id: LayerId) => void
  toggleLayerVisibility: (id: LayerId) => void
  toggleLayerLock: (id: LayerId) => void
  reorderLayers: (order: LayerId[]) => void
  setActiveLayer: (id: LayerId) => void

  // Tool operations
  setActiveTool: (tool: ToolId) => void

  // View operations
  setZoom: (zoom: number) => void
  setShowGrid: (show: boolean) => void
  setSnapToGrid: (snap: boolean) => void
  fitToScreen: () => void

  // History operations
  undo: () => void
  redo: () => void
  pushHistory: () => void
  canUndo: () => boolean
  canRedo: () => boolean

  // Alignment operations
  alignNodes: (alignment: 'left' | 'right' | 'center' | 'top' | 'bottom' | 'middle') => void
  distributeNodes: (direction: 'horizontal' | 'vertical') => void

  // Z-order operations
  bringForward: () => void
  sendBackward: () => void
  bringToFront: () => void
  sendToBack: () => void

  // Misc
  markDirty: () => void
  clearDirty: () => void
}

type CanvasContextValue = CanvasContextState & CanvasContextActions

const CanvasContext = createContext<CanvasContextValue | null>(null)

// ============================================================================
// CANVAS PROVIDER
// ============================================================================

interface CanvasProviderProps {
  children: ReactNode
  initialCanvas?: CanvasState
  initialLayers?: Layer[]
  boardId?: string
  boardName?: string
}

export function CanvasProvider({
  children,
  initialCanvas,
  initialLayers,
  boardId,
  boardName,
}: CanvasProviderProps) {
  const [state, setState] = useState<CanvasContextState>({
    boardId: boardId || null,
    boardName: boardName || '',
    canvas: initialCanvas || DEFAULT_CANVAS_STATE,
    layers: initialLayers || DEFAULT_LAYERS,
    selectedIds: new Set(),
    activeTool: 'select',
    activeLayerId: 'people',
    history: { past: [], future: [], maxSize: 50 },
    showGrid: true,
    snapToGrid: true,
    zoom: 1,
    isDirty: false,
  })

  // Helper to generate unique IDs
  const generateId = () => crypto.randomUUID()

  // Push current state to history
  const pushHistory = useCallback(() => {
    setState(prev => {
      const newPast = [...prev.history.past, structuredClone(prev.canvas)]
      if (newPast.length > prev.history.maxSize) {
        newPast.shift()
      }
      return {
        ...prev,
        history: {
          ...prev.history,
          past: newPast,
          future: [],
        },
      }
    })
  }, [])

  // Board operations
  const setBoardId = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, boardId: id }))
  }, [])

  const setBoardName = useCallback((name: string) => {
    setState(prev => ({ ...prev, boardName: name, isDirty: true }))
  }, [])

  // Canvas operations
  const setCanvas = useCallback((canvas: CanvasState) => {
    setState(prev => ({ ...prev, canvas, isDirty: true }))
  }, [])

  const setLayers = useCallback((layers: Layer[]) => {
    setState(prev => ({ ...prev, layers, isDirty: true }))
  }, [])

  // Node operations
  const addNode = useCallback((node: CanvasNode) => {
    pushHistory()
    setState(prev => ({
      ...prev,
      canvas: {
        ...prev.canvas,
        nodes: [...prev.canvas.nodes, { ...node, id: node.id || generateId() }],
      },
      isDirty: true,
    }))
  }, [pushHistory])

  const updateNode = useCallback((id: NodeId, changes: Partial<CanvasNode>) => {
    pushHistory()
    setState(prev => ({
      ...prev,
      canvas: {
        ...prev.canvas,
        nodes: prev.canvas.nodes.map(node =>
          node.id === id ? { ...node, ...changes } as CanvasNode : node
        ),
      },
      isDirty: true,
    }))
  }, [pushHistory])

  const deleteNode = useCallback((id: NodeId) => {
    pushHistory()
    setState(prev => {
      const filteredIds = Array.from(prev.selectedIds).filter(sid => sid !== id)
      return {
        ...prev,
        canvas: {
          ...prev.canvas,
          nodes: prev.canvas.nodes.filter(node => node.id !== id),
          connections: prev.canvas.connections.filter(
            conn => conn.sourceId !== id && conn.targetId !== id
          ),
        },
        selectedIds: new Set(filteredIds),
        isDirty: true,
      }
    })
  }, [pushHistory])

  const moveNode = useCallback((id: NodeId, position: Position) => {
    setState(prev => ({
      ...prev,
      canvas: {
        ...prev.canvas,
        nodes: prev.canvas.nodes.map(node =>
          node.id === id ? { ...node, position } : node
        ),
      },
      isDirty: true,
    }))
  }, [])

  const resizeNode = useCallback((id: NodeId, size: Size) => {
    pushHistory()
    setState(prev => ({
      ...prev,
      canvas: {
        ...prev.canvas,
        nodes: prev.canvas.nodes.map(node =>
          node.id === id ? { ...node, size } : node
        ),
      },
      isDirty: true,
    }))
  }, [pushHistory])

  const duplicateNodes = useCallback((ids: NodeId[]) => {
    pushHistory()
    setState(prev => {
      const nodesToDuplicate = prev.canvas.nodes.filter(n => ids.includes(n.id))
      const newNodes = nodesToDuplicate.map(node => ({
        ...structuredClone(node),
        id: generateId(),
        position: {
          x: node.position.x + 20,
          y: node.position.y + 20,
        },
      }))
      return {
        ...prev,
        canvas: {
          ...prev.canvas,
          nodes: [...prev.canvas.nodes, ...newNodes],
        },
        selectedIds: new Set(newNodes.map(n => n.id)),
        isDirty: true,
      }
    })
  }, [pushHistory])

  // Connection operations
  const addConnection = useCallback((connection: CanvasConnection) => {
    pushHistory()
    setState(prev => ({
      ...prev,
      canvas: {
        ...prev.canvas,
        connections: [...prev.canvas.connections, { ...connection, id: connection.id || generateId() }],
      },
      isDirty: true,
    }))
  }, [pushHistory])

  const updateConnection = useCallback((id: string, changes: Partial<CanvasConnection>) => {
    pushHistory()
    setState(prev => ({
      ...prev,
      canvas: {
        ...prev.canvas,
        connections: prev.canvas.connections.map(conn =>
          conn.id === id ? { ...conn, ...changes } : conn
        ),
      },
      isDirty: true,
    }))
  }, [pushHistory])

  const deleteConnection = useCallback((id: string) => {
    pushHistory()
    setState(prev => ({
      ...prev,
      canvas: {
        ...prev.canvas,
        connections: prev.canvas.connections.filter(conn => conn.id !== id),
      },
      isDirty: true,
    }))
  }, [pushHistory])

  // Selection operations
  const select = useCallback((ids: NodeId[]) => {
    setState(prev => ({ ...prev, selectedIds: new Set(ids) }))
  }, [])

  const addToSelection = useCallback((id: NodeId) => {
    setState(prev => ({
      ...prev,
      selectedIds: new Set([...Array.from(prev.selectedIds), id]),
    }))
  }, [])

  const removeFromSelection = useCallback((id: NodeId) => {
    setState(prev => ({
      ...prev,
      selectedIds: new Set(Array.from(prev.selectedIds).filter(sid => sid !== id)),
    }))
  }, [])

  const clearSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedIds: new Set() }))
  }, [])

  const selectAll = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedIds: new Set(prev.canvas.nodes.map(n => n.id)),
    }))
  }, [])

  // Layer operations
  const addLayer = useCallback((layer: Layer) => {
    setState(prev => ({
      ...prev,
      layers: [...prev.layers, layer],
      isDirty: true,
    }))
  }, [])

  const updateLayer = useCallback((id: LayerId, changes: Partial<Layer>) => {
    setState(prev => ({
      ...prev,
      layers: prev.layers.map(layer =>
        layer.id === id ? { ...layer, ...changes } : layer
      ),
      isDirty: true,
    }))
  }, [])

  const deleteLayer = useCallback((id: LayerId) => {
    setState(prev => ({
      ...prev,
      layers: prev.layers.filter(layer => layer.id !== id),
      canvas: {
        ...prev.canvas,
        nodes: prev.canvas.nodes.filter(node => node.layerId !== id),
      },
      isDirty: true,
    }))
  }, [])

  const toggleLayerVisibility = useCallback((id: LayerId) => {
    setState(prev => ({
      ...prev,
      layers: prev.layers.map(layer =>
        layer.id === id ? { ...layer, visible: !layer.visible } : layer
      ),
    }))
  }, [])

  const toggleLayerLock = useCallback((id: LayerId) => {
    setState(prev => ({
      ...prev,
      layers: prev.layers.map(layer =>
        layer.id === id ? { ...layer, locked: !layer.locked } : layer
      ),
    }))
  }, [])

  const reorderLayers = useCallback((order: LayerId[]) => {
    setState(prev => {
      const layerMap = new Map(prev.layers.map(l => [l.id, l]))
      const reordered = order
        .map((id, index) => {
          const layer = layerMap.get(id)
          return layer ? { ...layer, order: index } : null
        })
        .filter(Boolean) as Layer[]
      return { ...prev, layers: reordered, isDirty: true }
    })
  }, [])

  const setActiveLayer = useCallback((id: LayerId) => {
    setState(prev => ({ ...prev, activeLayerId: id }))
  }, [])

  // Tool operations
  const setActiveTool = useCallback((tool: ToolId) => {
    setState(prev => ({ ...prev, activeTool: tool }))
  }, [])

  // View operations
  const setZoom = useCallback((zoom: number) => {
    setState(prev => ({
      ...prev,
      zoom: Math.max(0.1, Math.min(5, zoom)),
      canvas: {
        ...prev.canvas,
        viewBox: { ...prev.canvas.viewBox, zoom: Math.max(0.1, Math.min(5, zoom)) },
      },
    }))
  }, [])

  const setShowGrid = useCallback((show: boolean) => {
    setState(prev => ({
      ...prev,
      showGrid: show,
      canvas: {
        ...prev.canvas,
        grid: { ...prev.canvas.grid, visible: show },
      },
    }))
  }, [])

  const setSnapToGrid = useCallback((snap: boolean) => {
    setState(prev => ({
      ...prev,
      snapToGrid: snap,
      canvas: {
        ...prev.canvas,
        grid: { ...prev.canvas.grid, snap },
      },
    }))
  }, [])

  const fitToScreen = useCallback(() => {
    setState(prev => ({
      ...prev,
      zoom: 1,
      canvas: {
        ...prev.canvas,
        viewBox: { x: 0, y: 0, width: prev.canvas.width, height: prev.canvas.height, zoom: 1 },
      },
    }))
  }, [])

  // History operations
  const undo = useCallback(() => {
    setState(prev => {
      if (prev.history.past.length === 0) return prev
      const newPast = [...prev.history.past]
      const previousState = newPast.pop()!
      return {
        ...prev,
        canvas: previousState,
        history: {
          ...prev.history,
          past: newPast,
          future: [prev.canvas, ...prev.history.future],
        },
        isDirty: true,
      }
    })
  }, [])

  const redo = useCallback(() => {
    setState(prev => {
      if (prev.history.future.length === 0) return prev
      const [nextState, ...newFuture] = prev.history.future
      return {
        ...prev,
        canvas: nextState,
        history: {
          ...prev.history,
          past: [...prev.history.past, prev.canvas],
          future: newFuture,
        },
        isDirty: true,
      }
    })
  }, [])

  const canUndo = useCallback(() => state.history.past.length > 0, [state.history.past.length])
  const canRedo = useCallback(() => state.history.future.length > 0, [state.history.future.length])

  // Alignment operations
  const alignNodes = useCallback((alignment: 'left' | 'right' | 'center' | 'top' | 'bottom' | 'middle') => {
    if (state.selectedIds.size < 2) return
    pushHistory()

    setState(prev => {
      const selectedNodes = prev.canvas.nodes.filter(n => prev.selectedIds.has(n.id))
      if (selectedNodes.length < 2) return prev

      let targetValue: number
      switch (alignment) {
        case 'left':
          targetValue = Math.min(...selectedNodes.map(n => n.position.x))
          break
        case 'right':
          targetValue = Math.max(...selectedNodes.map(n => n.position.x + n.size.width))
          break
        case 'center':
          const avgX = selectedNodes.reduce((sum, n) => sum + n.position.x + n.size.width / 2, 0) / selectedNodes.length
          targetValue = avgX
          break
        case 'top':
          targetValue = Math.min(...selectedNodes.map(n => n.position.y))
          break
        case 'bottom':
          targetValue = Math.max(...selectedNodes.map(n => n.position.y + n.size.height))
          break
        case 'middle':
          const avgY = selectedNodes.reduce((sum, n) => sum + n.position.y + n.size.height / 2, 0) / selectedNodes.length
          targetValue = avgY
          break
      }

      return {
        ...prev,
        canvas: {
          ...prev.canvas,
          nodes: prev.canvas.nodes.map(node => {
            if (!prev.selectedIds.has(node.id)) return node
            let newPosition = { ...node.position }
            switch (alignment) {
              case 'left':
                newPosition.x = targetValue
                break
              case 'right':
                newPosition.x = targetValue - node.size.width
                break
              case 'center':
                newPosition.x = targetValue - node.size.width / 2
                break
              case 'top':
                newPosition.y = targetValue
                break
              case 'bottom':
                newPosition.y = targetValue - node.size.height
                break
              case 'middle':
                newPosition.y = targetValue - node.size.height / 2
                break
            }
            return { ...node, position: newPosition }
          }),
        },
        isDirty: true,
      }
    })
  }, [state.selectedIds, pushHistory])

  const distributeNodes = useCallback((direction: 'horizontal' | 'vertical') => {
    if (state.selectedIds.size < 3) return
    pushHistory()

    setState(prev => {
      const selectedNodes = prev.canvas.nodes
        .filter(n => prev.selectedIds.has(n.id))
        .sort((a, b) => direction === 'horizontal'
          ? a.position.x - b.position.x
          : a.position.y - b.position.y
        )

      if (selectedNodes.length < 3) return prev

      const first = selectedNodes[0]
      const last = selectedNodes[selectedNodes.length - 1]

      const totalSpace = direction === 'horizontal'
        ? (last.position.x + last.size.width) - first.position.x
        : (last.position.y + last.size.height) - first.position.y

      const totalNodeSize = selectedNodes.reduce((sum, n) =>
        sum + (direction === 'horizontal' ? n.size.width : n.size.height), 0
      )

      const gap = (totalSpace - totalNodeSize) / (selectedNodes.length - 1)

      let currentPos = direction === 'horizontal' ? first.position.x : first.position.y

      const nodePositions = new Map<NodeId, Position>()
      selectedNodes.forEach((node, index) => {
        if (index === 0) {
          nodePositions.set(node.id, node.position)
        } else {
          currentPos += gap + (direction === 'horizontal'
            ? selectedNodes[index - 1].size.width
            : selectedNodes[index - 1].size.height
          )
          nodePositions.set(node.id, {
            x: direction === 'horizontal' ? currentPos : node.position.x,
            y: direction === 'vertical' ? currentPos : node.position.y,
          })
        }
      })

      return {
        ...prev,
        canvas: {
          ...prev.canvas,
          nodes: prev.canvas.nodes.map(node => {
            const newPos = nodePositions.get(node.id)
            return newPos ? { ...node, position: newPos } : node
          }),
        },
        isDirty: true,
      }
    })
  }, [state.selectedIds, pushHistory])

  // Z-order operations
  const bringForward = useCallback(() => {
    if (state.selectedIds.size === 0) return
    pushHistory()

    setState(prev => {
      const maxZ = Math.max(...prev.canvas.nodes.map(n => n.zIndex))
      return {
        ...prev,
        canvas: {
          ...prev.canvas,
          nodes: prev.canvas.nodes.map(node =>
            prev.selectedIds.has(node.id)
              ? { ...node, zIndex: Math.min(node.zIndex + 1, maxZ + 1) }
              : node
          ),
        },
        isDirty: true,
      }
    })
  }, [state.selectedIds, pushHistory])

  const sendBackward = useCallback(() => {
    if (state.selectedIds.size === 0) return
    pushHistory()

    setState(prev => ({
      ...prev,
      canvas: {
        ...prev.canvas,
        nodes: prev.canvas.nodes.map(node =>
          prev.selectedIds.has(node.id)
            ? { ...node, zIndex: Math.max(node.zIndex - 1, 0) }
            : node
        ),
      },
      isDirty: true,
    }))
  }, [state.selectedIds, pushHistory])

  const bringToFront = useCallback(() => {
    if (state.selectedIds.size === 0) return
    pushHistory()

    setState(prev => {
      const maxZ = Math.max(...prev.canvas.nodes.map(n => n.zIndex))
      return {
        ...prev,
        canvas: {
          ...prev.canvas,
          nodes: prev.canvas.nodes.map(node =>
            prev.selectedIds.has(node.id)
              ? { ...node, zIndex: maxZ + 1 }
              : node
          ),
        },
        isDirty: true,
      }
    })
  }, [state.selectedIds, pushHistory])

  const sendToBack = useCallback(() => {
    if (state.selectedIds.size === 0) return
    pushHistory()

    setState(prev => ({
      ...prev,
      canvas: {
        ...prev.canvas,
        nodes: prev.canvas.nodes.map(node =>
          prev.selectedIds.has(node.id)
            ? { ...node, zIndex: 0 }
            : node
        ),
      },
      isDirty: true,
    }))
  }, [state.selectedIds, pushHistory])

  // Misc
  const markDirty = useCallback(() => {
    setState(prev => ({ ...prev, isDirty: true }))
  }, [])

  const clearDirty = useCallback(() => {
    setState(prev => ({ ...prev, isDirty: false }))
  }, [])

  const value: CanvasContextValue = {
    ...state,
    setBoardId,
    setBoardName,
    setCanvas,
    setLayers,
    addNode,
    updateNode,
    deleteNode,
    moveNode,
    resizeNode,
    duplicateNodes,
    addConnection,
    updateConnection,
    deleteConnection,
    select,
    addToSelection,
    removeFromSelection,
    clearSelection,
    selectAll,
    addLayer,
    updateLayer,
    deleteLayer,
    toggleLayerVisibility,
    toggleLayerLock,
    reorderLayers,
    setActiveLayer,
    setActiveTool,
    setZoom,
    setShowGrid,
    setSnapToGrid,
    fitToScreen,
    undo,
    redo,
    pushHistory,
    canUndo,
    canRedo,
    alignNodes,
    distributeNodes,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    markDirty,
    clearDirty,
  }

  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  )
}

// ============================================================================
// HOOK
// ============================================================================

export function useCanvas() {
  const context = useContext(CanvasContext)
  if (!context) {
    throw new Error('useCanvas must be used within a CanvasProvider')
  }
  return context
}
