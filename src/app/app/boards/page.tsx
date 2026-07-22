'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Copy,
  Share2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { BoardShareDialog } from '@/components/boards/board-share-dialog'
import { EmptyState } from '@/components/dashboard'
import { useConfirm } from '@/components/dashboard/confirm-dialog'
import { Notice, fadeUp, staggerParent, VIEWPORT_ONCE } from '@/components/app-kit'
import { useBoards } from '@/lib/hooks/use-boards'
import { BOARD_TEMPLATES, type BoardTemplate } from '@/lib/types/board'
import type { Board } from '@/lib/types/database.types'
import { TEMPLATE_ICONS, FALLBACK_TEMPLATE_ICON } from '@/components/canvas/template-selector'
import { cn } from '@/lib/utils'

/** Lucide glyph for a board template (replaces the emoji icons). */
function TemplateGlyph({ templateId, className }: { templateId: string | null | undefined; className?: string }) {
  const Icon = (templateId && TEMPLATE_ICONS[templateId as BoardTemplate]) || FALLBACK_TEMPLATE_ICON
  return <Icon className={className} aria-hidden="true" />
}

export default function BoardsPage() {
  const {
    boards,
    loading,
    error,
    createBoard,
    deleteBoard,
    duplicateBoard,
    createShare,
    getShares,
    deleteShare,
  } = useBoards()
  const confirm = useConfirm()
  const reduced = useReducedMotion()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<BoardTemplate>('blank')
  const [isCreating, setIsCreating] = useState(false)
  const [shareTarget, setShareTarget] = useState<{ id: string; name: string } | null>(null)

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) return

    setIsCreating(true)
    try {
      await createBoard({
        name: newBoardName.trim(),
        template: selectedTemplate,
      })
      setNewBoardName('')
      setSelectedTemplate('blank')
      setIsCreateOpen(false)
    } catch (err) {
      console.error('Error creating board:', err)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteBoard = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete this board?',
      description: 'The board and everything on it will be permanently removed.',
      confirmText: 'Delete',
      variant: 'destructive',
    })
    if (!confirmed) return
    try {
      await deleteBoard(id)
    } catch (err) {
      console.error('Error deleting board:', err)
    }
  }

  const handleDuplicateBoard = async (id: string, name: string) => {
    try {
      await duplicateBoard(id, `${name} (Copy)`)
    } catch (err) {
      console.error('Error duplicating board:', err)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="skeleton-shimmer mb-2 h-9 w-36 rounded" />
            <div className="skeleton-shimmer h-5 w-48 rounded" />
          </div>
          <div className="skeleton-shimmer h-10 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="surface-card overflow-hidden">
              <div className="skeleton-shimmer aspect-video" />
              <div className="p-4">
                <div className="skeleton-shimmer h-4 w-32 rounded" />
                <div className="skeleton-shimmer mt-3 h-3 w-24 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-white/90">Boards</h1>
        </div>
        <Notice variant="error" title="Error loading boards">
          {error}
        </Notice>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-white/90">Boards</h1>
          <p className="mt-0.5 text-white/50">
            Create and edit visual boards
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl bg-brand text-white hover:bg-brand-soft active:scale-[0.98]">
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              New Board
            </Button>
          </DialogTrigger>
          <DialogContent className="surface-card sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display font-medium">Create New Board</DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              {/* Board name */}
              <div className="space-y-2">
                <Label htmlFor="board-name">Board Name</Label>
                <Input
                  id="board-name"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  placeholder="New Board"
                  autoFocus
                />
              </div>

              {/* Template selection */}
              <div className="space-y-2">
                <Label>Template</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(BOARD_TEMPLATES) as [BoardTemplate, typeof BOARD_TEMPLATES[BoardTemplate]][]).map(
                    ([key, template]) => (
                      <button
                        key={key}
                        type="button"
                        className={cn(
                          'rounded-xl border p-3 text-left transition-colors active:scale-[0.98]',
                          selectedTemplate === key
                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                            : 'border-white/[0.07] hover:border-white/[0.12]'
                        )}
                        onClick={() => setSelectedTemplate(key)}
                      >
                        <div className="mb-1 flex items-center gap-2">
                          <TemplateGlyph templateId={key} className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-white/90">{template.name}</span>
                        </div>
                        <p className="text-xs text-white/50">
                          {template.description}
                        </p>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Create button */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl active:scale-[0.98]"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateBoard}
                  disabled={!newBoardName.trim() || isCreating}
                  className="rounded-xl bg-brand text-white hover:bg-brand-soft active:scale-[0.98]"
                >
                  {isCreating ? 'Creating...' : 'Create Board'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Boards grid */}
      {boards.length === 0 ? (
        <EmptyState
          icon="boards"
          title="No boards yet"
          description="Create a new board to get started"
          action={{ label: 'Create First Board', onClick: () => setIsCreateOpen(true) }}
        />
      ) : (
        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          variants={staggerParent}
          initial={reduced ? false : 'hidden'}
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
        >
          {boards.map((board) => (
            <motion.div key={board.id} variants={fadeUp}>
              <BoardCard
                board={board}
                onDelete={() => handleDeleteBoard(board.id)}
                onDuplicate={() => handleDuplicateBoard(board.id, board.name)}
                onShare={() => setShareTarget({ id: board.id, name: board.name })}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Share dialog */}
      <BoardShareDialog
        boardId={shareTarget?.id ?? null}
        boardName={shareTarget?.name ?? null}
        onClose={() => setShareTarget(null)}
        createShare={createShare}
        getShares={getShares}
        deleteShare={deleteShare}
      />
    </div>
  )
}

// Board card component
interface BoardCardProps {
  board: Board
  onDelete: () => void
  onDuplicate: () => void
  onShare: () => void
}

function BoardCard({ board, onDelete, onDuplicate, onShare }: BoardCardProps) {
  const template = board.template ? BOARD_TEMPLATES[board.template as BoardTemplate] : null

  return (
    <div className="surface-card group relative overflow-hidden transition-colors hover:border-white/[0.12]">
      {/* Thumbnail / Preview */}
      <Link href={`/app/boards/${board.id}`}>
        <div className="flex aspect-video items-center justify-center bg-white/[0.03]">
          {board.thumbnail ? (
            <img
              src={board.thumbnail}
              alt={board.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <TemplateGlyph templateId={board.template} className="h-10 w-10 text-primary/40" />
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <Link href={`/app/boards/${board.id}`} className="min-w-0 flex-1">
            <h3 className="truncate font-display font-medium tracking-tight text-white/90">{board.name}</h3>
            {board.description && (
              <p className="mt-1 line-clamp-2 text-sm text-white/50">
                {board.description}
              </p>
            )}
          </Link>

          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/app/boards/${board.id}`} className="flex items-center">
                  <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onShare}>
                <Share2 className="mr-2 h-4 w-4" aria-hidden="true" />
                Share
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Meta */}
        <div className="mt-3 flex items-center gap-2 text-xs text-white/50">
          {template && (
            <span className="flex items-center gap-1">
              <TemplateGlyph templateId={board.template} className="h-3.5 w-3.5" />
              {template.name}
            </span>
          )}
          <span className="text-white/35">·</span>
          <span>
            {new Date(board.updated_at).toLocaleDateString('en-US')}
          </span>
        </div>
      </div>
    </div>
  )
}
