'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePeople } from '@/lib/hooks/use-people'
import { useGroups } from '@/lib/hooks/use-groups'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { ShareDialog } from '@/components/share-dialog'
import type { Group, Person } from '@/lib/supabase/database.types'
import type { GroupWithMembers, CreateGroupInput, ShareOptions } from '@/lib/types/relationship'

// Group Card Component
function GroupCard({
  group,
  memberCount,
  onEdit,
  onDelete,
  onViewMembers,
  onAnalyze,
  onShare,
}: {
  group: Group
  memberCount: number
  onEdit: (group: Group) => void
  onDelete: (id: string) => void
  onViewMembers: (group: Group) => void
  onAnalyze: (group: Group) => void
  onShare: (group: Group) => void
}) {
  return (
    <Card className="cursor-pointer hover:border-primary/50 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div onClick={() => onViewMembers(group)}>
            <CardTitle className="text-lg">{group.name}</CardTitle>
            {group.description && (
              <CardDescription>{group.description}</CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <span className="sr-only">תפריט</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => onViewMembers(group)}>
                צפה בחברים
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAnalyze(group)}>
                ניתוח קבוצתי
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onShare(group)}>
                שתף
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(group)}>
                ערוך
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(group.id)}
              >
                מחק
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent onClick={() => onViewMembers(group)}>
        <Badge variant="secondary">
          {memberCount} חברים
        </Badge>
      </CardContent>
    </Card>
  )
}

