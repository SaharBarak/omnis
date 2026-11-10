'use client'

import b from './birth-fields.module.css'
import { PlaceField } from './place-field'
import { Field } from '../site/field'
import type { BirthField } from '@/lib/atlas/birth-input'
import type { AtlasDraft } from '@/lib/atlas/use-atlas-draft'

/** The element id of one field, from the id the caller gives the set: a caller that moves focus to a field asks for it here. */
export const birthFieldId = (id: string, field: BirthField): string => `${id}-${field === 'hebrewName' ? 'hebrew' : field}`

type Layout = 'pair' | 'stack' | 'dense' | 'row'

const layoutOf = (compact: boolean, dense: boolean, row: boolean): Layout => (row ? 'row' : dense ? 'dense' : compact ? 'stack' : 'pair')

/**
 * Date, time, place and optional name for one person. Labels sit above their
 * inputs. `compact` stacks every field; `dense` pairs date and time and drops
 * the time hint, for a slot where the drawing already shows what is missing;
 * `row` sets date, time and place on one line, as a map's search bar, and
 * stacks them where the line is too narrow (with `dense`, it drops the hint
 * too, for a page whose steps already say the hour is optional).
 */
export function BirthFields({
  id,
  form,
  withName = false,
  compact = false,
  dense = false,
  row = false,
}: {
  readonly id: string
  readonly form: AtlasDraft
  readonly withName?: boolean
  readonly compact?: boolean
  readonly dense?: boolean
  readonly row?: boolean
}) {
  const { draft, errors, set } = form
  return (
    <div className={b.fields} data-layout={layoutOf(compact, dense, row)}>
      <Field
        id={birthFieldId(id, 'date')}
        label="Birth date"
        type="date"
        required
        value={draft.date}
        onChange={(e) => set('date', e.target.value)}
        error={errors.date}
      />
      <Field
        id={birthFieldId(id, 'time')}
        label="Birth time"
        type="time"
        value={draft.time}
        onChange={(e) => set('time', e.target.value)}
        hint={dense ? undefined : 'Optional. Without it the Moon is a range and there is no bodygraph.'}
        error={errors.time}
      />
      <div className={b.place}>
        <PlaceField id={birthFieldId(id, 'place')} value={draft.place} onChange={(place) => set('place', place)} error={errors.place} />
      </div>
      {withName && (
        <div className={b.wide}>
          <Field
            id={birthFieldId(id, 'name')}
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
