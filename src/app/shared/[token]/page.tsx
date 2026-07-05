'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Eye, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  | { status: 'locked'; wrongPassword: boolean }
  | { status: 'error'; message: string }
  | { status: 'ready'; board: SharedBoard }

/**
 * Public, read-only viewer for a board shared via an unguessable token.
 * Intentionally fetches the public endpoint directly (no useBoards hook)
 * so no authenticated board-list request fires for anonymous visitors.
 *
 * Password attempts go in the POST body — never in the URL — so they can't
 * leak via logs, history, or Referer headers.
 */
export default function SharedBoardPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const [state, setState] = useState<ViewState>({ status: 'loading' })
  const [password, setPassword] = useState('')

  const loadSharedBoard = useCallback(
    async (candidatePassword?: string): Promise<void> => {
      try {
        const { token } = await params
        const res = candidatePassword
          ? await fetch(`/api/boards/shared/${token}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ password: candidatePassword }),
            })
          : await fetch(`/api/boards/shared/${token}`)

        if (res.status === 401) {
          setState({ status: 'locked', wrongPassword: !!candidatePassword })
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
        setState({ status: 'error', message: 'Could not load this board.' })
      }
    },
    [params]
  )

  useEffect(() => {
    loadSharedBoard()
  }, [loadSharedBoard])

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
        <form
          className="flex flex-col items-center gap-3 w-full max-w-xs"
          onSubmit={(e) => {
            e.preventDefault()
            if (!password) return
            setState({ status: 'loading' })
            loadSharedBoard(password)
          }}
        >
          <Input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {state.wrongPassword && (
            <p className="text-sm text-destructive">Incorrect password. Try again.</p>
          )}
          <Button type="submit" className="w-full" disabled={!password}>
            Unlock board
          </Button>
        </form>
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
