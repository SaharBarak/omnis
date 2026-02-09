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

interface TodayKinProps {
  className?: string
  /** User's kin number for relationship display */
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

    // Calculate relationship to user's kin if provided
    let relationship: { type: string; description: string } | null = null
    if (userKin) {
      const userKinBranded = asKin(userKin)
      const todaySealNum = kinToSeal(kin)
      const userSealNum = kinToSeal(userKinBranded)
      const userOracle = calculateOracle(userKinBranded)

      if (todaySealNum === userSealNum) {
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

    return {
      kin,
      seal,
      tone,
      mantra,
      wavespellSealName: wavespellSeal.english,
      castleName: castle.name,
      relationship,
    }
  }, [userKin])

  return (
    <div className={cn('feature-card', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
        </span>
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Today&apos;s Energy
        </span>
      </div>

      {/* Seal + Tone Glyphs */}
      <div className="flex items-center gap-3 mb-4">
        <img
          src={getSealGlyphPath(data.seal.number)}
          alt={data.seal.english}
          className="w-14 h-14 object-contain"
        />
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Kin <span className="text-primary">{data.kin}</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            {data.tone.name} {data.seal.english}
          </p>
        </div>
        <img
          src={getToneGlyphPath(data.tone.number)}
          alt={`Tone ${data.tone.number}`}
          className="w-10 h-10 object-contain ml-auto"
        />
      </div>

      {/* Mantra */}
      {data.mantra && (
        <blockquote className="text-sm italic text-muted-foreground border-l-2 border-primary/30 pl-3 mb-4">
          &ldquo;{data.mantra}&rdquo;
        </blockquote>
      )}

      {/* Context badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant="secondary">{data.wavespellSealName} Wavespell</Badge>
        <Badge variant="outline">{data.castleName} Castle</Badge>
      </div>

      {/* User relationship */}
      {data.relationship && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
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
  )
}
