'use client'

import { useMemo } from 'react'
import { Zap } from 'lucide-react'
import { asKin } from '@pleiad/engine/core/types'
import { dateToKin, kinToSeal, kinToTone } from '@pleiad/engine/calculations/dreamspell'
import { calculateOracle } from '@pleiad/engine/calculations/oracle'
import { getSeal } from '@pleiad/engine/data/seals'
import { getTone } from '@pleiad/engine/data/tones'
import { generateMantra } from '@pleiad/engine/data/mantras'
import { kinToWavespell } from '@pleiad/engine/calculations/wavespell'
import { kinToCastle } from '@pleiad/engine/calculations/cycles'
import { cn } from '@/lib/utils'
import { Eyebrow, Pill } from '@/components/app-kit'
import { SEAL_COLORS, toSealColor, type SealColor } from '@/components/app-kit/seal-colors'
import { getSealGlyphPath, getToneGlyphPath } from '@/lib/dreamspell-assets'
import { OracleMap } from '@/components/cards/OracleMap'

/**
 * Seal-color washes resolve through the `--seal-*` tokens (via the
 * tailwind `seal-*` scale) — raw palette classes are banned. Literal
 * class strings are required here so the JIT can see them.
 */
const COLOR_GRADIENT: Record<SealColor, string> = {
  red: 'from-seal-red/15 via-transparent to-transparent',
  white: 'from-seal-white/[0.08] via-transparent to-transparent',
  blue: 'from-seal-blue/15 via-transparent to-transparent',
  yellow: 'from-seal-yellow/15 via-transparent to-transparent',
}

const COLOR_BORDER: Record<SealColor, string> = {
  red: 'border-seal-red/40',
  white: 'border-seal-white/30',
  blue: 'border-seal-blue/40',
  yellow: 'border-seal-yellow/40',
}

interface TodayKinProps {
  className?: string
  userKin?: number
  /**
   * Stable "now" from the page (created once after mount) so SSR and
   * client agree on the day. Falls back to render-time for old callers.
   */
  now?: Date
}

export function TodayKin({ className, userKin, now }: TodayKinProps) {
  const data = useMemo(() => {
    const today = (now ?? new Date()).toISOString().split('T')[0]
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
  }, [userKin, now])

  const sealColor = toSealColor(data.seal.color) ?? 'white'
  const spec = SEAL_COLORS[sealColor]

  return (
    <div className={cn(
      'feature-card relative overflow-hidden',
      className,
    )}>
      {/* Background wash from the seal-color token */}
      <div
        aria-hidden
        className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br', COLOR_GRADIENT[sealColor])}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="mb-5 flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75 motion-reduce:hidden" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
          </span>
          <Eyebrow>Today&apos;s Galactic Signature</Eyebrow>
        </div>

        {/* Main kin display */}
        <div className="mb-5 flex items-start gap-4">
          {/* Seal glyph with seal-token glow */}
          <div className="relative shrink-0">
            <div aria-hidden className={cn('absolute inset-0 rounded-full opacity-40 blur-xl', spec.bg)} />
            <img
              src={getSealGlyphPath(data.seal.number)}
              alt={data.seal.english}
              className="relative z-10 h-16 w-16 object-contain drop-shadow-lg"
            />
          </div>

          <div className="flex-1">
            <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-white/90 sm:text-4xl">
              Kin <span className={cn('font-mono [font-variant-numeric:tabular-nums]', spec.text)}>{data.kin}</span>
            </h2>
            <p className={cn('text-lg font-medium', spec.text)}>
              {data.tone.name} {data.seal.english}
            </p>
            <Eyebrow className="mt-1 block tracking-[0.14em]">
              {data.seal.mayan} · Tone {data.tone.number}
            </Eyebrow>
          </div>

          <img
            src={getToneGlyphPath(data.tone.number)}
            alt={`Tone ${data.tone.number}`}
            className="h-12 w-12 shrink-0 object-contain opacity-80"
          />
        </div>

        {/* Oracle Cross */}
        <div className="mb-5">
          <OracleMap kin={data.kin} size="sm" />
        </div>

        {/* Mantra */}
        {data.mantra && (
          <blockquote className={cn(
            'mb-5 border-l-2 pl-3 text-sm italic text-white/50',
            COLOR_BORDER[sealColor],
          )}>
            &ldquo;{data.mantra}&rdquo;
          </blockquote>
        )}

        {/* Context pills */}
        <div className="mb-4 flex flex-wrap gap-2">
          <Pill className="px-3 py-1">{data.wavespellSealName} Wavespell</Pill>
          <Pill className="px-3 py-1">{data.castleName} Castle</Pill>
          <Pill className="px-3 py-1">Tone {data.tone.number} · {data.tone.keywords.join(' · ')}</Pill>
        </div>

        {/* User relationship */}
        {data.relationship && (
          <div className="flex items-center gap-3 rounded-xl border border-primary/10 bg-primary/5 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.07]">
              <Zap className="size-4 text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-medium text-white/90">Your {data.relationship.type} Day</p>
              <p className="text-xs text-white/50">{data.relationship.description}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
