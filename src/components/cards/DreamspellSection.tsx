import type { Kin } from '@/core/types'
import { dateToKin, kinToSeal, kinToTone } from '@/lib/calculations/dreamspell'
import { getSeal } from '@/lib/data/seals'
import { getTone } from '@/lib/data/tones'
import { OracleMap } from './OracleMap'
import { MantraDisplay } from './MantraDisplay'

export interface DreamspellSectionProps {
  date: string
}

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function DreamspellSection({ date }: DreamspellSectionProps) {
  const kin: Kin = dateToKin(date)
  const sealNumber = kinToSeal(kin)
  const toneNumber = kinToTone(kin)
  const seal = getSeal(sealNumber)
  const tone = getTone(toneNumber)

  const kinName = `${capitalizeFirstLetter(seal.color)} ${tone.name} ${seal.english}`

  return (
    <section className="dreamspell-section flex-1 flex flex-col border-b pb-4">
      <h3 className="text-center text-sm font-medium text-muted-foreground mb-2">
        לפי הדרימספל / According to the Dreamspell
      </h3>

      <div className="text-center mb-4">
        <span className="text-lg font-semibold">
          {kinName} (Kin {kin})
        </span>
      </div>

      <OracleMap kin={kin} />

      <MantraDisplay kin={kin} />
    </section>
  )
}
