'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CanvasProvider, CanvasEditor, useCanvas } from '@/components/canvas'
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
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !board) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <p className="text-destructive mb-4">{error || 'Board not found'}</p>
        <Button variant="outline" onClick={() => router.push('/boards')}>
          <ArrowRight className="h-4 w-4 mr-2" />
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
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="h-14 border-b bg-card flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/boards">
            <Button variant="ghost" size="sm">
              <ArrowRight className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="h-6 w-px bg-border" />
          <h1 className="font-semibold">{boardName}</h1>
          {isDirty && (
            <span className="text-xs text-muted-foreground">(unsaved changes)</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={isDirty ? 'default' : 'outline'}
            size="sm"
            onClick={handleSave}
            disabled={saving || !isDirty}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </header>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden">
        <CanvasEditor onSave={handleSave} />
      </div>
    </div>
  )
}
