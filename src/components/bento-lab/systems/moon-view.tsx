'use client'

import Link from 'next/link'
import { useCallback } from 'react'
import type { Lunation, MoonPhaseName, MoonReading } from '@pleiad/engine/calculations/moon'
import { systemArt } from './art'
import s from './systems.module.css'
import { FigureCard, GridSkeleton, PersonPicker, Readout, SystemGrid, SystemPage, SystemSection, type SystemPageSpec } from './system-page'
import { useComputed, useToday } from './use-computed'
import { useSystemPeople, type SavedPerson, type SystemStatus } from './use-system-people'
import kit from '../kit.module.css'
import { EmptyState, ErrorState, PrimaryAction, Skeleton } from '../site'
import { useAppHrefs } from '../site/site-tree'
import site from '../site/site.module.css'
import { MOON_PHASE_HINTS } from '@/lib/data/moon-phases'
import { routeTitle } from '@/lib/site/routes'
import { MoonGlyph } from '@/components/moon/moon-glyph'

export const MOON_SPEC: SystemPageSpec = {
  path: '/app/moon',
  title: routeTitle('/app/moon'),
  eyebrow: 'Lunar phase',
  lead: "Tonight's phase, and the phase each of your people was born under.",
  reads: "Reads the angle between Sun and Moon on a date: tonight's, and each saved person's birth date. The angle names the phase and how much of the disc is lit.",
  ...systemArt('/app/moon'),
  article: null,
  guide: null,
}

/** The shared phase hint, set as a sentence. */
const phaseHint = (phase: MoonPhaseName): string => {
  const hint = MOON_PHASE_HINTS[phase]
  return `${hint.charAt(0).toUpperCase()}${hint.slice(1)}`
}

interface Tonight {
  readonly lunation: Lunation
  readonly phases: readonly MoonPhaseName[]
}

type Births = ReadonlyMap<string, MoonReading>

const loadMoon = () => import('@pleiad/engine/calculations/moon')

const lit = (r: MoonReading): string => `${Math.round(r.illumination * 100)}% lit`
const days = (n: number): string => `${Math.round(n)} days`

