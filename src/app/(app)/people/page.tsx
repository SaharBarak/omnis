'use client'

import { useState } from 'react'
import { usePeople } from '@/lib/hooks/use-people'
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
import type { Person, Tag } from '@/lib/supabase/database.types'
import { dateToKin, kinToSeal, kinToTone } from '@/lib/calculations/dreamspell'
import { getSeal } from '@/lib/data/seals'
import { getTone } from '@/lib/data/tones'

interface PersonWithTags extends Person {
  tags: Tag[]
}

function PersonCard({
  person,
  onEdit,
  onDelete,
}: {
  person: PersonWithTags
  onEdit: (person: PersonWithTags) => void
  onDelete: (id: string) => void
}) {
  // Calculate Dreamspell Kin
  const kin = dateToKin(person.birth_date)
  const seal = getSeal(kinToSeal(kin))
  const tone = getTone(kinToTone(kin))

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{person.name}</CardTitle>
            {person.hebrew_name && (
              <CardDescription>{person.hebrew_name}</CardDescription>
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
              <DropdownMenuItem onClick={() => onEdit(person)}>
                ערוך
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(person.id)}
              >
                מחק
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          תאריך לידה: {new Date(person.birth_date).toLocaleDateString('he-IL')}
        </div>

        <div className="text-sm">
          <span className="font-medium">קין {kin}: </span>
          <span>{tone.name} {seal.english}</span>
        </div>

        {person.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {person.tags.map(tag => (
              <Badge
                key={tag.id}
                variant="secondary"
                style={{ backgroundColor: tag.color + '20', color: tag.color }}
              >
                {tag.hebrew_name}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
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
    notes: string
    tagIds: string[]
  }) => Promise<void>
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: person?.name || '',
    hebrew_name: person?.hebrew_name || '',
    birth_date: person?.birth_date || '',
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
      setError(err instanceof Error ? err.message : 'שגיאה בשמירה')
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
        <Label htmlFor="name">שם *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
          placeholder="שם מלא"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="hebrew_name">שם עברי</Label>
        <Input
          id="hebrew_name"
          value={formData.hebrew_name}
          onChange={(e) => setFormData(prev => ({ ...prev, hebrew_name: e.target.value }))}
          placeholder="שם עברי (אופציונלי)"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="birth_date">תאריך לידה *</Label>
        <Input
          id="birth_date"
          type="date"
          value={formData.birth_date}
          onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
          required
          dir="ltr"
          max={new Date().toISOString().split('T')[0]}
        />
      </div>

      <div className="space-y-2">
        <Label>תגיות</Label>
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
              {tag.hebrew_name}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">הערות</Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="הערות (אופציונלי)"
        />
      </div>

      {error && (
        <div className="text-sm text-destructive">{error}</div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          ביטול
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'שומר...' : person ? 'עדכן' : 'הוסף'}
        </Button>
      </div>
    </form>
  )
}

export default function PeoplePage() {
  const { people, tags, loading, error, addPerson, updatePerson, deletePerson } = usePeople()
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [editingPerson, setEditingPerson] = useState<PersonWithTags | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

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
    notes: string
    tagIds: string[]
  }) => {
    await addPerson({
      name: data.name,
      hebrew_name: data.hebrew_name || null,
      birth_date: data.birth_date,
      notes: data.notes || null,
    }, data.tagIds)
    setIsAddDialogOpen(false)
  }

  const handleUpdatePerson = async (data: {
    name: string
    hebrew_name: string
    birth_date: string
    notes: string
    tagIds: string[]
  }) => {
    if (!editingPerson) return

    await updatePerson(editingPerson.id, {
      name: data.name,
      hebrew_name: data.hebrew_name || null,
      birth_date: data.birth_date,
      notes: data.notes || null,
    }, data.tagIds)
    setIsEditDialogOpen(false)
    setEditingPerson(null)
  }

  const handleEditPerson = (person: PersonWithTags) => {
    setEditingPerson(person)
    setIsEditDialogOpen(true)
  }

  const handleDeletePerson = async (id: string) => {
    if (confirm('האם למחוק את האדם הזה?')) {
      await deletePerson(id)
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
          <h1 className="text-3xl font-bold tracking-tight">האנשים שלי</h1>
          <p className="text-muted-foreground">
            {people.length} אנשים
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>+ הוסף אדם</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>הוסף אדם חדש</DialogTitle>
              <DialogDescription>
                הזן את הפרטים של האדם שברצונך להוסיף
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="חיפוש לפי שם..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedTag === null ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedTag(null)}
          >
            הכל
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
              {tag.hebrew_name}
            </Badge>
          ))}
        </div>
      </div>

      {/* People grid */}
      {filteredPeople.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              {search || selectedTag ? 'לא נמצאו תוצאות' : 'עדיין לא הוספת אנשים'}
            </p>
            {!search && !selectedTag && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                + הוסף אדם ראשון
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPeople.map(person => (
            <PersonCard
              key={person.id}
              person={person}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>עריכת {editingPerson?.name}</DialogTitle>
            <DialogDescription>
              עדכן את הפרטים
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
