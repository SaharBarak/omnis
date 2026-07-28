'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { dateToKin, kinToSeal, kinToTone } from '@pleiad/engine/calculations/dreamspell'
import { getSeal } from '@pleiad/engine/data/seals'
import { getTone } from '@pleiad/engine/data/tones'
import { Plus, MoreVertical, Search } from 'lucide-react'
import { usePeople } from '@/lib/hooks/use-people'
import { useRelationships } from '@/lib/hooks/use-relationships'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { BirthTimeInput } from '@/components/ui/birth-time-input'
import { LocationPicker, type BirthPlace } from '@/components/ui/location-picker'
import { PageHeader, EmptyState } from '@/components/dashboard'
import { useConfirm } from '@/components/dashboard/confirm-dialog'
import { Pill, Notice, SkeletonRows, EASE_OUT } from '@/components/app-kit'
import type { Person, Tag } from '@/lib/types/database.types'

interface PersonWithTags extends Person {
  tags: Tag[]
}

/** Cascade caps at ~8 rows — rows past the fold land without theatrics. */
const STAGGER_CAP = 8

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter((part) => part.length > 0)
  const first = parts[0]?.[0] ?? ''
  const second = parts[1]?.[0] ?? ''
  return `${first}${second}`.toUpperCase() || '·'
}

/** "KIN 42 · BLUE LUNAR MONKEY" — the mobile library's inline reading. */
function dreamspellLine(birthDate: string): string {
  try {
    const kin = dateToKin(birthDate)
    const seal = getSeal(kinToSeal(kin))
    const tone = getTone(kinToTone(kin))
    return `KIN ${kin} · ${seal.color} ${tone.name} ${seal.english}`.toUpperCase()
  } catch {
    return birthDate
  }
}

