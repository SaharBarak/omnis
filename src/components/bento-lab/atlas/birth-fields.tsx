'use client'

import { PlaceField } from './place-field'
import { Field } from '../site/field'
import type { AtlasDraft } from '@/lib/atlas/use-atlas-draft'

/**
 * Date, time, place and optional name for one person. Labels sit above their
 * inputs. `compact` stacks every field; `dense` pairs date and time and drops
 * the time hint, for a slot where the drawing already shows what is missing.
 */
export function BirthFields({
  id,
  form,
  withName = false,
  compact = false,
  dense = false,
}: {
  readonly id: string
  readonly form: AtlasDraft
  readonly withName?: boolean
  readonly compact?: boolean
  readonly dense?: boolean
}) {
  const { draft, errors, set } = form
  const columns = compact && !dense ? 'minmax(0, 1fr)' : dense ? 'minmax(0, 1fr) minmax(0, 0.8fr)' : 'minmax(0, 1.2fr) minmax(0, 1fr)'
  return (
    <div style={{ display: 'grid', gap: dense ? 10 : 12, gridTemplateColumns: columns }}>
      <Field
        id={`${id}-date`}
        label="Birth date"
        type="date"
        required
        value={draft.date}
        onChange={(e) => set('date', e.target.value)}
        error={errors.date}
      />
      <Field
        id={`${id}-time`}
        label="Birth time"
        type="time"
        value={draft.time}
        onChange={(e) => set('time', e.target.value)}
        hint={dense ? undefined : 'Optional. Without it the Moon is a range and there is no bodygraph.'}
        error={errors.time}
      />
      <div style={{ gridColumn: '1 / -1' }}>
        <PlaceField id={`${id}-place`} value={draft.place} onChange={(place) => set('place', place)} error={errors.place} />
      </div>
      {withName && (
        <div style={{ gridColumn: '1 / -1' }}>
          <Field
            id={`${id}-name`}
            label="Full name"
            value={draft.name}
            onChange={(e) => set('name', e.target.value)}
            hint="Optional. Latin letters give the expression and soul numbers."
            autoComplete="name"
            error={errors.name}
          />
        </div>
      )}
    </div>
  )
}
