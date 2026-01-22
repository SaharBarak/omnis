'use client'

import { useMemo } from 'react'
import {
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useCanvas } from './canvas-context'

export function PropertiesPanel() {
  const {
    canvas,
    layers,
    selectedIds,
    updateNode,
    deleteNode,
    duplicateNodes,
    alignNodes,
  } = useCanvas()

  const selectedNodes = useMemo(() => {
    return canvas.nodes.filter(n => selectedIds.has(n.id))
  }, [canvas.nodes, selectedIds])

  if (selectedNodes.length === 0) {
    return null
  }

  const firstNode = selectedNodes[0]
  const isMultiSelect = selectedNodes.length > 1

  const handlePositionChange = (axis: 'x' | 'y', value: number) => {
    if (isMultiSelect) return
    updateNode(firstNode.id, {
      position: {
        ...firstNode.position,
        [axis]: value,
      },
    })
  }

  const handleSizeChange = (dim: 'width' | 'height', value: number) => {
    if (isMultiSelect) return
    updateNode(firstNode.id, {
      size: {
        ...firstNode.size,
        [dim]: value,
      },
    })
  }

  const handleOpacityChange = (value: number) => {
    selectedNodes.forEach(node => {
      updateNode(node.id, {
        style: {
          ...node.style,
          opacity: value,
        },
      })
    })
  }

  const handleToggleLock = () => {
    selectedNodes.forEach(node => {
      updateNode(node.id, { locked: !node.locked })
    })
  }

  const handleToggleVisibility = () => {
    selectedNodes.forEach(node => {
      updateNode(node.id, { visible: !node.visible })
    })
  }

  const handleDelete = () => {
    selectedNodes.forEach(node => {
      deleteNode(node.id)
    })
  }

  const handleDuplicate = () => {
    duplicateNodes(Array.from(selectedIds))
  }

  const handleLayerChange = (layerId: string) => {
    selectedNodes.forEach(node => {
      updateNode(node.id, { layerId })
    })
  }

  return (
    <div className="w-64 p-4 bg-card rounded-lg shadow-md border max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm" dir="rtl">
          {isMultiSelect
            ? `${selectedNodes.length} פריטים נבחרו`
            : firstNode.type === 'person' ? 'אדם'
            : firstNode.type === 'text' ? 'טקסט'
            : firstNode.type === 'shape' ? 'צורה'
            : firstNode.type === 'sticky' ? 'פתק'
            : 'פריט'
          }
        </h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDuplicate} title="שכפל">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDelete} title="מחק">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Position - only for single selection */}
      {!isMultiSelect && (
        <>
          <div className="space-y-2 mb-4">
            <Label className="text-xs text-muted-foreground">מיקום</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="text-xs">X</Label>
                <input
                  type="number"
                  value={Math.round(firstNode.position.x)}
                  onChange={(e) => handlePositionChange('x', Number(e.target.value))}
                  className="w-full px-2 py-1 text-sm border rounded"
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs">Y</Label>
                <input
                  type="number"
                  value={Math.round(firstNode.position.y)}
                  onChange={(e) => handlePositionChange('y', Number(e.target.value))}
                  className="w-full px-2 py-1 text-sm border rounded"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <Label className="text-xs text-muted-foreground">גודל</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="text-xs">רוחב</Label>
                <input
                  type="number"
                  value={Math.round(firstNode.size.width)}
                  onChange={(e) => handleSizeChange('width', Number(e.target.value))}
                  className="w-full px-2 py-1 text-sm border rounded"
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs">גובה</Label>
                <input
                  type="number"
                  value={Math.round(firstNode.size.height)}
                  onChange={(e) => handleSizeChange('height', Number(e.target.value))}
                  className="w-full px-2 py-1 text-sm border rounded"
                />
              </div>
            </div>
          </div>

          <Separator className="my-4" />
        </>
      )}

      {/* Alignment - only for multi-selection */}
      {isMultiSelect && (
        <>
          <div className="space-y-2 mb-4">
            <Label className="text-xs text-muted-foreground">יישור</Label>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => alignNodes('left')} title="יישר שמאלה">
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => alignNodes('center')} title="יישר למרכז (אופקי)">
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => alignNodes('right')} title="יישר ימינה">
                <AlignRight className="h-4 w-4" />
              </Button>
              <div className="w-px bg-border mx-1" />
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => alignNodes('top')} title="יישר למעלה">
                <AlignStartVertical className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => alignNodes('middle')} title="יישר למרכז (אנכי)">
                <AlignCenterVertical className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => alignNodes('bottom')} title="יישר למטה">
                <AlignEndVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator className="my-4" />
        </>
      )}

      {/* Opacity */}
      <div className="space-y-2 mb-4">
        <Label className="text-xs text-muted-foreground">שקיפות</Label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={firstNode.style.opacity}
            onChange={(e) => handleOpacityChange(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm w-12 text-right">
            {Math.round(firstNode.style.opacity * 100)}%
          </span>
        </div>
      </div>

      {/* Layer */}
      <div className="space-y-2 mb-4">
        <Label className="text-xs text-muted-foreground">שכבה</Label>
        <select
          value={firstNode.layerId}
          onChange={(e) => handleLayerChange(e.target.value)}
          className="w-full px-2 py-1.5 text-sm border rounded"
          dir="rtl"
        >
          {layers.map(layer => (
            <option key={layer.id} value={layer.id}>
              {layer.name}
            </option>
          ))}
        </select>
      </div>

      <Separator className="my-4" />

      {/* Lock & Visibility */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={handleToggleLock}
        >
          {firstNode.locked ? (
            <>
              <Unlock className="h-4 w-4 ml-2" />
              בטל נעילה
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 ml-2" />
              נעל
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={handleToggleVisibility}
        >
          {firstNode.visible ? (
            <>
              <EyeOff className="h-4 w-4 ml-2" />
              הסתר
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 ml-2" />
              הצג
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export default PropertiesPanel
