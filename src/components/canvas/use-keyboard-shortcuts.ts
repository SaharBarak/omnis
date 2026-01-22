'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useCanvas } from './canvas-context'
import type { CanvasNode, ToolId } from '@/lib/types/board'

interface UseKeyboardShortcutsOptions {
  enabled?: boolean
  onCopy?: (nodes: CanvasNode[]) => void
  onPaste?: () => void
}

/**
 * Hook to handle keyboard shortcuts for the canvas editor
 *
 * Shortcuts:
 * - V: Select tool
 * - H: Hand/pan tool
 * - T: Text tool
 * - R: Shape tool
 * - L: Line tool
 * - N: Sticky note tool
 * - P: Pen tool
 * - G: Highlight tool
 * - Delete/Backspace: Delete selected
 * - Ctrl+C: Copy
 * - Ctrl+V: Paste
 * - Ctrl+D: Duplicate
 * - Ctrl+Z: Undo
 * - Ctrl+Shift+Z / Ctrl+Y: Redo
 * - Ctrl+A: Select all
 * - Escape: Deselect
 * - Ctrl+0: Fit to screen
 * - Ctrl+=/+: Zoom in
 * - Ctrl+-: Zoom out
 * - Ctrl+]: Bring forward
 * - Ctrl+[: Send backward
 * - Ctrl+Shift+]: Bring to front
 * - Ctrl+Shift+[: Send to back
 */
export function useKeyboardShortcuts({
  enabled = true,
  onCopy,
  onPaste,
}: UseKeyboardShortcutsOptions = {}) {
  const {
    canvas,
    selectedIds,
    setActiveTool,
    deleteNode,
    duplicateNodes,
    selectAll,
    clearSelection,
    undo,
    redo,
    canUndo,
    canRedo,
    fitToScreen,
    setZoom,
    zoom,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    alignNodes,
  } = useCanvas()

  // Store clipboard in ref to persist across renders
  const clipboardRef = useRef<CanvasNode[]>([])

  // Handle tool shortcuts
  const handleToolShortcut = useCallback((key: string): boolean => {
    const toolMap: Record<string, ToolId> = {
      'v': 'select',
      'h': 'hand',
      't': 'text',
      'r': 'shape',
      'l': 'line',
      'n': 'sticky',
      'p': 'pen',
      'g': 'highlight',
    }

    const tool = toolMap[key.toLowerCase()]
    if (tool) {
      setActiveTool(tool)
      return true
    }
    return false
  }, [setActiveTool])

  // Copy selected nodes
  const handleCopy = useCallback(() => {
    const selectedNodes = canvas.nodes.filter(n => selectedIds.has(n.id))
    if (selectedNodes.length > 0) {
      clipboardRef.current = structuredClone(selectedNodes)
      onCopy?.(selectedNodes)
    }
  }, [canvas.nodes, selectedIds, onCopy])

  // Paste nodes from clipboard
  const handlePaste = useCallback(() => {
    if (clipboardRef.current.length > 0) {
      duplicateNodes(clipboardRef.current.map(n => n.id))
      onPaste?.()
    }
  }, [duplicateNodes, onPaste])

  // Delete selected nodes
  const handleDelete = useCallback(() => {
    Array.from(selectedIds).forEach(id => {
      deleteNode(id)
    })
  }, [selectedIds, deleteNode])

  // Main keyboard event handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    // Don't handle shortcuts when typing in inputs
    const target = event.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return
    }

    const key = event.key.toLowerCase()
    const ctrl = event.ctrlKey || event.metaKey
    const shift = event.shiftKey

    // Prevent default for most shortcuts
    const preventDefault = () => {
      event.preventDefault()
      event.stopPropagation()
    }

    // Handle shortcuts
    if (ctrl) {
      switch (key) {
        case 'c':
          // Copy
          preventDefault()
          handleCopy()
          break
        case 'v':
          // Paste
          preventDefault()
          handlePaste()
          break
        case 'd':
          // Duplicate
          preventDefault()
          duplicateNodes(Array.from(selectedIds))
          break
        case 'z':
          preventDefault()
          if (shift) {
            // Redo (Ctrl+Shift+Z)
            if (canRedo()) redo()
          } else {
            // Undo (Ctrl+Z)
            if (canUndo()) undo()
          }
          break
        case 'y':
          // Redo (Ctrl+Y)
          preventDefault()
          if (canRedo()) redo()
          break
        case 'a':
          // Select all
          preventDefault()
          selectAll()
          break
        case '0':
          // Fit to screen
          preventDefault()
          fitToScreen()
          break
        case '=':
        case '+':
          // Zoom in
          preventDefault()
          setZoom(zoom * 1.25)
          break
        case '-':
          // Zoom out
          preventDefault()
          setZoom(zoom / 1.25)
          break
        case ']':
          preventDefault()
          if (shift) {
            // Bring to front
            bringToFront()
          } else {
            // Bring forward
            bringForward()
          }
          break
        case '[':
          preventDefault()
          if (shift) {
            // Send to back
            sendToBack()
          } else {
            // Send backward
            sendBackward()
          }
          break
        // Alignment shortcuts
        case 'l':
          if (shift) {
            preventDefault()
            alignNodes('left')
          }
          break
        case 'r':
          if (shift) {
            preventDefault()
            alignNodes('right')
          }
          break
        // Note: Ctrl+Shift+C conflicts with browser dev tools, use Ctrl+Shift+E for center
        case 'e':
          if (shift) {
            preventDefault()
            alignNodes('center')
          }
          break
        case 't':
          if (shift) {
            preventDefault()
            alignNodes('top')
          }
          break
        case 'b':
          if (shift) {
            preventDefault()
            alignNodes('bottom')
          }
          break
        case 'm':
          if (shift) {
            preventDefault()
            alignNodes('middle')
          }
          break
      }
    } else {
      // Non-Ctrl shortcuts
      switch (key) {
        case 'delete':
        case 'backspace':
          // Delete selected
          preventDefault()
          handleDelete()
          break
        case 'escape':
          // Deselect
          preventDefault()
          clearSelection()
          break
        default:
          // Tool shortcuts (single letter keys)
          if (handleToolShortcut(key)) {
            preventDefault()
          }
          break
      }
    }
  }, [
    enabled,
    handleCopy,
    handlePaste,
    handleDelete,
    handleToolShortcut,
    duplicateNodes,
    selectedIds,
    selectAll,
    clearSelection,
    undo,
    redo,
    canUndo,
    canRedo,
    fitToScreen,
    setZoom,
    zoom,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    alignNodes,
  ])

  // Attach event listener
  useEffect(() => {
    if (!enabled) return

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, handleKeyDown])

  return {
    clipboard: clipboardRef.current,
    copy: handleCopy,
    paste: handlePaste,
    deleteSelected: handleDelete,
  }
}

export default useKeyboardShortcuts
