'use client'

import { memo, useState, useCallback } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { useCanvas } from '../canvas-context'

// Define the data shape that will be stored in the node's data property
interface TextNodeData extends Record<string, unknown> {
  content: string
  textStyle?: {
    fontFamily?: string
    fontSize?: number
    fontWeight?: number
    color?: string
    alignment?: 'left' | 'center' | 'right'
    direction?: 'ltr' | 'rtl'
    lineHeight?: number
  }
}

// Define the full node type
type TextFlowNode = Node<TextNodeData, 'text'>

export const TextCanvasNode = memo(function TextCanvasNode({
  id,
  data,
  selected,
}: NodeProps<TextFlowNode>) {
  const { content, textStyle } = data
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
      // Note: updateNode expects a partial CanvasNode, but we're only updating nested data
      // This is a simplified approach - in production you'd update via the full node structure
      updateNode(id, { content: editText } as never)
    }
  }, [id, editText, content, updateNode])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleBlur()
    }
    if (e.key === 'Escape') {
      setEditText(content)
      setIsEditing(false)
    }
  }, [content, handleBlur])

  const style: React.CSSProperties = {
    fontFamily: textStyle?.fontFamily || 'inherit',
    fontSize: textStyle?.fontSize || 16,
    fontWeight: textStyle?.fontWeight || 400,
    color: textStyle?.color || 'inherit',
    textAlign: textStyle?.alignment || 'right',
    direction: textStyle?.direction || 'rtl',
    lineHeight: textStyle?.lineHeight || 1.5,
  }

  return (
    <div
      className={`
        min-w-[100px] min-h-[40px] p-2
        ${selected ? 'ring-2 ring-primary ring-offset-2' : ''}
        transition-all
      `}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full h-full min-h-[100px] bg-transparent border-none outline-none resize-none"
          style={style}
          dir={textStyle?.direction || 'rtl'}
        />
      ) : (
        <div
          className="whitespace-pre-wrap"
          style={style}
          dir={textStyle?.direction || 'rtl'}
        >
          {content || 'לחץ פעמיים לעריכה'}
        </div>
      )}

      <Handle type="source" position={Position.Right} className="!bg-primary opacity-0 hover:opacity-100" />
      <Handle type="target" position={Position.Left} className="!bg-primary opacity-0 hover:opacity-100" />
    </div>
  )
})

export default TextCanvasNode
