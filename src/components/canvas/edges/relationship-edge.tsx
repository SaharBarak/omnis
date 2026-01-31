'use client'

import { memo } from 'react'
import { BaseEdge, EdgeLabelRenderer, type EdgeProps, getBezierPath } from '@xyflow/react'

interface RelationshipEdgeData extends Record<string, unknown> {
  label?: string
  relationshipType?: string
  color?: string
  width?: number
}

export const RelationshipEdge = memo(function RelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style,
  markerEnd,
  selected,
}: EdgeProps) {
  const edgeData = data as RelationshipEdgeData | undefined
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const color = edgeData?.color || style?.stroke as string || '#6B7280'
  const width = edgeData?.width || (style?.strokeWidth as number) || 2
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

export default RelationshipEdge
