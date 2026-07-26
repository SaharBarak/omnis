import type { Kin, SealNumber, ToneNumber } from '../types/core'
import type { ColorFamily } from './common'

// ============================================================================
// Prediction System Types
// ============================================================================

/**
 * Systems that generate predictions
 */
export type PredictionSystem =
  | 'dreamspell'
  | 'tzolkin'
  | 'longcount'
  | 'astrology'
  | 'humandesign'

/**
 * Types of prediction events
 */
export type PredictionType =
  // Dreamspell types
  | 'wavespell'         // 13-day wavespell transitions
  | 'castle'            // 52-day castle transitions
  | 'yearly-kin'        // Galactic birthday, personal year
  | 'return'            // Galactic returns (~52 year cycle)
  // Tzolkin types
  | 'trecena'           // Traditional 13-day cycles
  | 'year-bearer'       // Mayan new year
  // Long count types
  | 'tun-birthday'      // 360-day cycle milestones
  | 'katun-birthday'    // ~19.7 year milestones
  | 'calendar-round'    // 52-year calendar round return
  // Other systems (future)
  | 'transit'           // Astrology transits
  | 'retrograde'        // Planetary retrogrades
  | 'hd-transit'        // Human Design transits

/**
 * Intensity levels for predictions
 */
export type PredictionIntensity = 'low' | 'medium' | 'high' | 'peak'

/**
 * A single prediction event
 */
export interface PredictionEvent {
  id?: string
  personId?: string
  system: PredictionSystem
  type: PredictionType
  startDate: string  // YYYY-MM-DD
  endDate: string    // YYYY-MM-DD
  title: string
  description: string
  intensity: PredictionIntensity
  themes: string[]
  data: PredictionEventData
  interpretation?: string
  computedAt?: string
  expiresAt?: string
}

/**
 * Specific data for different prediction types
 */
export interface PredictionEventData {
  // Dreamspell specific
  kin?: Kin
  seal?: SealNumber
  tone?: ToneNumber
  sealName?: string
  toneName?: string
  color?: ColorFamily

  // Wavespell data
  wavespellNumber?: number
  wavespellName?: string
  wavespellPosition?: number
  wavespellRole?: string

  // Castle data
  castleNumber?: number
  castleName?: string
  castleTheme?: string

  // Personal year data
  personalYear?: number
  age?: number
  cycleYear?: number
  totalCycles?: number

  // Galactic return data
  isGalacticReturn?: boolean
  returnNumber?: number

  // Long count data
  tunNumber?: number
  katunNumber?: number
  calendarRoundNumber?: number
  longCount?: string

  // Generic
  previousValue?: string | number
  currentValue?: string | number
  nextValue?: string | number
  transitionDate?: string
}

/**
 * Daily prediction summary
 */
export interface DailyPrediction {
  date: string
  kin: number
  seal: SealNumber
  tone: ToneNumber
  sealName: string
  toneName: string
  color: ColorFamily
  colorHex: string
  wavespell: {
    number: number
    name: string
    day: number
    role: string
    isTransition: boolean
  }
  castle: {
    number: number
    name: string
    day: number
    theme: string
    isTransition: boolean
  }
  events: PredictionEvent[]
  intensity: PredictionIntensity
}

/**
 * Weekly prediction summary
 */
export interface WeeklyPrediction {
  startDate: string
  endDate: string
  days: DailyPrediction[]
  events: PredictionEvent[]
  intensity: PredictionIntensity
  wavespellTransitions: number
  castleTransitions: number
}

/**
 * Monthly prediction summary
 */
export interface MonthlyPrediction {
  year: number
  month: number
  days: DailyPrediction[]
  events: PredictionEvent[]
  intensity: PredictionIntensity
  highlights: PredictionEvent[]
}

/**
 * Personal timeline with milestones
 */
export interface PersonalTimeline {
  personId: string
  personName: string
  birthDate: string
  birthKin: Kin

  // Current cycle info
  currentPersonalYear: {
    kin: Kin
    seal: SealNumber
    tone: ToneNumber
    startDate: string
    endDate: string
    age: number
  }

  // Upcoming milestones
  milestones: TimelineMilestone[]

  // Galactic returns
  galacticReturns: GalacticReturnMilestone[]

  // Long count milestones
  tunBirthdays: TunBirthdayMilestone[]
  katunBirthdays: KatunBirthdayMilestone[]

  // Next calendar round return
  nextCalendarRoundReturn?: CalendarRoundMilestone
}

/**
 * Generic timeline milestone
 */
export interface TimelineMilestone {
  type: PredictionType
  date: string
  title: string
  description: string
  intensity: PredictionIntensity
  isFuture: boolean
  daysUntil?: number
}

