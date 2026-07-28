'use client'

import { useCallback, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  dateToKin,
  kinToSeal,
  kinToTone,
  getWavespellPosition,
  getWavespellKins,
} from '@pleiad/engine/calculations'
import { getSeal } from '@pleiad/engine/data/seals'
import { getTone } from '@pleiad/engine/data/tones'
import { SealIcon } from '@/components/cards/SealIcon'
import { PageHeader } from '@/components/dashboard'
import { DataRow, Eyebrow, PageSection, getFlavor } from '@/components/app-kit'
import { SEAL_COLORS, toSealColor } from '@/components/app-kit/seal-colors'
import { cn } from '@/lib/utils'

/**
 * Dreamspell calendar (#59) — the full month-at-a-glance kin calendar the
 * 13:20 Sync app popularized: every Gregorian day carries its kin, colored
 * by seal family, grouped into wavespells on tap.
 */

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

/** Local-timezone YYYY-MM-DD (the calendar is a civil-date surface). */
function localIso(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

interface DayCell {
  readonly iso: string
  readonly day: number
  readonly kin: number
  readonly sealNumber: number
  readonly inMonth: boolean
}

/** Sunday-first grid covering the whole displayed month. */
function monthGrid(anchor: Date): DayCell[] {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const start = new Date(first)
  start.setDate(1 - first.getDay())
  const cells: DayCell[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    const iso = localIso(d)
    const kin = dateToKin(iso)
    cells.push({
      iso,
      day: d.getDate(),
      kin,
      sealNumber: kinToSeal(kin),
      inMonth: d.getMonth() === anchor.getMonth(),
    })
  }
  // Drop a trailing all-outside week so short months stay five rows.
  const lastWeek = cells.slice(35)
  return lastWeek.every((c) => !c.inMonth) ? cells.slice(0, 35) : cells
}

function DayButton({
  cell,
  isToday,
  isSelected,
  onSelect,
}: {
  cell: DayCell
  isToday: boolean
  isSelected: boolean
  onSelect: (iso: string) => void
}) {
  const seal = getSeal(cell.sealNumber)
  const color = SEAL_COLORS[toSealColor(seal.color) ?? 'red']
  return (
    <button
      type="button"
      onClick={() => onSelect(cell.iso)}
      aria-pressed={isSelected}
      aria-label={`${cell.iso}, Kin ${cell.kin}`}
      className={cn(
        'group relative flex min-h-[60px] flex-col items-start gap-1 rounded-lg border p-2 text-left transition-colors active:scale-[0.98] md:min-h-[72px]',
        isSelected
          ? 'border-brand/60 bg-brand/10'
          : 'border-white/[0.07] hover:border-white/[0.12]',
        !cell.inMonth && 'opacity-35'
      )}
    >
      <span
        className={cn(
          'text-xs',
          isToday
            ? 'flex size-5 items-center justify-center rounded-full bg-brand text-[11px] text-white'
            : 'text-white/50'
        )}
      >
        {cell.day}
      </span>
      <span className="flex items-center gap-1.5">
        <span aria-hidden className={cn('size-1.5 rounded-full', color.bg)} />
        <span className="text-[11px] text-white/70 [font-variant-numeric:tabular-nums]">
          {cell.kin}
        </span>
      </span>
    </button>
  )
}

export default function DreamspellCalendarPage() {
  const flavor = getFlavor('dreamspell')
  const todayIso = useMemo(() => localIso(new Date()), [])
  const [anchor, setAnchor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selected, setSelected] = useState(todayIso)

  const cells = useMemo(() => monthGrid(anchor), [anchor])

  const moveMonth = useCallback((delta: number) => {
    setAnchor((a) => new Date(a.getFullYear(), a.getMonth() + delta, 1))
  }, [])

  const jumpToday = useCallback(() => {
    const now = new Date()
    setAnchor(new Date(now.getFullYear(), now.getMonth(), 1))
    setSelected(todayIso)
  }, [todayIso])

  const detail = useMemo(() => {
    const kin = dateToKin(selected)
    const seal = getSeal(kinToSeal(kin))
    const tone = getTone(kinToTone(kin))
    const ws = getWavespellPosition(kin)
    const wsKins = getWavespellKins(ws.wavespell.number)
    const wsSeal = getSeal(ws.wavespell.sealNumber)
    return { kin, seal, tone, ws, wsKins, wsSeal }
  }, [selected])

  const monthLabel = anchor.toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dreamspell Calendar"
        subtitle="Every day carries a kin — the 260-day galactic count laid over the civil month"
      />

      <PageSection index={0} accent={flavor.accent} eyebrow="Month">
        <div className="surface-card p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold tracking-tight text-white/90">
              {monthLabel}
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={jumpToday}
                className="rounded-full border border-white/15 px-3 py-1 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-white/70 transition-colors hover:border-white/[0.25] active:scale-[0.98]"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => moveMonth(-1)}
                aria-label="Previous month"
                className="flex size-8 items-center justify-center rounded-full border border-white/[0.07] text-white/70 transition-colors hover:border-white/[0.12] active:scale-[0.98]"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => moveMonth(1)}
                aria-label="Next month"
                className="flex size-8 items-center justify-center rounded-full border border-white/[0.07] text-white/70 transition-colors hover:border-white/[0.12] active:scale-[0.98]"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1 md:gap-2">
            {WEEKDAYS.map((d) => (
              <span
                key={d}
                className="px-2 font-sans text-[10px] font-medium uppercase tracking-[0.15em] text-white/35"
              >
                {d}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {cells.map((cell) => (
              <DayButton
                key={cell.iso}
                cell={cell}
                isToday={cell.iso === todayIso}
                isSelected={cell.iso === selected}
                onSelect={setSelected}
              />
            ))}
          </div>
        </div>
      </PageSection>

      <PageSection index={1} accent={flavor.accent} eyebrow="Selected day">
        <div className="feature-card p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-10">
            <div className="flex shrink-0 items-center gap-4">
              <SealIcon sealNumber={detail.seal.number} size="lg" />
              <div>
                <div className="font-display text-3xl tracking-tight text-brand-bright [font-variant-numeric:tabular-nums]">
                  Kin {detail.kin}
                </div>
                <div className="text-sm text-white/70">
                  {detail.tone.name} {detail.seal.english}
                </div>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <DataRow
                label="Date"
                value={new Date(`${selected}T12:00:00`).toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              />
              <DataRow
                label="Wavespell"
                value={`${detail.wsSeal.english} · ${detail.ws.position} of 13`}
              />
              <DataRow label="Role" value={detail.ws.dayName} last />
            </div>
          </div>

          <div className="mt-6">
            <Eyebrow accent={flavor.accent}>
              {detail.wsSeal.english} wavespell
            </Eyebrow>
            <div className="mt-2 grid grid-cols-[repeat(13,minmax(0,1fr))] gap-1 max-md:grid-cols-7">
              {detail.wsKins.map((wsKin, i) => {
                const wsKinSeal = getSeal(kinToSeal(wsKin))
                const color = SEAL_COLORS[toSealColor(wsKinSeal.color) ?? 'red']
                const isCurrent = wsKin === detail.kin
                return (
                  <div
                    key={wsKin}
                    title={`Kin ${wsKin}`}
                    className={cn(
                      'flex h-9 flex-col items-center justify-center rounded-md border text-[10px] [font-variant-numeric:tabular-nums]',
                      isCurrent
                        ? 'border-brand/60 bg-brand/15 text-white/90'
                        : 'border-white/[0.07] text-white/50'
                    )}
                  >
                    <span aria-hidden className={cn('mb-0.5 size-1 rounded-full', color.bg)} />
                    {i + 1}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </PageSection>
    </div>
  )
}
