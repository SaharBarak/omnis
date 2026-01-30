'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { usePeople } from '@/lib/hooks/use-people'
import { useRelationships } from '@/lib/hooks/use-relationships'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import type { Person, Tag, Json } from '@/lib/supabase/database.types'
import { dateToKin, kinToSeal, kinToTone } from '@/lib/calculations/dreamspell'
import { getSeal } from '@/lib/data/seals'
import { getTone } from '@/lib/data/tones'

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
  // Calculate Dreamspell Kin
  const kin = dateToKin(person.birth_date)
  const seal = getSeal(kinToSeal(kin))
  const tone = getTone(kinToTone(kin))

  return (
    <div className="earth-card bg-card p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <Link href={`/app/people/${person.id}`} className="hover:underline">
            <h3 className="text-lg font-heading text-foreground">{person.name}</h3>
          </Link>
          {person.hebrew_name && (
            <p className="text-sm text-muted-foreground">{person.hebrew_name}</p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <span className="sr-only">Menu</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/app/people/${person.id}`}>
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(person)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/app/relationships">
                Relationships ({relationshipCount})
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(person.id)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-3">
        <div className="text-sm text-muted-foreground">
          Birth date: {new Date(person.birth_date).toLocaleDateString('en-US')}
        </div>

        <div className="text-sm">
          <span className="font-medium text-primary">Kin {kin}: </span>
          <span>{tone.name} {seal.english}</span>
        </div>

        <div className="flex flex-wrap gap-1">
          {person.tags.length > 0 && person.tags.map(tag => (
            <Badge
              key={tag.id}
              variant="secondary"
              style={{ backgroundColor: tag.color + '20', color: tag.color }}
            >
              {tag.name}
            </Badge>
          ))}
          {relationshipCount > 0 && (
            <Badge variant="outline" className="text-muted-foreground">
              {relationshipCount} relationships
            </Badge>
          )}
        </div>
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
  // Parse existing birth_place if present
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
          className="bg-background border-border"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="hebrew_name">Hebrew Name</Label>
        <Input
          id="hebrew_name"
          value={formData.hebrew_name}
          onChange={(e) => setFormData(prev => ({ ...prev, hebrew_name: e.target.value }))}
          placeholder="Hebrew name (optional)"
          className="bg-background border-border"
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
          className="bg-background border-border"
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

      {error && (
        <div className="text-sm text-destructive">{error}</div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          {loading ? 'Saving...' : person ? 'Update' : 'Add'}
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

  // Compute relationship counts per person
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

  // Filter people by search and tag
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

  const handleEditPerson = (person: PersonWithTags) => {
    setEditingPerson(person)
    setIsEditDialogOpen(true)
  }

  const [deleteError, setDeleteError] = useState<string | null>(null)

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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-muted-foreground">Loading...</div>
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
          <h1 className="text-3xl font-heading text-foreground">My People</h1>
          <p className="text-muted-foreground">
            {people.length} people in your circle
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">+ Add Person</Button>
          </DialogTrigger>
          <DialogContent className="earth-card">
            <DialogHeader>
              <DialogTitle className="font-heading">Add New Person</DialogTitle>
              <DialogDescription>
                Enter the details of the person you want to add
              </DialogDescription>
            </DialogHeader>
            <PersonForm
              tags={tags}
              onSave={handleAddPerson}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Delete error message */}
      {deleteError && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
          {deleteError}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs bg-background border-border"
        />
        <div className="flex flex-wrap gap-2">
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
      </div>

      {/* People grid */}
      {filteredPeople.length === 0 ? (
        <div className="earth-card bg-card p-12 text-center">
          <p className="text-muted-foreground mb-4">
            {search || selectedTag ? 'No results found' : "You haven't added any people yet"}
          </p>
          {!search && !selectedTag && (
            <Button onClick={() => setIsAddDialogOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              + Add First Person
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPeople.map(person => (
            <PersonCard
              key={person.id}
              person={person}
              relationshipCount={relationshipCounts[person.id] || 0}
              onEdit={handleEditPerson}
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
        <DialogContent className="earth-card">
          <DialogHeader>
            <DialogTitle className="font-heading">Edit {editingPerson?.name}</DialogTitle>
            <DialogDescription>
              Update the details
            </DialogDescription>
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
