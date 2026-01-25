'use client'

import { useState, useEffect } from 'react'
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
    displayName: '',
    birthDate: '',
    hebrewName: '',
  })

  // Initialize form data when profile/user loads
  useEffect(() => {
    if (profile || user) {
      setFormData({
        displayName: profile?.display_name || user?.user_metadata?.full_name || '',
        birthDate: profile?.birth_date || '',
        hebrewName: profile?.hebrew_name || '',
      })
    }
  }, [profile, user])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (step === 1) {
        // Validate display name
        if (!formData.displayName.trim()) {
          setError('Please enter a display name')
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
          setError('Please enter your birth date')
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
      setError(err instanceof Error ? err.message : 'Error saving profile')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to Omnis</CardTitle>
          <CardDescription>
            {step === 1 && "Let's get to know you - what's your name?"}
            {step === 2 && 'When were you born?'}
            {step === 3 && 'Do you have a Hebrew name? (optional)'}
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
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Your name"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  required
                  autoFocus
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-2">
                <Label htmlFor="birthDate">Birth Date</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                  required
                  autoFocus
                  max={new Date().toISOString().split('T')[0]}
                />
                <p className="text-sm text-muted-foreground">
                  Birth date is required to calculate your symbolic maps
                </p>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-2">
                <Label htmlFor="hebrewName">Hebrew Name (optional)</Label>
                <Input
                  id="hebrewName"
                  type="text"
                  placeholder="Your Hebrew name"
                  value={formData.hebrewName}
                  onChange={(e) => setFormData(prev => ({ ...prev, hebrewName: e.target.value }))}
                  autoFocus
                />
                <p className="text-sm text-muted-foreground">
                  Hebrew name is used for Gematria calculations
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
                  Back
                </Button>
              )}
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Saving...' : step === 3 ? 'Finish' : 'Continue'}
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
                Skip
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
