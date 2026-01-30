'use client'

import { CardGrid, PersonCard } from '@/components/cards'
import { TEST_PEOPLE } from '@/lib/data/people'
import { Button } from '@/components/ui/button'

export default function CardsPage() {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading text-foreground">Cards</h1>
          <p className="text-muted-foreground">
            {TEST_PEOPLE.length} A5 cards for printing
          </p>
        </div>
        <Button onClick={handlePrint} className="no-print bg-primary hover:bg-primary/90 text-primary-foreground">
          Print Cards
        </Button>
      </div>

      <CardGrid>
        {TEST_PEOPLE.map((person) => (
          <PersonCard
            key={person.name}
            name={person.name}
            birthDate={person.birthDate}
          />
        ))}
      </CardGrid>
    </div>
  )
}
