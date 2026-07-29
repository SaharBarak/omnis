'use client'

import { useMemo, useState } from 'react'
import type {
  UpcomingWorldHoliday,
  WorldDateParts,
} from '@pleiad/engine/calculations'
import { DataRow, Notice } from '@/components/app-kit'
import { Input } from '@/components/ui/input'

/**
 * Presentational blocks shared by the Intl-backed world-calendar pages
 * (#71: Hijri, Persian, Chinese). Each page keeps its own engine wiring and
 * SPEC prose; the hero / converter / holiday-list grammar lives here so the
 * three pages can't drift apart. Panchang and Long Count have their own
 * set pieces — different data shapes, same section slots.
 */

export function WorldTodayHero({
  parts,
  next,
  dayNote,
}: {
  parts: WorldDateParts | null
  next?: UpcomingWorldHoliday
  /** e.g. "the Hijri day began at sunset yesterday". */
  dayNote?: string
}) {
  const today = useMemo(() => new Date(), [])
  if (!parts) return <Notice variant="info">This device lacks calendar data for this system.</Notice>

  return (
    <div className="feature-card p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="font-display text-3xl tracking-tight text-brand-bright md:text-4xl">
            {parts.formatted}
          </div>
          <p className="mt-1 text-sm text-white/50">
            {today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {dayNote ? ` · ${dayNote}` : null}
          </p>
        </div>
        {next && (
          <div className="text-sm text-white/70">
            <span className="text-white/50">Next: </span>
            {next.holiday.name}
            <span className="text-white/50">
              {' '}
              ({next.calendarDate}) — {next.inDays === 0 ? 'today' : `in ${next.inDays} days`}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export function WorldConverter({
  convert,
  footnote,
}: {
  convert: (date: Date) => WorldDateParts | null
  footnote: string
}) {
  const [value, setValue] = useState(() => new Date().toISOString().split('T')[0])
  const converted = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
    return convert(new Date(`${value}T12:00:00Z`))
  }, [value, convert])

  return (
    <div className="surface-card p-5">
      <label htmlFor="world-date-in" className="mb-2 block text-sm text-white/70">
        Pick any civil date
      </label>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Input
          id="world-date-in"
          type="date"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-fit"
        />
        <div className="font-display text-xl tracking-tight text-brand-bright">
          {converted ? converted.formatted : '—'}
        </div>
      </div>
      <p className="mt-3 text-xs text-white/35">{footnote}</p>
    </div>
  )
}

export function WorldHolidays({ list }: { list: readonly UpcomingWorldHoliday[] }) {
  return (
    <div className="surface-card p-5">
      {list.map((h, i) => (
        <DataRow
          key={`${h.holiday.name}-${h.date}`}
          label={h.holiday.name}
          value={`${h.calendarDate} · ${new Date(`${h.date}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · ${h.inDays === 0 ? 'today' : `in ${h.inDays} days`}`}
          detail={h.holiday.note}
          last={i === list.length - 1}
        />
      ))}
    </div>
  )
}
