'use client'

import { memo, useState, useCallback } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { STICKY_COLORS, type StickyColor } from '@/lib/types/board'
import { useCanvas } from '../canvas-context'

// Define the data shape that will be stored in the node's data property
interface StickyNodeData extends Record<string, unknown> {
  content: string
  color?: StickyColor
}

// Define the full node type
type StickyFlowNode = Node<StickyNodeData, 'sticky'>

export const StickyCanvasNode = memo(function StickyCanvasNode({
  id,
  data,
  selected,
}: NodeProps<StickyFlowNode>) {
  const { content, color = 'yellow' } = data
  const { updateNode } = useCanvas()
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(content)

  const bgColor = STICKY_COLORS[color as StickyColor] || STICKY_COLORS.yellow

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true)
    setEditText(content)
  }, [content])

  const handleBlur = useCallback(() => {
    setIsEditing(false)
    if (editText !== content) {
      // Note: updateNode expects a partial CanvasNode, simplified for now
      updateNode(id, { content: editText } as never)
    }
  }, [id, editText, content, updateNode])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditText(content)
      setIsEditing(false)
    }
  }, [content])

  return (
    <div
      className={`
        min-w-[150px] min-h-[150px] p-4 rounded shadow-md
        ${selected ? 'ring-2 ring-primary ring-offset-2' : ''}
        transition-all
      `}
      style={{
        backgroundColor: bgColor,
        transform: 'rotate(-1deg)',
      }}
      onDoubleClick={handleDoubleClick}
    >
      {/* Fold effect */}
      <div
        className="absolute top-0 right-0 w-6 h-6"
        style={{
          background: `linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.1) 50%)`,
        }}
      />

      {isEditing ? (
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full h-full min-h-[120px] bg-transparent border-none outline-none resize-none"
          style={{
            fontFamily: "'Heebo', sans-serif",
            fontSize: 14,
            color: '#1F2937',
          }}
          dir="ltr"
          placeholder="Write a note..."
        />
      ) : (
        <div
          className="whitespace-pre-wrap text-sm"
          style={{
            fontFamily: "'Heebo', sans-serif",
            color: '#1F2937',
          }}
          dir="ltr"
        >
          {content || 'Double-click to edit'}
        </div>
      )}

      <Handle type="source" position={Position.Right} className="!bg-amber-600 opacity-0 hover:opacity-100" />
      <Handle type="target" position={Position.Left} className="!bg-amber-600 opacity-0 hover:opacity-100" />
    </div>
  )
})

export default StickyCanvasNode
