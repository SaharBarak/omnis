'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { Plus, MoreVertical, Search, Users, Share2, BarChart3, Check } from 'lucide-react'
import { usePeople } from '@/lib/hooks/use-people'
import { useGroups } from '@/lib/hooks/use-groups'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { useConfirm } from '@/components/dashboard/confirm-dialog'
import {
  Eyebrow,
  Notice,
  SkeletonCard,
  fadeUp,
  staggerParent,
  VIEWPORT_ONCE,
} from '@/components/app-kit'
import type { Group, Person } from '@/lib/types/database.types'
import type { GroupWithMembers, CreateGroupInput } from '@/lib/types/relationship'

// Member toggle row — shadcn has no Checkbox primitive in this repo, so the
// picker rows are button toggles speaking the kit grammar (no native inputs).
function MemberToggle({
  person,
  checked,
  onToggle,
}: {
  person: Pick<Person, 'id' | 'name' | 'hebrew_name'>
  checked: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors duration-fast hover:bg-white/[0.04] active:scale-[0.98]"
    >
      <span
        aria-hidden
        className={cn(
          'flex size-4 shrink-0 items-center justify-center rounded border transition-colors duration-fast',
          checked ? 'border-primary bg-primary' : 'border-white/25'
        )}
      >
        {checked && <Check className="size-3 text-primary-foreground" strokeWidth={3} />}
      </span>
      <span className="text-sm text-white/90">{person.name}</span>
      {person.hebrew_name && (
        <span className="text-sm text-white/50">({person.hebrew_name})</span>
      )}
    </button>
  )
}

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
    <div className="surface-card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onViewMembers(group)}>
          <h3 className="truncate font-display text-lg font-medium text-white/90">
            {group.name}
          </h3>
          {group.description && (
            <p className="mt-1 line-clamp-2 text-sm text-white/50">{group.description}</p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <span className="sr-only">Menu</span>
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewMembers(group)}>
              <Users className="mr-2 size-4" />
              View Members
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAnalyze(group)}>
              <BarChart3 className="mr-2 size-4" />
              Group Analysis
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onShare(group)}>
              <Share2 className="mr-2 size-4" />
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
        <Eyebrow className="inline-flex items-center gap-1.5">
          <Users className="size-3.5" aria-hidden />
          {memberCount} member{memberCount !== 1 ? 's' : ''}
        </Eyebrow>
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
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Short description of the group (optional)"
        />
      </div>

      <div className="space-y-2">
        <Label>Group Members</Label>
        <div className="max-h-48 overflow-y-auto rounded-xl border border-white/[0.07] p-1.5">
          {people.length === 0 ? (
            <p className="py-4 text-center text-sm text-white/50">
              You haven&apos;t added any people yet
            </p>
          ) : (
            <div className="space-y-0.5">
              {people.map(person => (
                <MemberToggle
                  key={person.id}
                  person={person}
                  checked={formData.memberIds.includes(person.id)}
                  onToggle={() => toggleMember(person.id)}
                />
              ))}
            </div>
          )}
        </div>
        <Eyebrow>{formData.memberIds.length} people selected</Eyebrow>
      </div>

      {error && <Notice variant="error">{error}</Notice>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" className="rounded-xl" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-brand text-white hover:bg-brand-soft active:scale-[0.98]"
        >
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
        <h3 className="font-display font-medium text-white/90">
          Group Members ({members.length})
        </h3>
        {!isEditing && (
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setIsEditing(true)}>
            Edit Members
          </Button>
        )}
      </div>

      {isEditing ? (
        <>
          <div className="max-h-64 overflow-y-auto rounded-xl border border-white/[0.07] p-1.5">
            <div className="space-y-0.5">
              {people.map(person => (
                <MemberToggle
                  key={person.id}
                  person={person}
                  checked={selectedIds.includes(person.id)}
                  onToggle={() => toggleMember(person.id)}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => {
                setIsEditing(false)
                setSelectedIds(members.map(m => m.id))
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={loading}
              className="rounded-xl bg-brand text-white hover:bg-brand-soft active:scale-[0.98]"
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </>
      ) : (
        <div>
          {members.length === 0 ? (
            <p className="py-4 text-center text-sm text-white/50">
              No members in this group
            </p>
          ) : (
            members.map((member, i) => (
              <div
                key={member.id}
                className={cn(
                  'flex items-center gap-3 py-2.5',
                  i < members.length - 1 && 'border-b border-white/[0.07]'
                )}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-medium text-primary">
                  {member.name[0]}
                </span>
                <span className="text-sm text-white/90">{member.name}</span>
                {member.hebrew_name && (
                  <span className="text-sm text-white/50">({member.hebrew_name})</span>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="outline" className="rounded-xl" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )
}

// Main Page Component
export default function GroupsPage() {
  const router = useRouter()
  const confirm = useConfirm()
  const reduced = useReducedMotion()
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
  const [editingMemberIds, setEditingMemberIds] = useState<string[]>([])
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
    // Seed the form with current members — without this, saving an edit
    // called setGroupMembers([]) and silently wiped the group.
    const groupData = await getGroupWithMembers(group.id)
    setEditingMemberIds(groupData?.members?.map((m) => m.id) ?? [])
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
    const confirmed = await confirm({
      title: 'Delete group',
      description: 'Are you sure you want to delete this group?',
      confirmText: 'Delete',
      variant: 'destructive',
    })
    if (!confirmed) return
    setDeleteError(null)
    try {
      await deleteGroup(id)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Error deleting')
    }
  }

  if (loading) {
    return <GroupsSkeleton />
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Groups" />
        <Notice variant="error" title="Error loading groups">
          {error}
        </Notice>
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
              <Button className="rounded-xl bg-brand text-white hover:bg-brand-soft active:scale-[0.98]">
                <Plus className="mr-2 size-4" />
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

      {deleteError && <Notice variant="error">{deleteError}</Notice>}

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/35" />
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
            <Search className="mx-auto mb-4 size-10 text-white/35" />
            <p className="font-display font-medium text-white/90">No results found</p>
            <p className="mt-1 text-sm text-white/50">
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
        <motion.div
          variants={staggerParent}
          initial={reduced ? false : 'hidden'}
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filteredGroups.map(group => (
            <motion.div key={group.id} variants={fadeUp}>
              <GroupCard
                group={group}
                memberCount={memberCounts[group.id] || 0}
                onEdit={handleEditGroup}
                onDelete={handleDeleteGroup}
                onViewMembers={handleViewMembers}
                onAnalyze={handleAnalyze}
                onShare={handleShare}
              />
            </motion.div>
          ))}
        </motion.div>
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
              initialMemberIds={editingMemberIds}
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

// Loading skeleton — layout-matched (header, search, card grid)
function GroupsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="skeleton-shimmer h-8 w-32 rounded" />
          <div className="skeleton-shimmer h-4 w-24 rounded" />
        </div>
        <div className="skeleton-shimmer mt-3 h-10 w-36 rounded-xl sm:mt-0" />
      </div>

      {/* Search */}
      <div className="skeleton-shimmer h-10 w-64 rounded-xl" />

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}
