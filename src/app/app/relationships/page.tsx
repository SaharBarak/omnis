'use client'

import { useState, useMemo } from 'react'
import { usePeople } from '@/lib/hooks/use-people'
import { useRelationships, getRelationshipColor } from '@/lib/hooks/use-relationships'
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
import type { Person } from '@/lib/supabase/database.types'
import type { RelationshipWithPeople, RelationshipType, CreateRelationshipInput } from '@/lib/types/relationship'
import {
  RELATIONSHIP_TYPE_LABELS,
  RELATIONSHIP_SUBTYPES,
  STRENGTH_LABELS,
} from '@/lib/types/relationship'

// Relationship Card Component
function RelationshipCard({
  relationship,
  onEdit,
  onDelete,
}: {
  relationship: RelationshipWithPeople
  onEdit: (relationship: RelationshipWithPeople) => void
  onDelete: (id: string) => void
}) {
  const typeInfo = RELATIONSHIP_TYPE_LABELS[relationship.type as RelationshipType]
  const strengthInfo = STRENGTH_LABELS[relationship.strength as 1 | 2 | 3 | 4 | 5]

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{relationship.person1.name}</CardTitle>
              <span className="text-muted-foreground">↔</span>
              <CardTitle className="text-lg">{relationship.person2.name}</CardTitle>
            </div>
            <Badge
              variant="secondary"
              style={{ backgroundColor: typeInfo.color + '20', color: typeInfo.color }}
            >
              {typeInfo.labelHebrew}
            </Badge>
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
              <DropdownMenuItem onClick={() => onEdit(relationship)}>
                ערוך
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(relationship.id)}
              >
                מחק
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {relationship.subtype && (
          <div className="text-sm text-muted-foreground">
            {RELATIONSHIP_SUBTYPES[relationship.type as RelationshipType]?.find(
              s => s.value === relationship.subtype
            )?.labelHebrew || relationship.subtype}
          </div>
        )}

        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">עוצמה:</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className={`w-4 h-4 rounded-full ${
                  level <= relationship.strength
                    ? 'bg-primary'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground mr-1">
            ({strengthInfo.labelHebrew})
          </span>
        </div>

        {!relationship.bidirectional && (
          <Badge variant="outline" className="text-xs">
            חד-כיווני
          </Badge>
        )}

        {relationship.notes && (
          <p className="text-sm text-muted-foreground">{relationship.notes}</p>
        )}
      </CardContent>
    </Card>
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

    if (formData.person1Id === formData.person2Id) {
      setError('יש לבחור שני אנשים שונים')
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
      setError(err instanceof Error ? err.message : 'שגיאה בשמירה')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Person 1 */}
      <div className="space-y-2">
        <Label htmlFor="person1">אדם 1 *</Label>
        <select
          id="person1"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={formData.person1Id}
          onChange={(e) => setFormData(prev => ({ ...prev, person1Id: e.target.value }))}
          required
        >
          <option value="">בחר אדם...</option>
          {people.map(person => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </select>
      </div>

      {/* Person 2 */}
      <div className="space-y-2">
        <Label htmlFor="person2">אדם 2 *</Label>
        <select
          id="person2"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={formData.person2Id}
          onChange={(e) => setFormData(prev => ({ ...prev, person2Id: e.target.value }))}
          required
        >
          <option value="">בחר אדם...</option>
          {people
            .filter(p => p.id !== formData.person1Id)
            .map(person => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
        </select>
      </div>

      {/* Relationship Type */}
      <div className="space-y-2">
        <Label>סוג קשר *</Label>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(RELATIONSHIP_TYPE_LABELS) as [RelationshipType, typeof RELATIONSHIP_TYPE_LABELS[RelationshipType]][]).map(([type, info]) => (
            <Badge
              key={type}
              variant={formData.type === type ? 'default' : 'outline'}
              className="cursor-pointer"
              style={formData.type === type ? {
                backgroundColor: info.color,
                borderColor: info.color,
              } : {
                borderColor: info.color,
                color: info.color,
              }}
              onClick={() => setFormData(prev => ({ ...prev, type, subtype: '' }))}
            >
              {info.labelHebrew}
            </Badge>
          ))}
        </div>
      </div>

      {/* Subtype */}
      {availableSubtypes.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="subtype">תת-סוג</Label>
          <select
            id="subtype"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.subtype}
            onChange={(e) => setFormData(prev => ({ ...prev, subtype: e.target.value }))}
          >
            <option value="">בחר תת-סוג (אופציונלי)</option>
            {availableSubtypes.map(subtype => (
              <option key={subtype.value} value={subtype.value}>
                {subtype.labelHebrew}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Strength */}
      <div className="space-y-2">
        <Label>עוצמת הקשר</Label>
        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            {([1, 2, 3, 4, 5] as const).map((level) => (
              <button
                key={level}
                type="button"
                className={`w-8 h-8 rounded-full border-2 transition-colors ${
                  level <= formData.strength
                    ? 'bg-primary border-primary'
                    : 'bg-background border-muted hover:border-primary/50'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, strength: level }))}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            {STRENGTH_LABELS[formData.strength as 1 | 2 | 3 | 4 | 5].labelHebrew}
          </span>
        </div>
      </div>

      {/* Bidirectional */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="bidirectional"
          checked={formData.bidirectional}
          onChange={(e) => setFormData(prev => ({ ...prev, bidirectional: e.target.checked }))}
          className="rounded border-input"
        />
        <Label htmlFor="bidirectional" className="font-normal">
          קשר דו-כיווני (שני הצדדים רואים את הקשר)
        </Label>
      </div>

      {/* Start Date */}
      <div className="space-y-2">
        <Label htmlFor="startDate">תאריך התחלה</Label>
        <Input
          id="startDate"
          type="date"
          value={formData.startDate}
          onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
          dir="ltr"
        />
      </div>

      {/* Notes */}
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
          {loading ? 'שומר...' : relationship ? 'עדכן' : 'הוסף'}
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
    if (confirm('האם למחוק את הקשר הזה?')) {
      setDeleteError(null)
      try {
        await deleteRelationship(id)
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

  // Check if we have enough people
  const canAddRelationship = people.length >= 2

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">קשרים</h1>
          <p className="text-muted-foreground">
            {relationships.length} קשרים
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!canAddRelationship}>
              + הוסף קשר
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>הוסף קשר חדש</DialogTitle>
              <DialogDescription>
                צור קשר בין שני אנשים
              </DialogDescription>
            </DialogHeader>
            <RelationshipForm
              people={people}
              onSave={handleAddRelationship}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {!canAddRelationship && (
        <div className="p-4 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-md">
          יש להוסיף לפחות 2 אנשים לפני שניתן ליצור קשרים
        </div>
      )}

      {deleteError && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {deleteError}
        </div>
      )}

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
            variant={selectedType === null ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedType(null)}
          >
            הכל
          </Badge>
          {(Object.entries(RELATIONSHIP_TYPE_LABELS) as [RelationshipType, typeof RELATIONSHIP_TYPE_LABELS[RelationshipType]][]).map(([type, info]) => (
            <Badge
              key={type}
              variant={selectedType === type ? 'default' : 'outline'}
              className="cursor-pointer"
              style={selectedType === type ? {
                backgroundColor: info.color,
                borderColor: info.color,
              } : {
                borderColor: info.color,
                color: info.color,
              }}
              onClick={() => setSelectedType(selectedType === type ? null : type)}
            >
              {info.labelHebrew}
            </Badge>
          ))}
        </div>
      </div>

      {/* Relationships grid */}
      {filteredRelationships.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              {search || selectedType ? 'לא נמצאו תוצאות' : 'עדיין לא יצרת קשרים'}
            </p>
            {!search && !selectedType && canAddRelationship && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                + צור קשר ראשון
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRelationships.map(relationship => (
            <RelationshipCard
              key={relationship.id}
              relationship={relationship}
              onEdit={handleEditRelationship}
              onDelete={handleDeleteRelationship}
            />
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open)
        if (!open) setEditingRelationship(null)
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>עריכת קשר</DialogTitle>
            <DialogDescription>
              עדכן את פרטי הקשר
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
