'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
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
import type { CanvasNode, CanvasConnection } from '@/lib/types/board'

// ============================================================================
// HELPERS
// ============================================================================

function canvasNodeToFlowNode(node: CanvasNode): Node {
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
      opacity: node.style.opacity,
    },
    draggable: !node.locked,
    selectable: !node.locked,
    hidden: !node.visible,
  }
}

function canvasConnectionToFlowEdge(conn: CanvasConnection): Edge {
  return {
    id: conn.id,
    source: conn.sourceId,
    target: conn.targetId,
    sourceHandle: conn.sourceAnchor,
    targetHandle: conn.targetAnchor,
    type: conn.type === 'curve' ? 'smoothstep' : conn.type === 'flow' ? 'default' : 'straight',
    label: conn.label,
    style: {
      stroke: conn.style.color,
      strokeWidth: conn.style.width,
      strokeDasharray: conn.style.dash?.join(' '),
    },
    markerEnd: conn.style.endMarker === 'arrow' ? { type: 'arrowclosed' as const } : undefined,
    data: conn as unknown as Record<string, unknown>,
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
    showGrid,
    snapToGrid,
    zoom,
    moveNode,
    select,
    clearSelection,
    addConnection,
    deleteNode,
    setZoom,
  } = useCanvas()

  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  // Convert canvas nodes to React Flow nodes
  const initialNodes = useMemo(() => {
    const visibleLayerIds = new Set(layers.filter(l => l.visible).map(l => l.id))
    return canvas.nodes
      .filter(node => visibleLayerIds.has(node.layerId))
      .map(canvasNodeToFlowNode)
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
      .map(canvasNodeToFlowNode)
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

  // Handle click on canvas background
  const handlePaneClick = useCallback(() => {
    clearSelection()
  }, [clearSelection])

  // Handle delete key
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (readOnly) return

    if (event.key === 'Delete' || event.key === 'Backspace') {
      Array.from(selectedIds).forEach(id => deleteNode(id))
    }
  }, [readOnly, selectedIds, deleteNode])

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
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
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
