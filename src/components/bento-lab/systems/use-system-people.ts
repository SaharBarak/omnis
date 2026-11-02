'use client'

import { useMemo, useState } from 'react'
import { defaultPersonId } from './model'
import { planThatOpens } from '@/lib/site/plans'
import { birthInputOf } from '@/lib/atlas/app/saved-person'
import type { BirthInput } from '@/lib/atlas/types'
import { usePeople, type PersonWithTags } from '@/lib/hooks/use-people'
import { usePlan } from '@/lib/hooks/use-plan'
import type { PlanId } from '@/lib/site/plans'
import { SYSTEM_CATALOG, type SystemInfo, type SystemKey } from '@/lib/system-preferences'

/** A saved person whose stored birth date parses, with the birth data as the atlas reads it. */
export interface SavedPerson {
  readonly person: PersonWithTags
  readonly input: BirthInput
}

export type SystemStatus =
  | { readonly kind: 'loading' }
  | { readonly kind: 'error'; readonly message: string; readonly retry: () => void }
  | { readonly kind: 'locked'; readonly opensOn: PlanId | null; readonly planName: string }
  | { readonly kind: 'no-people' }
  | { readonly kind: 'ready'; readonly selected: SavedPerson }

export interface SystemPeople {
  readonly status: SystemStatus
  readonly people: readonly SavedPerson[]
  readonly selectedId: string | null
  readonly select: (id: string) => void
}

export const systemInfo = (key: SystemKey): SystemInfo => {
  const info = SYSTEM_CATALOG.find((s) => s.key === key)
  if (!info) throw new Error(`SYSTEM_CATALOG has no entry for ${key}`)
  return info
}

/**
 * Saved people for a system page, the person on screen, and the page state.
 * `requested` is a person id the server already checked for ownership (the
 * `?person=` link); without it the account's own person comes first.
 * A gated page stays loading until the plan resolves, so paid content never
 * flashes for a free account (the live LockedPage contract).
 */
export function useSystemPeople(gate: SystemKey | null, requested: string | null = null): SystemPeople {
  const { people, loading, error, fetchPeople } = usePeople()
  const plan = usePlan()
  const [chosen, setChosen] = useState<string | null>(requested)

  const saved = useMemo(
    () =>
      people.flatMap((person): SavedPerson[] => {
        const read = birthInputOf(person)
        return read.success ? [{ person, input: read.data }] : []
      }),
    [people],
  )

  const selectedId = saved.some((s) => s.person.id === chosen) ? chosen : defaultPersonId(saved.map((s) => s.person))
  const selected = saved.find((s) => s.person.id === selectedId) ?? null

  const status: SystemStatus = (() => {
    if (loading || (gate && plan.loading)) return { kind: 'loading' }
    if (gate && !plan.canUseSystem(gate)) return { kind: 'locked', opensOn: planThatOpens(gate), planName: plan.planName }
    if (error) return { kind: 'error', message: error, retry: () => void fetchPeople() }
    if (!selected) return { kind: 'no-people' }
    return { kind: 'ready', selected }
  })()

  return { status, people: saved, selectedId, select: setChosen }
}
