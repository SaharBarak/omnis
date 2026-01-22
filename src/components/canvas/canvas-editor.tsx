'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Panel,
  type Node,
  type Edge,
  type Connection,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { useCanvas } from './canvas-context'
import { CanvasToolbar } from './canvas-toolbar'
import { PropertiesPanel } from './properties-panel'
import { LayersPanel } from './layers-panel'
import { edgeTypes } from './edges'
import { useKeyboardShortcuts } from './use-keyboard-shortcuts'
import type { CanvasNode, CanvasConnection, Layer, TextNode, ShapeNode, StickyNote, StickyColor } from '@/lib/types/board'

// ============================================================================
// HELPERS
// ============================================================================

function canvasNodeToFlowNode(node: CanvasNode, layers: Layer[]): Node {
  // Find the layer and apply its opacity
  const layer = layers.find(l => l.id === node.layerId)
  const layerOpacity = layer?.opacity ?? 1
  const finalOpacity = node.style.opacity * layerOpacity
  const isLayerLocked = layer?.locked ?? false

  return {
    id: node.id,
    type: 'default',
    position: node.position,
    data: {
      label: node.type === 'person' && 'personId' in node ? (node as { personId: string }).personId : node.type,
      nodeData: node,
    },
    width: node.size.width,
    height: node.size.height,
    style: {
      opacity: finalOpacity,
    },
    draggable: !node.locked && !isLayerLocked,
    selectable: !node.locked && !isLayerLocked,
    hidden: !node.visible,
  }
}

function canvasConnectionToFlowEdge(conn: CanvasConnection): Edge {
  // Map our connection types to custom edge types
  const edgeType = conn.type === 'relationship' ? 'relationship'
    : conn.type === 'flow' ? 'flow'
    : conn.type === 'curve' ? 'curve'
    : 'line'

  return {
    id: conn.id,
    source: conn.sourceId,
    target: conn.targetId,
    sourceHandle: conn.sourceAnchor,
    targetHandle: conn.targetAnchor,
    type: edgeType,
    data: {
      label: conn.label,
      color: conn.style.color,
      width: conn.style.width,
      dash: conn.style.dash,
      connectionData: conn,
    } as Record<string, unknown>,
    style: {
      stroke: conn.style.color,
      strokeWidth: conn.style.width,
      strokeDasharray: conn.style.dash?.join(' '),
    },
    markerEnd: conn.style.endMarker === 'arrow' ? { type: 'arrowclosed' as const } : undefined,
  }
}

// ============================================================================
// CANVAS EDITOR COMPONENT
// ============================================================================

interface CanvasEditorProps {
  className?: string
  readOnly?: boolean
  onSave?: () => void
  onExport?: () => void
}

