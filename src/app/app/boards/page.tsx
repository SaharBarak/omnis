'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Copy,
  Share2,
  LayoutTemplate,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { useBoards } from '@/lib/hooks/use-boards'
import { BOARD_TEMPLATES, type BoardTemplate } from '@/lib/types/board'
import type { Board } from '@/lib/supabase/database.types'

export default function BoardsPage() {
  const { boards, loading, error, createBoard, deleteBoard, duplicateBoard } = useBoards()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<BoardTemplate>('blank')
  const [isCreating, setIsCreating] = useState(false)

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
    if (!confirm('האם למחוק את הלוח?')) return
    try {
      await deleteBoard(id)
    } catch (err) {
      console.error('Error deleting board:', err)
    }
  }

  const handleDuplicateBoard = async (id: string, name: string) => {
    try {
      await duplicateBoard(id, `${name} (העתק)`)
    } catch (err) {
      console.error('Error duplicating board:', err)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-destructive">
          <p>שגיאה בטעינת הלוחות</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" dir="rtl">לוחות</h1>
          <p className="text-muted-foreground" dir="rtl">
            צור וערוך לוחות ויזואליים
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              לוח חדש
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle>יצירת לוח חדש</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {/* Board name */}
              <div className="space-y-2">
                <Label>שם הלוח</Label>
                <input
                  type="text"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  placeholder="לוח חדש"
                  className="w-full px-3 py-2 border rounded-md"
                  autoFocus
                />
              </div>

              {/* Template selection */}
              <div className="space-y-2">
                <Label>תבנית</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(BOARD_TEMPLATES) as [BoardTemplate, typeof BOARD_TEMPLATES[BoardTemplate]][]).map(
                    ([key, template]) => (
                      <button
                        key={key}
                        type="button"
                        className={`
                          p-3 border rounded-lg text-right transition-all
                          ${selectedTemplate === key
                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                            : 'hover:border-primary/50'
                          }
                        `}
                        onClick={() => setSelectedTemplate(key)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">{template.icon}</span>
                          <span className="font-medium text-sm">{template.nameHebrew}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {template.descriptionHebrew}
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
                  onClick={() => setIsCreateOpen(false)}
                >
                  ביטול
                </Button>
                <Button
                  onClick={handleCreateBoard}
                  disabled={!newBoardName.trim() || isCreating}
                >
                  {isCreating ? 'יוצר...' : 'צור לוח'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Boards grid */}
      {boards.length === 0 ? (
        <div className="text-center py-16">
          <LayoutTemplate className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2" dir="rtl">אין לוחות עדיין</h3>
          <p className="text-muted-foreground mb-4" dir="rtl">
            צור לוח חדש כדי להתחיל לעבוד
          </p>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 ml-2" />
            צור לוח ראשון
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {boards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              onDelete={() => handleDeleteBoard(board.id)}
              onDuplicate={() => handleDuplicateBoard(board.id, board.name)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Board card component
interface BoardCardProps {
  board: Board
  onDelete: () => void
  onDuplicate: () => void
}

function BoardCard({ board, onDelete, onDuplicate }: BoardCardProps) {
  const template = board.template ? BOARD_TEMPLATES[board.template as BoardTemplate] : null

  return (
    <div className="group relative bg-card border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      {/* Thumbnail / Preview */}
      <Link href={`/boards/${board.id}`}>
        <div className="aspect-video bg-muted flex items-center justify-center">
          {board.thumbnail ? (
            <img
              src={board.thumbnail}
              alt={board.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-4xl opacity-50">
              {template?.icon || '📋'}
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <Link href={`/boards/${board.id}`} className="flex-1 min-w-0">
            <h3 className="font-medium truncate" dir="rtl">{board.name}</h3>
            {board.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1" dir="rtl">
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
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/boards/${board.id}`} className="flex items-center">
                  <Pencil className="h-4 w-4 ml-2" />
                  ערוך
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="h-4 w-4 ml-2" />
                שכפל
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Share2 className="h-4 w-4 ml-2" />
                שתף
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 ml-2" />
                מחק
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          {template && (
            <span className="flex items-center gap-1">
              {template.icon}
              {template.nameHebrew}
            </span>
          )}
          <span className="text-muted-foreground/50">•</span>
          <span>
            {new Date(board.updated_at).toLocaleDateString('he-IL')}
          </span>
        </div>
      </div>
    </div>
  )
}
