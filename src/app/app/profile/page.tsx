'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-heading text-foreground">My Profile</h1>
        <p className="text-muted-foreground">
          View and edit your personal details
        </p>
      </div>

      {/* Profile Info Card */}
      <div className="earth-card bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-heading text-foreground">Personal Details</h2>
          {!editing && (
            <Button variant="outline" onClick={() => setEditing(true)}>
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
              <div className="text-sm text-destructive">{error}</div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {loading ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="outline" onClick={() => {
                setEditing(false)
                setFormData({
                  display_name: profile?.display_name || '',
                  birth_date: profile?.birth_date || '',
                  hebrew_name: profile?.hebrew_name || '',
                })
              }}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Display Name</div>
              <div className="font-medium text-foreground">{profile?.display_name}</div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="font-medium text-foreground">{user?.email}</div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Birth Date</div>
              <div className="font-medium text-foreground">
                {profile?.birth_date
                  ? new Date(profile.birth_date).toLocaleDateString('en-US')
                  : 'Not set'}
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Hebrew Name</div>
              <div className="font-medium text-foreground">
                {profile?.hebrew_name || 'Not set'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Symbolic Data Cards */}
      {hasBirthDate && dreamspellKin && dreamspellSeal && dreamspellTone && tzolkinDay && (
        <>
          <div className="earth-card bg-card p-6">
            <h2 className="text-xl font-heading text-foreground mb-2">Dreamspell</h2>
            <p className="text-sm text-muted-foreground mb-4">Your symbolic map according to the Dreamspell system</p>

            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Kin</div>
                <div className="text-2xl font-heading text-primary">Kin {dreamspellKin}</div>
                <div className="text-lg text-foreground">
                  {dreamspellTone.name} {dreamspellSeal.english}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <img
                  src={`/icons/dreamspell/seals/${String(dreamspellSeal.number).padStart(2, '0')}-${dreamspellSeal.english.toLowerCase().replace(' ', '-').replace('-', '-')}.svg`}
                  alt={dreamspellSeal.english}
                  className="h-16 w-16"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <div>
                  <div className="font-medium text-foreground">{dreamspellSeal.mayan}</div>
                  <div className="text-muted-foreground">{dreamspellSeal.english}</div>
                  <div className="text-sm capitalize" style={{ color: dreamspellSeal.color === 'white' ? '#666' : dreamspellSeal.color }}>
                    {dreamspellSeal.color}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="earth-card bg-card p-6">
            <h2 className="text-xl font-heading text-foreground mb-2">Tzolkin</h2>
            <p className="text-sm text-muted-foreground mb-4">Your symbolic map according to the traditional Tzolkin</p>

            <div className="space-y-4">
              <div>
                <div className="text-2xl font-heading text-primary">
                  {tzolkinDay.tone} {tzolkinDay.daySign.yucatec}
                </div>
                <div className="text-lg text-muted-foreground">
                  {tzolkinDay.daySign.english}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
