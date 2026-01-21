'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { dateToKin, kinToSeal, kinToTone } from '@/lib/calculations/dreamspell'
import { getSeal } from '@/lib/data/seals'
import { getTone } from '@/lib/data/tones'
import { dateToTzolkin } from '@/lib/calculations/tzolkin'
import { getTzolkinSign } from '@/lib/data/tzolkin-signs'

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
      setError(err instanceof Error ? err.message : 'שגיאה בעדכון הפרופיל')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">טוען...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">הפרופיל שלי</h1>
        <p className="text-muted-foreground">
          צפייה ועריכת הפרטים האישיים שלך
        </p>
      </div>

      {/* Profile Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>פרטים אישיים</CardTitle>
            {!editing && (
              <Button variant="outline" onClick={() => setEditing(true)}>
                ערוך
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="display_name">שם תצוגה</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth_date">תאריך לידה</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
                  dir="ltr"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hebrew_name">שם עברי</Label>
                <Input
                  id="hebrew_name"
                  value={formData.hebrew_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, hebrew_name: e.target.value }))}
                  placeholder="אופציונלי"
                />
              </div>

              {error && (
                <div className="text-sm text-destructive">{error}</div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? 'שומר...' : 'שמור'}
                </Button>
                <Button variant="outline" onClick={() => {
                  setEditing(false)
                  setFormData({
                    display_name: profile?.display_name || '',
                    birth_date: profile?.birth_date || '',
                    hebrew_name: profile?.hebrew_name || '',
                  })
                }}>
                  ביטול
                </Button>
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="text-sm text-muted-foreground">שם תצוגה</div>
                <div className="font-medium">{profile?.display_name}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">אימייל</div>
                <div className="font-medium" dir="ltr">{user?.email}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">תאריך לידה</div>
                <div className="font-medium">
                  {profile?.birth_date
                    ? new Date(profile.birth_date).toLocaleDateString('he-IL')
                    : 'לא הוגדר'}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">שם עברי</div>
                <div className="font-medium">
                  {profile?.hebrew_name || 'לא הוגדר'}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Symbolic Data Cards */}
      {hasBirthDate && dreamspellKin && dreamspellSeal && dreamspellTone && tzolkinDay && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>לפי הדרימספל</CardTitle>
              <CardDescription>המפה הסימבולית שלך לפי מערכת הדרימספל</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">קין</div>
                <div className="text-2xl font-bold">קין {dreamspellKin}</div>
                <div className="text-lg">
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
                  <div className="font-medium">{dreamspellSeal.mayan}</div>
                  <div className="text-muted-foreground">{dreamspellSeal.english}</div>
                  <div className="text-sm" style={{ color: dreamspellSeal.color }}>
                    {dreamspellSeal.color}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>לפי הצולקין</CardTitle>
              <CardDescription>המפה הסימבולית שלך לפי הצולקין המסורתי</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-2xl font-bold">
                  {tzolkinDay.tone} {tzolkinDay.daySign.yucatec}
                </div>
                <div className="text-lg text-muted-foreground">
                  {tzolkinDay.daySign.english}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
