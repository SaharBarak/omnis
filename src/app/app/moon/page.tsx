'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { getLunation, getMoonReading, MOON_PHASES } from '@pleiad/engine/calculations'
import { usePeople } from '@/lib/hooks/use-people'
import { MoonGlyph } from '@/components/moon/moon-glyph'
import { PageHeader, EmptyState } from '@/components/dashboard'
import { DataRow, Eyebrow, PageSection, SkeletonCard } from '@/components/app-kit'
import { COLORS } from '@/lib/design/landing-tokens'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

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

/** Tabular-mono numeral for DataRow values. */
function Mono({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono [font-variant-numeric:tabular-nums]">{children}</span>
  )
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Moon Map"
        subtitle="Tonight's moon, and the moon each of your people was born under"
      />

      {/* Tonight's lunation — the set piece */}
      <PageSection index={0} accent={COLORS.brand} eyebrow="Tonight">
        <div className="feature-card p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-10">
            <MoonGlyph angle={lunation.angle} size={140} className="mx-auto shrink-0 md:mx-0" />
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-white/90 md:text-3xl">
                {lunation.phase}
              </h2>
              <p className="mt-1 text-sm text-white/50">{PHASE_HINTS[lunation.phase]}</p>
              <div className="mt-4">
                <DataRow
                  label="Illumination"
                  value={<Mono>{Math.round(lunation.illumination * 100)}%</Mono>}
                />
                <DataRow
                  label="Next full moon"
                  value={<Mono>{Math.round(lunation.daysToFull)} days</Mono>}
                />
                <DataRow
                  label="Next new moon"
                  value={<Mono>{Math.round(lunation.daysToNew)} days</Mono>}
                  last
                />
              </div>
            </div>
          </div>
        </div>
      </PageSection>

      {/* Natal phases of your people */}
      <PageSection index={1} accent={COLORS.brand} eyebrow="Born under">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {MOON_PHASES.map((phase) => (
              <SkeletonCard key={phase} className="h-32" />
            ))}
          </div>
        ) : people.length === 0 ? (
          <div className="surface-card">
            <EmptyState
              icon="people"
              title="No one on your map yet"
              description="Add people to see the moon each of them was born under"
              action={{ label: 'Add people', href: '/app/people' }}
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {buckets.map((bucket) => {
              const isTonight = bucket.index === lunation.phaseIndex
              return (
                <div
                  key={bucket.phase}
                  className={cn('surface-card p-4', isTonight && '!border-brand/40')}
                >
                  <div className="flex items-center gap-3">
                    <MoonGlyph angle={bucket.index * 45} size={32} className="shrink-0" />
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-sm font-semibold tracking-tight text-white/90">
                        {bucket.phase}
                      </h3>
                      <Eyebrow className="block truncate text-[10px] tracking-[0.15em]">
                        {PHASE_HINTS[bucket.phase]}
                      </Eyebrow>
                    </div>
                  </div>

                  {bucket.members.length === 0 ? (
                    <p className="mt-3 text-xs text-white/35">No one yet</p>
                  ) : (
                    <div className="mt-2 divide-y divide-white/[0.07] border-t border-white/[0.07]">
                      {bucket.members.map(({ person, moon }) => (
                        <Link
                          key={person.id}
                          href={`/app/people/${person.id}`}
                          className="flex items-center gap-3 py-2.5 transition-colors hover:bg-white/[0.03] active:scale-[0.98]"
                        >
                          <Avatar className="size-8 shrink-0 rounded-full">
                            <AvatarImage
                              src={person.avatar_url || undefined}
                              alt={person.name}
                            />
                            <AvatarFallback className="rounded-full bg-brand/15 text-xs font-medium text-brand-soft">
                              {person.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="min-w-0 flex-1 truncate text-sm text-white/90">
                            {person.name}
                          </span>
                          {person.is_self && (
                            <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.15em] text-brand-soft">
                              You
                            </span>
                          )}
                          <span className="shrink-0 font-mono text-xs text-white/50 [font-variant-numeric:tabular-nums]">
                            {Math.round(moon.illumination * 100)}%
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {isTonight && bucket.members.length > 0 && (
                    <p className="mt-3 text-[11px] leading-relaxed text-brand-soft">
                      Tonight is their moon, born under the phase in the sky right now
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </PageSection>
    </div>
  )
}
