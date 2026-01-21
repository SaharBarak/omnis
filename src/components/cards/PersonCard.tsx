import { DreamspellSection } from './DreamspellSection'
import { TzolkinSection } from './TzolkinSection'

export interface PersonCardProps {
  name: string
  birthDate: string
}

export function PersonCard({ name, birthDate }: PersonCardProps) {
  return (
    <article
      className="person-card w-[148mm] h-[210mm] bg-card border rounded-lg shadow-sm flex flex-col p-6"
      dir="rtl"
    >
      {/* Header with name */}
      <header className="border-t-4 border-primary pt-4 mb-4">
        <h1 className="text-3xl font-bold text-center">{name}</h1>
      </header>

      {/* Dreamspell section - flexible height */}
      <DreamspellSection date={birthDate} />

      {/* Tzolkin section - fixed height */}
      <TzolkinSection date={birthDate} />
    </article>
  )
}
