'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'

// Define the data shape that will be stored in the node's data property
interface ShapeNodeData extends Record<string, unknown> {
  shape: 'rectangle' | 'ellipse' | 'triangle' | 'diamond' | 'star' | 'line' | 'arrow'
  fill?: {
    type: 'solid' | 'gradient' | 'pattern'
    color?: string
    gradient?: {
      type: 'linear' | 'radial'
      stops: Array<{ offset: number; color: string }>
      angle?: number
    }
  }
  stroke?: {
    color: string
    width: number
    dash?: number[]
  }
  size?: {
    width: number
    height: number
  }
}

// Define the full node type
type ShapeFlowNode = Node<ShapeNodeData, 'shape'>

export const ShapeCanvasNode = memo(function ShapeCanvasNode({
  data,
  selected,
}: NodeProps<ShapeFlowNode>) {
  const { shape, fill, stroke, size } = data

  const fillColor = fill?.type === 'solid' ? fill.color : 'transparent'
  const strokeColor = stroke?.color || '#000'
  const strokeWidth = stroke?.width || 1

  const commonStyle: React.CSSProperties = {
    width: size?.width || 100,
    height: size?.height || 100,
    backgroundColor: fillColor,
    border: `${strokeWidth}px ${stroke?.dash ? 'dashed' : 'solid'} ${strokeColor}`,
  }

  const renderShape = () => {
    switch (shape) {
      case 'rectangle':
        return (
          <div
            className={`${selected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
            style={{
              ...commonStyle,
              borderRadius: 4,
            }}
          />
        )

      case 'ellipse':
        return (
          <div
            className={`${selected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
            style={{
              ...commonStyle,
              borderRadius: '50%',
            }}
          />
        )

      case 'triangle':
        return (
          <svg
            width={size?.width || 100}
            height={size?.height || 100}
            className={`${selected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
          >
            <polygon
              points={`${(size?.width || 100) / 2},0 ${size?.width || 100},${size?.height || 100} 0,${size?.height || 100}`}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={stroke?.dash?.join(' ')}
            />
          </svg>
        )

      case 'diamond':
        return (
          <svg
            width={size?.width || 100}
            height={size?.height || 100}
            className={`${selected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
          >
            <polygon
              points={`${(size?.width || 100) / 2},0 ${size?.width || 100},${(size?.height || 100) / 2} ${(size?.width || 100) / 2},${size?.height || 100} 0,${(size?.height || 100) / 2}`}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={stroke?.dash?.join(' ')}
            />
          </svg>
        )

      case 'star': {
        const cx = (size?.width || 100) / 2
        const cy = (size?.height || 100) / 2
        const outerR = Math.min(size?.width || 100, size?.height || 100) / 2
        const innerR = outerR * 0.4
        const points = []
        for (let i = 0; i < 10; i++) {
          const r = i % 2 === 0 ? outerR : innerR
          const angle = (Math.PI / 5) * i - Math.PI / 2
          points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`)
        }
        return (
          <svg
            width={size?.width || 100}
            height={size?.height || 100}
            className={`${selected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
          >
            <polygon
              points={points.join(' ')}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={stroke?.dash?.join(' ')}
            />
          </svg>
        )
      }

      case 'line':
        return (
          <svg
            width={size?.width || 100}
            height={strokeWidth + 10}
            className={`${selected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
          >
            <line
              x1={0}
              y1={(strokeWidth + 10) / 2}
              x2={size?.width || 100}
              y2={(strokeWidth + 10) / 2}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={stroke?.dash?.join(' ')}
            />
          </svg>
        )

      case 'arrow': {
        const arrowWidth = size?.width || 100
        const arrowHeight = size?.height || 20
        const arrowHeadSize = Math.min(arrowHeight, 20)
        return (
          <svg
            width={arrowWidth}
            height={arrowHeight}
            className={`${selected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
          >
            <line
              x1={0}
              y1={arrowHeight / 2}
              x2={arrowWidth - arrowHeadSize}
              y2={arrowHeight / 2}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={stroke?.dash?.join(' ')}
            />
            <polygon
              points={`${arrowWidth},${arrowHeight / 2} ${arrowWidth - arrowHeadSize},0 ${arrowWidth - arrowHeadSize},${arrowHeight}`}
              fill={strokeColor}
            />
          </svg>
        )
      }

      default:
        return (
          <div
            className={`${selected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
            style={{
              ...commonStyle,
              borderRadius: 4,
            }}
          />
        )
    }
  }

  return (
    <div className="relative">
      {renderShape()}
      <Handle type="source" position={Position.Top} id="top" className="!bg-primary opacity-0 hover:opacity-100" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-primary opacity-0 hover:opacity-100" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-primary opacity-0 hover:opacity-100" />
      <Handle type="source" position={Position.Left} id="left" className="!bg-primary opacity-0 hover:opacity-100" />
    </div>
  )
})

export default ShapeCanvasNode
