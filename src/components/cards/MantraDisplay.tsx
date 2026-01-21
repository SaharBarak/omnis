import type { Kin } from '@/core/types'
import { kinToSeal, kinToTone } from '@/lib/calculations/dreamspell'
import { getSeal } from '@/lib/data/seals'
import { getTone } from '@/lib/data/tones'
import { generateMantra } from '@/lib/data/mantras'

export interface MantraDisplayProps {
  kin: Kin
}

export function MantraDisplay({ kin }: MantraDisplayProps) {
  const sealNumber = kinToSeal(kin)
  const toneNumber = kinToTone(kin)
  const seal = getSeal(sealNumber)
  const tone = getTone(toneNumber)
  const mantra = generateMantra(seal, tone)

  return (
    <div className="mantra-display text-center p-4">
      <p className="text-sm italic text-muted-foreground whitespace-pre-line leading-relaxed">
        {mantra}
      </p>
    </div>
  )
}
