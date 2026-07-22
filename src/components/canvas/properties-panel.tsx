'use client'

import { useMemo, useCallback } from 'react'
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
import { useCanvas } from './canvas-context'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import type {
  PersonNode,
  TextNode,
  ShapeNode,
  StickyNote,
  PersonDisplayMode,
  SystemType,
  ShapeType,
  StickyColor,
  CanvasNode,
} from '@/lib/types/board'
import { STICKY_COLORS } from '@/lib/types/board'

// Display mode options
const DISPLAY_MODES: { value: PersonDisplayMode; label: string }[] = [
  { value: 'avatar', label: 'Avatar' },
  { value: 'mini', label: 'Mini' },
  { value: 'card', label: 'Card' },
  { value: 'detailed', label: 'Detailed' },
]

// System types for checkboxes
const SYSTEM_TYPES: { value: SystemType; label: string }[] = [
  { value: 'dreamspell', label: 'Dreamspell' },
  { value: 'tzolkin', label: 'Tzolkin' },
  { value: 'longcount', label: 'Long Count' },
  { value: 'astrology', label: 'Astrology' },
  { value: 'humandesign', label: 'Human Design' },
  { value: 'gematria', label: 'Gematria' },
]

// Shape type options
const SHAPE_TYPES: { value: ShapeType; label: string }[] = [
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'ellipse', label: 'Ellipse' },
  { value: 'triangle', label: 'Triangle' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'star', label: 'Star' },
  { value: 'arrow', label: 'Arrow' },
  { value: 'line', label: 'Line' },
]

// Sticky note color options
const STICKY_COLOR_OPTIONS: { value: StickyColor; label: string }[] = [
  { value: 'yellow', label: 'Yellow' },
  { value: 'pink', label: 'Pink' },
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'purple', label: 'Purple' },
]

// Preset colors for various color pickers
const PRESET_COLORS = [
  '#000000', // black
  '#6B7280', // gray
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
]

// Text alignment options
const TEXT_ALIGNMENTS: { value: 'right' | 'center' | 'left'; label: string; icon: 'right' | 'center' | 'left' }[] = [
  { value: 'left', label: 'Left', icon: 'left' },
  { value: 'center', label: 'Center', icon: 'center' },
  { value: 'right', label: 'Right', icon: 'right' },
]

// Helper type guards
function isPersonNode(node: CanvasNode): node is PersonNode {
  return node.type === 'person'
}

function isTextNode(node: CanvasNode): node is TextNode {
  return node.type === 'text'
}

function isShapeNode(node: CanvasNode): node is ShapeNode {
  return node.type === 'shape'
}

