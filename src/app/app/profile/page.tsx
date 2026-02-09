'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/dashboard'
import { Pencil, Save, X } from 'lucide-react'
import { dateToKin, kinToSeal, kinToTone } from '@/lib/calculations/dreamspell'
import { getSeal } from '@/lib/data/seals'
import { getTone } from '@/lib/data/tones'
import { dateToTzolkin } from '@/lib/calculations/tzolkin'

export default function ProfilePage() {
  const { user, profile, updateProfile, loading: authLoading } = useAuth()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    display_name: profile?.display_name || '',
    birth_date: profile?.birth_date || '',
    hebrew_name: profile?.hebrew_name || '',
  })

  // Calculate if profile has birth date
  const hasBirthDate = profile?.birth_date

  // Calculate Dreamspell and Tzolkin if birth date exists
  let dreamspellKin, dreamspellSeal, dreamspellTone, tzolkinDay
  if (hasBirthDate) {
    dreamspellKin = dateToKin(profile.birth_date!)
    dreamspellSeal = getSeal(kinToSeal(dreamspellKin))
    dreamspellTone = getTone(kinToTone(dreamspellKin))
    tzolkinDay = dateToTzolkin(profile.birth_date!)
  }

  const handleSave = async () => {
    setLoading(true)
    setError(null)

    try {
      await updateProfile({
        display_name: formData.display_name,
        birth_date: formData.birth_date || null,
        hebrew_name: formData.hebrew_name || null,
      })
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating profile')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return <ProfileSkeleton />
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="My Profile"
        subtitle="View and edit your personal details"
      />

      {/* Profile Info Card */}
      <div className="surface-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Personal Details</h2>
          {!editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                required
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth_date">Birth Date</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
                max={new Date().toISOString().split('T')[0]}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hebrew_name">Hebrew Name</Label>
              <Input
                id="hebrew_name"
                value={formData.hebrew_name}
                onChange={(e) => setFormData(prev => ({ ...prev, hebrew_name: e.target.value }))}
                placeholder="Optional"
                className="bg-background border-border"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-sm text-destructive">{error}</div>
            )}

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={() => {
                setEditing(false)
                setFormData({
                  display_name: profile?.display_name || '',
                  birth_date: profile?.birth_date || '',
                  hebrew_name: profile?.hebrew_name || '',
                })
              }}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Display Name</div>
              <div className="font-medium text-foreground">{profile?.display_name}</div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">Email</div>
              <div className="font-medium text-foreground">{user?.email}</div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">Birth Date</div>
              <div className="font-medium text-foreground">
                {profile?.birth_date
                  ? new Date(profile.birth_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                  : <span className="text-muted-foreground italic">Not set</span>}
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">Hebrew Name</div>
              <div className="font-medium text-foreground">
                {profile?.hebrew_name || <span className="text-muted-foreground italic">Not set</span>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Symbolic Data Cards */}
      {hasBirthDate && dreamspellKin && dreamspellSeal && dreamspellTone && tzolkinDay && (
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="surface-card p-6">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-1">Dreamspell</h2>
            <p className="text-xs text-muted-foreground mb-4">Galactic Signature</p>

            <div className="space-y-4">
              <div>
                <div className="text-3xl font-bold text-primary">Kin {dreamspellKin}</div>
                <div className="text-lg text-foreground">
                  {dreamspellTone.name} {dreamspellSeal.english}
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-border">
                <img
                  src={`/icons/dreamspell/seals/${String(dreamspellSeal.number).padStart(2, '0')}-${dreamspellSeal.english.toLowerCase().replace(' ', '-').replace('-', '-')}.svg`}
                  alt={dreamspellSeal.english}
                  className="h-14 w-14"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <div>
                  <div className="font-medium text-foreground">{dreamspellSeal.mayan}</div>
                  <div className="text-sm text-muted-foreground">{dreamspellSeal.english}</div>
                  <div className="text-xs capitalize mt-1" style={{ color: dreamspellSeal.color === 'white' ? '#666' : dreamspellSeal.color }}>
                    {dreamspellSeal.color}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="surface-card p-6">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-1">Tzolkin</h2>
            <p className="text-xs text-muted-foreground mb-4">Traditional Mayan Calendar</p>

            <div className="space-y-4">
              <div>
                <div className="text-3xl font-bold text-primary">
                  {tzolkinDay.tone} {tzolkinDay.daySign.yucatec}
                </div>
                <div className="text-lg text-muted-foreground">
                  {tzolkinDay.daySign.english}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Loading skeleton
function ProfileSkeleton() {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Profile card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-20" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <Skeleton className="h-3 w-24 mb-2" />
              <Skeleton className="h-5 w-40" />
            </div>
          ))}
        </div>
      </div>

      {/* Symbolic cards */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  )
}
