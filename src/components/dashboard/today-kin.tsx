'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { asKin } from '@/core/types'
import { dateToKin, kinToSeal, kinToTone } from '@/lib/calculations/dreamspell'
import { calculateOracle } from '@/lib/calculations/oracle'
import { getSeal } from '@/lib/data/seals'
import { getTone } from '@/lib/data/tones'
import { generateMantra } from '@/lib/data/mantras'
import { kinToWavespell } from '@/lib/calculations/wavespell'
import { kinToCastle } from '@/lib/calculations/cycles'
import { getSealGlyphPath, getToneGlyphPath } from '@/lib/dreamspell-assets'
import { OracleMap } from '@/components/cards/OracleMap'
import { SealIcon } from '@/components/cards/SealIcon'

const COLOR_GRADIENT = {
  red: 'from-red-500/20 via-transparent to-transparent',
  white: 'from-white/10 via-transparent to-transparent',
  blue: 'from-blue-500/20 via-transparent to-transparent',
  yellow: 'from-yellow-500/20 via-transparent to-transparent',
} as const

const COLOR_ACCENT = {
  red: 'text-red-400',
  white: 'text-white/90',
  blue: 'text-blue-400',
  yellow: 'text-yellow-400',
} as const

const COLOR_GLOW = {
  red: 'shadow-red-500/20',
  white: 'shadow-white/10',
  blue: 'shadow-blue-500/20',
  yellow: 'shadow-yellow-500/20',
} as const

interface TodayKinProps {
  className?: string
  userKin?: number
}

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0]
}

export function TodayKin({ className, userKin }: TodayKinProps) {
  const data = useMemo(() => {
    const today = getTodayDateString()
    const kin = dateToKin(today)
    const seal = getSeal(kinToSeal(kin))
    const tone = getTone(kinToTone(kin))
    const oracle = calculateOracle(kin)
    const mantra = generateMantra(seal, tone)
    const wavespell = kinToWavespell(kin)
    const wavespellSeal = getSeal(wavespell.sealNumber)
    const castle = kinToCastle(kin)

    let relationship: { type: string; description: string } | null = null
    if (userKin) {
      const userKinBranded = asKin(userKin)
      const todaySealNum = kinToSeal(kin)
      const userOracle = calculateOracle(userKinBranded)

      if (todaySealNum === kinToSeal(userKinBranded)) {
        relationship = { type: 'Self', description: 'Today resonates with your core energy' }
      } else if (todaySealNum === userOracle.guide) {
        relationship = { type: 'Guide', description: 'A day of guidance and higher wisdom' }
      } else if (todaySealNum === userOracle.analog) {
        relationship = { type: 'Analog', description: 'A supportive and harmonious day' }
      } else if (todaySealNum === userOracle.antipode) {
        relationship = { type: 'Antipode', description: 'A day of challenge and growth' }
      } else if (todaySealNum === userOracle.occult) {
        relationship = { type: 'Occult', description: 'A day of hidden gifts and magic' }
      }
    }

    return { kin, seal, tone, oracle, mantra, wavespellSealName: wavespellSeal.english, castleName: castle.name, relationship }
  }, [userKin])

  const gradient = COLOR_GRADIENT[data.seal.color]
  const accent = COLOR_ACCENT[data.seal.color]
  const glow = COLOR_GLOW[data.seal.color]

  return (
    <div className={cn(
      'feature-card relative overflow-hidden',
      className,
    )}>
      {/* Background gradient based on seal color */}
      <div className={cn('absolute inset-0 bg-gradient-to-br pointer-events-none', gradient)} />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
          </span>
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Today&apos;s Galactic Signature
          </span>
        </div>

        {/* Main kin display */}
        <div className="flex items-start gap-4 mb-5">
          {/* Seal icon with glow */}
          <div className="relative shrink-0">
            <div className={cn(
              'absolute inset-0 rounded-full blur-xl opacity-40',
              data.seal.color === 'red' && 'bg-red-500',
              data.seal.color === 'white' && 'bg-white',
              data.seal.color === 'blue' && 'bg-blue-500',
              data.seal.color === 'yellow' && 'bg-yellow-500',
            )} />
            <img
              src={getSealGlyphPath(data.seal.number)}
              alt={data.seal.english}
              className={cn('w-16 h-16 object-contain relative z-10 drop-shadow-lg')}
            />
          </div>

          <div className="flex-1">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-foreground leading-tight">
              Kin <span className={cn('font-mono tabular-nums', accent)}>{data.kin}</span>
            </h2>
            <p className={cn('text-lg font-medium', accent)}>
              {data.tone.name} {data.seal.english}
            </p>
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground mt-1">
              {data.seal.mayan} · Tone {data.tone.number}
            </p>
          </div>

          <img
            src={getToneGlyphPath(data.tone.number)}
            alt={`Tone ${data.tone.number}`}
            className="w-12 h-12 object-contain opacity-80 shrink-0"
          />
        </div>

        {/* Oracle Cross */}
        <div className="mb-5">
          <OracleMap kin={data.kin} size="sm" />
        </div>

        {/* Mantra */}
        {data.mantra && (
          <blockquote className={cn(
            'text-sm italic text-muted-foreground border-l-2 pl-3 mb-5',
            data.seal.color === 'red' && 'border-red-500/40',
            data.seal.color === 'white' && 'border-white/30',
            data.seal.color === 'blue' && 'border-blue-500/40',
            data.seal.color === 'yellow' && 'border-yellow-500/40',
          )}>
            &ldquo;{data.mantra}&rdquo;
          </blockquote>
        )}

        {/* Context badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="secondary" className="text-xs">{data.wavespellSealName} Wavespell</Badge>
          <Badge variant="outline" className="text-xs">{data.castleName} Castle</Badge>
          <Badge variant="outline" className="text-xs">Tone {data.tone.number} · {data.tone.keywords.join(' · ')}</Badge>
        </div>

        {/* User relationship */}
        {data.relationship && (
          <div className={cn(
            'flex items-center gap-3 p-3 rounded-lg border transition-all',
            'bg-primary/5 border-primary/10',
            `shadow-sm ${glow}`,
          )}>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-sm text-foreground">Your {data.relationship.type} Day</p>
              <p className="text-xs text-muted-foreground">{data.relationship.description}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
