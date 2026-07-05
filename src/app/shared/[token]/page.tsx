'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Eye, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CanvasProvider, CanvasEditor } from '@/components/canvas'
import type { CanvasState, Layer } from '@/lib/types/board'

interface SharedBoard {
  id: string
  name: string
  canvas: CanvasState
  layers: Layer[]
  ownerName: string | null
}

type ViewState =
  | { status: 'loading' }
  | { status: 'locked' }
  | { status: 'error'; message: string }
  | { status: 'ready'; board: SharedBoard }

/**
 * Public, read-only viewer for a board shared via an unguessable token.
 * Intentionally fetches the public endpoint directly (no useBoards hook)
 * so no authenticated board-list request fires for anonymous visitors.
 */
export default function SharedBoardPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const [state, setState] = useState<ViewState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    async function loadSharedBoard() {
      try {
        const { token } = await params
        const res = await fetch(`/api/boards/shared/${token}`)

        if (cancelled) return

        if (res.status === 401) {
          setState({ status: 'locked' })
          return
        }
        if (res.status === 404) {
          setState({ status: 'error', message: 'This share link is invalid or has expired.' })
          return
        }
        if (!res.ok) {
          setState({ status: 'error', message: 'Could not load this board.' })
          return
        }

        const row = (await res.json()) as {
          id: string
          name: string
          canvas: unknown
          layers: unknown
          owner_name: string | null
        }

        setState({
          status: 'ready',
          board: {
            id: row.id,
            name: row.name,
            canvas: row.canvas as CanvasState,
            layers: row.layers as Layer[],
            ownerName: row.owner_name,
          },
        })
      } catch {
        if (!cancelled) {
          setState({ status: 'error', message: 'Could not load this board.' })
        }
      }
    }

    loadSharedBoard()
    return () => {
      cancelled = true
    }
  }, [params])

  if (state.status === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (state.status === 'locked') {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <Lock className="h-8 w-8 text-muted-foreground" />
        <p className="text-muted-foreground">This shared board is password protected.</p>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-destructive">{state.message}</p>
        <Link href="/">
          <Button variant="outline">Go home</Button>
        </Link>
      </div>
    )
  }

  const { board } = state

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="h-14 border-b bg-card flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="font-semibold truncate">{board.name}</h1>
          {board.ownerName && (
            <span className="text-xs text-muted-foreground truncate">
              shared by {board.ownerName}
            </span>
          )}
        </div>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground flex-shrink-0">
          <Eye className="h-3.5 w-3.5" />
          View only
        </span>
      </header>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden">
        <CanvasProvider
          boardId={board.id}
          boardName={board.name}
          initialCanvas={board.canvas}
          initialLayers={board.layers}
        >
          <CanvasEditor readOnly />
        </CanvasProvider>
      </div>
    </div>
  )
}