function BornUnder({ status, people, data, births }: { readonly status: SystemStatus; readonly people: readonly SavedPerson[]; readonly data: Tonight; readonly births: Births | null }) {
  const hrefs = useAppHrefs()
  if (status.kind === 'loading' || (status.kind === 'ready' && !births)) {
    return (
      <div className={s.buckets}>
        {data.phases.map((p) => (
          <Skeleton key={p} height={120} />
        ))}
      </div>
    )
  }
  if (status.kind === 'error') {
    return (
      <ErrorState
        title="Your people did not load"
        action={
          <button type="button" className={`${site.btn} ${site.btnSmall}`} onClick={status.retry}>
            Try again
          </button>
        }
      >
        {status.message}
      </ErrorState>
    )
  }
  if (status.kind === 'no-people') {
    return (
      <EmptyState
        title="No saved people yet"
        action={
          <PrimaryAction href={hrefs.addPerson} intent="add" size="small">
            Add a person
          </PrimaryAction>
        }
      >
        Add people to see the moon each of them was born under.
      </EmptyState>
    )
  }
  return (
    <div className={s.buckets}>
      {data.phases.map((phase, index) => {
        const members = people.filter((p) => births?.get(p.person.id)?.phaseIndex === index)
        return (
          <div key={phase} className={`${s.tile} ${index === data.lunation.phaseIndex ? s.tileActive : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <MoonGlyph angle={index * (360 / data.phases.length)} size={30} />
              <div style={{ display: 'grid' }}>
                <strong style={{ fontSize: 15 }}>{phase}</strong>
                <span className={s.tileText}>{phaseHint(phase)}</span>
              </div>
            </div>
            {members.length === 0 ? (
              <span className={`${s.tileText} ${s.muted}`}>No one</span>
            ) : (
              <ul className={s.people}>
                {members.map((m) => {
                  const birth = births?.get(m.person.id)
                  return (
                    <li key={m.person.id}>
                      <Link href={hrefs.person(m.person.id)} className={kit.pill} title={birth ? lit(birth) : undefined}>
                        {m.person.is_self ? `${m.person.name} (you)` : m.person.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function MoonView({ requested = null }: { readonly requested?: string | null }) {
  const today = useToday('utc')
  const { status, people, selectedId, select } = useSystemPeople(null, requested)
  const tonightTask = useCallback(async (): Promise<Tonight> => {
    const { getLunation, MOON_PHASES } = await loadMoon()
    return { lunation: getLunation(today ?? ''), phases: MOON_PHASES }
  }, [today])
  const birthsTask = useCallback(async (): Promise<Births> => {
    const { getMoonReading } = await loadMoon()
    return new Map(people.map((p) => [p.person.id, getMoonReading(p.input.date)]))
  }, [people])
  const moon = useComputed(today ? tonightTask : null)
  const births = useComputed(people.length > 0 ? birthsTask : null)
  const birthMap = births.status === 'ready' ? births.value : null
  const selected = status.kind === 'ready' ? status.selected : null
  const selectedBirth = selected ? birthMap?.get(selected.person.id) : undefined

  return (
    <SystemPage spec={MOON_SPEC} picker={selected && <PersonPicker people={people} value={selectedId} onChange={select} />}>
      {moon.status === 'ready' ? (
        <>
          <SystemGrid
            spec={MOON_SPEC}
            figure={
              <FigureCard label="Tonight's moon">
                <div className={s.hero} style={{ alignItems: 'center' }}>
                  <MoonGlyph angle={moon.value.lunation.angle} size={168} />
                  <div className={s.heroText}>
                    <span className={site.label}>Tonight, {today}</span>
                    <span className={site.h2}>{moon.value.lunation.phase}</span>
                    <span className={s.tileText}>{phaseHint(moon.value.lunation.phase)}</span>
                  </div>
                </div>
                <ol className={s.cycle} aria-label="The lunar cycle" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {moon.value.phases.map((phase, index) => (
                    <li key={phase} className={`${s.phase} ${index === moon.value.lunation.phaseIndex ? s.phaseNow : ''}`} aria-current={index === moon.value.lunation.phaseIndex ? 'true' : undefined}>
                      <MoonGlyph angle={index * (360 / moon.value.phases.length)} size={28} />
                      {phase}
                    </li>
                  ))}
                </ol>
              </FigureCard>
            }
            side={
              <Readout
                title="Tonight"
                rows={[
                  { label: 'Phase', value: moon.value.lunation.phase, detail: lit(moon.value.lunation) },
                  { label: 'Next full moon', value: `In ${days(moon.value.lunation.daysToFull)}` },
                  { label: 'Next new moon', value: `In ${days(moon.value.lunation.daysToNew)}` },
                  ...(selected
                    ? [
                        {
                          label: 'Born under',
                          value: selectedBirth?.phase ?? 'Reading',
                          detail: selectedBirth ? `${selected.person.name}, ${selected.input.date}, ${lit(selectedBirth)}` : selected.person.name,
                        },
                      ]
                    : []),
                ]}
              />
            }
          />
          <SystemSection id="born-under" title="Born under" lead="Each saved person sits with the phase of their birth date. Tonight's phase is outlined.">
            <BornUnder status={status} people={people} data={moon.value} births={birthMap} />
          </SystemSection>
        </>
      ) : moon.status === 'error' ? (
        <SystemGrid
          spec={MOON_SPEC}
          figure={
            <ErrorState
              title="The moon did not compute"
              action={
                <button type="button" className={`${site.btn} ${site.btnSmall}`} onClick={moon.retry}>
                  Try again
                </button>
              }
            >
              {moon.error}
            </ErrorState>
          }
        />
      ) : (
        <GridSkeleton spec={MOON_SPEC} rows={4} />
      )}
    </SystemPage>
  )
}