function isStickyNote(node: CanvasNode): node is StickyNote {
  return node.type === 'sticky'
}

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

  const firstNode = selectedNodes[0]
  const isMultiSelect = selectedNodes.length > 1

  // === Person Node Handlers ===
  const handleDisplayModeChange = useCallback((display: PersonDisplayMode) => {
    if (!firstNode || isMultiSelect || !isPersonNode(firstNode)) return
    updateNode(firstNode.id, { display } as Partial<CanvasNode>)
  }, [firstNode, isMultiSelect, updateNode])

  const handleSystemToggle = useCallback((system: SystemType) => {
    if (!firstNode || isMultiSelect || !isPersonNode(firstNode)) return
    const currentSystems = firstNode.showSystems || []
    const newSystems = currentSystems.includes(system)
      ? currentSystems.filter(s => s !== system)
      : [...currentSystems, system]
    updateNode(firstNode.id, { showSystems: newSystems } as Partial<CanvasNode>)
  }, [firstNode, isMultiSelect, updateNode])

  // === Text Node Handlers ===
  const handleFontSizeChange = useCallback((fontSize: number) => {
    if (!firstNode || isMultiSelect || !isTextNode(firstNode)) return
    updateNode(firstNode.id, {
      textStyle: { ...firstNode.textStyle, fontSize }
    } as Partial<CanvasNode>)
  }, [firstNode, isMultiSelect, updateNode])

  const handleFontWeightChange = useCallback((fontWeight: number) => {
    if (!firstNode || isMultiSelect || !isTextNode(firstNode)) return
    updateNode(firstNode.id, {
      textStyle: { ...firstNode.textStyle, fontWeight }
    } as Partial<CanvasNode>)
  }, [firstNode, isMultiSelect, updateNode])

  const handleTextColorChange = useCallback((color: string) => {
    if (!firstNode || isMultiSelect || !isTextNode(firstNode)) return
    updateNode(firstNode.id, {
      textStyle: { ...firstNode.textStyle, color }
    } as Partial<CanvasNode>)
  }, [firstNode, isMultiSelect, updateNode])

  const handleTextAlignmentChange = useCallback((alignment: 'right' | 'center' | 'left') => {
    if (!firstNode || isMultiSelect || !isTextNode(firstNode)) return
    updateNode(firstNode.id, {
      textStyle: { ...firstNode.textStyle, alignment }
    } as Partial<CanvasNode>)
  }, [firstNode, isMultiSelect, updateNode])

  // === Shape Node Handlers ===
  const handleShapeTypeChange = useCallback((shape: ShapeType) => {
    if (!firstNode || isMultiSelect || !isShapeNode(firstNode)) return
    updateNode(firstNode.id, { shape } as Partial<CanvasNode>)
  }, [firstNode, isMultiSelect, updateNode])

  const handleFillColorChange = useCallback((color: string) => {
    if (!firstNode || isMultiSelect || !isShapeNode(firstNode)) return
    updateNode(firstNode.id, {
      fill: { ...firstNode.fill, type: 'solid', color }
    } as Partial<CanvasNode>)
  }, [firstNode, isMultiSelect, updateNode])

  const handleStrokeColorChange = useCallback((color: string) => {
    if (!firstNode || isMultiSelect || !isShapeNode(firstNode)) return
    updateNode(firstNode.id, {
      stroke: { ...firstNode.stroke, color }
    } as Partial<CanvasNode>)
  }, [firstNode, isMultiSelect, updateNode])

  const handleStrokeWidthChange = useCallback((width: number) => {
    if (!firstNode || isMultiSelect || !isShapeNode(firstNode)) return
    updateNode(firstNode.id, {
      stroke: { ...firstNode.stroke, width }
    } as Partial<CanvasNode>)
  }, [firstNode, isMultiSelect, updateNode])

  // === Sticky Note Handler ===
  const handleStickyColorChange = useCallback((color: StickyColor) => {
    if (!firstNode || isMultiSelect || !isStickyNote(firstNode)) return
    updateNode(firstNode.id, { color } as Partial<CanvasNode>)
  }, [firstNode, isMultiSelect, updateNode])

  // Early return must come AFTER all hooks
  if (selectedNodes.length === 0) {
    return null
  }

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
        <h3 className="font-semibold text-sm" dir="ltr">
          {isMultiSelect
            ? `${selectedNodes.length} items selected`
            : firstNode.type === 'person' ? 'Person'
            : firstNode.type === 'text' ? 'Text'
            : firstNode.type === 'shape' ? 'Shape'
            : firstNode.type === 'sticky' ? 'Sticky'
            : 'Item'
          }
        </h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDuplicate} title="Duplicate">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDelete} title="Delete">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Position - only for single selection */}
      {!isMultiSelect && (
        <>
          <div className="space-y-2 mb-4">
            <Label className="text-xs text-muted-foreground">Position</Label>
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
            <Label className="text-xs text-muted-foreground">Size</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="text-xs">Width</Label>
                <input
                  type="number"
                  value={Math.round(firstNode.size.width)}
                  onChange={(e) => handleSizeChange('width', Number(e.target.value))}
                  className="w-full px-2 py-1 text-sm border rounded"
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs">Height</Label>
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
            <Label className="text-xs text-muted-foreground">Alignment</Label>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => alignNodes('left')} title="Align left">
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => alignNodes('center')} title="Align center (horizontal)">
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => alignNodes('right')} title="Align right">
                <AlignRight className="h-4 w-4" />
              </Button>
              <div className="w-px bg-border mx-1" />
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => alignNodes('top')} title="Align top">
                <AlignStartVertical className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => alignNodes('middle')} title="Align middle (vertical)">
                <AlignCenterVertical className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => alignNodes('bottom')} title="Align bottom">
                <AlignEndVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator className="my-4" />
        </>
      )}

      {/* Opacity */}
      <div className="space-y-2 mb-4">
        <Label className="text-xs text-muted-foreground">Opacity</Label>
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
          <span className="text-sm w-12 text-left">
            {Math.round(firstNode.style.opacity * 100)}%
          </span>
        </div>
      </div>

      {/* Layer */}
      <div className="space-y-2 mb-4">
        <Label className="text-xs text-muted-foreground">Layer</Label>
        <select
          value={firstNode.layerId}
          onChange={(e) => handleLayerChange(e.target.value)}
          className="w-full px-2 py-1.5 text-sm border rounded"
          dir="ltr"
        >
          {layers.map(layer => (
            <option key={layer.id} value={layer.id}>
              {layer.name}
            </option>
          ))}
        </select>
      </div>

      {/* === Type-Specific Properties === */}

      {/* Person Node Properties */}
      {!isMultiSelect && isPersonNode(firstNode) && (
        <>
          <Separator className="my-4" />
          <div className="space-y-4">
            {/* Display Mode */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Display Mode</Label>
              <select
                value={firstNode.display || 'card'}
                onChange={(e) => handleDisplayModeChange(e.target.value as PersonDisplayMode)}
                className="w-full px-2 py-1.5 text-sm border rounded"
                dir="ltr"
              >
                {DISPLAY_MODES.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Show Systems */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Show Systems</Label>
              <div className="space-y-1.5">
                {SYSTEM_TYPES.map(system => (
                  <label key={system.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(firstNode.showSystems || []).includes(system.value)}
                      onChange={() => handleSystemToggle(system.value)}
                      className="rounded border"
                    />
                    <span className="text-sm">{system.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Text Node Properties */}
      {!isMultiSelect && isTextNode(firstNode) && (
        <>
          <Separator className="my-4" />
          <div className="space-y-4">
            {/* Font Size */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Font Size</Label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="8"
                  max="72"
                  step="1"
                  value={firstNode.textStyle.fontSize}
                  onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm w-12 text-left">{firstNode.textStyle.fontSize}px</span>
              </div>
            </div>

            {/* Font Weight */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Font Weight</Label>
              <select
                value={firstNode.textStyle.fontWeight}
                onChange={(e) => handleFontWeightChange(Number(e.target.value))}
                className="w-full px-2 py-1.5 text-sm border rounded"
                dir="ltr"
              >
                <option value={300}>Light</option>
                <option value={400}>Regular</option>
                <option value={500}>Medium</option>
                <option value={600}>Semibold</option>
                <option value={700}>Bold</option>
              </select>
            </div>

            {/* Text Color */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Text Color</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`w-6 h-6 rounded-full border-2 ${
                      firstNode.textStyle.color === color ? 'border-primary' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleTextColorChange(color)}
                  />
                ))}
              </div>
              <input
                type="color"
                value={firstNode.textStyle.color}
                onChange={(e) => handleTextColorChange(e.target.value)}
                className="w-full h-8 rounded border"
              />
            </div>

            {/* Text Alignment */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Text Alignment</Label>
              <div className="flex gap-1">
                {TEXT_ALIGNMENTS.map(align => (
                  <Button
                    key={align.value}
                    variant={firstNode.textStyle.alignment === align.value ? 'default' : 'outline'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleTextAlignmentChange(align.value)}
                    title={align.label}
                  >
                    {align.icon === 'right' && <AlignRight className="h-4 w-4" />}
                    {align.icon === 'center' && <AlignCenter className="h-4 w-4" />}
                    {align.icon === 'left' && <AlignLeft className="h-4 w-4" />}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Shape Node Properties */}
      {!isMultiSelect && isShapeNode(firstNode) && (
        <>
          <Separator className="my-4" />
          <div className="space-y-4">
            {/* Shape Type */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Shape Type</Label>
              <select
                value={firstNode.shape}
                onChange={(e) => handleShapeTypeChange(e.target.value as ShapeType)}
                className="w-full px-2 py-1.5 text-sm border rounded"
                dir="ltr"
              >
                {SHAPE_TYPES.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Fill Color */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Fill Color</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`w-6 h-6 rounded-full border-2 ${
                      firstNode.fill.color === color ? 'border-primary' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleFillColorChange(color)}
                  />
                ))}
              </div>
              <input
                type="color"
                value={firstNode.fill.color || '#3B82F6'}
                onChange={(e) => handleFillColorChange(e.target.value)}
                className="w-full h-8 rounded border"
              />
            </div>

            {/* Stroke Color */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Stroke Color</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`w-6 h-6 rounded-full border-2 ${
                      firstNode.stroke.color === color ? 'border-primary' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleStrokeColorChange(color)}
                  />
                ))}
              </div>
              <input
                type="color"
                value={firstNode.stroke.color}
                onChange={(e) => handleStrokeColorChange(e.target.value)}
                className="w-full h-8 rounded border"
              />
            </div>

            {/* Stroke Width */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Stroke Width</Label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={firstNode.stroke.width}
                  onChange={(e) => handleStrokeWidthChange(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm w-12 text-left">{firstNode.stroke.width}px</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Sticky Note Properties */}
      {!isMultiSelect && isStickyNote(firstNode) && (
        <>
          <Separator className="my-4" />
          <div className="space-y-4">
            {/* Sticky Color */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Sticky Color</Label>
              <div className="flex flex-wrap gap-2">
                {STICKY_COLOR_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    className={`w-8 h-8 rounded border-2 flex items-center justify-center ${
                      firstNode.color === option.value ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: STICKY_COLORS[option.value] }}
                    onClick={() => handleStickyColorChange(option.value)}
                    title={option.label}
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      )}

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
              <Unlock className="h-4 w-4 mr-2" />
              Unlock
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Lock
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
              <EyeOff className="h-4 w-4 mr-2" />
              Hide
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Show
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export default PropertiesPanel
