'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Pencil, Save, X } from 'lucide-react'
import { dateToKin, kinToSeal, kinToTone } from '@pleiad/engine/calculations/dreamspell'
import { getSeal } from '@pleiad/engine/data/seals'
import { getTone } from '@pleiad/engine/data/tones'
import { dateToTzolkin } from '@pleiad/engine/calculations/tzolkin'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/dashboard'
import {
  DataRow,
  EASE_OUT,
  Eyebrow,
  Notice,
  PageSection,
  SkeletonCard,
  StatNumber,
  StatWord,
  VIEWPORT_ONCE,
  getFlavor,
} from '@/components/app-kit'
import { SEAL_COLORS, toSealColor } from '@/components/app-kit/seal-colors'
import { cn } from '@/lib/utils'

export default function ProfilePage() {
  const { user, profile, updateProfile, loading: authLoading } = useAuth()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reduced = useReducedMotion()

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

  const dreamspell = getFlavor('dreamspell')
  const tzolkin = getFlavor('tzolkin')
  const sealColor = dreamspellSeal ? toSealColor(dreamspellSeal.color) : null

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

  const notSet = <span className="text-white/35">Not set</span>

  if (authLoading) {
    return <ProfileSkeleton />
  }

  return (
    <div className="max-w-2xl space-y-8">
      <PageHeader
        title="My Profile"
        subtitle="View and edit your personal details"
      />

      {/* Profile Info Card */}
      <motion.div
        className="surface-card p-6"
        initial={reduced ? false : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={VIEWPORT_ONCE}
        transition={{ duration: 0.5, ease: EASE_OUT as [number, number, number, number] }}
      >
        <div className="mb-4 flex items-center justify-between">
          <Eyebrow>Personal Details</Eyebrow>
          {!editing && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl active:scale-[0.98]"
              onClick={() => setEditing(true)}
            >
              <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hebrew_name">Hebrew Name</Label>
              <Input
                id="hebrew_name"
                value={formData.hebrew_name}
                onChange={(e) => setFormData(prev => ({ ...prev, hebrew_name: e.target.value }))}
                placeholder="Optional"
              />
            </div>

            {error && <Notice variant="error">{error}</Notice>}

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSave}
                disabled={loading}
                className="rounded-xl bg-brand text-white hover:bg-brand-soft active:scale-[0.98]"
              >
                <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="outline"
                className="rounded-xl active:scale-[0.98]"
                onClick={() => {
                  setEditing(false)
                  setFormData({
                    display_name: profile?.display_name || '',
                    birth_date: profile?.birth_date || '',
                    hebrew_name: profile?.hebrew_name || '',
                  })
                }}
              >
                <X className="mr-2 h-4 w-4" aria-hidden="true" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <DataRow label="Display Name" value={profile?.display_name || notSet} />
            <DataRow label="Email" value={user?.email || notSet} />
            <DataRow
              label="Birth Date"
              value={
                profile?.birth_date
                  ? new Date(profile.birth_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : notSet
              }
            />
            <DataRow label="Hebrew Name" value={profile?.hebrew_name || notSet} last />
          </div>
        )}
      </motion.div>

      {/* Symbolic readings */}
      {hasBirthDate && dreamspellKin && dreamspellSeal && dreamspellTone && tzolkinDay && (
        <div className="grid gap-8 sm:grid-cols-2">
          <PageSection
            index={1}
            accent={dreamspell.accent}
            eyebrow="Dreamspell · Galactic Signature"
          >
            <StatNumber
              value={`Kin ${dreamspellKin}`}
              label={`${dreamspellTone.name} ${dreamspellSeal.english}`}
            />

            <div className="flex items-center gap-4">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] p-2">
                <img
                  src={`/dreamspell/gifs/glyph${dreamspellSeal.number}.gif`}
                  alt={dreamspellSeal.english}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <div className="font-display text-lg font-medium text-white/90">
                  {dreamspellSeal.mayan}
                </div>
                <div className="text-sm text-white/70">{dreamspellSeal.english}</div>
                <div className="mt-1">
                  <Eyebrow accent={sealColor ? SEAL_COLORS[sealColor].css : undefined}>
                    {dreamspellSeal.color}
                  </Eyebrow>
                </div>
              </div>
            </div>
          </PageSection>

          <PageSection index={2} accent={tzolkin.accent} eyebrow="Tzolkin · Sacred Count">
            <StatWord
              value={`${tzolkinDay.tone} ${tzolkinDay.daySign.yucatec}`}
              label={tzolkinDay.daySign.english}
            />
          </PageSection>
        </div>
      )}
    </div>
  )
}

// Loading skeleton — layout-matched shimmer (no spinners, no stock Skeleton)
function ProfileSkeleton() {
  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <div className="skeleton-shimmer mb-2 h-8 w-40 rounded" />
        <div className="skeleton-shimmer h-4 w-56 rounded" />
      </div>

      {/* Profile card */}
      <div className="surface-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="skeleton-shimmer h-3 w-32 rounded" />
          <div className="skeleton-shimmer h-9 w-20 rounded-xl" />
        </div>
        <div>
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center justify-between py-3',
                i < 3 && 'border-b border-white/[0.07]'
              )}
            >
              <div className="skeleton-shimmer h-3 w-24 rounded" />
              <div className="skeleton-shimmer h-4 w-40 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Symbolic sections */}
      <div className="grid gap-8 sm:grid-cols-2">
        <SkeletonCard className="h-48" />
        <SkeletonCard className="h-48" />
      </div>
    </div>
  )
}
