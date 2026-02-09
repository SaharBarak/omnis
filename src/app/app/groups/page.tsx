'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePeople } from '@/lib/hooks/use-people'
import { useGroups } from '@/lib/hooks/use-groups'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
import { PageHeader, EmptyState } from '@/components/dashboard'
import { Plus, MoreVertical, Search, Users, AlertTriangle, Share2, BarChart3 } from 'lucide-react'
import type { Group, Person } from '@/lib/supabase/database.types'
import type { GroupWithMembers, CreateGroupInput } from '@/lib/types/relationship'

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
    <div className="surface-card p-5 hover:border-primary/20 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="cursor-pointer flex-1" onClick={() => onViewMembers(group)}>
          <h3 className="font-semibold text-foreground">{group.name}</h3>
          {group.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{group.description}</p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <span className="sr-only">Menu</span>
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewMembers(group)}>
              <Users className="w-4 h-4 mr-2" />
              View Members
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAnalyze(group)}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Group Analysis
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onShare(group)}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(group)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(group.id)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="cursor-pointer" onClick={() => onViewMembers(group)}>
        <Badge variant="secondary" className="bg-secondary/10 text-secondary-foreground">
          <Users className="w-3 h-3 mr-1" />
          {memberCount} member{memberCount !== 1 ? 's' : ''}
        </Badge>
      </div>
    </div>
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
      setError(err instanceof Error ? err.message : 'Error saving')
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
        <Label htmlFor="name">Group Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
          placeholder="e.g., Nuclear Family, Friends"
          className="bg-background border-border"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Short description of the group (optional)"
          className="bg-background border-border"
        />
      </div>

      <div className="space-y-2">
        <Label>Group Members</Label>
        <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-2">
          {people.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              You haven&apos;t added any people yet
            </p>
          ) : (
            <div className="space-y-1">
              {people.map(person => (
                <label
                  key={person.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.memberIds.includes(person.id)}
                    onChange={() => toggleMember(person.id)}
                    className="rounded border-border"
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
          {formData.memberIds.length} people selected
        </p>
      </div>

      {error && (
        <div className="text-sm text-destructive">{error}</div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          {loading ? 'Saving...' : group ? 'Update' : 'Create Group'}
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
        <h3 className="font-heading text-foreground">Group Members ({members.length})</h3>
        {!isEditing && (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            Edit Members
          </Button>
        )}
      </div>

      {isEditing ? (
        <>
          <div className="max-h-64 overflow-y-auto border border-border rounded-lg p-2">
            {people.map(person => (
              <label
                key={person.id}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(person.id)}
                  onChange={() => toggleMember(person.id)}
                  className="rounded border-border"
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
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </>
      ) : (
        <div className="space-y-1">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No members in this group
            </p>
          ) : (
            members.map(member => (
              <div
                key={member.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
              >
                <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm text-primary font-medium">
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
          Close
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
    if (confirm('Are you sure you want to delete this group?')) {
      setDeleteError(null)
      try {
        await deleteGroup(id)
      } catch (err) {
        setDeleteError(err instanceof Error ? err.message : 'Error deleting')
      }
    }
  }

  if (loading) {
    return <GroupsSkeleton />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-destructive" />
        </div>
        <div className="text-center">
          <p className="font-medium text-foreground">Error loading groups</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Groups"
        subtitle={`${groups.length} group${groups.length !== 1 ? 's' : ''} created`}
        actions={
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
                <DialogDescription>
                  Create a group of people for group analysis
                </DialogDescription>
              </DialogHeader>
              <GroupForm
                people={people}
                onSave={handleAddGroup}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        }
      />

      {deleteError && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{deleteError}</p>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search groups..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Groups grid */}
      {filteredGroups.length === 0 ? (
        search ? (
          <div className="surface-card p-12 text-center">
            <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="font-medium text-foreground">No results found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your search term
            </p>
          </div>
        ) : (
          <EmptyState
            icon="groups"
            title="No groups yet"
            description="Create groups to analyze collective patterns and dynamics."
            action={{
              label: 'Create First Group',
              onClick: () => setIsAddDialogOpen(true),
            }}
          />
        )
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>
              Update the group details
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

// Loading skeleton
function GroupsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-10 w-36 mt-3 sm:mt-0" />
      </div>

      {/* Search */}
      <Skeleton className="h-10 w-64" />

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
