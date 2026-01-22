'use client'

import { useState, useCallback, useMemo } from 'react'
import { Trash2, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useCanvas } from './canvas-context'
import type { ConnectionType, Marker } from '@/lib/types/board'

const CONNECTION_TYPES: { value: ConnectionType; label: string }[] = [
  { value: 'line', label: 'קו' },
  { value: 'curve', label: 'עקומה' },
  { value: 'flow', label: 'זרימה (חץ)' },
  { value: 'relationship', label: 'קשר' },
]

const MARKER_OPTIONS: { value: Marker; label: string }[] = [
  { value: 'none', label: 'ללא' },
  { value: 'arrow', label: 'חץ' },
  { value: 'circle', label: 'עיגול' },
  { value: 'diamond', label: 'מעוין' },
]

const PRESET_COLORS = [
  '#6B7280', // gray
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
]

interface ConnectionPropertiesPanelProps {
  connectionId: string
}

export function ConnectionPropertiesPanel({ connectionId }: ConnectionPropertiesPanelProps) {
  const { canvas, updateConnection, deleteConnection } = useCanvas()

  const connection = useMemo(() => {
    return canvas.connections.find(c => c.id === connectionId)
  }, [canvas.connections, connectionId])

  const [label, setLabel] = useState(connection?.label || '')

  const handleTypeChange = useCallback((type: ConnectionType) => {
    if (!connection) return
    updateConnection(connectionId, { type })
  }, [connectionId, connection, updateConnection])

  const handleColorChange = useCallback((color: string) => {
    if (!connection) return
    updateConnection(connectionId, {
      style: { ...connection.style, color }
    })
  }, [connectionId, connection, updateConnection])

  const handleWidthChange = useCallback((width: number) => {
    if (!connection) return
    updateConnection(connectionId, {
      style: { ...connection.style, width }
    })
  }, [connectionId, connection, updateConnection])

  const handleDashChange = useCallback((dashed: boolean) => {
    if (!connection) return
    updateConnection(connectionId, {
      style: {
        ...connection.style,
        dash: dashed ? [5, 5] : undefined
      }
    })
  }, [connectionId, connection, updateConnection])

  const handleStartMarkerChange = useCallback((marker: Marker) => {
    if (!connection) return
    updateConnection(connectionId, {
      style: { ...connection.style, startMarker: marker }
    })
  }, [connectionId, connection, updateConnection])

  const handleEndMarkerChange = useCallback((marker: Marker) => {
    if (!connection) return
    updateConnection(connectionId, {
      style: { ...connection.style, endMarker: marker }
    })
  }, [connectionId, connection, updateConnection])

  const handleLabelChange = useCallback(() => {
    if (!connection) return
    updateConnection(connectionId, { label: label || undefined })
  }, [connectionId, connection, label, updateConnection])

  const handleDelete = useCallback(() => {
    deleteConnection(connectionId)
  }, [connectionId, deleteConnection])

  if (!connection) {
    return null
  }

  return (
    <div className="w-64 p-4 bg-card rounded-lg shadow-md border max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm" dir="rtl">קשר</h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleDelete}
            title="מחק"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Connection Type */}
      <div className="space-y-2 mb-4">
        <Label className="text-xs text-muted-foreground">סוג חיבור</Label>
        <select
          value={connection.type}
          onChange={(e) => handleTypeChange(e.target.value as ConnectionType)}
          className="w-full px-2 py-1.5 text-sm border rounded"
          dir="rtl"
        >
          {CONNECTION_TYPES.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Label */}
      <div className="space-y-2 mb-4">
        <Label className="text-xs text-muted-foreground">תווית</Label>
        <div className="flex gap-2">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleLabelChange}
            placeholder="הוסף תווית..."
            className="flex-1 px-2 py-1 text-sm border rounded"
            dir="rtl"
          />
        </div>
      </div>

      <Separator className="my-4" />

      {/* Style */}
      <div className="space-y-4">
        {/* Color */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">צבע</Label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map(color => (
              <button
                key={color}
                type="button"
                className={`w-6 h-6 rounded-full border-2 ${
                  connection.style.color === color ? 'border-primary' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => handleColorChange(color)}
              />
            ))}
          </div>
          <input
            type="color"
            value={connection.style.color}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-full h-8 rounded border"
          />
        </div>

        {/* Width */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">עובי</Label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={connection.style.width}
              onChange={(e) => handleWidthChange(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm w-8 text-right">{connection.style.width}px</span>
          </div>
        </div>

        {/* Dashed */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="dashed"
            checked={!!connection.style.dash}
            onChange={(e) => handleDashChange(e.target.checked)}
            className="rounded border"
          />
          <Label htmlFor="dashed" className="text-sm">קו מקווקו</Label>
        </div>

        {/* Markers */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">סמנים</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">התחלה</Label>
              <select
                value={connection.style.startMarker || 'none'}
                onChange={(e) => handleStartMarkerChange(e.target.value as Marker)}
                className="w-full px-2 py-1 text-sm border rounded"
                dir="rtl"
              >
                {MARKER_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">סוף</Label>
              <select
                value={connection.style.endMarker || 'none'}
                onChange={(e) => handleEndMarkerChange(e.target.value as Marker)}
                className="w-full px-2 py-1 text-sm border rounded"
                dir="rtl"
              >
                {MARKER_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConnectionPropertiesPanel
