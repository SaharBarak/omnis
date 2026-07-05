'use client'

import type { Kin } from '@/core/types'
import { dateToKin, kinToSeal, kinToTone } from '@/lib/calculations/dreamspell'
import { getSeal } from '@/lib/data/seals'
import { getTone } from '@/lib/data/tones'
import { OracleMap } from './OracleMap'
import { MantraDisplay } from './MantraDisplay'
import { WavespellDisplay } from './WavespellDisplay'
import { SealIcon } from './SealIcon'
import { ToneIcon } from './ToneIcon'
import { cn } from '@/lib/utils'

const COLOR_TEXT = {
  red: 'text-red-400',
  white: 'text-white/80',
  blue: 'text-blue-400',
  yellow: 'text-yellow-400',
} as const

const COLOR_BORDER = {
  red: 'border-red-500/30',
  white: 'border-white/20',
  blue: 'border-blue-500/30',
  yellow: 'border-yellow-500/30',
} as const

export interface DreamspellSectionProps {
  date: string
  showWavespell?: boolean
}

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function DreamspellSection({ date, showWavespell = true }: DreamspellSectionProps) {
  const kin: Kin = dateToKin(date)
  const sealNumber = kinToSeal(kin)
  const toneNumber = kinToTone(kin)
  const seal = getSeal(sealNumber)
  const tone = getTone(toneNumber)
  const colorText = COLOR_TEXT[seal.color]
  const colorBorder = COLOR_BORDER[seal.color]

  const kinNameEn = `${capitalizeFirstLetter(seal.color)} ${tone.name} ${seal.english}`
  const kinNameMayan = `${tone.name} ${seal.mayan}`

  return (
    <section className="dreamspell-section flex-1 flex flex-col border-b pb-4">
      <h3 className="text-center text-sm font-medium text-muted-foreground mb-3">
        According to the Dreamspell
      </h3>

      {/* Seal + Tone glyphs with glow effect */}
      <div className="flex items-center justify-center gap-4 mb-3">
        <div className="relative">
          <div className={cn(
            'absolute inset-0 rounded-full blur-lg opacity-30',
            seal.color === 'red' && 'bg-red-500',
            seal.color === 'white' && 'bg-white',
            seal.color === 'blue' && 'bg-blue-500',
            seal.color === 'yellow' && 'bg-yellow-500',
          )} />
          <SealIcon sealNumber={sealNumber} size="lg" className="relative z-10" />
        </div>
        <ToneIcon toneNumber={toneNumber} size="lg" className="opacity-90" />
      </div>

      <div className="text-center mb-5">
        <div className={cn('text-lg font-bold', colorText)}>
          {kinNameEn} <span className="text-muted-foreground font-normal">(Kin {kin})</span>
        </div>
        <div className="text-base text-muted-foreground">
          {kinNameMayan}
        </div>
        <div className="text-xs text-muted-foreground/60 mt-1">
          {tone.keywords.join(' · ')}
        </div>
      </div>

      {/* Oracle Cross */}
      <div className={cn('rounded-xl border p-4 mb-4', colorBorder, 'bg-black/20')}>
        <h4 className="text-center text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
          Oracle Cross
        </h4>
        <OracleMap kin={kin} size="md" />
      </div>

      {/* Wavespell */}
      {showWavespell && (
        <div className={cn('rounded-xl border p-4 mb-4', colorBorder, 'bg-black/20')}>
          <WavespellDisplay kin={kin} compact />
        </div>
      )}

      <MantraDisplay kin={kin} />
    </section>
  )
}
