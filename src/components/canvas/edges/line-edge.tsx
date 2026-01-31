'use client'

import { memo } from 'react'
import { BaseEdge, EdgeLabelRenderer, type EdgeProps, getStraightPath } from '@xyflow/react'

interface LineEdgeData extends Record<string, unknown> {
  label?: string
  color?: string
  width?: number
  dash?: number[]
}

export const LineEdge = memo(function LineEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  style,
  markerEnd,
  selected,
}: EdgeProps) {
  const edgeData = data as LineEdgeData | undefined
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  })

  const color = edgeData?.color || style?.stroke as string || '#9CA3AF'
  const width = edgeData?.width || (style?.strokeWidth as number) || 1
  const dash = edgeData?.dash
  const label = edgeData?.label

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke: color,
          strokeWidth: width,
          strokeDasharray: dash?.join(' '),
          strokeLinecap: 'round',
        }}
        markerEnd={markerEnd}
        className={selected ? 'react-flow__edge-selected' : ''}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            className="absolute bg-card px-2 py-1 rounded text-xs border shadow-sm pointer-events-auto"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
            dir="ltr"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
})

export default LineEdge
