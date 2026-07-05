'use client'

import { CardGrid, PersonCard } from '@/components/cards'
import { EmptyState } from '@/components/dashboard'
import { usePeople } from '@/lib/hooks/use-people'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Printer } from 'lucide-react'

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
            <Skeleton className="h-9 w-32 mb-2" />
            <Skeleton className="h-5 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="aspect-[148/210] rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (people.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">Cards</h1>
          <p className="text-muted-foreground">Printable A5 cards for the people in your map</p>
        </div>
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
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">Cards</h1>
          <p className="text-muted-foreground">
            {people.length} A5 {people.length === 1 ? 'card' : 'cards'} for printing
          </p>
        </div>
        <Button onClick={handlePrint} className="no-print bg-primary hover:bg-primary/90 text-primary-foreground active:scale-[0.98]">
          <Printer className="w-4 h-4 mr-2" aria-hidden="true" />
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