export function CanvasEditor({ className, readOnly = false, onSave, onExport }: CanvasEditorProps) {
  const {
    canvas,
    layers,
    selectedIds,
    activeTool,
    activeLayerId,
    showGrid,
    snapToGrid,
    zoom,
    moveNode,
    select,
    clearSelection,
    addNode,
    addConnection,
    setZoom,
    setActiveTool,
  } = useCanvas()

  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  // Enable keyboard shortcuts when not in read-only mode
  useKeyboardShortcuts({ enabled: !readOnly })

  // Convert canvas nodes to React Flow nodes
  const initialNodes = useMemo(() => {
    const visibleLayerIds = new Set(layers.filter(l => l.visible).map(l => l.id))
    return canvas.nodes
      .filter(node => visibleLayerIds.has(node.layerId))
      .map(node => canvasNodeToFlowNode(node, layers))
  }, [canvas.nodes, layers])

  // Convert canvas connections to React Flow edges
  const initialEdges = useMemo(() => {
    const visibleLayerIds = new Set(layers.filter(l => l.visible).map(l => l.id))
    return canvas.connections
      .filter(conn => visibleLayerIds.has(conn.layerId))
      .map(canvasConnectionToFlowEdge)
  }, [canvas.connections, layers])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Sync nodes when canvas changes
  useEffect(() => {
    const visibleLayerIds = new Set(layers.filter(l => l.visible).map(l => l.id))
    const newNodes = canvas.nodes
      .filter(node => visibleLayerIds.has(node.layerId))
      .map(node => canvasNodeToFlowNode(node, layers))
    setNodes(newNodes)
  }, [canvas.nodes, layers, setNodes])

  // Sync edges when canvas changes
  useEffect(() => {
    const visibleLayerIds = new Set(layers.filter(l => l.visible).map(l => l.id))
    const newEdges = canvas.connections
      .filter(conn => visibleLayerIds.has(conn.layerId))
      .map(canvasConnectionToFlowEdge)
    setEdges(newEdges)
  }, [canvas.connections, layers, setEdges])

  // Handle node changes (position, selection)
  const handleNodesChange: OnNodesChange = useCallback((changes) => {
    onNodesChange(changes)

    changes.forEach(change => {
      if (change.type === 'position' && change.position && change.dragging === false) {
        const node = canvas.nodes.find(n => n.id === change.id)
        if (node && change.position) {
          moveNode(change.id, change.position)
        }
      }
      if (change.type === 'select') {
        if (change.selected) {
          select([change.id])
        }
      }
    })
  }, [onNodesChange, canvas.nodes, moveNode, select])

  // Handle edge changes
  const handleEdgesChange: OnEdgesChange = useCallback((changes) => {
    onEdgesChange(changes)
  }, [onEdgesChange])

  // Handle new connection
  const handleConnect: OnConnect = useCallback((params: Connection) => {
    if (readOnly || !params.source || !params.target) return

    const newConnection: CanvasConnection = {
      id: crypto.randomUUID(),
      type: 'line',
      sourceId: params.source,
      targetId: params.target,
      sourceAnchor: 'auto',
      targetAnchor: 'auto',
      style: {
        color: '#6B7280',
        width: 2,
      },
      layerId: 'connections',
    }

    addConnection(newConnection)
  }, [readOnly, addConnection])

  // Handle node selection
  const handleSelectionChange = useCallback(({ nodes: selectedNodes }: { nodes: Node[] }) => {
    select(selectedNodes.map(n => n.id))
  }, [select])

  // Get React Flow instance for viewport conversion
  const reactFlowInstance = useReactFlow()

  // Handle click on canvas background - create nodes based on active tool
  const handlePaneClick = useCallback((event: React.MouseEvent) => {
    if (readOnly) {
      clearSelection()
      return
    }

    // For select or hand tool, just clear selection
    if (activeTool === 'select' || activeTool === 'hand') {
      clearSelection()
      return
    }

    // Get click position in canvas coordinates
    const bounds = reactFlowWrapper.current?.getBoundingClientRect()
    if (!bounds) return

    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    })

    // Snap to grid if enabled
    const finalPosition = snapToGrid
      ? {
          x: Math.round(position.x / canvas.grid.size) * canvas.grid.size,
          y: Math.round(position.y / canvas.grid.size) * canvas.grid.size,
        }
      : position

    const nodeId = crypto.randomUUID()

    // Create node based on active tool
    switch (activeTool) {
      case 'text': {
        const textNode: TextNode = {
          id: nodeId,
          type: 'text',
          position: finalPosition,
          size: { width: 200, height: 100 },
          rotation: 0,
          locked: false,
          visible: true,
          layerId: activeLayerId,
          zIndex: canvas.nodes.length,
          style: { opacity: 1 },
          content: '',
          textStyle: {
            fontFamily: 'Heebo, sans-serif',
            fontSize: 16,
            fontWeight: 400,
            color: '#1F2937',
            alignment: 'right',
            direction: 'rtl',
            lineHeight: 1.5,
          },
        }
        addNode(textNode)
        select([nodeId])
        setActiveTool('select')
        break
      }

      case 'shape': {
        const shapeNode: ShapeNode = {
          id: nodeId,
          type: 'shape',
          position: finalPosition,
          size: { width: 100, height: 100 },
          rotation: 0,
          locked: false,
          visible: true,
          layerId: activeLayerId,
          zIndex: canvas.nodes.length,
          style: { opacity: 1 },
          shape: 'rectangle',
          fill: { type: 'solid', color: '#E5E7EB' },
          stroke: { color: '#6B7280', width: 2 },
        }
        addNode(shapeNode)
        select([nodeId])
        setActiveTool('select')
        break
      }

      case 'sticky': {
        const stickyColors: StickyColor[] = ['yellow', 'pink', 'blue', 'green', 'purple']
        const randomColor = stickyColors[Math.floor(Math.random() * stickyColors.length)]
        const stickyNode: StickyNote = {
          id: nodeId,
          type: 'sticky',
          position: finalPosition,
          size: { width: 150, height: 150 },
          rotation: 0,
          locked: false,
          visible: true,
          layerId: activeLayerId,
          zIndex: canvas.nodes.length,
          style: { opacity: 1 },
          content: '',
          color: randomColor,
        }
        addNode(stickyNode)
        select([nodeId])
        setActiveTool('select')
        break
      }

      case 'line':
      case 'pen':
      case 'highlight':
        // These tools require drag behavior, not just click
        // For now, just clear selection
        clearSelection()
        break

      default:
        clearSelection()
    }
  }, [readOnly, activeTool, activeLayerId, clearSelection, addNode, select, setActiveTool, canvas.grid.size, canvas.nodes.length, snapToGrid, reactFlowInstance])

  // Handle zoom change
  const handleMoveEnd = useCallback((_event: unknown, viewport: { zoom: number }) => {
    setZoom(viewport.zoom)
  }, [setZoom])

  // Get cursor based on active tool
  const getCursor = () => {
    switch (activeTool) {
      case 'hand': return 'grab'
      case 'text': return 'text'
      case 'shape':
      case 'line':
      case 'sticky':
      case 'pen':
      case 'highlight': return 'crosshair'
      default: return 'default'
    }
  }

  return (
    <div
      ref={reactFlowWrapper}
      className={`h-full w-full ${className || ''}`}
      style={{ cursor: getCursor() }}
      tabIndex={0}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        edgeTypes={edgeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onSelectionChange={handleSelectionChange}
        onPaneClick={handlePaneClick}
        onMoveEnd={handleMoveEnd}
        fitView
        snapToGrid={snapToGrid}
        snapGrid={[canvas.grid.size, canvas.grid.size]}
        defaultViewport={{ x: 0, y: 0, zoom }}
        minZoom={0.1}
        maxZoom={5}
        deleteKeyCode={null}
        multiSelectionKeyCode="Shift"
        selectionKeyCode="Shift"
        panOnDrag={activeTool === 'hand' || activeTool === 'select'}
        panOnScroll
        zoomOnScroll
        zoomOnPinch
        selectionOnDrag={activeTool === 'select'}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
      >
        {showGrid && (
          <Background
            variant={BackgroundVariant.Dots}
            gap={canvas.grid.size}
            size={1}
            color={canvas.grid.color}
          />
        )}

        <Controls
          showZoom={true}
          showFitView={true}
          showInteractive={false}
          position="bottom-left"
        />

        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          position="bottom-right"
        />

        {/* Toolbar Panel */}
        <Panel position="top-left">
          <CanvasToolbar readOnly={readOnly} onSave={onSave} onExport={onExport} />
        </Panel>

        {/* Properties Panel */}
        {selectedIds.size > 0 && !readOnly && (
          <Panel position="top-right">
            <PropertiesPanel />
          </Panel>
        )}
      </ReactFlow>

      {/* Layers Panel - Outside ReactFlow */}
      {!readOnly && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <LayersPanel />
        </div>
      )}
    </div>
  )
}

export default CanvasEditor