// Group Form Component
function GroupForm({
  group,
  people,
  initialMemberIds,
  onSave,
  onCancel,
}: {
  group?: Group
  people: Person[]
  initialMemberIds?: string[]
  onSave: (data: CreateGroupInput & { memberIds: string[] }) => Promise<void>
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: group?.name || '',
    description: group?.description || '',
    memberIds: initialMemberIds || [],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await onSave({
        name: formData.name,
        description: formData.description || undefined,
        personIds: formData.memberIds,
        memberIds: formData.memberIds,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשמירה')
    } finally {
      setLoading(false)
    }
  }

  const toggleMember = (personId: string) => {
    setFormData(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(personId)
        ? prev.memberIds.filter(id => id !== personId)
        : [...prev.memberIds, personId],
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">שם הקבוצה *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
          placeholder="לדוגמה: משפחה גרעינית, חברים"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">תיאור</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="תיאור קצר של הקבוצה (אופציונלי)"
        />
      </div>

      <div className="space-y-2">
        <Label>חברי הקבוצה</Label>
        <div className="max-h-48 overflow-y-auto border rounded-md p-2">
          {people.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              עדיין לא הוספת אנשים
            </p>
          ) : (
            <div className="space-y-1">
              {people.map(person => (
                <label
                  key={person.id}
                  className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.memberIds.includes(person.id)}
                    onChange={() => toggleMember(person.id)}
                    className="rounded border-input"
                  />
                  <span>{person.name}</span>
                  {person.hebrew_name && (
                    <span className="text-muted-foreground text-sm">
                      ({person.hebrew_name})
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          נבחרו {formData.memberIds.length} אנשים
        </p>
      </div>

      {error && (
        <div className="text-sm text-destructive">{error}</div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          ביטול
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'שומר...' : group ? 'עדכן' : 'צור קבוצה'}
        </Button>
      </div>
    </form>
  )
}

// Group Members View Component
function GroupMembersView({
  group,
  members,
  people,
  onUpdateMembers,
  onClose,
}: {
  group: Group
  members: Array<{ id: string; name: string; hebrew_name: string | null }>
  people: Person[]
  onUpdateMembers: (personIds: string[]) => Promise<void>
  onClose: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>(members.map(m => m.id))
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      await onUpdateMembers(selectedIds)
      setIsEditing(false)
    } finally {
      setLoading(false)
    }
  }

  const toggleMember = (personId: string) => {
    setSelectedIds(prev =>
      prev.includes(personId)
        ? prev.filter(id => id !== personId)
        : [...prev, personId]
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">חברי הקבוצה ({members.length})</h3>
        {!isEditing && (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            ערוך חברים
          </Button>
        )}
      </div>

      {isEditing ? (
        <>
          <div className="max-h-64 overflow-y-auto border rounded-md p-2">
            {people.map(person => (
              <label
                key={person.id}
                className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(person.id)}
                  onChange={() => toggleMember(person.id)}
                  className="rounded border-input"
                />
                <span>{person.name}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEditing(false)
                setSelectedIds(members.map(m => m.id))
              }}
            >
              ביטול
            </Button>
            <Button size="sm" onClick={handleSave} disabled={loading}>
              {loading ? 'שומר...' : 'שמור'}
            </Button>
          </div>
        </>
      ) : (
        <div className="space-y-1">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              אין חברים בקבוצה
            </p>
          ) : (
            members.map(member => (
              <div
                key={member.id}
                className="flex items-center gap-2 p-2 rounded bg-muted/50"
              >
                <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm">
                  {member.name[0]}
                </span>
                <span>{member.name}</span>
                {member.hebrew_name && (
                  <span className="text-muted-foreground text-sm">
                    ({member.hebrew_name})
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>
          סגור
        </Button>
      </div>
    </div>
  )
}

// Main Page Component
export default function GroupsPage() {
  const router = useRouter()
  const { people, loading: peopleLoading } = usePeople()
  const {
    groups,
    loading: groupsLoading,
    error,
    createGroup,
    updateGroup,
    deleteGroup,
    getGroupWithMembers,
    setGroupMembers,
  } = useGroups()

  const [search, setSearch] = useState('')
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [viewingGroup, setViewingGroup] = useState<{ group: Group; members: GroupWithMembers['members'] } | null>(null)
  const [sharingGroup, setSharingGroup] = useState<Group | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({})

  const loading = peopleLoading || groupsLoading

  // Fetch member counts for all groups
  useEffect(() => {
    const fetchMemberCounts = async () => {
      const counts: Record<string, number> = {}
      for (const group of groups) {
        const groupData = await getGroupWithMembers(group.id)
        counts[group.id] = groupData?.members?.length || 0
      }
      setMemberCounts(counts)
    }
    if (groups.length > 0) {
      fetchMemberCounts()
    }
  }, [groups, getGroupWithMembers])

  // Filter groups
  const filteredGroups = groups.filter(group => {
    const matchesSearch = search
      ? group.name.toLowerCase().includes(search.toLowerCase()) ||
        group.description?.toLowerCase().includes(search.toLowerCase())
      : true
    return matchesSearch
  })

  const handleAddGroup = async (data: CreateGroupInput & { memberIds: string[] }) => {
    await createGroup({
      name: data.name,
      description: data.description,
      personIds: data.memberIds,
    })
    setIsAddDialogOpen(false)
  }

  const handleUpdateGroup = async (data: CreateGroupInput & { memberIds: string[] }) => {
    if (!editingGroup) return

    await updateGroup(editingGroup.id, {
      name: data.name,
      description: data.description || null,
    })
    await setGroupMembers(editingGroup.id, data.memberIds)
    setIsEditDialogOpen(false)
    setEditingGroup(null)
  }

  const handleEditGroup = async (group: Group) => {
    const groupData = await getGroupWithMembers(group.id)
    setEditingGroup(group)
    setIsEditDialogOpen(true)
  }

  const handleViewMembers = async (group: Group) => {
    const groupData = await getGroupWithMembers(group.id)
    setViewingGroup({
      group,
      members: groupData?.members || [],
    })
    setIsViewDialogOpen(true)
  }

  const handleAnalyze = (group: Group) => {
    router.push(`/app/groups/${group.id}/analysis`)
  }

  const handleShare = (group: Group) => {
    setSharingGroup(group)
    setIsShareDialogOpen(true)
  }

  const handleUpdateGroupMembers = async (personIds: string[]) => {
    if (!viewingGroup) return
    await setGroupMembers(viewingGroup.group.id, personIds)
    const groupData = await getGroupWithMembers(viewingGroup.group.id)
    setViewingGroup({
      ...viewingGroup,
      members: groupData?.members || [],
    })
  }

  const handleDeleteGroup = async (id: string) => {
    if (confirm('האם למחוק את הקבוצה הזו?')) {
      setDeleteError(null)
      try {
        await deleteGroup(id)
      } catch (err) {
        setDeleteError(err instanceof Error ? err.message : 'שגיאה במחיקה')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">טוען...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-destructive">{error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">קבוצות</h1>
          <p className="text-muted-foreground">
            {groups.length} קבוצות
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>+ צור קבוצה</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>צור קבוצה חדשה</DialogTitle>
              <DialogDescription>
                צור קבוצה של אנשים לניתוח קבוצתי
              </DialogDescription>
            </DialogHeader>
            <GroupForm
              people={people}
              onSave={handleAddGroup}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {deleteError && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {deleteError}
        </div>
      )}

      {/* Search */}
      <Input
        placeholder="חיפוש קבוצה..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs"
      />

      {/* Groups grid */}
      {filteredGroups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              {search ? 'לא נמצאו תוצאות' : 'עדיין לא יצרת קבוצות'}
            </p>
            {!search && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                + צור קבוצה ראשונה
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredGroups.map(group => (
            <GroupCard
              key={group.id}
              group={group}
              memberCount={memberCounts[group.id] || 0}
              onEdit={handleEditGroup}
              onDelete={handleDeleteGroup}
              onViewMembers={handleViewMembers}
              onAnalyze={handleAnalyze}
              onShare={handleShare}
            />
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open)
        if (!open) setEditingGroup(null)
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>עריכת קבוצה</DialogTitle>
            <DialogDescription>
              עדכן את פרטי הקבוצה
            </DialogDescription>
          </DialogHeader>
          {editingGroup && (
            <GroupForm
              group={editingGroup}
              people={people}
              onSave={handleUpdateGroup}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setEditingGroup(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View members dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={(open) => {
        setIsViewDialogOpen(open)
        if (!open) setViewingGroup(null)
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{viewingGroup?.group.name}</DialogTitle>
            {viewingGroup?.group.description && (
              <DialogDescription>
                {viewingGroup.group.description}
              </DialogDescription>
            )}
          </DialogHeader>
          {viewingGroup && (
            <GroupMembersView
              group={viewingGroup.group}
              members={viewingGroup.members}
              people={people}
              onUpdateMembers={handleUpdateGroupMembers}
              onClose={() => {
                setIsViewDialogOpen(false)
                setViewingGroup(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Share dialog */}
      {sharingGroup && (
        <ShareDialog
          open={isShareDialogOpen}
          onOpenChange={(open) => {
            setIsShareDialogOpen(open)
            if (!open) setSharingGroup(null)
          }}
          shareType="group"
          title={sharingGroup.name}
          options={{
            groupId: sharingGroup.id,
            includeSystems: ['dreamspell', 'tzolkin'],
            includeAnalysis: true,
          }}
        />
      )}
    </div>
  )
}
