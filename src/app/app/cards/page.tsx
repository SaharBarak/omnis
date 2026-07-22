'use client'

import { Printer } from 'lucide-react'
import { CardGrid, PersonCard } from '@/components/cards'
import { EmptyState } from '@/components/dashboard'
import { usePeople } from '@/lib/hooks/use-people'
import { Button } from '@/components/ui/button'
import { Eyebrow } from '@/components/app-kit'

/** Page header — Eyebrow micro-caps over the display title. */
function CardsHeader({ subtitle }: { subtitle: string }) {
  return (
    <div>
      <Eyebrow className="mb-1.5 block">A5 Print Set</Eyebrow>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-white/90">
        Cards
      </h1>
      <p className="mt-0.5 text-white/50">{subtitle}</p>
    </div>
  )
}

export default function CardsPage() {
  const { people, loading } = usePeople()

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="skeleton-shimmer mb-2 h-3 w-24 rounded" />
            <div className="skeleton-shimmer mb-2 h-9 w-32 rounded" />
            <div className="skeleton-shimmer h-5 w-48 rounded" />
          </div>
          <div className="skeleton-shimmer h-10 w-32 rounded-xl" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton-shimmer aspect-[148/210] rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (people.length === 0) {
    return (
      <div className="space-y-6">
        <CardsHeader subtitle="Printable A5 cards for the people in your map" />
        <EmptyState
          icon="cards"
          title="No cards to print yet"
          description="Add people to your map and each one gets a printable card with their full symbolic reading."
          action={{ label: 'Add Your First Person', href: '/app/people' }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <CardsHeader
          subtitle={`${people.length} A5 ${people.length === 1 ? 'card' : 'cards'} for printing`}
        />
        <Button
          onClick={handlePrint}
          className="no-print rounded-xl bg-brand text-white hover:bg-brand-soft active:scale-[0.98]"
        >
          <Printer className="mr-2 h-4 w-4" aria-hidden="true" />
          Print Cards
        </Button>
      </div>

      <CardGrid>
        {people.map((person) => (
          <PersonCard
            key={person.id}
            name={person.name}
            birthDate={person.birth_date}
          />
        ))}
      </CardGrid>
    </div>
  )
}
