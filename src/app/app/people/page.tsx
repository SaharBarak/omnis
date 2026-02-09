'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { usePeople } from '@/lib/hooks/use-people'
import { useRelationships } from '@/lib/hooks/use-relationships'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { BirthTimeInput } from '@/components/ui/birth-time-input'
import { LocationPicker, type BirthPlace } from '@/components/ui/location-picker'
import { PageHeader, EmptyState } from '@/components/dashboard'
import type { Person, Tag, Json } from '@/lib/supabase/database.types'
import { dateToKin, kinToSeal, kinToTone } from '@/lib/calculations/dreamspell'
import { getSeal } from '@/lib/data/seals'
import { getTone } from '@/lib/data/tones'
import { Plus, MoreVertical, Search } from 'lucide-react'

interface PersonWithTags extends Person {
  tags: Tag[]
}

function PersonCard({
  person,
  relationshipCount,
  onEdit,
  onDelete,
}: {
  person: PersonWithTags
  relationshipCount: number
  onEdit: (person: PersonWithTags) => void
  onDelete: (id: string) => void
}) {
  const kin = dateToKin(person.birth_date)
  const seal = getSeal(kinToSeal(kin))
  const tone = getTone(kinToTone(kin))

  return (
    <div className="surface-card p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <Link href={`/app/people/${person.id}`} className="hover:text-primary transition-colors">
            <h3 className="font-semibold text-foreground truncate">{person.name}</h3>
          </Link>
          {person.hebrew_name && (
            <p className="text-sm text-muted-foreground truncate">{person.hebrew_name}</p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/app/people/${person.id}`}>View Details</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(person)}>Edit</DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/app/relationships">Relationships ({relationshipCount})</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(person.id)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2.5">
        <p className="text-sm text-muted-foreground">
          {new Date(person.birth_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm font-bold">
            {kin}
          </span>
          <span className="text-sm text-foreground">{tone.name} {seal.english}</span>
        </div>

        {(person.tags.length > 0 || relationshipCount > 0) && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {person.tags.map(tag => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="text-xs"
                style={{ backgroundColor: `${tag.color}15`, color: tag.color }}
              >
                {tag.name}
              </Badge>
            ))}
            {relationshipCount > 0 && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                {relationshipCount} connections
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function PersonForm({
  person,
  tags,
  onSave,
  onCancel,
}: {
  person?: PersonWithTags
  tags: Tag[]
  onSave: (data: {
    name: string
    hebrew_name: string
    birth_date: string
    birth_time: string | null
    birth_place: BirthPlace | null
    notes: string
    tagIds: string[]
  }) => Promise<void>
  onCancel: () => void
}) {
  const existingBirthPlace = person?.birth_place
    ? (person.birth_place as unknown as BirthPlace)
    : null

  const [formData, setFormData] = useState({
    name: person?.name || '',
    hebrew_name: person?.hebrew_name || '',
    birth_date: person?.birth_date || '',
    birth_time: person?.birth_time || null as string | null,
    birth_place: existingBirthPlace,
    notes: person?.notes || '',
    tagIds: person?.tags.map(t => t.id) || [],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await onSave(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving')
    } finally {
      setLoading(false)
    }
  }

  const toggleTag = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter(id => id !== tagId)
        : [...prev.tagIds, tagId],
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
          placeholder="Full name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="hebrew_name">Hebrew Name</Label>
        <Input
          id="hebrew_name"
          value={formData.hebrew_name}
          onChange={(e) => setFormData(prev => ({ ...prev, hebrew_name: e.target.value }))}
          placeholder="Optional"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="birth_date">Birth Date *</Label>
        <Input
          id="birth_date"
          type="date"
          value={formData.birth_date}
          onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
          required
          max={new Date().toISOString().split('T')[0]}
        />
      </div>

      <div className="space-y-2">
        <Label>Birth Time</Label>
        <BirthTimeInput
          value={formData.birth_time}
          onChange={(value) => setFormData(prev => ({ ...prev, birth_time: value }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Birth Place</Label>
        <LocationPicker
          value={formData.birth_place}
          onChange={(value) => setFormData(prev => ({ ...prev, birth_place: value }))}
        />
      </div>

      {tags.length > 0 && (
        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <Badge
                key={tag.id}
                variant={formData.tagIds.includes(tag.id) ? 'default' : 'outline'}
                className="cursor-pointer"
                style={formData.tagIds.includes(tag.id) ? {
                  backgroundColor: tag.color,
                  borderColor: tag.color,
                } : {
                  borderColor: tag.color,
                  color: tag.color,
                }}
                onClick={() => toggleTag(tag.id)}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Optional"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : person ? 'Update' : 'Add Person'}
        </Button>
      </div>
    </form>
  )
}

export default function PeoplePage() {
  const { people, tags, loading, error, addPerson, updatePerson, deletePerson } = usePeople()
  const { relationships } = useRelationships()
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [editingPerson, setEditingPerson] = useState<PersonWithTags | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const relationshipCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    relationships.forEach(rel => {
      counts[rel.person1_id] = (counts[rel.person1_id] || 0) + 1
      if (rel.bidirectional) {
        counts[rel.person2_id] = (counts[rel.person2_id] || 0) + 1
      }
    })
    return counts
  }, [relationships])

  const filteredPeople = people.filter(person => {
    const matchesSearch = search
      ? person.name.toLowerCase().includes(search.toLowerCase()) ||
        person.hebrew_name?.toLowerCase().includes(search.toLowerCase())
      : true
    const matchesTag = selectedTag
      ? person.tags.some(t => t.id === selectedTag)
      : true
    return matchesSearch && matchesTag
  })

  const handleAddPerson = async (data: {
    name: string
    hebrew_name: string
    birth_date: string
    birth_time: string | null
    birth_place: BirthPlace | null
    notes: string
    tagIds: string[]
  }) => {
    await addPerson({
      name: data.name,
      hebrew_name: data.hebrew_name || null,
      birth_date: data.birth_date,
      birth_time: data.birth_time,
      birth_place: data.birth_place as Json | null,
      notes: data.notes || null,
    }, data.tagIds)
    setIsAddDialogOpen(false)
  }

  const handleUpdatePerson = async (data: {
    name: string
    hebrew_name: string
    birth_date: string
    birth_time: string | null
    birth_place: BirthPlace | null
    notes: string
    tagIds: string[]
  }) => {
    if (!editingPerson) return
    await updatePerson(editingPerson.id, {
      name: data.name,
      hebrew_name: data.hebrew_name || null,
      birth_date: data.birth_date,
      birth_time: data.birth_time,
      birth_place: data.birth_place as Json | null,
      notes: data.notes || null,
    }, data.tagIds)
    setIsEditDialogOpen(false)
    setEditingPerson(null)
  }

  const handleDeletePerson = async (id: string) => {
    if (confirm('Are you sure you want to delete this person?')) {
      setDeleteError(null)
      try {
        await deletePerson(id)
      } catch (err) {
        setDeleteError(err instanceof Error ? err.message : 'Error deleting')
      }
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-32 mb-1" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="People"
        subtitle={`${people.length} people in your circle`}
        actions={
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Person
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Person</DialogTitle>
                <DialogDescription>Enter the details of the person you want to add</DialogDescription>
              </DialogHeader>
              <PersonForm
                tags={tags}
                onSave={handleAddPerson}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        }
      />

      {deleteError && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
          {deleteError}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search people..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <Badge
              variant={selectedTag === null ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedTag(null)}
            >
              All
            </Badge>
            {tags.map(tag => (
              <Badge
                key={tag.id}
                variant={selectedTag === tag.id ? 'default' : 'outline'}
                className="cursor-pointer"
                style={selectedTag === tag.id ? {
                  backgroundColor: tag.color,
                  borderColor: tag.color,
                } : {
                  borderColor: tag.color,
                  color: tag.color,
                }}
                onClick={() => setSelectedTag(selectedTag === tag.id ? null : tag.id)}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* People grid */}
      {filteredPeople.length === 0 ? (
        <EmptyState
          icon={search || selectedTag ? 'general' : 'people'}
          title={search || selectedTag ? 'No results found' : "No people yet"}
          description={search || selectedTag ? 'Try adjusting your search or filters' : "Start by adding yourself and the people in your life"}
          action={!search && !selectedTag ? {
            label: 'Add First Person',
            onClick: () => setIsAddDialogOpen(true),
          } : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPeople.map(person => (
            <PersonCard
              key={person.id}
              person={person}
              relationshipCount={relationshipCounts[person.id] || 0}
              onEdit={(p) => {
                setEditingPerson(p)
                setIsEditDialogOpen(true)
              }}
              onDelete={handleDeletePerson}
            />
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open)
        if (!open) setEditingPerson(null)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editingPerson?.name}</DialogTitle>
            <DialogDescription>Update the details</DialogDescription>
          </DialogHeader>
          {editingPerson && (
            <PersonForm
              person={editingPerson}
              tags={tags}
              onSave={handleUpdatePerson}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setEditingPerson(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
