'use client'

import { useState, useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Plus, MoreVertical, Search } from 'lucide-react'
import { usePeople } from '@/lib/hooks/use-people'
import { useRelationships } from '@/lib/hooks/use-relationships'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { PageHeader, EmptyState, useConfirm } from '@/components/dashboard'
import { Notice, Pill, SkeletonRows, fadeUp, staggerParent } from '@/components/app-kit'
import {
  RELATIONSHIP_ACCENTS,
  TypeFilterPill,
} from '@/components/relationships/type-accents'
import type { Person } from '@/lib/types/database.types'
import type { RelationshipWithPeople, RelationshipType, CreateRelationshipInput } from '@/lib/types/relationship'
import {
  RELATIONSHIP_TYPE_LABELS,
  RELATIONSHIP_SUBTYPES,
  STRENGTH_LABELS,
} from '@/lib/types/relationship'

/** Radix SelectItem values can't be empty strings — sentinel for "none". */
const NO_SUBTYPE = '__none__'

// Relationship Row Component — hairline-divided list row (contract: lists
// are rows, never nested card boxes).
function RelationshipRow({
  relationship,
  onEdit,
  onDelete,
  last,
}: {
  relationship: RelationshipWithPeople
  onEdit: (relationship: RelationshipWithPeople) => void
  onDelete: (id: string) => void
  last: boolean
}) {
  const type = relationship.type as RelationshipType
  const typeInfo = RELATIONSHIP_TYPE_LABELS[type]
  const strengthInfo = STRENGTH_LABELS[relationship.strength as 1 | 2 | 3 | 4 | 5]
  const subtypeLabel = relationship.subtype
    ? RELATIONSHIP_SUBTYPES[type]?.find(s => s.value === relationship.subtype)?.label ||
      relationship.subtype
    : null

  return (
    <motion.div
      variants={fadeUp}
      className={cn(
        'flex items-center gap-4 py-4',
        !last && 'border-b border-white/[0.07]'
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <span className="text-sm font-medium text-white/90">
            {relationship.person1.name}
          </span>
          <span className="text-xs text-white/35" aria-hidden>
            ×
          </span>
          <span className="text-sm font-medium text-white/90">
            {relationship.person2.name}
          </span>
          <Pill
            accent={RELATIONSHIP_ACCENTS[type] ?? undefined}
            className="px-2.5 py-0.5 text-[10px]"
          >
            {typeInfo.label}
          </Pill>
          {!relationship.bidirectional && (
            <Pill className="px-2.5 py-0.5 text-[10px]">One-way</Pill>
          )}
        </div>
        {(subtypeLabel || relationship.notes) && (
          <p className="mt-1 truncate text-xs text-white/50">
            {[subtypeLabel, relationship.notes].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>

      <div
        className="flex shrink-0 items-center gap-1"
        role="img"
        aria-label={`Strength: ${strengthInfo.label}`}
        title={strengthInfo.label}
      >
        {[1, 2, 3, 4, 5].map((level) => (
          <span
            key={level}
            aria-hidden
            className={cn(
              'size-2.5 rounded-full',
              level <= relationship.strength ? 'bg-brand' : 'bg-white/[0.12]'
            )}
          />
        ))}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <span className="sr-only">Menu</span>
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <a href={`/app/pair/${relationship.person1_id}/${relationship.person2_id}`}>
              Open couple map
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(relationship)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => onDelete(relationship.id)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  )
}

// Relationship Form Component
function RelationshipForm({
  relationship,
  people,
  onSave,
  onCancel,
}: {
  relationship?: RelationshipWithPeople
  people: Person[]
  onSave: (data: CreateRelationshipInput) => Promise<void>
  onCancel: () => void
}) {
  const [formData, setFormData] = useState<{
    person1Id: string
    person2Id: string
    type: RelationshipType
    subtype: string
    bidirectional: boolean
    strength: number
    startDate: string
    endDate: string
    notes: string
  }>({
    person1Id: relationship?.person1_id || '',
    person2Id: relationship?.person2_id || '',
    type: (relationship?.type as RelationshipType) || 'friend',
    subtype: relationship?.subtype || '',
    bidirectional: relationship?.bidirectional ?? true,
    strength: relationship?.strength ?? 3,
    startDate: relationship?.start_date || '',
    endDate: relationship?.end_date || '',
    notes: relationship?.notes || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const availableSubtypes = RELATIONSHIP_SUBTYPES[formData.type] || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Radix Select has no native `required`; keep the old guarantee.
    if (!formData.person1Id || !formData.person2Id) {
      setError('Please select both people')
      setLoading(false)
      return
    }

    if (formData.person1Id === formData.person2Id) {
      setError('Please select two different people')
      setLoading(false)
      return
    }

    try {
      await onSave({
        person1Id: formData.person1Id,
        person2Id: formData.person2Id,
        type: formData.type,
        subtype: formData.subtype || undefined,
        bidirectional: formData.bidirectional,
        strength: formData.strength as 1 | 2 | 3 | 4 | 5,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        notes: formData.notes || undefined,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Person 1 */}
      <div className="space-y-2">
        <Label htmlFor="person1">Person 1 *</Label>
        <Select
          value={formData.person1Id}
          onValueChange={(value) => setFormData(prev => ({ ...prev, person1Id: value }))}
        >
          <SelectTrigger id="person1" className="rounded-lg border-white/[0.07]">
            <SelectValue placeholder="Select a person..." />
          </SelectTrigger>
          <SelectContent>
            {people.map(person => (
              <SelectItem key={person.id} value={person.id}>
                {person.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Person 2 */}
      <div className="space-y-2">
        <Label htmlFor="person2">Person 2 *</Label>
        <Select
          value={formData.person2Id}
          onValueChange={(value) => setFormData(prev => ({ ...prev, person2Id: value }))}
        >
          <SelectTrigger id="person2" className="rounded-lg border-white/[0.07]">
            <SelectValue placeholder="Select a person..." />
          </SelectTrigger>
          <SelectContent>
            {people
              .filter(p => p.id !== formData.person1Id)
              .map(person => (
                <SelectItem key={person.id} value={person.id}>
                  {person.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Relationship Type */}
      <div className="space-y-2">
        <Label>Relationship Type *</Label>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(RELATIONSHIP_TYPE_LABELS) as [RelationshipType, typeof RELATIONSHIP_TYPE_LABELS[RelationshipType]][]).map(([type, info]) => (
            <TypeFilterPill
              key={type}
              active={formData.type === type}
              accent={RELATIONSHIP_ACCENTS[type]}
              onClick={() => setFormData(prev => ({ ...prev, type, subtype: '' }))}
            >
              {info.label}
            </TypeFilterPill>
          ))}
        </div>
      </div>

      {/* Subtype */}
      {availableSubtypes.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="subtype">Subtype</Label>
          <Select
            value={formData.subtype || NO_SUBTYPE}
            onValueChange={(value) =>
              setFormData(prev => ({ ...prev, subtype: value === NO_SUBTYPE ? '' : value }))
            }
          >
            <SelectTrigger id="subtype" className="rounded-lg border-white/[0.07]">
              <SelectValue placeholder="Select subtype (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_SUBTYPE}>No subtype</SelectItem>
              {availableSubtypes.map(subtype => (
                <SelectItem key={subtype.value} value={subtype.value}>
                  {subtype.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Strength */}
      <div className="space-y-2">
        <Label>Relationship Strength</Label>
        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            {([1, 2, 3, 4, 5] as const).map((level) => (
              <button
                key={level}
                type="button"
                aria-label={`Strength ${level}: ${STRENGTH_LABELS[level].label}`}
                aria-pressed={formData.strength === level}
                className={cn(
                  'size-8 rounded-full border-2 transition-colors active:scale-[0.98]',
                  level <= formData.strength
                    ? 'border-brand bg-brand'
                    : 'border-white/[0.12] bg-transparent hover:border-brand/50'
                )}
                onClick={() => setFormData(prev => ({ ...prev, strength: level }))}
              />
            ))}
          </div>
          <span className="text-sm text-white/50">
            {STRENGTH_LABELS[formData.strength as 1 | 2 | 3 | 4 | 5].label}
          </span>
        </div>
      </div>

      {/* Bidirectional */}
      <div className="flex items-center gap-3">
        <Switch
          id="bidirectional"
          checked={formData.bidirectional}
          onCheckedChange={(checked) =>
            setFormData(prev => ({ ...prev, bidirectional: checked }))
          }
        />
        <Label htmlFor="bidirectional" className="font-normal">
          Bidirectional relationship (both sides see the relationship)
        </Label>
      </div>

      {/* Start Date */}
      <div className="space-y-2">
        <Label htmlFor="startDate">Start Date</Label>
        <Input
          id="startDate"
          type="date"
          value={formData.startDate}
          onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
          dir="ltr"
          className="bg-background border-border"
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Notes (optional)"
          className="bg-background border-border"
        />
      </div>

      {error && <Notice variant="error">{error}</Notice>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl">
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-brand text-white hover:bg-brand-soft active:scale-[0.98]"
        >
          {loading ? 'Saving...' : relationship ? 'Update' : 'Add'}
        </Button>
      </div>
    </form>
  )
}

// Main Page Component
export default function RelationshipsPage() {
  const { people, loading: peopleLoading } = usePeople()
  const {
    relationships,
    loading: relLoading,
    error,
    addRelationship,
    updateRelationship,
    deleteRelationship,
  } = useRelationships()
  const confirm = useConfirm()
  const reducedMotion = useReducedMotion()

  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState<RelationshipType | null>(null)
  const [editingRelationship, setEditingRelationship] = useState<RelationshipWithPeople | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const loading = peopleLoading || relLoading

  // Filter relationships
  const filteredRelationships = useMemo(() => {
    return relationships.filter(rel => {
      const matchesSearch = search
        ? rel.person1.name.toLowerCase().includes(search.toLowerCase()) ||
          rel.person2.name.toLowerCase().includes(search.toLowerCase()) ||
          rel.person1.hebrew_name?.toLowerCase().includes(search.toLowerCase()) ||
          rel.person2.hebrew_name?.toLowerCase().includes(search.toLowerCase())
        : true

      const matchesType = selectedType
        ? rel.type === selectedType
        : true

      return matchesSearch && matchesType
    })
  }, [relationships, search, selectedType])

  const handleAddRelationship = async (data: CreateRelationshipInput) => {
    await addRelationship(data)
    setIsAddDialogOpen(false)
  }

  const handleUpdateRelationship = async (data: CreateRelationshipInput) => {
    if (!editingRelationship) return

    await updateRelationship(editingRelationship.id, {
      type: data.type,
      subtype: data.subtype ?? null,
      bidirectional: data.bidirectional,
      strength: data.strength,
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
      notes: data.notes ?? null,
    })
    setIsEditDialogOpen(false)
    setEditingRelationship(null)
  }

  const handleEditRelationship = (relationship: RelationshipWithPeople) => {
    setEditingRelationship(relationship)
    setIsEditDialogOpen(true)
  }

  const handleDeleteRelationship = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete relationship',
      description: 'Are you sure you want to delete this relationship? This cannot be undone.',
      confirmText: 'Delete',
      variant: 'destructive',
    })
    if (!confirmed) return

    setDeleteError(null)
    try {
      await deleteRelationship(id)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Error deleting')
    }
  }

  if (loading) {
    return <RelationshipsSkeleton />
  }

  if (error) {
    return (
      <Notice variant="error" title="Error loading relationships">
        {error}
      </Notice>
    )
  }

  // Check if we have enough people
  const canAddRelationship = people.length >= 2

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relationships"
        subtitle={`${relationships.length} connection${relationships.length !== 1 ? 's' : ''} mapped`}
        actions={
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!canAddRelationship} className="rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Add Relationship
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Relationship</DialogTitle>
                <DialogDescription>
                  Create a relationship between two people
                </DialogDescription>
              </DialogHeader>
              <RelationshipForm
                people={people}
                onSave={handleAddRelationship}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        }
      />

      {!canAddRelationship && (
        <Notice variant="warning">
          Add at least 2 people before creating relationships
        </Notice>
      )}

      {deleteError && <Notice variant="error">{deleteError}</Notice>}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TypeFilterPill
            active={selectedType === null}
            onClick={() => setSelectedType(null)}
          >
            All
          </TypeFilterPill>
          {(Object.entries(RELATIONSHIP_TYPE_LABELS) as [RelationshipType, typeof RELATIONSHIP_TYPE_LABELS[RelationshipType]][]).map(([type, info]) => (
            <TypeFilterPill
              key={type}
              active={selectedType === type}
              accent={RELATIONSHIP_ACCENTS[type]}
              onClick={() => setSelectedType(selectedType === type ? null : type)}
            >
              {info.label}
            </TypeFilterPill>
          ))}
        </div>
      </div>

      {/* Relationships list — hairline rows, staggered entrance */}
      {filteredRelationships.length === 0 ? (
        search || selectedType ? (
          <div className="surface-card p-12 text-center">
            <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="font-medium text-white/90">No results found</p>
            <p className="text-sm text-white/50 mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <EmptyState
            icon="relationships"
            title="No relationships yet"
            description={canAddRelationship
              ? "Start mapping the connections between people in your circle."
              : "Add at least 2 people to start creating relationships."
            }
            action={canAddRelationship ? {
              label: 'Create First Relationship',
              onClick: () => setIsAddDialogOpen(true),
            } : undefined}
          />
        )
      ) : (
        <motion.div
          variants={staggerParent}
          initial={reducedMotion ? false : 'hidden'}
          animate="visible"
        >
          {filteredRelationships.map((relationship, i) => (
            <RelationshipRow
              key={relationship.id}
              relationship={relationship}
              onEdit={handleEditRelationship}
              onDelete={handleDeleteRelationship}
              last={i === filteredRelationships.length - 1}
            />
          ))}
        </motion.div>
      )}

      {/* Edit dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open)
        if (!open) setEditingRelationship(null)
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Relationship</DialogTitle>
            <DialogDescription>
              Update the relationship details
            </DialogDescription>
          </DialogHeader>
          {editingRelationship && (
            <RelationshipForm
              relationship={editingRelationship}
              people={people}
              onSave={handleUpdateRelationship}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setEditingRelationship(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Loading skeleton — layout-matched (header, filters, hairline rows)
function RelationshipsSkeleton() {
  return (
    <div className="space-y-6" aria-hidden>
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="skeleton-shimmer h-8 w-48 rounded" />
          <div className="skeleton-shimmer h-4 w-32 rounded" />
        </div>
        <div className="skeleton-shimmer mt-3 h-10 w-40 rounded-xl sm:mt-0" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="skeleton-shimmer h-10 w-full rounded-md sm:w-64" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="skeleton-shimmer h-7 w-20 rounded-full" />
          ))}
        </div>
      </div>

      {/* Rows */}
      <SkeletonRows count={6} />
    </div>
  )
}
