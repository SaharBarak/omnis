import { asKin, type Kin, type SealNumber, type ToneNumber } from '../core/types'
import type { ColorFamily } from '../types/common'
import {
  dateToKin,
  kinToSeal,
  kinToTone,
  kinToWavespell,
  getWavespellPosition,
  getWavespellRole,
  kinToCastle,
  getCastle,
  getGalacticBirthday,
  getNextGalacticReturn,
  getGalacticReturns,
  getCurrentPersonalYear,
  getPersonalYear,
  getPersonalCyclePosition,
  calculatePersonalMayanDates,
  formatLongCount,
  type Wavespell,
  type Castle,
} from '../calculations'
import { getSeal, SEALS } from '../data/seals'
import { getTone, TONES } from '../data/tones'
import type {
  PredictionEvent,
  DailyPrediction,
  WeeklyPrediction,
  MonthlyPrediction,
  PersonalTimeline,
  PredictionIntensity,
  TimelineMilestone,
  GalacticReturnMilestone,
  TunBirthdayMilestone,
  KatunBirthdayMilestone,
  CalendarRoundMilestone,
  calculateIntensity,
} from '../types/prediction'

// ============================================================================
// Color Hex Values
// ============================================================================

const COLOR_HEX: Record<ColorFamily, string> = {
  red: '#EF4444',
  white: '#F5F5F5',
  blue: '#3B82F6',
  yellow: '#EAB308',
}

// ============================================================================
// Date Utilities
// ============================================================================

function formatDateStr(date: Date): string {
  return date.toISOString().split('T')[0]
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return formatDateStr(date)
}

function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
}

function getWeekStart(dateStr: string): string {
  const date = new Date(dateStr)
  const day = date.getDay()
  date.setDate(date.getDate() - day)
  return formatDateStr(date)
}

