'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BirthTimeInput } from '@/components/ui/birth-time-input'
import { LocationPicker, type BirthPlace } from '@/components/ui/location-picker'
import { useAuth } from '@/lib/hooks/use-auth'
import type { Json } from '@/lib/supabase/database.types'

export default function OnboardingPage() {
  const router = useRouter()
  const { user, profile, updateProfile, loading: authLoading } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    displayName: '',
    birthDate: '',
    birthTime: null as string | null,
    birthPlace: null as BirthPlace | null,
    hebrewName: '',
  })

  // Initialize form data when profile/user loads
  useEffect(() => {
    if (profile || user) {
      setFormData({
        displayName: profile?.display_name || user?.name || '',
        birthDate: profile?.birth_date || '',
        birthTime: profile?.birth_time || null,
        birthPlace: profile?.birth_place as unknown as BirthPlace | null,
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

      if (step === 3) {
        // Birth time is optional, move to next step
        setStep(4)
        setLoading(false)
        return
      }

      if (step === 4) {
        // Birth place is optional, move to next step
        setStep(5)
        setLoading(false)
        return
      }

      // Final step - save profile and complete onboarding
      await updateProfile({
        display_name: formData.displayName,
        birth_date: formData.birthDate,
        birth_time: formData.birthTime,
        birth_place: formData.birthPlace ?? null,
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 flex items-center justify-center">
              <svg viewBox="0 0 32 32" className="w-7 h-7">
                <circle cx="16" cy="16" r="14" fill="none" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.3" />
                <circle cx="16" cy="16" r="9" fill="none" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.5" />
                <circle cx="16" cy="16" r="4" fill="hsl(var(--primary))" />
              </svg>
            </div>
            <span className="text-xl font-heading text-foreground">Omnis</span>
          </Link>
        </div>

        <div className="earth-card bg-card p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-heading text-foreground mb-2">Welcome to Omnis</h1>
            <p className="text-muted-foreground">
              {step === 1 && "Let's get to know you - what's your name?"}
              {step === 2 && 'When were you born?'}
              {step === 3 && 'What time were you born? (optional)'}
              {step === 4 && 'Where were you born? (optional)'}
              {step === 5 && 'Do you have a Hebrew name? (optional)'}
            </p>
          </div>

          {/* Progress */}
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-2 w-8 rounded-full transition-colors ${
                  s <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

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
                  className="h-11 bg-background border-border"
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
                  className="h-11 bg-background border-border"
                />
                <p className="text-sm text-muted-foreground">
                  Birth date is required to calculate your symbolic maps
                </p>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-2">
                <Label>Birth Time</Label>
                <BirthTimeInput
                  value={formData.birthTime}
                  onChange={(value) => setFormData(prev => ({ ...prev, birthTime: value }))}
                />
              </div>
            )}

            {step === 4 && (
              <div className="space-y-2">
                <Label>Birth Place</Label>
                <LocationPicker
                  value={formData.birthPlace}
                  onChange={(value) => setFormData(prev => ({ ...prev, birthPlace: value }))}
                />
              </div>
            )}

            {step === 5 && (
              <div className="space-y-2">
                <Label htmlFor="hebrewName">Hebrew Name (optional)</Label>
                <Input
                  id="hebrewName"
                  type="text"
                  placeholder="Your Hebrew name"
                  value={formData.hebrewName}
                  onChange={(e) => setFormData(prev => ({ ...prev, hebrewName: e.target.value }))}
                  autoFocus
                  className="h-11 bg-background border-border"
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
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {loading ? 'Saving...' : step === 5 ? 'Finish' : 'Continue'}
              </Button>
            </div>

            {(step === 3 || step === 4 || step === 5) && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (step === 3) {
                    setFormData(prev => ({ ...prev, birthTime: null }))
                  } else if (step === 4) {
                    setFormData(prev => ({ ...prev, birthPlace: null }))
                  } else if (step === 5) {
                    setFormData(prev => ({ ...prev, hebrewName: '' }))
                  }
                  handleSubmit(new Event('submit') as unknown as React.FormEvent)
                }}
                className="w-full text-muted-foreground"
                disabled={loading}
              >
                Skip
              </Button>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
