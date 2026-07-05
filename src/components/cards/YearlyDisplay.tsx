'use client'

import { Sparkles } from 'lucide-react'
import { SealIcon } from './SealIcon'
import type { Kin } from '@/core/types'
import { dateToKin, kinToSeal, kinToTone } from '@/lib/calculations/dreamspell'
import {
  getDreamspellYear,
  getGalacticBirthday,
  getCurrentPersonalYear,
  getPersonalCyclePosition,
  type DreamspellYear,
} from '@/lib/calculations/yearly'
import { getSeal } from '@/lib/data/seals'
import { getTone } from '@/lib/data/tones'
import { cn } from '@/lib/utils'

export interface DreamspellYearDisplayProps {
  year?: number
  className?: string
}

export function DreamspellYearDisplay({
  year = new Date().getFullYear(),
  className = '',
}: DreamspellYearDisplayProps) {
  const dreamspellYear = getDreamspellYear(year)
  const seal = getSeal(dreamspellYear.yearBearer.seal)
  const tone = getTone(dreamspellYear.yearBearer.tone)

  return (
    <div className={cn('dreamspell-year-display p-4 rounded-lg bg-muted/50', className)}>
      <h3 className="text-lg font-semibold text-center mb-3">
        Dreamspell Year
      </h3>

      <div className="flex items-center justify-center gap-4">
        <SealIcon sealNumber={dreamspellYear.yearBearer.seal} size="lg" />

        <div className="text-center">
          <p className="font-bold text-xl">
            {dreamspellYear.yearName}
          </p>
          <p className="text-muted-foreground">
            {tone.name} {seal.mayan}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Kin {dreamspellYear.yearBearer.kin}
          </p>
        </div>
      </div>

      <div className="mt-4 text-center text-sm text-muted-foreground">
        <p>
          {dreamspellYear.startDate} — {dreamspellYear.endDate}
        </p>
      </div>
    </div>
  )
}

export interface GalacticBirthdayDisplayProps {
  birthDate: string
  targetYear?: number
  className?: string
}

export function GalacticBirthdayDisplay({
  birthDate,
  targetYear = new Date().getFullYear(),
  className = '',
}: GalacticBirthdayDisplayProps) {
  const galacticBirthday = getGalacticBirthday(birthDate, targetYear)
  const seal = getSeal(galacticBirthday.seal)
  const tone = getTone(galacticBirthday.tone)
  const birthKin = dateToKin(birthDate)

  return (
    <div className={cn('galactic-birthday-display p-4 rounded-lg bg-muted/50', className)}>
      <h3 className="text-lg font-semibold text-center mb-3">
        Galactic Birthday
      </h3>

      <div className="flex items-center justify-center gap-4">
        <SealIcon sealNumber={galacticBirthday.seal} size="lg" />

        <div className="text-center">
          <p className="font-bold text-xl">
            {getSealColorName(galacticBirthday.seal)} {tone.name} {seal.english}
          </p>
          <p className="text-muted-foreground">
            {seal.mayan}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Kin {galacticBirthday.kin}
          </p>
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm">
          <span className="text-muted-foreground">Date: </span>
          <span className="font-medium">{galacticBirthday.date}</span>
        </p>

        {galacticBirthday.isGalacticReturn && (
          <div className="mt-2 p-2 bg-primary/20 rounded-lg">
            <p className="flex items-center gap-1.5 text-primary font-semibold text-sm">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Galactic Return!
            </p>
            <p className="text-xs text-muted-foreground">
              Your kin on this date matches your birth kin ({birthKin})
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export interface PersonalYearDisplayProps {
  birthDate: string
  currentDate?: string
  className?: string
}

export function PersonalYearDisplay({
  birthDate,
  currentDate = new Date().toISOString().split('T')[0],
  className = '',
}: PersonalYearDisplayProps) {
  const personalYear = getCurrentPersonalYear(birthDate, currentDate)
  const cyclePosition = getPersonalCyclePosition(birthDate, currentDate)
  const seal = getSeal(personalYear.seal)
  const tone = getTone(personalYear.tone)

  return (
    <div className={cn('personal-year-display p-4 rounded-lg bg-muted/50', className)}>
      <h3 className="text-lg font-semibold text-center mb-3">
        Personal Year
      </h3>

      <div className="flex items-center justify-center gap-4">
        <SealIcon sealNumber={personalYear.seal} size="lg" />

        <div className="text-center">
          <p className="font-bold text-xl">
            {getSealColorName(personalYear.seal)} {tone.name} {seal.english}
          </p>
          <p className="text-muted-foreground">
            {seal.mayan}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Kin {personalYear.kin} • Age {personalYear.age}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-center text-sm">
        <div className="p-2 bg-background rounded">
          <p className="text-muted-foreground">13-Year Cycle</p>
          <p className="font-semibold">
            Year {cyclePosition.cycleYear} of 13
          </p>
        </div>
        <div className="p-2 bg-background rounded">
          <p className="text-muted-foreground">Complete Cycles</p>
          <p className="font-semibold">
            {cyclePosition.totalCycles}
          </p>
        </div>
      </div>

      {/* 13-year cycle progress */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Year 1</span>
          <span>Year 13</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${((cyclePosition.cycleYear - 1) / 12) * 100}%` }}
          />
        </div>
        <p className="text-center text-xs text-muted-foreground mt-1">
          {cyclePosition.yearsUntilCycleEnd} years until cycle end
        </p>
      </div>
    </div>
  )
}

// Helper functions
function getSealColorName(sealNumber: number): string {
  const colors = ['Red', 'White', 'Blue', 'Yellow']
  return colors[(sealNumber - 1) % 4]
}
