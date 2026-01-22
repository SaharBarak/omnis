'use client'

import { memo } from 'react'
import { BaseEdge, EdgeLabelRenderer, type EdgeProps, getSmoothStepPath } from '@xyflow/react'

interface FlowEdgeData extends Record<string, unknown> {
  label?: string
  color?: string
  width?: number
  animated?: boolean
}

export const FlowEdge = memo(function FlowEdge({
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
  const edgeData = data as FlowEdgeData | undefined
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  })

  const color = edgeData?.color || style?.stroke as string || '#3B82F6'
  const width = edgeData?.width || (style?.strokeWidth as number) || 2
  const label = edgeData?.label
  const animated = edgeData?.animated

  return (
    <>
      {/* Arrow marker definition */}
      <defs>
        <marker
          id={`arrow-${id}`}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
        </marker>
      </defs>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke: color,
          strokeWidth: width,
          strokeLinecap: 'round',
          markerEnd: `url(#arrow-${id})`,
        }}
        markerEnd={markerEnd}
        className={`${selected ? 'react-flow__edge-selected' : ''} ${animated ? 'react-flow__edge-animated' : ''}`}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            className="absolute bg-card px-2 py-1 rounded text-xs border shadow-sm pointer-events-auto"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
            dir="rtl"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
})

export default FlowEdge