function getMonthStart(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-01`
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

// ============================================================================
// Calculate Intensity
// ============================================================================

const INTENSITY_WEIGHTS: Record<string, number> = {
  return: 10,
  'calendar-round': 10,
  'katun-birthday': 8,
  'yearly-kin': 6,
  castle: 5,
  'tun-birthday': 4,
  wavespell: 3,
  trecena: 3,
  'year-bearer': 4,
}

function calcIntensity(events: PredictionEvent[]): PredictionIntensity {
  const score = events.reduce((sum, event) => {
    return sum + (INTENSITY_WEIGHTS[event.type] || 1)
  }, 0)

  if (score >= 10) return 'peak'
  if (score >= 6) return 'high'
  if (score >= 3) return 'medium'
  return 'low'
}

// ============================================================================
// Daily Prediction
// ============================================================================

/**
 * Get daily prediction for a given date
 */
export function getDailyPrediction(dateStr: string): DailyPrediction {
  const kin = dateToKin(dateStr)
  const seal = kinToSeal(kin)
  const tone = kinToTone(kin)
  const sealData = getSeal(seal)
  const toneData = getTone(tone)

  const wavespellData = kinToWavespell(kin)
  const wavespellPosition = getWavespellPosition(kin)
  const wavespellSeal = getSeal(wavespellData.sealNumber)

  const castleData = kinToCastle(kin)
  const castlePosition = kin - castleData.startKin + 1

  // Check for transitions
  const isWavespellTransition = wavespellPosition.position === 1 || wavespellPosition.position === 13
  const isCastleTransition = castlePosition === 1 || castlePosition === 52

  // Generate events for the day
  const events: PredictionEvent[] = []

  // Wavespell transition event
  if (wavespellPosition.position === 1) {
    events.push({
      system: 'dreamspell',
      type: 'wavespell',
      startDate: dateStr,
      endDate: addDays(dateStr, 12),
      title: `${wavespellSeal.english} Wavespell Begins`,
      description: `Starting a new 13-day cycle focused on ${wavespellSeal.english} energy. Theme: Purpose.`,
      intensity: 'medium',
      themes: [wavespellSeal.english, 'New Cycle', 'Purpose'],
      data: {
        wavespellNumber: wavespellData.number,
        wavespellName: wavespellSeal.english,
        wavespellPosition: 1,
        wavespellRole: 'Purpose',
        kin,
        seal,
        tone,
        sealName: sealData.english,
        toneName: toneData.name,
        color: sealData.color,
      },
    })
  }

  // Castle transition event
  if (castlePosition === 1) {
    events.push({
      system: 'dreamspell',
      type: 'castle',
      startDate: dateStr,
      endDate: addDays(dateStr, 51),
      title: `${castleData.name} Begins`,
      description: `Entering the ${castleData.name}. Theme: ${castleData.theme}`,
      intensity: 'high',
      themes: [castleData.name, castleData.theme, 'Major Cycle'],
      data: {
        castleNumber: castleData.number,
        castleName: castleData.name,
        castleTheme: castleData.theme,
        kin,
        seal,
        tone,
        color: castleData.color as ColorFamily,
      },
    })
  }

  return {
    date: dateStr,
    kin: kin as number,
    seal,
    tone,
    sealName: sealData.english,
    toneName: toneData.name,
    color: sealData.color,
    colorHex: COLOR_HEX[sealData.color],
    wavespell: {
      number: wavespellData.number,
      name: wavespellSeal.english,
      day: wavespellPosition.position as number,
      role: wavespellPosition.dayName,
      isTransition: isWavespellTransition,
    },
    castle: {
      number: castleData.number,
      name: castleData.name,
      day: castlePosition,
      theme: castleData.theme,
      isTransition: isCastleTransition,
    },
    events,
    intensity: events.length > 0 ? calcIntensity(events) : 'low',
  }
}

// ============================================================================
// Weekly Prediction
// ============================================================================

/**
 * Get weekly prediction starting from a given date
 */
export function getWeeklyPrediction(startDate: string): WeeklyPrediction {
  const weekStart = getWeekStart(startDate)
  const weekEnd = addDays(weekStart, 6)

  const days: DailyPrediction[] = []
  let allEvents: PredictionEvent[] = []
  let wavespellTransitions = 0
  let castleTransitions = 0

  for (let i = 0; i < 7; i++) {
    const dayStr = addDays(weekStart, i)
    const daily = getDailyPrediction(dayStr)
    days.push(daily)
    allEvents = allEvents.concat(daily.events)

    if (daily.wavespell.isTransition && daily.wavespell.day === 1) {
      wavespellTransitions++
    }
    if (daily.castle.isTransition && daily.castle.day === 1) {
      castleTransitions++
    }
  }

  return {
    startDate: weekStart,
    endDate: weekEnd,
    days,
    events: allEvents,
    intensity: calcIntensity(allEvents),
    wavespellTransitions,
    castleTransitions,
  }
}

// ============================================================================
// Monthly Prediction
// ============================================================================

/**
 * Get monthly prediction for a given year and month
 */
export function getMonthlyPrediction(year: number, month: number): MonthlyPrediction {
  const daysInMonth = getDaysInMonth(year, month)
  const days: DailyPrediction[] = []
  let allEvents: PredictionEvent[] = []
  const highlights: PredictionEvent[] = []

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const daily = getDailyPrediction(dateStr)
    days.push(daily)
    allEvents = allEvents.concat(daily.events)

    // Add high/peak events to highlights
    daily.events.forEach((event) => {
      if (event.intensity === 'high' || event.intensity === 'peak') {
        highlights.push(event)
      }
    })
  }

  return {
    year,
    month,
    days,
    events: allEvents,
    intensity: calcIntensity(allEvents),
    highlights,
  }
}

// ============================================================================
// Date Range Prediction
// ============================================================================

/**
 * Get predictions for a date range
 */
export function getRangePredictions(startDate: string, endDate: string): DailyPrediction[] {
  const days: DailyPrediction[] = []
  const numDays = daysBetween(startDate, endDate) + 1

  for (let i = 0; i < numDays; i++) {
    const dateStr = addDays(startDate, i)
    days.push(getDailyPrediction(dateStr))
  }

  return days
}

// ============================================================================
// Personal Timeline
// ============================================================================

/**
 * Generate personal timeline with milestones for a person
 */
export function getPersonalTimeline(
  personId: string,
  personName: string,
  birthDate: string
): PersonalTimeline {
  const today = formatDateStr(new Date())
  const currentYear = new Date().getFullYear()

  // Birth kin
  const birthKin = dateToKin(birthDate)
  const birthSeal = kinToSeal(birthKin)
  const birthTone = kinToTone(birthKin)

  // Current personal year
  const personalYear = getCurrentPersonalYear(birthDate, today)
  const personalYearSeal = getSeal(personalYear.seal)

  // Get galactic returns (past and future)
  const galacticReturns = getGalacticReturns(birthDate, currentYear - 60, currentYear + 60)

  // Get personal mayan dates (tun and katun birthdays)
  const mayanDates = calculatePersonalMayanDates(birthDate)

  // Build milestones array
  const milestones: TimelineMilestone[] = []

  // Add galactic birthday this year and next year
  for (let yr = currentYear; yr <= currentYear + 2; yr++) {
    const gb = getGalacticBirthday(birthDate, yr)
    const isFuture = gb.date > today
    const daysUntil = isFuture ? daysBetween(today, gb.date) : undefined

    if (gb.isGalacticReturn) {
      milestones.push({
        type: 'return',
        date: gb.date,
        title: 'Galactic Return',
        description: `Your birthday kin matches your birth kin (Kin ${gb.kin}). A complete galactic cycle!`,
        intensity: 'peak',
        isFuture,
        daysUntil,
      })
    } else {
      milestones.push({
        type: 'yearly-kin',
        date: gb.date,
        title: `Galactic Birthday (Age ${personalYear.age + (yr - currentYear)})`,
        description: `Your galactic signature for this year: Kin ${gb.kin} - ${getTone(gb.tone).name} ${getSeal(gb.seal).english}`,
        intensity: 'high',
        isFuture,
        daysUntil,
      })
    }
  }

  // Convert galactic returns to milestones
  const galacticReturnMilestones: GalacticReturnMilestone[] = galacticReturns.map((gr, index) => {
    const isFuture = gr.date > today
    return {
      type: 'return' as const,
      date: gr.date,
      title: `Galactic Return #${index + 1}`,
      description: `Complete galactic cycle - your kin returns to ${gr.kin}`,
      intensity: 'peak' as const,
      isFuture,
      daysUntil: isFuture ? daysBetween(today, gr.date) : undefined,
      kin: gr.kin,
      returnNumber: index + 1,
      age: gr.year - new Date(birthDate).getFullYear(),
    }
  })

  // Convert tun birthdays to milestones
  const tunBirthdayMilestones: TunBirthdayMilestone[] = mayanDates.tunBirthdays.map((tun) => ({
    type: 'tun-birthday' as const,
    date: tun.gregorianDate,
    title: `Tun Birthday #${tun.tunNumber}`,
    description: `${tun.tunNumber * 360} days since birth (${tun.tunNumber} tuns)`,
    intensity: 'medium' as const,
    isFuture: tun.isFuture,
    daysUntil: tun.isFuture ? daysBetween(today, tun.gregorianDate) : undefined,
    tunNumber: tun.tunNumber,
    longCount: formatLongCount(tun.longCount),
  }))

  // Convert katun birthdays to milestones
  const katunBirthdayMilestones: KatunBirthdayMilestone[] = mayanDates.katunBirthdays.map((katun) => ({
    type: 'katun-birthday' as const,
    date: katun.gregorianDate,
    title: `Katun Birthday #${katun.katunNumber}`,
    description: `Major milestone: ${katun.katunNumber * 7200} days since birth (~${katun.ageAtKatun} years)`,
    intensity: 'high' as const,
    isFuture: katun.isFuture,
    daysUntil: katun.isFuture ? daysBetween(today, katun.gregorianDate) : undefined,
    katunNumber: katun.katunNumber,
    longCount: formatLongCount(katun.longCount),
    ageAtKatun: katun.ageAtKatun,
  }))

  // Calendar round return
  let nextCalendarRoundReturn: CalendarRoundMilestone | undefined
  if (mayanDates.nextCalendarRoundReturn) {
    const cr = mayanDates.nextCalendarRoundReturn
    nextCalendarRoundReturn = {
      type: 'calendar-round' as const,
      date: cr.gregorianDate,
      title: 'Calendar Round Return',
      description: `Your complete Tzolkin + Haab combination returns after ${cr.yearsFromBirth} years`,
      intensity: 'peak' as const,
      isFuture: true,
      daysUntil: daysBetween(today, cr.gregorianDate),
      longCount: formatLongCount(cr.longCount),
      yearsFromBirth: cr.yearsFromBirth,
    }
  }

  // Sort milestones by date
  milestones.sort((a, b) => a.date.localeCompare(b.date))

  return {
    personId,
    personName,
    birthDate,
    birthKin,
    currentPersonalYear: {
      kin: personalYear.kin,
      seal: personalYear.seal,
      tone: personalYear.tone,
      startDate: personalYear.startDate,
      endDate: personalYear.endDate,
      age: personalYear.age,
    },
    milestones,
    galacticReturns: galacticReturnMilestones,
    tunBirthdays: tunBirthdayMilestones,
    katunBirthdays: katunBirthdayMilestones,
    nextCalendarRoundReturn,
  }
}

