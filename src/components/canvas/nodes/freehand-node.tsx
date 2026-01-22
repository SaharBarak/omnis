'use client'

import { memo, useMemo } from 'react'
import { type NodeProps, type Node } from '@xyflow/react'

interface FreehandNodeData extends Record<string, unknown> {
  points: Array<{ x: number; y: number }>
  color: string
  width: number
}

type FreehandFlowNode = Node<FreehandNodeData, 'freehand'>

export const FreehandCanvasNode = memo(function FreehandCanvasNode({
  data,
  selected,
}: NodeProps<FreehandFlowNode>) {
  const { points, color, width } = data

  // Calculate bounds to size the SVG
  const bounds = useMemo(() => {
    if (points.length === 0) return { minX: 0, minY: 0, maxX: 100, maxY: 100 }

    const xs = points.map(p => p.x)
    const ys = points.map(p => p.y)

    return {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xs),
      maxY: Math.max(...ys),
    }
  }, [points])

  // Generate path from points using smooth curves
  const pathData = useMemo(() => {
    if (points.length < 2) return ''

    // Normalize points to start from 0,0
    const normalizedPoints = points.map(p => ({
      x: p.x - bounds.minX + width,
      y: p.y - bounds.minY + width,
    }))

    // Start path
    let d = `M ${normalizedPoints[0].x} ${normalizedPoints[0].y}`

    if (normalizedPoints.length === 2) {
      // Simple line for 2 points
      d += ` L ${normalizedPoints[1].x} ${normalizedPoints[1].y}`
    } else {
      // Use quadratic curves for smooth paths
      for (let i = 1; i < normalizedPoints.length - 1; i++) {
        const current = normalizedPoints[i]
        const next = normalizedPoints[i + 1]
        const midX = (current.x + next.x) / 2
        const midY = (current.y + next.y) / 2
        d += ` Q ${current.x} ${current.y} ${midX} ${midY}`
      }

      // End with last point
      const last = normalizedPoints[normalizedPoints.length - 1]
      d += ` L ${last.x} ${last.y}`
    }

    return d
  }, [points, bounds, width])

  const svgWidth = bounds.maxX - bounds.minX + width * 2
  const svgHeight = bounds.maxY - bounds.minY + width * 2

  return (
    <div
      className={`
        ${selected ? 'ring-2 ring-primary ring-offset-2' : ''}
        transition-all
      `}
      style={{
        width: svgWidth,
        height: svgHeight,
        pointerEvents: 'none',
      }}
    >
      <svg
        width={svgWidth}
        height={svgHeight}
        style={{ overflow: 'visible' }}
      >
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth={width}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
})

export default FreehandCanvasNode
