'use client'

import { memo } from 'react'
import { type NodeProps, type Node } from '@xyflow/react'

interface HighlightNodeData extends Record<string, unknown> {
  targetIds: string[]
  color: string
  label?: string
}

type HighlightFlowNode = Node<HighlightNodeData, 'highlight'>

export const HighlightCanvasNode = memo(function HighlightCanvasNode({
  data,
  selected,
}: NodeProps<HighlightFlowNode>) {
  const { color, label } = data

  return (
    <div
      className={`
        min-w-[100px] min-h-[100px] rounded-lg
        border-2 border-dashed
        ${selected ? 'ring-2 ring-primary ring-offset-2' : ''}
        transition-all
      `}
      style={{
        backgroundColor: color + '20', // Add transparency
        borderColor: color,
      }}
    >
      {label && (
        <div
          className="absolute -top-6 right-0 px-2 py-0.5 text-xs font-medium rounded"
          style={{
            backgroundColor: color,
            color: 'white',
          }}
          dir="rtl"
        >
          {label}
        </div>
      )}
    </div>
  )
})

export default HighlightCanvasNode