/**
 * Galactic return milestone
 */
export interface GalacticReturnMilestone extends TimelineMilestone {
  type: 'return'
  kin: Kin
  returnNumber: number
  age: number
}

/**
 * Tun birthday milestone
 */
export interface TunBirthdayMilestone extends TimelineMilestone {
  type: 'tun-birthday'
  tunNumber: number
  longCount: string
}

/**
 * Katun birthday milestone
 */
export interface KatunBirthdayMilestone extends TimelineMilestone {
  type: 'katun-birthday'
  katunNumber: number
  longCount: string
  ageAtKatun: number
}

/**
 * Calendar round milestone
 */
export interface CalendarRoundMilestone extends TimelineMilestone {
  type: 'calendar-round'
  longCount: string
  yearsFromBirth: number
}

// ============================================================================
// Intensity Calculation Weights
// ============================================================================

/**
 * Weights for calculating intensity score
 */
export const INTENSITY_WEIGHTS: Record<string, number> = {
  // Peak events (10)
  galactic_return: 10,
  calendar_round: 10,

  // High events (6-8)
  katun_birthday: 8,
  personal_year_start: 6,
  castle_transition: 5,

  // Medium events (3-4)
  wavespell_transition: 3,
  tun_birthday: 4,
  trecena_transition: 3,
  year_bearer: 4,

  // Low events (1-2)
  daily_kin: 1,
  portal_day: 2,
}

/**
 * Calculate intensity from event weights
 */
export function calculateIntensity(events: PredictionEvent[]): PredictionIntensity {
  const score = events.reduce((sum, event) => {
    const key = event.type.replace(/-/g, '_')
    return sum + (INTENSITY_WEIGHTS[key] || 1)
  }, 0)

  if (score >= 10) return 'peak'
  if (score >= 6) return 'high'
  if (score >= 3) return 'medium'
  return 'low'
}

// ============================================================================
// Notification Types
// ============================================================================

/**
 * Notification channel types
 */
export type NotificationChannel = 'in-app' | 'email' | 'sms'

/**
 * User notification settings
 */
export interface NotificationSettings {
  userId: string
  enabled: boolean
  channels: NotificationChannel[]
  dailyDigest: boolean
  dailyDigestTime: string  // HH:MM format
  weeklyDigest: boolean
  weeklyDigestDay: number  // 0-6 (Sunday-Saturday)
  advanceNotice: number    // 0-30 days
  systems: PredictionSystem[]
  minIntensity: PredictionIntensity
  createdAt?: string
  updatedAt?: string
}

/**
 * Default notification settings
 */
export const DEFAULT_NOTIFICATION_SETTINGS: Omit<NotificationSettings, 'userId'> = {
  enabled: true,
  channels: ['in-app'],
  dailyDigest: false,
  dailyDigestTime: '08:00',
  weeklyDigest: false,
  weeklyDigestDay: 0,
  advanceNotice: 1,
  systems: ['dreamspell', 'tzolkin'],
  minIntensity: 'medium',
}

// ============================================================================
// Calendar Export Types
// ============================================================================

/**
 * Calendar event for export
 */
export interface CalendarEvent {
  id?: string
  predictionId?: string
  title: string
  description: string
  startDate: string
  endDate: string
  allDay: boolean
  category?: string
}

/**
 * ICS calendar format data
 */
export interface ICSEvent {
  uid: string
  summary: string
  description: string
  dtstart: string
  dtend: string
  categories?: string[]
}

// ============================================================================
// AI Interpretation Types
// ============================================================================

/**
 * AI interpretation request
 */
export interface AIInterpretationRequest {
  prediction: PredictionEvent
  personContext?: {
    birthDate: string
    birthKin: Kin
    currentAge?: number
    personalYearKin?: Kin
  }
  locale?: 'en' | 'he'
}

/**
 * AI interpretation response
 */
export interface AIInterpretationResponse {
  interpretation: string
  themes: string[]
  affirmation?: string
  guidance?: string
  cachedAt?: string
  expiresAt?: string
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Generic prediction API response
 */
export interface PredictionAPIResponse<T> {
  success: boolean
  data?: T
  error?: string
  cached?: boolean
  computedAt?: string
}

/**
 * Daily prediction API response
 */
export interface DailyPredictionResponse extends PredictionAPIResponse<DailyPrediction> {}

/**
 * Weekly prediction API response
 */
export interface WeeklyPredictionResponse extends PredictionAPIResponse<WeeklyPrediction> {}

/**
 * Monthly prediction API response
 */
export interface MonthlyPredictionResponse extends PredictionAPIResponse<MonthlyPrediction> {}

/**
 * Timeline API response
 */
export interface TimelineResponse extends PredictionAPIResponse<PersonalTimeline> {}
