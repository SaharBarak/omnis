'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

// System definitions
type SystemKey = 'dreamspell' | 'tzolkin' | 'longcount' | 'astrology' | 'humandesign' | 'gematria'

interface SystemInfo {
  key: SystemKey
  label: string
  labelHe: string
  icon: string
  description: string
  descriptionHe: string
  requiresTime?: boolean
  requiresLocation?: boolean
}

const SYSTEMS: SystemInfo[] = [
  {
    key: 'dreamspell',
    label: 'Dreamspell',
    labelHe: 'דרימספל',
    icon: '🌈',
    description: 'Modern Mayan calendar system by José Argüelles',
    descriptionHe: 'לוח השנה המאיה המודרני מבית חוסה ארגואיז',
  },
  {
    key: 'tzolkin',
    label: 'Tzolkin',
    labelHe: 'צולקין',
    icon: '🗓️',
    description: 'Traditional Mayan 260-day sacred calendar',
    descriptionHe: 'הלוח המאיה המסורתי בן 260 הימים',
  },
  {
    key: 'longcount',
    label: 'Long Count',
    labelHe: 'לונג קאונט',
    icon: '🏛️',
    description: 'Ancient Mayan long count calendar system',
    descriptionHe: 'מערכת הספירה הארוכה של המאיה העתיקים',
  },
  {
    key: 'astrology',
    label: 'Astrology',
    labelHe: 'אסטרולוגיה',
    icon: '⭐',
    description: 'Western natal chart astrology',
    descriptionHe: 'אסטרולוגיה מערבית - מפת לידה',
    requiresTime: true,
    requiresLocation: true,
  },
  {
    key: 'humandesign',
    label: 'Human Design',
    labelHe: 'עיצוב אנושי',
    icon: '🧬',
    description: 'Bodygraph analysis combining multiple systems',
    descriptionHe: 'ניתוח הבודיגרף המשלב מערכות רבות',
    requiresTime: true,
    requiresLocation: true,
  },
  {
    key: 'gematria',
    label: 'Gematria',
    labelHe: 'גימטריה',
    icon: '🔢',
    description: 'Hebrew numerology based on letter values',
    descriptionHe: 'נומרולוגיה עברית מבוססת ערכי אותיות',
  },
]

// Default system preferences - all enabled
const DEFAULT_PREFERENCES: Record<SystemKey, boolean> = {
  dreamspell: true,
  tzolkin: true,
  longcount: true,
  astrology: true,
  humandesign: true,
  gematria: true,
}

export interface SystemPreferences {
  enabledSystems: Record<SystemKey, boolean>
}

export default function SettingsPage() {
  const { profile, updateProfile, loading: authLoading } = useAuth()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Extract system preferences from profile
  const preferences = (profile?.preferences as { systems?: Record<SystemKey, boolean> } | null)?.systems ?? DEFAULT_PREFERENCES

  // Local state for toggles
  const [enabledSystems, setEnabledSystems] = useState<Record<SystemKey, boolean>>(DEFAULT_PREFERENCES)

  // Initialize from profile
  useEffect(() => {
    if (profile?.preferences) {
      const prefs = profile.preferences as { systems?: Record<SystemKey, boolean> }
      if (prefs.systems) {
        setEnabledSystems({ ...DEFAULT_PREFERENCES, ...prefs.systems })
      }
    }
  }, [profile])

  const handleToggle = (key: SystemKey, enabled: boolean) => {
    setEnabledSystems(prev => ({
      ...prev,
      [key]: enabled,
    }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const currentPrefs = (profile?.preferences as Record<string, unknown>) || {}
      await updateProfile({
        preferences: {
          ...currentPrefs,
          systems: enabledSystems,
        },
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Error saving preferences:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleResetDefaults = () => {
    setEnabledSystems(DEFAULT_PREFERENCES)
    setSaved(false)
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">טוען...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">הגדרות</h1>
        <p className="text-muted-foreground">
          התאם אישית את המערכות המוצגות
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>מערכות סימבוליות</CardTitle>
          <CardDescription>
            בחר אילו מערכות יוצגו בדף הפרופיל האישי
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {SYSTEMS.map((system) => (
            <div
              key={system.key}
              className="flex items-center justify-between py-3 border-b last:border-0"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{system.icon}</span>
                <div>
                  <Label htmlFor={system.key} className="text-base font-medium cursor-pointer">
                    {system.labelHe}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {system.descriptionHe}
                  </p>
                  {(system.requiresTime || system.requiresLocation) && (
                    <p className="text-xs text-amber-600 mt-1">
                      {system.requiresTime && system.requiresLocation && 'דורש שעת ומקום לידה לדיוק מלא'}
                      {system.requiresTime && !system.requiresLocation && 'דורש שעת לידה לדיוק מלא'}
                      {!system.requiresTime && system.requiresLocation && 'דורש מקום לידה לדיוק מלא'}
                    </p>
                  )}
                </div>
              </div>
              <Switch
                id={system.key}
                checked={enabledSystems[system.key]}
                onCheckedChange={(checked) => handleToggle(system.key, checked)}
              />
            </div>
          ))}

          <div className="flex items-center gap-4 pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'שומר...' : saved ? '✓ נשמר' : 'שמור שינויים'}
            </Button>
            <Button variant="outline" onClick={handleResetDefaults}>
              איפוס לברירת מחדל
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Future sections placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>הגדרות תצוגה</CardTitle>
          <CardDescription>
            עוד בקרוב...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            הגדרות נוספות יתווספו בגרסאות הבאות
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
