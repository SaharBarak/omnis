'use client'

import { useCallback } from 'react'
import {
  MousePointer2,
  Hand,
  Type,
  Square,
  Minus,
  StickyNote,
  Pencil,
  Highlighter,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid3X3,
  Save,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useCanvas } from './canvas-context'
import type { ToolId } from '@/lib/types/board'

interface CanvasToolbarProps {
  readOnly?: boolean
  onSave?: () => void
  onExport?: () => void
}

export function CanvasToolbar({ readOnly, onSave, onExport }: CanvasToolbarProps) {
  const {
    activeTool,
    setActiveTool,
    undo,
    redo,
    canUndo,
    canRedo,
    zoom,
    setZoom,
    fitToScreen,
    showGrid,
    setShowGrid,
    isDirty,
  } = useCanvas()

  const tools: { id: ToolId; icon: React.ReactNode; label: string; shortcut: string }[] = [
    { id: 'select', icon: <MousePointer2 className="h-4 w-4" />, label: 'בחירה', shortcut: 'V' },
    { id: 'hand', icon: <Hand className="h-4 w-4" />, label: 'גרירה', shortcut: 'H' },
    { id: 'text', icon: <Type className="h-4 w-4" />, label: 'טקסט', shortcut: 'T' },
    { id: 'shape', icon: <Square className="h-4 w-4" />, label: 'צורה', shortcut: 'R' },
    { id: 'line', icon: <Minus className="h-4 w-4" />, label: 'קו', shortcut: 'L' },
    { id: 'sticky', icon: <StickyNote className="h-4 w-4" />, label: 'פתק', shortcut: 'N' },
    { id: 'pen', icon: <Pencil className="h-4 w-4" />, label: 'עט', shortcut: 'P' },
    { id: 'highlight', icon: <Highlighter className="h-4 w-4" />, label: 'הדגשה', shortcut: 'G' },
  ]

  const handleToolClick = useCallback((toolId: ToolId) => {
    setActiveTool(toolId)
  }, [setActiveTool])

  const handleZoomIn = useCallback(() => {
    setZoom(Math.min(zoom + 0.25, 5))
  }, [zoom, setZoom])

  const handleZoomOut = useCallback(() => {
    setZoom(Math.max(zoom - 0.25, 0.1))
  }, [zoom, setZoom])

  if (readOnly) {
    return (
      <div className="flex items-center gap-1 p-2 bg-card rounded-lg shadow-md border">
        {/* View controls only */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomOut}
          title="התרחק"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="px-2 text-sm font-medium min-w-[60px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomIn}
          title="התקרב"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={fitToScreen}
          title="התאם למסך"
        >
          <Maximize className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Main toolbar */}
      <div className="flex items-center gap-1 p-2 bg-card rounded-lg shadow-md border">
        {/* Save */}
        {onSave && (
          <>
            <Button
              variant={isDirty ? 'default' : 'ghost'}
              size="sm"
              onClick={onSave}
              title="שמור"
            >
              <Save className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
          </>
        )}

        {/* Undo/Redo */}
        <Button
          variant="ghost"
          size="sm"
          onClick={undo}
          disabled={!canUndo()}
          title="בטל (Ctrl+Z)"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={redo}
          disabled={!canRedo()}
          title="בצע שוב (Ctrl+Shift+Z)"
        >
          <Redo2 className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Tools */}
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant={activeTool === tool.id ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => handleToolClick(tool.id)}
            title={`${tool.label} (${tool.shortcut})`}
            className={activeTool === tool.id ? 'bg-primary/10' : ''}
          >
            {tool.icon}
          </Button>
        ))}

        <Separator orientation="vertical" className="h-6" />

        {/* View controls */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomOut}
          title="התרחק (Ctrl+-)"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="px-2 text-sm font-medium min-w-[60px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomIn}
          title="התקרב (Ctrl+=)"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={fitToScreen}
          title="התאם למסך (Ctrl+0)"
        >
          <Maximize className="h-4 w-4" />
        </Button>
        <Button
          variant={showGrid ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setShowGrid(!showGrid)}
          title="הצג/הסתר רשת"
        >
          <Grid3X3 className="h-4 w-4" />
        </Button>

        {/* Export */}
        {onExport && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <Button
              variant="ghost"
              size="sm"
              onClick={onExport}
              title="ייצא"
            >
              <Download className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export default CanvasToolbar
