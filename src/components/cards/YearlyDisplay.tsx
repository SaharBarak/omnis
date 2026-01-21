'use client'

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
    <div className={cn('dreamspell-year-display p-4 rounded-lg bg-muted/50', className)} dir="rtl">
      <h3 className="text-lg font-semibold text-center mb-3">
        שנת הדרימספל / Dreamspell Year
      </h3>

      <div className="flex items-center justify-center gap-4">
        <SealIcon sealNumber={dreamspellYear.yearBearer.seal} size="lg" />

        <div className="text-center">
          <p className="font-bold text-xl">
            {seal.hebrew} {tone.nameHebrew}
          </p>
          <p className="text-muted-foreground">
            {dreamspellYear.yearName}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            קין {dreamspellYear.yearBearer.kin}
          </p>
        </div>
      </div>

      <div className="mt-4 text-center text-sm text-muted-foreground">
        <p>
          {formatDateHebrew(dreamspellYear.startDate)} — {formatDateHebrew(dreamspellYear.endDate)}
        </p>
        <p className="text-xs mt-1">
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
    <div className={cn('galactic-birthday-display p-4 rounded-lg bg-muted/50', className)} dir="rtl">
      <h3 className="text-lg font-semibold text-center mb-3">
        יום הולדת גלקטי / Galactic Birthday
      </h3>

      <div className="flex items-center justify-center gap-4">
        <SealIcon sealNumber={galacticBirthday.seal} size="lg" />

        <div className="text-center">
          <p className="font-bold text-xl">
            {seal.hebrew} {tone.nameHebrew}
          </p>
          <p className="text-muted-foreground">
            {getSealColorName(galacticBirthday.seal)} {tone.name} {seal.english}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            קין {galacticBirthday.kin}
          </p>
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm">
          <span className="text-muted-foreground">תאריך: </span>
          <span className="font-medium">{formatDateHebrew(galacticBirthday.date)}</span>
        </p>

        {galacticBirthday.isGalacticReturn && (
          <div className="mt-2 p-2 bg-primary/20 rounded-lg">
            <p className="text-primary font-semibold text-sm">
              🌟 חזרה גלקטית! / Galactic Return!
            </p>
            <p className="text-xs text-muted-foreground">
              הקין שלך בתאריך זה זהה לקין הלידה ({birthKin})
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
    <div className={cn('personal-year-display p-4 rounded-lg bg-muted/50', className)} dir="rtl">
      <h3 className="text-lg font-semibold text-center mb-3">
        השנה האישית / Personal Year
      </h3>

      <div className="flex items-center justify-center gap-4">
        <SealIcon sealNumber={personalYear.seal} size="lg" />

        <div className="text-center">
          <p className="font-bold text-xl">
            {seal.hebrew} {tone.nameHebrew}
          </p>
          <p className="text-muted-foreground">
            {getSealColorName(personalYear.seal)} {tone.name} {seal.english}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            קין {personalYear.kin} • גיל {personalYear.age}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-center text-sm">
        <div className="p-2 bg-background rounded">
          <p className="text-muted-foreground">מחזור 13 שנים</p>
          <p className="font-semibold">
            שנה {cyclePosition.cycleYear} מתוך 13
          </p>
        </div>
        <div className="p-2 bg-background rounded">
          <p className="text-muted-foreground">מחזורים שלמים</p>
          <p className="font-semibold">
            {cyclePosition.totalCycles}
          </p>
        </div>
      </div>

      {/* 13-year cycle progress */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>שנה 1</span>
          <span>שנה 13</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${((cyclePosition.cycleYear - 1) / 12) * 100}%` }}
          />
        </div>
        <p className="text-center text-xs text-muted-foreground mt-1">
          {cyclePosition.yearsUntilCycleEnd} שנים עד סוף המחזור
        </p>
      </div>
    </div>
  )
}

// Helper functions
function formatDateHebrew(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const months = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ]
  return `${day} ${months[month - 1]} ${year}`
}

function getSealColorName(sealNumber: number): string {
  const colors = ['Red', 'White', 'Blue', 'Yellow']
  return colors[(sealNumber - 1) % 4]
}
