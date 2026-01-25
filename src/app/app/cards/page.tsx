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
          <h1 className="text-2xl font-bold">כרטיסים</h1>
          <p className="text-muted-foreground">
            {TEST_PEOPLE.length} כרטיסי A5 להדפסה
          </p>
        </div>
        <Button onClick={handlePrint} className="no-print">
          הדפס כרטיסים
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