// ============================================================================
// Personal Daily Prediction (with birth data context)
// ============================================================================

/**
 * Get personalized daily prediction considering birth data
 */
export function getPersonalDailyPrediction(
  dateStr: string,
  birthDate: string,
  personId?: string
): DailyPrediction {
  // Get base daily prediction
  const daily = getDailyPrediction(dateStr)

  // Check if this is the person's galactic birthday
  const { month: birthMonth, day: birthDay } = parseDateParts(birthDate)
  const { month: dateMonth, day: dateDay } = parseDateParts(dateStr)

  if (birthMonth === dateMonth && birthDay === dateDay) {
    const year = new Date(dateStr).getFullYear()
    const gb = getGalacticBirthday(birthDate, year)

    if (gb.isGalacticReturn) {
      daily.events.push({
        system: 'dreamspell',
        type: 'return',
        startDate: dateStr,
        endDate: dateStr,
        title: 'Galactic Return!',
        description: `Your birthday kin matches your birth kin. A complete galactic cycle of ~52 years!`,
        intensity: 'peak',
        themes: ['Galactic Return', 'Major Milestone', 'New Cycle'],
        data: {
          kin: gb.kin,
          seal: gb.seal,
          tone: gb.tone,
          sealName: getSeal(gb.seal).english,
          toneName: getTone(gb.tone).name,
          isGalacticReturn: true,
        },
      })
    } else {
      daily.events.push({
        system: 'dreamspell',
        type: 'yearly-kin',
        startDate: dateStr,
        endDate: addDays(dateStr, 364),
        title: 'Galactic Birthday',
        description: `Starting your new personal year as Kin ${gb.kin} - ${getTone(gb.tone).name} ${getSeal(gb.seal).english}`,
        intensity: 'high',
        themes: ['Galactic Birthday', 'Personal Year', 'New Cycle'],
        data: {
          kin: gb.kin,
          seal: gb.seal,
          tone: gb.tone,
          sealName: getSeal(gb.seal).english,
          toneName: getTone(gb.tone).name,
          personalYear: year - new Date(birthDate).getFullYear(),
        },
      })
    }

    // Recalculate intensity with new events
    daily.intensity = calcIntensity(daily.events)
  }

  return daily
}

// ============================================================================
// Helpers
// ============================================================================

function parseDateParts(dateStr: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateStr.split('-').map(Number)
  return { year, month, day }
}

// ============================================================================
// Exports
// ============================================================================

export {
  formatDateStr,
  addDays,
  daysBetween,
  getWeekStart,
  COLOR_HEX,
}
