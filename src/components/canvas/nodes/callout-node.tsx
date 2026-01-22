'use client'

import { memo, useState, useCallback } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { useCanvas } from '../canvas-context'

interface CalloutNodeData extends Record<string, unknown> {
  targetId: string
  content: string
  pointer: 'top' | 'right' | 'bottom' | 'left'
  backgroundColor?: string
  textColor?: string
}

type CalloutFlowNode = Node<CalloutNodeData, 'callout'>

export const CalloutCanvasNode = memo(function CalloutCanvasNode({
  id,
  data,
  selected,
}: NodeProps<CalloutFlowNode>) {
  const { content, pointer = 'left', backgroundColor = '#1F2937', textColor = '#FFFFFF' } = data
  const { updateNode } = useCanvas()
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(content)

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true)
    setEditText(content)
  }, [content])

  const handleBlur = useCallback(() => {
    setIsEditing(false)
    if (editText !== content) {
      updateNode(id, { content: editText } as never)
    }
  }, [id, editText, content, updateNode])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditText(content)
      setIsEditing(false)
    }
  }, [content])

  // Get pointer position based on direction
  const getPointerStyle = () => {
    const pointerSize = 12
    const baseStyle = {
      position: 'absolute' as const,
      width: 0,
      height: 0,
      borderStyle: 'solid' as const,
    }

    switch (pointer) {
      case 'top':
        return {
          ...baseStyle,
          top: -pointerSize,
          left: '50%',
          transform: 'translateX(-50%)',
          borderWidth: `0 ${pointerSize}px ${pointerSize}px ${pointerSize}px`,
          borderColor: `transparent transparent ${backgroundColor} transparent`,
        }
      case 'bottom':
        return {
          ...baseStyle,
          bottom: -pointerSize,
          left: '50%',
          transform: 'translateX(-50%)',
          borderWidth: `${pointerSize}px ${pointerSize}px 0 ${pointerSize}px`,
          borderColor: `${backgroundColor} transparent transparent transparent`,
        }
      case 'left':
        return {
          ...baseStyle,
          left: -pointerSize,
          top: '50%',
          transform: 'translateY(-50%)',
          borderWidth: `${pointerSize}px ${pointerSize}px ${pointerSize}px 0`,
          borderColor: `transparent ${backgroundColor} transparent transparent`,
        }
      case 'right':
        return {
          ...baseStyle,
          right: -pointerSize,
          top: '50%',
          transform: 'translateY(-50%)',
          borderWidth: `${pointerSize}px 0 ${pointerSize}px ${pointerSize}px`,
          borderColor: `transparent transparent transparent ${backgroundColor}`,
        }
    }
  }

  return (
    <div
      className={`
        relative min-w-[120px] min-h-[60px] p-3 rounded-lg shadow-lg
        ${selected ? 'ring-2 ring-primary ring-offset-2' : ''}
        transition-all
      `}
      style={{ backgroundColor }}
      onDoubleClick={handleDoubleClick}
    >
      {/* Pointer */}
      <div style={getPointerStyle()} />

      {/* Content */}
      {isEditing ? (
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full h-full min-h-[40px] bg-transparent border-none outline-none resize-none text-sm"
          style={{ color: textColor }}
          dir="rtl"
          placeholder="הוסף הערה..."
        />
      ) : (
        <div
          className="text-sm whitespace-pre-wrap"
          style={{ color: textColor }}
          dir="rtl"
        >
          {content || 'לחץ פעמיים לעריכה'}
        </div>
      )}

      {/* Handles */}
      <Handle type="source" position={Position.Top} className="!bg-gray-500 opacity-0 hover:opacity-100" />
      <Handle type="source" position={Position.Right} className="!bg-gray-500 opacity-0 hover:opacity-100" />
      <Handle type="source" position={Position.Bottom} className="!bg-gray-500 opacity-0 hover:opacity-100" />
      <Handle type="source" position={Position.Left} className="!bg-gray-500 opacity-0 hover:opacity-100" />
    </div>
  )
})

export default CalloutCanvasNode
