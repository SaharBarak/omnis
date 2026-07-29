'use client'

import { useCallback, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  dateToKin,
  kinToSeal,
  kinToTone,
  getWavespellPosition,
  getWavespellKins,
  thirteenMoonDate,
  thirteenMoonYear,
  type ThirteenMoonMonth,
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
 * by seal family, grouped into wavespells on tap. The 13-Moon view lays the
 * same days out as the 13 × 28 ring instead — thirteen moons of four
 * radial weeks, with the Day Out of Time and Hunab Ku outside the count.
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

function MoonRow({
  moon,
  todayIso,
  selected,
  onSelect,
}: {
  moon: ThirteenMoonMonth
  todayIso: string
  selected: string
  onSelect: (iso: string) => void
}) {
  const first = moon.days[0].iso
  const last = moon.days[27].iso
  const range = `${new Date(`${first}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${new Date(`${last}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-white/70 [font-variant-numeric:tabular-nums]">
          {moon.moon} · {moon.moonName} {moon.totem} Moon
        </span>
        <span className="text-[11px] text-white/35">{range}</span>
      </div>
      <div className="grid grid-cols-[repeat(28,minmax(0,1fr))] gap-1 max-md:grid-cols-[repeat(14,minmax(0,1fr))]">
        {moon.days.map((cell) => {
          const kin = dateToKin(cell.iso)
          const seal = getSeal(kinToSeal(kin))
          const color = SEAL_COLORS[toSealColor(seal.color) ?? 'red']
          const isToday = cell.iso === todayIso
          const isSelected = cell.iso === selected
          return (
            <button
              key={cell.iso}
              type="button"
              onClick={() => onSelect(cell.iso)}
              aria-pressed={isSelected}
              aria-label={`${cell.iso}, Kin ${kin}, ${moon.moonName} Moon day ${cell.dayOfMoon}`}
              title={`${cell.iso} · Kin ${kin}`}
              className={cn(
                'flex h-9 flex-col items-center justify-center rounded-md border text-[10px] transition-colors active:scale-[0.98] [font-variant-numeric:tabular-nums]',
                isSelected
                  ? 'border-brand/60 bg-brand/15 text-white/90'
                  : isToday
                    ? 'border-brand/40 text-white/80'
                    : 'border-white/[0.07] text-white/50 hover:border-white/[0.12]'
              )}
            >
              <span aria-hidden className={cn('mb-0.5 size-1 rounded-full', color.bg)} />
              {cell.dayOfMoon}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function DreamspellCalendarPage() {
  const flavor = getFlavor('dreamspell')
  const todayIso = useMemo(() => localIso(new Date()), [])
  const [view, setView] = useState<'month' | 'year'>('month')
  const [anchor, setAnchor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [yearStart, setYearStart] = useState(
    () => thirteenMoonDate(localIso(new Date())).yearStart
  )
  const [selected, setSelected] = useState(todayIso)

  const cells = useMemo(() => monthGrid(anchor), [anchor])
  const moons = useMemo(() => thirteenMoonYear(yearStart), [yearStart])

  const moveMonth = useCallback((delta: number) => {
    setAnchor((a) => new Date(a.getFullYear(), a.getMonth() + delta, 1))
  }, [])

  const jumpToday = useCallback(() => {
    const now = new Date()
    setAnchor(new Date(now.getFullYear(), now.getMonth(), 1))
    setYearStart(thirteenMoonDate(localIso(now)).yearStart)
    setSelected(todayIso)
  }, [todayIso])

  const detail = useMemo(() => {
    const kin = dateToKin(selected)
    const seal = getSeal(kinToSeal(kin))
    const tone = getTone(kinToTone(kin))
    const ws = getWavespellPosition(kin)
    const wsKins = getWavespellKins(ws.wavespell.number)
    const wsSeal = getSeal(ws.wavespell.sealNumber)
    const moonDay = thirteenMoonDate(selected)
    return { kin, seal, tone, ws, wsKins, wsSeal, moonDay }
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

      <PageSection
        index={0}
        accent={flavor.accent}
        eyebrow={view === 'month' ? 'Month' : '13 Moons'}
      >
        <div className="surface-card p-4 md:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold tracking-tight text-white/90">
              {view === 'month'
                ? monthLabel
                : `${yearStart}–${yearStart + 1} ring`}
            </h2>
            <div className="flex items-center gap-2">
              <div
                role="group"
                aria-label="Calendar view"
                className="mr-1 flex overflow-hidden rounded-full border border-white/15"
              >
                {(['month', 'year'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setView(v)}
                    aria-pressed={view === v}
                    className={cn(
                      'px-3 py-1 font-sans text-[11px] font-medium uppercase tracking-[0.2em] transition-colors active:scale-[0.98]',
                      view === v
                        ? 'bg-brand/20 text-white/90'
                        : 'text-white/50 hover:text-white/70'
                    )}
                  >
                    {v === 'month' ? 'Month' : '13 Moons'}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={jumpToday}
                className="rounded-full border border-white/15 px-3 py-1 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-white/70 transition-colors hover:border-white/[0.25] active:scale-[0.98]"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() =>
                  view === 'month' ? moveMonth(-1) : setYearStart((y) => y - 1)
                }
                aria-label={view === 'month' ? 'Previous month' : 'Previous year'}
                className="flex size-8 items-center justify-center rounded-full border border-white/[0.07] text-white/70 transition-colors hover:border-white/[0.12] active:scale-[0.98]"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  view === 'month' ? moveMonth(1) : setYearStart((y) => y + 1)
                }
                aria-label={view === 'month' ? 'Next month' : 'Next year'}
                className="flex size-8 items-center justify-center rounded-full border border-white/[0.07] text-white/70 transition-colors hover:border-white/[0.12] active:scale-[0.98]"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          {view === 'month' ? (
            <>
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
            </>
          ) : (
            <div className="space-y-5">
              {moons.map((moon) => (
                <MoonRow
                  key={moon.moon}
                  moon={moon}
                  todayIso={todayIso}
                  selected={selected}
                  onSelect={setSelected}
                />
              ))}
              <p className="text-xs text-white/35">
                July 25 — the Day Out of Time — and Feb 29 (0.0 Hunab Ku) sit
                outside the 13 × 28 count; the ring runs July 26 to July 24.
              </p>
            </div>
          )}
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
              <DataRow label="Role" value={detail.ws.dayName} />
              <DataRow label="13-Moon" value={detail.moonDay.formatted} last />
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
