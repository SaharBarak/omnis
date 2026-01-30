'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type {
  DailyPrediction,
  WeeklyPrediction,
  MonthlyPrediction,
  PersonalTimeline,
  PredictionEvent,
  NotificationSettings,
} from '@/lib/types/prediction'
import {
  getDailyPrediction,
  getWeeklyPrediction,
  getMonthlyPrediction,
  getPersonalTimeline,
  getPersonalDailyPrediction,
  formatDateStr,
} from '@/lib/services/predictions'

// ============================================================================
// Hook Types
// ============================================================================

interface UsePredictionsOptions {
  birthDate?: string | null
  personId?: string
  personName?: string
}

interface UsePredictionsReturn {
  // Today's prediction
  today: DailyPrediction | null

  // Selected date prediction
  daily: DailyPrediction | null
  weekly: WeeklyPrediction | null
  monthly: MonthlyPrediction | null

  // Personal timeline
  timeline: PersonalTimeline | null

  // Navigation
  selectedDate: Date
  setSelectedDate: (date: Date) => void
  goToToday: () => void
  navigatePrev: (view: 'daily' | 'weekly' | 'monthly') => void
  navigateNext: (view: 'daily' | 'weekly' | 'monthly') => void

  // Loading states
  isLoading: boolean
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Hook for managing predictions state and navigation
 */
export function usePredictions(
  options: UsePredictionsOptions = {}
): UsePredictionsReturn {
  const { birthDate, personId, personName = 'You' } = options

  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isLoading, setIsLoading] = useState(false)

  // Calculate today's prediction
  const today = useMemo(() => {
    const dateStr = formatDateStr(new Date())
    return birthDate
      ? getPersonalDailyPrediction(dateStr, birthDate, personId)
      : getDailyPrediction(dateStr)
  }, [birthDate, personId])

  // Calculate daily prediction for selected date
  const daily = useMemo(() => {
    const dateStr = formatDateStr(selectedDate)
    return birthDate
      ? getPersonalDailyPrediction(dateStr, birthDate, personId)
      : getDailyPrediction(dateStr)
  }, [selectedDate, birthDate, personId])

  // Calculate weekly prediction
  const weekly = useMemo(() => {
    const dateStr = formatDateStr(selectedDate)
    return getWeeklyPrediction(dateStr)
  }, [selectedDate])

  // Calculate monthly prediction
  const monthly = useMemo(() => {
    return getMonthlyPrediction(selectedDate.getFullYear(), selectedDate.getMonth())
  }, [selectedDate])

  // Calculate personal timeline
  const timeline = useMemo(() => {
    if (!birthDate || !personId) return null
    return getPersonalTimeline(personId, personName, birthDate)
  }, [birthDate, personId, personName])

  // Navigation functions
  const goToToday = useCallback(() => {
    setSelectedDate(new Date())
  }, [])

  const navigatePrev = useCallback((view: 'daily' | 'weekly' | 'monthly') => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev)
      if (view === 'daily') {
        newDate.setDate(newDate.getDate() - 1)
      } else if (view === 'weekly') {
        newDate.setDate(newDate.getDate() - 7)
      } else {
        newDate.setMonth(newDate.getMonth() - 1)
      }
      return newDate
    })
  }, [])

  const navigateNext = useCallback((view: 'daily' | 'weekly' | 'monthly') => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev)
      if (view === 'daily') {
        newDate.setDate(newDate.getDate() + 1)
      } else if (view === 'weekly') {
        newDate.setDate(newDate.getDate() + 7)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }, [])

  return {
    today,
    daily,
    weekly,
    monthly,
    timeline,
    selectedDate,
    setSelectedDate,
    goToToday,
    navigatePrev,
    navigateNext,
    isLoading,
  }
}

// ============================================================================
// API-based Hooks (for server-side caching)
// ============================================================================

interface UseAPIPredicationsOptions {
  enabled?: boolean
}

/**
 * Hook for fetching predictions from API with caching
 */
export function useAPIPredictions(
  date: string,
  options: UseAPIPredicationsOptions = {}
) {
  const { enabled = true } = options
  const [data, setData] = useState<DailyPrediction | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) return

    async function fetchPrediction() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/predictions/daily?date=${date}`)
        const result = await response.json()

        if (result.success) {
          setData(result.data)
        } else {
          setError(result.error || 'Failed to fetch prediction')
        }
      } catch (err) {
        setError('Failed to fetch prediction')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPrediction()
  }, [date, enabled])

  return { data, isLoading, error }
}

/**
 * Hook for fetching personal timeline from API
 */
export function useAPITimeline(
  personId: string | null,
  options: UseAPIPredicationsOptions = {}
) {
  const { enabled = true } = options
  const [data, setData] = useState<PersonalTimeline | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !personId) return

    async function fetchTimeline() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/predictions/timeline/${personId}`)
        const result = await response.json()

        if (result.success) {
          setData(result.data)
        } else {
          setError(result.error || 'Failed to fetch timeline')
        }
      } catch (err) {
        setError('Failed to fetch timeline')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTimeline()
  }, [personId, enabled])

  return { data, isLoading, error }
}

// ============================================================================
// Notification Settings Hook
// ============================================================================

/**
 * Hook for managing notification settings
 */
export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch settings on mount
  useEffect(() => {
    async function fetchSettings() {
      setIsLoading(true)
      try {
        const response = await fetch('/api/notifications/settings')
        const result = await response.json()
        if (result.success) {
          setSettings(result.data)
        }
      } catch (err) {
        setError('Failed to load settings')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  // Save settings
  const saveSettings = useCallback(async (newSettings: NotificationSettings) => {
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      })
      const result = await response.json()

      if (result.success) {
        setSettings(result.data)
        return true
      } else {
        setError(result.error || 'Failed to save settings')
        return false
      }
    } catch (err) {
      setError('Failed to save settings')
      return false
    } finally {
      setIsSaving(false)
    }
  }, [])

  // Send test notification
  const sendTest = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
      })
      const result = await response.json()
      return result.success
    } catch {
      return false
    }
  }, [])

  return {
    settings,
    setSettings,
    saveSettings,
    sendTest,
    isLoading,
    isSaving,
    error,
  }
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook for getting upcoming events
 */
export function useUpcomingEvents(
  days: number = 7,
  birthDate?: string | null,
  personId?: string
): PredictionEvent[] {
  return useMemo(() => {
    const events: PredictionEvent[] = []
    const today = new Date()

    for (let i = 0; i < days; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      const dateStr = formatDateStr(date)

      const prediction = birthDate
        ? getPersonalDailyPrediction(dateStr, birthDate, personId)
        : getDailyPrediction(dateStr)

      events.push(...prediction.events)
    }

    return events
  }, [days, birthDate, personId])
}

/**
 * Hook for event intensity summary
 */
export function useIntensitySummary(
  startDate: string,
  endDate: string
): { low: number; medium: number; high: number; peak: number } {
  return useMemo(() => {
    const summary = { low: 0, medium: 0, high: 0, peak: 0 }
    const start = new Date(startDate)
    const end = new Date(endDate)

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = formatDateStr(d)
      const prediction = getDailyPrediction(dateStr)

      prediction.events.forEach((event) => {
        summary[event.intensity]++
      })
    }

    return summary
  }, [startDate, endDate])
}