function PersonRow({
  person,
  index,
  animateIn,
  relationshipCount,
  onEdit,
  onDelete,
}: {
  person: PersonWithTags
  index: number
  animateIn: boolean
  relationshipCount: number
  onEdit: (person: PersonWithTags) => void
  onDelete: (person: PersonWithTags) => void
}) {
  const reduced = useReducedMotion()
  const line = useMemo(() => dreamspellLine(person.birth_date), [person.birth_date])

  return (
    <motion.div
      initial={animateIn && !reduced ? { opacity: 0, y: 16 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: Math.min(index, STAGGER_CAP) * 0.06,
        ease: EASE_OUT as [number, number, number, number],
      }}
      className="flex items-center gap-2 border-b border-white/[0.07] transition-colors hover:bg-white/[0.02]"
    >
      <Link
        href={`/app/people/${person.id}`}
        className="flex min-w-0 flex-1 items-center gap-4 py-3.5 transition-transform active:scale-[0.98]"
      >
        <span
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-full border border-white/[0.07] bg-surface-2',
            'font-sans font-medium text-[11px] uppercase tracking-[0.1em] text-white/70',
            person.is_self && 'ring-1 ring-brand-soft/70'
          )}
          aria-hidden
        >
          {initialsOf(person.name)}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-baseline gap-2">
            <span className="truncate text-sm font-medium text-white/90">{person.name}</span>
            {person.is_self && (
              <span className="shrink-0 font-sans font-medium text-[10px] uppercase tracking-[0.2em] text-brand-soft">
                You
              </span>
            )}
          </span>
          <span className="truncate font-sans font-medium text-[11px] uppercase tracking-[0.2em] text-white/50">
            {line}
          </span>
        </span>
      </Link>

      {person.tags.length > 0 && (
        <div className="hidden shrink-0 items-center gap-1.5 md:flex">
          {person.tags.map((tag) => (
            <Pill key={tag.id} accent={tag.color} className="px-2.5 py-0.5 text-[10px] tracking-[0.15em]">
              {tag.name}
            </Pill>
          ))}
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8 shrink-0 text-white/50 hover:text-white/90">
            <MoreVertical className="size-4" />
            <span className="sr-only">Menu for {person.name}</span>
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
          <DropdownMenuItem className="text-destructive" onClick={() => onDelete(person)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  )
}

function PersonForm({
  person,
  onSave,
  onCancel,
}: {
  person?: PersonWithTags
  onSave: (data: {
    name: string
    hebrew_name: string
    birth_date: string
    birth_time: string | null
    birth_place: BirthPlace | null
    notes: string
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
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl">
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-brand text-white hover:bg-brand-soft active:scale-[0.98]"
        >
          {loading ? 'Saving...' : person ? 'Update' : 'Add Person'}
        </Button>
      </div>
    </form>
  )
}

export default function PeoplePage() {
  const { people, tags, loading, error, fetchPeople, addPerson, updatePerson, deletePerson } = usePeople()
  const { relationships } = useRelationships()
  const confirm = useConfirm()
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [editingPerson, setEditingPerson] = useState<PersonWithTags | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [hasSettled, setHasSettled] = useState(false)

  // Stagger the cascade only on the first data landing, once per mount.
  useEffect(() => {
    if (!loading && !hasSettled) {
      const timer = setTimeout(() => setHasSettled(true), 900)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [loading, hasSettled])

  // Deep-link support: /app/people?edit=<id> opens the edit dialog —
  // the person-detail AddDataChips land here to complete missing data.
  // The param is consumed (stripped) on first data landing so later
  // refetches never re-open the dialog.
  useEffect(() => {
    if (loading) return
    const id = new URLSearchParams(window.location.search).get('edit')
    if (!id) return
    window.history.replaceState(null, '', '/app/people')
    const person = people.find(p => p.id === id)
    if (person) {
      setEditingPerson(person)
      setIsEditDialogOpen(true)
    }
  }, [loading, people])

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

  const countLabel = `${people.length} ${people.length === 1 ? 'PERSON' : 'PEOPLE'}`

  const handleAddPerson = async (data: {
    name: string
    hebrew_name: string
    birth_date: string
    birth_time: string | null
    birth_place: BirthPlace | null
    notes: string
  }) => {
    await addPerson({
      name: data.name,
      hebrew_name: data.hebrew_name || null,
      birth_date: data.birth_date,
      birth_time: data.birth_time,
      birth_place: data.birth_place,
      notes: data.notes || null,
    })
    setIsAddDialogOpen(false)
  }

  const handleUpdatePerson = async (data: {
    name: string
    hebrew_name: string
    birth_date: string
    birth_time: string | null
    birth_place: BirthPlace | null
    notes: string
  }) => {
    if (!editingPerson) return
    // tagIds intentionally omitted: no tag-management UI exists, and an
    // undefined tagIds skips tag sync server-side, preserving legacy tags.
    await updatePerson(editingPerson.id, {
      name: data.name,
      hebrew_name: data.hebrew_name || null,
      birth_date: data.birth_date,
      birth_time: data.birth_time,
      birth_place: data.birth_place,
      notes: data.notes || null,
    })
    setIsEditDialogOpen(false)
    setEditingPerson(null)
  }

  const handleDeletePerson = async (person: PersonWithTags) => {
    const confirmed = await confirm({
      title: `Remove ${person.name}?`,
      description: 'They leave your map. Adding them again recomputes everything.',
      confirmText: 'Remove',
      variant: 'destructive',
    })
    if (!confirmed) return
    setDeleteError(null)
    try {
      await deletePerson(person.id)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Error deleting')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-2">
            <div className="skeleton-shimmer h-3 w-24 rounded" />
            <div className="skeleton-shimmer h-8 w-36 rounded" />
          </div>
          <div className="skeleton-shimmer h-10 w-32 rounded-xl" />
        </div>
        <div className="skeleton-shimmer h-10 w-full max-w-xs rounded-xl" />
        <SkeletonRows count={6} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader meta="PEOPLE" title="People" />
        <Notice
          variant="error"
          title="Your people are out of reach."
          action={
            <Button variant="outline" size="sm" className="rounded-xl" onClick={fetchPeople}>
              Try again
            </Button>
          }
        >
          We couldn&apos;t load the library. They&apos;re safe. Check your connection.
        </Notice>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        meta={countLabel}
        title="People"
        actions={
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-brand text-white hover:bg-brand-soft active:scale-[0.98]">
                <Plus className="mr-2 size-4" />
                Add Person
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">Add New Person</DialogTitle>
                <DialogDescription>Enter the details of the person you want to add</DialogDescription>
              </DialogHeader>
              <PersonForm
                onSave={handleAddPerson}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        }
      />

      {deleteError && (
        <Notice variant="error" title={"Couldn't remove them."}>
          {deleteError}
        </Notice>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/35" />
          <Input
            placeholder="Search your people"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedTag(null)}
              className="transition-transform active:scale-[0.98]"
            >
              <Pill
                className={cn(
                  'cursor-pointer px-3 py-1 text-[10px]',
                  selectedTag === null
                    ? 'border-brand-soft/60 text-brand-soft'
                    : 'text-white/50 hover:text-white/70'
                )}
              >
                All
              </Pill>
            </button>
            {tags.map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => setSelectedTag(selectedTag === tag.id ? null : tag.id)}
                className="transition-transform active:scale-[0.98]"
              >
                <Pill
                  accent={selectedTag === tag.id ? tag.color : undefined}
                  className={cn(
                    'cursor-pointer px-3 py-1 text-[10px]',
                    selectedTag !== tag.id && 'text-white/50 hover:text-white/70'
                  )}
                >
                  {tag.name}
                </Pill>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* The library — hairline-divided rows, never a card grid */}
      {people.length === 0 ? (
        <EmptyState
          icon="people"
          title="Your map starts with one birthday."
          description="Add the first person you carry with you. The reading is instant."
          action={{
            label: 'Add First Person',
            onClick: () => setIsAddDialogOpen(true),
          }}
        />
      ) : filteredPeople.length === 0 ? (
        <p className="pt-12 text-center text-sm text-white/50">
          No one answers to that name yet.
        </p>
      ) : (
        <div>
          {filteredPeople.map((person, index) => (
            <PersonRow
              key={person.id}
              person={person}
              index={index}
              animateIn={!hasSettled}
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
            <DialogTitle className="font-display">Edit {editingPerson?.name}</DialogTitle>
            <DialogDescription>Update the details</DialogDescription>
          </DialogHeader>
          {editingPerson && (
            <PersonForm
              person={editingPerson}
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
