'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/hooks/use-auth'

export default function OnboardingPage() {
  const router = useRouter()
  const { user, profile, updateProfile, loading: authLoading } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    displayName: profile?.display_name || user?.user_metadata?.full_name || '',
    birthDate: profile?.birth_date || '',
    hebrewName: profile?.hebrew_name || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (step === 1) {
        // Validate display name
        if (!formData.displayName.trim()) {
          setError('יש להזין שם תצוגה')
          setLoading(false)
          return
        }
        setStep(2)
        setLoading(false)
        return
      }

      if (step === 2) {
        // Validate birth date
        if (!formData.birthDate) {
          setError('יש להזין תאריך לידה')
          setLoading(false)
          return
        }
        setStep(3)
        setLoading(false)
        return
      }

      // Final step - save profile and complete onboarding
      await updateProfile({
        display_name: formData.displayName,
        birth_date: formData.birthDate,
        hebrew_name: formData.hebrewName || null,
        onboarding_completed: true,
      })

      router.push('/app')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשמירת הפרופיל')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">טוען...</div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">ברוכים הבאים ל-Omnis</CardTitle>
          <CardDescription>
            {step === 1 && 'בואו נכיר - מה שמך?'}
            {step === 2 && 'מתי נולדת?'}
            {step === 3 && 'האם יש לך שם עברי? (אופציונלי)'}
          </CardDescription>
          <div className="flex justify-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 w-8 rounded-full ${
                  s <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <div className="space-y-2">
                <Label htmlFor="displayName">שם תצוגה</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="השם שלך"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  required
                  autoFocus
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-2">
                <Label htmlFor="birthDate">תאריך לידה</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                  required
                  autoFocus
                  dir="ltr"
                  max={new Date().toISOString().split('T')[0]}
                />
                <p className="text-sm text-muted-foreground">
                  תאריך הלידה נדרש לחישוב המפות הסימבוליות
                </p>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-2">
                <Label htmlFor="hebrewName">שם עברי (אופציונלי)</Label>
                <Input
                  id="hebrewName"
                  type="text"
                  placeholder="השם העברי שלך"
                  value={formData.hebrewName}
                  onChange={(e) => setFormData(prev => ({ ...prev, hebrewName: e.target.value }))}
                  autoFocus
                />
                <p className="text-sm text-muted-foreground">
                  השם העברי משמש לחישובי גימטריה
                </p>
              </div>
            )}

            {error && (
              <div className="text-sm text-destructive text-center">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  disabled={loading}
                  className="flex-1"
                >
                  חזור
                </Button>
              )}
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'שומר...' : step === 3 ? 'סיום' : 'המשך'}
              </Button>
            </div>

            {step === 3 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setFormData(prev => ({ ...prev, hebrewName: '' }))
                  handleSubmit(new Event('submit') as unknown as React.FormEvent)
                }}
                className="w-full"
                disabled={loading}
              >
                דלג
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
