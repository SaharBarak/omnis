'use client'

import { useState } from 'react'
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Settings,
} from 'lucide-react'
import { useCanvas } from './canvas-context'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'

export function LayersPanel() {
  const {
    layers,
    activeLayerId,
    setActiveLayer,
    toggleLayerVisibility,
    toggleLayerLock,
    addLayer,
    updateLayer,
    deleteLayer,
    reorderLayers,
  } = useCanvas()

  const [isExpanded, setIsExpanded] = useState(true)

  const sortedLayers = [...layers].sort((a, b) => b.order - a.order)

  const handleAddLayer = () => {
    const newId = `layer-${Date.now()}`
    addLayer({
      id: newId,
      name: `Layer ${layers.length + 1}`,
      visible: true,
      locked: false,
      opacity: 1,
      order: layers.length,
      color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
    })
  }

  const handleMoveUp = (layerId: string) => {
    const index = sortedLayers.findIndex(l => l.id === layerId)
    if (index === 0) return
    const newOrder = sortedLayers.map(l => l.id)
    ;[newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]]
    reorderLayers(newOrder.reverse())
  }

  const handleMoveDown = (layerId: string) => {
    const index = sortedLayers.findIndex(l => l.id === layerId)
    if (index === sortedLayers.length - 1) return
    const newOrder = sortedLayers.map(l => l.id)
    ;[newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
    reorderLayers(newOrder.reverse())
  }

  const handleOpacityChange = (layerId: string, opacity: number) => {
    updateLayer(layerId, { opacity })
  }

  const handleColorChange = (layerId: string, color: string) => {
    updateLayer(layerId, { color })
  }

  const handleNameChange = (layerId: string, name: string) => {
    updateLayer(layerId, { name })
  }

  if (!isExpanded) {
    return (
      <div className="bg-card rounded-lg shadow-md border">
        <Button
          variant="ghost"
          size="sm"
          className="px-4"
          onClick={() => setIsExpanded(true)}
        >
          Layers ({layers.length})
          <ChevronUp className="h-4 w-4 mr-2" />
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg shadow-md border p-2 min-w-[300px]">
      <div className="flex items-center justify-between mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(false)}
        >
          Layers
          <ChevronDown className="h-4 w-4 mr-2" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleAddLayer}
          title="Add layer"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-2">
        {sortedLayers.map((layer, index) => (
          <div
            key={layer.id}
            className={`
              flex items-center gap-1 px-2 py-1 rounded cursor-pointer
              min-w-fit whitespace-nowrap
              ${activeLayerId === layer.id ? 'bg-primary/10 ring-1 ring-primary' : 'hover:bg-muted'}
            `}
            onClick={() => setActiveLayer(layer.id)}
          >
            {/* Color indicator */}
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: layer.color, opacity: layer.opacity }}
            />

            {/* Layer name */}
            <span
              className="text-sm font-medium"
              dir="ltr"
              style={{ opacity: layer.opacity }}
            >
              {layer.name}
            </span>

            {/* Opacity indicator */}
            {layer.opacity < 1 && (
              <span className="text-xs text-muted-foreground">
                {Math.round(layer.opacity * 100)}%
              </span>
            )}

            {/* Controls */}
            <div className="flex gap-0.5 mr-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleLayerVisibility(layer.id)
                }}
                title={layer.visible ? 'Hide layer' : 'Show layer'}
              >
                {layer.visible ? (
                  <Eye className="h-3 w-3" />
                ) : (
                  <EyeOff className="h-3 w-3 text-muted-foreground" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleLayerLock(layer.id)
                }}
                title={layer.locked ? 'Unlock' : 'Lock layer'}
              >
                {layer.locked ? (
                  <Lock className="h-3 w-3 text-amber-600" />
                ) : (
                  <Unlock className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation()
                  handleMoveUp(layer.id)
                }}
                disabled={index === 0}
                title="Move up"
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation()
                  handleMoveDown(layer.id)
                }}
                disabled={index === sortedLayers.length - 1}
                title="Move down"
              >
                <ChevronDown className="h-3 w-3" />
              </Button>

              {/* Layer settings popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => e.stopPropagation()}
                    title="Layer settings"
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56" dir="ltr" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                  <div className="space-y-3">
                    {/* Name */}
                    <div className="space-y-1">
                      <Label className="text-xs">Name</Label>
                      <input
                        type="text"
                        value={layer.name}
                        onChange={(e) => handleNameChange(layer.id, e.target.value)}
                        className="w-full px-2 py-1 text-sm border rounded"
                        dir="ltr"
                      />
                    </div>

                    {/* Opacity */}
                    <div className="space-y-1">
                      <Label className="text-xs">Opacity</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={layer.opacity}
                          onChange={(e) => handleOpacityChange(layer.id, Number(e.target.value))}
                          className="flex-1"
                        />
                        <span className="text-xs w-10 text-left">
                          {Math.round(layer.opacity * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Color */}
                    <div className="space-y-1">
                      <Label className="text-xs">Color</Label>
                      <input
                        type="color"
                        value={layer.color}
                        onChange={(e) => handleColorChange(layer.id, e.target.value)}
                        className="w-full h-8 rounded border"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {layers.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteLayer(layer.id)
                  }}
                  title="Delete layer"
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LayersPanel
