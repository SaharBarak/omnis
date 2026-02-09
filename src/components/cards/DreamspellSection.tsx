import type { Kin } from '@/core/types'
import { dateToKin, kinToSeal, kinToTone } from '@/lib/calculations/dreamspell'
import { getSeal } from '@/lib/data/seals'
import { getTone } from '@/lib/data/tones'
import { OracleMap } from './OracleMap'
import { MantraDisplay } from './MantraDisplay'
import { SealIcon } from './SealIcon'
import { ToneIcon } from './ToneIcon'

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

  const kinNameEn = `${capitalizeFirstLetter(seal.color)} ${tone.name} ${seal.english}`
  const kinNameHe = `${seal.hebrew} ${tone.nameHebrew}`

  return (
    <section className="dreamspell-section flex-1 flex flex-col border-b pb-4">
      <h3 className="text-center text-sm font-medium text-muted-foreground mb-2">
        According to the Dreamspell
      </h3>

      {/* Seal + Tone glyphs */}
      <div className="flex items-center justify-center gap-3 mb-3">
        <SealIcon sealNumber={sealNumber} size="lg" />
        <ToneIcon toneNumber={toneNumber} size="lg" />
      </div>

      <div className="text-center mb-4">
        <div className="text-lg font-semibold">
          {kinNameEn} (Kin {kin})
        </div>
        <div className="text-base text-muted-foreground">
          {kinNameHe}
        </div>
      </div>

      <OracleMap kin={kin} />

      <MantraDisplay kin={kin} />
    </section>
  )
}
