'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, Copy, Link2, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { BoardShare } from '@/lib/hooks/use-boards'
import type { CreateBoardShareInput } from '@/lib/types/board'

interface BoardShareDialogProps {
  boardId: string | null
  boardName: string | null
  onClose: () => void
  createShare: (boardId: string, input: CreateBoardShareInput) => Promise<BoardShare>
  getShares: (boardId: string) => Promise<BoardShare[]>
  deleteShare: (shareId: string) => Promise<void>
}

function shareUrl(token: string): string {
  return `${window.location.origin}/shared/${token}`
}

/**
 * Manage public share links for a board: list active links, create a new
 * view-only link, copy to clipboard, and revoke.
 */
export function BoardShareDialog({
  boardId,
  boardName,
  onClose,
  createShare,
  getShares,
  deleteShare,
}: BoardShareDialogProps) {
  const [shares, setShares] = useState<BoardShare[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const open = boardId !== null

  useEffect(() => {
    if (!boardId) return
    let cancelled = false
    setLoading(true)
    setError(null)
    getShares(boardId)
      .then((rows) => {
        if (!cancelled) setShares(rows.filter((s) => s.active))
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error loading share links')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [boardId, getShares])

  const handleCreate = useCallback(async () => {
    if (!boardId) return
    setCreating(true)
    setError(null)
    try {
      const share = await createShare(boardId, { permissions: 'view' })
      setShares((prev) => [share, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating share link')
    } finally {
      setCreating(false)
    }
  }, [boardId, createShare])

  const handleCopy = useCallback(async (share: BoardShare) => {
    try {
      await navigator.clipboard.writeText(shareUrl(share.url_token))
      setCopiedId(share.id)
      setTimeout(() => setCopiedId((prev) => (prev === share.id ? null : prev)), 2000)
    } catch {
      setError('Could not copy link to clipboard')
    }
  }, [])

  const handleRevoke = useCallback(
    async (share: BoardShare) => {
      setError(null)
      try {
        await deleteShare(share.id)
        setShares((prev) => prev.filter((s) => s.id !== share.id))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error revoking share link')
      }
    },
    [deleteShare]
  )

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="earth-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">
            Share {boardName ? `"${boardName}"` : 'board'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <p className="text-sm text-muted-foreground">
            Anyone with a link can view this board. Revoke a link at any time.
          </p>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : shares.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              No share links yet
            </div>
          ) : (
            <ul className="space-y-2">
              {shares.map((share) => (
                <li
                  key={share.id}
                  className="flex items-center gap-2 p-2 border border-border rounded-lg"
                >
                  <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="flex-1 min-w-0 truncate text-sm font-mono">
                    {shareUrl(share.url_token)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleCopy(share)}
                    title="Copy link"
                  >
                    {copiedId === share.id ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleRevoke(share)}
                    title="Revoke link"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  Create view link
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
