'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import type { SystemType } from '@/lib/types/board'

// Define the data shape that will be stored in the node's data property
interface PersonNodeData extends Record<string, unknown> {
  display?: 'avatar' | 'mini' | 'card'
  personId: string
  personName?: string
  hebrewName?: string
  avatarUrl?: string
  showSystems?: SystemType[]
}

// Define the full node type
type PersonFlowNode = Node<PersonNodeData, 'person'>

export const PersonCanvasNode = memo(function PersonCanvasNode({
  data,
  selected,
}: NodeProps<PersonFlowNode>) {
  const { display = 'card', personName, hebrewName, avatarUrl, showSystems } = data

  // Avatar display mode
  if (display === 'avatar') {
    return (
      <div
        className={`
          w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center
          border-2 ${selected ? 'border-primary' : 'border-border'}
          transition-all hover:shadow-md
        `}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={personName} className="w-full h-full rounded-full object-cover" />
        ) : (
          <span className="text-lg font-bold text-primary">
            {(hebrewName || personName || '?').charAt(0)}
          </span>
        )}
        <Handle type="source" position={Position.Right} className="!bg-primary" />
        <Handle type="target" position={Position.Left} className="!bg-primary" />
      </div>
    )
  }

  // Mini display mode
  if (display === 'mini') {
    return (
      <div
        className={`
          min-w-[100px] p-2 rounded-lg bg-card
          border-2 ${selected ? 'border-primary' : 'border-border'}
          shadow-sm transition-all hover:shadow-md
        `}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={personName} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-primary">
                {(hebrewName || personName || '?').charAt(0)}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" dir="ltr">
              {personName || hebrewName}
            </p>
          </div>
        </div>
        <Handle type="source" position={Position.Right} className="!bg-primary" />
        <Handle type="target" position={Position.Left} className="!bg-primary" />
      </div>
    )
  }

  // Card display mode (default)
  return (
    <div
      className={`
        min-w-[200px] p-4 rounded-xl bg-card
        border-2 ${selected ? 'border-primary ring-2 ring-primary/20' : 'border-border'}
        shadow-md transition-all hover:shadow-lg
      `}
    >
      <div className="flex flex-col items-center gap-3">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          {avatarUrl ? (
            <img src={avatarUrl} alt={personName} className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-primary">
              {(hebrewName || personName || '?').charAt(0)}
            </span>
          )}
        </div>

        {/* Name */}
        <div className="text-center">
          <h3 className="font-semibold text-lg" dir="ltr">
            {personName || hebrewName || 'New person'}
          </h3>
          {hebrewName && personName && hebrewName !== personName && (
            <p className="text-sm text-muted-foreground">{personName}</p>
          )}
        </div>

        {/* Systems indicators */}
        {showSystems && showSystems.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-center">
            {showSystems.includes('dreamspell') && (
              <span className="px-2 py-0.5 text-xs rounded bg-red-100 text-red-800">Dreamspell</span>
            )}
            {showSystems.includes('tzolkin') && (
              <span className="px-2 py-0.5 text-xs rounded bg-orange-100 text-orange-800">Tzolkin</span>
            )}
            {showSystems.includes('astrology') && (
              <span className="px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-800">Astro</span>
            )}
            {showSystems.includes('humandesign') && (
              <span className="px-2 py-0.5 text-xs rounded bg-pink-100 text-pink-800">HD</span>
            )}
            {showSystems.includes('gematria') && (
              <span className="px-2 py-0.5 text-xs rounded bg-cyan-100 text-cyan-800">Gematria</span>
            )}
          </div>
        )}
      </div>

      {/* Connection handles */}
      <Handle type="source" position={Position.Top} id="top" className="!bg-primary" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-primary" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-primary" />
      <Handle type="source" position={Position.Left} id="left" className="!bg-primary" />
      <Handle type="target" position={Position.Top} id="top-target" className="!bg-primary" />
      <Handle type="target" position={Position.Right} id="right-target" className="!bg-primary" />
      <Handle type="target" position={Position.Bottom} id="bottom-target" className="!bg-primary" />
      <Handle type="target" position={Position.Left} id="left-target" className="!bg-primary" />
    </div>
  )
})

export default PersonCanvasNode
