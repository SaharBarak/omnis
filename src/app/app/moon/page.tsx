'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { usePeople } from '@/lib/hooks/use-people'
import { getLunation, getMoonReading, MOON_PHASES } from '@/lib/calculations'
import { MoonGlyph } from '@/components/moon/moon-glyph'
import { Button } from '@/components/ui/button'

const PHASE_HINTS: Record<string, string> = {
  'New Moon': 'beginnings, intention-setting',
  'Waxing Crescent': 'momentum, first steps',
  'First Quarter': 'decision, friction, commitment',
  'Waxing Gibbous': 'refinement, persistence',
  'Full Moon': 'culmination, visibility',
  'Waning Gibbous': 'gratitude, sharing outward',
  'Last Quarter': 'release, course-correction',
  'Waning Crescent': 'rest, surrender, closure',
}

export default function MoonMapPage() {
  const { people, loading } = usePeople()

  const today = new Date().toISOString().split('T')[0]
  const lunation = useMemo(() => getLunation(today), [today])

  const readings = useMemo(
    () =>
      people.map((p) => ({
        person: p,
        moon: getMoonReading(p.birth_date),
      })),
    [people]
  )

  // Bucket people by natal phase, in cycle order.
  const buckets = useMemo(
    () =>
      MOON_PHASES.map((phase, index) => ({
        phase,
        index,
        members: readings.filter((r) => r.moon.phaseIndex === index),
      })),
    [readings]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading text-foreground">Moon Map</h1>
        <p className="text-muted-foreground">
          Tonight&apos;s moon, and the moon each of your people was born under
        </p>
      </div>

      {/* Current lunation */}
      <div className="earth-card bg-card p-6">
        <div className="flex flex-wrap items-center gap-6">
          <MoonGlyph angle={lunation.angle} size={96} />
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
              Tonight
            </p>
            <h2 className="text-2xl font-heading text-foreground">{lunation.phase}</h2>
            <p className="text-sm text-muted-foreground">
              {Math.round(lunation.illumination * 100)}% illuminated ·{' '}
              {PHASE_HINTS[lunation.phase]}
            </p>
          </div>
          <div className="ml-auto flex gap-6 text-sm">
            <div>
              <p className="text-muted-foreground">Next full</p>
              <p className="text-foreground font-semibold">
                {Math.round(lunation.daysToFull)}d
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Next new</p>
              <p className="text-foreground font-semibold">
                {Math.round(lunation.daysToNew)}d
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Natal phases of your people */}
      {people.length === 0 ? (
        <div className="earth-card bg-card flex flex-col items-center justify-center p-12 text-center">
          <p className="text-muted-foreground mb-4">
            Add people to see the moon each of them was born under
          </p>
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/app/people">+ Add People</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {buckets.map((bucket) => (
            <div
              key={bucket.phase}
              className={`earth-card bg-card p-4 ${
                bucket.index === lunation.phaseIndex ? 'ring-1 ring-primary/50' : ''
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <MoonGlyph angle={bucket.index * 45} size={36} />
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-sm">{bucket.phase}</h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {PHASE_HINTS[bucket.phase]}
                  </p>
                </div>
              </div>
              {bucket.members.length === 0 ? (
                <p className="text-xs text-muted-foreground/60">No one yet</p>
              ) : (
                <ul className="space-y-1.5">
                  {bucket.members.map(({ person, moon }) => (
                    <li key={person.id}>
                      <Link
                        href={`/app/people/${person.id}`}
                        className="flex items-center justify-between gap-2 text-sm text-foreground hover:text-primary transition-colors"
                      >
                        <span className="truncate">
                          {person.name}
                          {person.is_self && (
                            <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-primary">
                              You
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {Math.round(moon.illumination * 100)}%
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {bucket.index === lunation.phaseIndex && bucket.members.length > 0 && (
                <p className="mt-2 text-[11px] text-primary/80">
                  Tonight is their moon — born under the phase in the sky right now
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
