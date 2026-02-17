import type { Kin } from '@/core/types'
import { kinToSeal, kinToTone } from '@/lib/calculations/dreamspell'
import { getSeal } from '@/lib/data/seals'
import { getTone } from '@/lib/data/tones'
import { generateMantra } from '@/lib/data/mantras'
import { cn } from '@/lib/utils'

const COLOR_BORDER = {
  red: 'border-red-500/30',
  white: 'border-white/20',
  blue: 'border-blue-500/30',
  yellow: 'border-yellow-500/30',
} as const

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
      <blockquote className={cn(
        'text-sm italic text-muted-foreground whitespace-pre-line leading-relaxed',
        'border-l-2 pl-3 text-left',
        COLOR_BORDER[seal.color],
      )}>
        {mantra}
      </blockquote>
    </div>
  )
}
