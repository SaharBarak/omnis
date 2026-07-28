'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CanvasProvider, CanvasEditor, ExportDialog, useCanvas } from '@/components/canvas'
import { useBoards, useBoard } from '@/lib/hooks/use-boards'
import type { CanvasState, Layer } from '@/lib/types/board'

export default function BoardEditorPage() {
  const params = useParams()
  const router = useRouter()
  const boardId = params.id as string

  const { getBoard } = useBoards()
  const [board, setBoard] = useState<{
    id: string
    name: string
    canvas: CanvasState
    layers: Layer[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load board data
  useEffect(() => {
    async function loadBoard() {
      try {
        const data = await getBoard(boardId)
        if (!data) {
          setError('Board not found')
          return
        }
        setBoard({
          id: data.id,
          name: data.name,
          canvas: data.canvas as unknown as CanvasState,
          layers: data.layers as unknown as Layer[],
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading board')
      } finally {
        setLoading(false)
      }
    }

    loadBoard()
  }, [boardId, getBoard])

  if (loading) {
    // Layout-matched header skeleton — the canvas itself stays dark until data lands.
    return (
      <div className="flex h-[100dvh] flex-col">
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-white/[0.07] bg-surface/80 px-4 backdrop-blur">
          <div className="skeleton-shimmer h-8 w-24 rounded-lg" />
          <div className="h-6 w-px bg-white/[0.07]" />
          <div className="skeleton-shimmer h-4 w-40 rounded" />
        </header>
        <div className="flex-1" />
      </div>
    )
  }

  if (error || !board) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-4">
        <p className="text-sm text-destructive">{error || 'Board not found'}</p>
        <Button
          variant="outline"
          className="rounded-xl active:scale-[0.98]"
          onClick={() => router.push('/app/boards')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Back to Boards
        </Button>
      </div>
    )
  }

  return (
    <CanvasProvider
      boardId={board.id}
      boardName={board.name}
      initialCanvas={board.canvas}
      initialLayers={board.layers}
    >
      <BoardEditorContent boardId={board.id} boardName={board.name} />
    </CanvasProvider>
  )
}

interface BoardEditorContentProps {
  boardId: string
  boardName: string
}

function BoardEditorContent({ boardId, boardName }: BoardEditorContentProps) {
  const { canvas, layers, isDirty, clearDirty } = useCanvas()
  const { updateBoard } = useBoards()
  const [saving, setSaving] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const canvasContainerRef = useRef<HTMLDivElement>(null)

  const handleOpenExport = useCallback(() => setIsExportOpen(true), [])

  // Save function
  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      await updateBoard(boardId, {
        canvas,
        layers,
      })
      clearDirty()
    } catch (err) {
      console.error('Error saving board:', err)
    } finally {
      setSaving(false)
    }
  }, [boardId, canvas, layers, updateBoard, clearDirty])

  // Auto-save on Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave])

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  return (
    <div className="flex h-[100dvh] flex-col">
      {/* Header */}
      <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-white/[0.07] bg-surface/80 px-4 backdrop-blur">
        <div className="flex items-center gap-4">
          <Link href="/app/boards">
            <Button variant="ghost" size="sm" className="active:scale-[0.98]">
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Back
            </Button>
          </Link>
          <div className="h-6 w-px bg-white/[0.07]" />
          <h1 className="font-display font-medium text-white/90">{boardName}</h1>
          {isDirty && (
            <span className="font-sans font-medium text-[11px] uppercase tracking-[0.2em] text-white/35">
              Unsaved
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={isDirty ? 'default' : 'outline'}
            size="sm"
            className="rounded-xl active:scale-[0.98]"
            onClick={handleSave}
            disabled={saving || !isDirty}
          >
            <Save className="mr-2 h-4 w-4" aria-hidden="true" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </header>

      {/* Canvas */}
      <div ref={canvasContainerRef} className="flex-1 overflow-hidden">
        <CanvasEditor onSave={handleSave} onExport={handleOpenExport} />
      </div>

      <ExportDialog
        open={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        canvasRef={canvasContainerRef}
        boardName={boardName}
      />
    </div>
  )
}
