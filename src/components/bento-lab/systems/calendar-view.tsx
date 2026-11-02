'use client'

import { useCallback, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { dateToKin, kinToSeal, kinToTone } from '@pleiad/engine/calculations/dreamspell'
import { thirteenMoonDate, thirteenMoonYear, type ThirteenMoonMonth } from '@pleiad/engine/calculations/thirteen-moon'
import { getWavespellKins, getWavespellPosition } from '@pleiad/engine/calculations/wavespell'
import { SEALS, getSeal } from '@pleiad/engine/data/seals'
import { TONES, getTone } from '@pleiad/engine/data/tones'
import { systemArt } from './art'
import s from './systems.module.css'
import { monthGrid, monthOf, shiftMonth } from './calendar-grid'
import { FigureCard, GridSkeleton, Readout, Segmented, SystemGrid, SystemPage, SystemSection, type SystemPageSpec } from './system-page'
import { useComputed, useToday } from './use-computed'
import kit from '../kit.module.css'
import { ErrorState, Skeleton } from '../site'
import site from '../site/site.module.css'
import { todayRows } from '@/lib/today-rows'
import { routeTitle } from '@/lib/site/routes'
import { SEAL_COLORS, toSealColor } from '@/components/app-kit/seal-colors'
import { sealGlyphSrc } from '@/lib/design/glyph-paths'
import { useSystemPreferences } from '@/lib/hooks/use-system-preferences'

export const CALENDAR_SPEC: SystemPageSpec = {
  path: '/app/calendar',
  title: routeTitle('/app/calendar'),
  eyebrow: 'Dreamspell count',
  lead: 'Every civil day with its Dreamspell kin, the wavespell it sits in and its 13-Moon date.',
  reads: `Reads the civil date. The kin runs 1 to ${SEALS.length * TONES.length}, ${TONES.length} tones over ${SEALS.length} seals, and skips 29 February. The 13-Moon year opens on 26 July.`,
  ...systemArt('/app/calendar'),
  article: 'history-of-dreamspell',
  guide: { slug: 'dreamspell', label: 'Dreamspell guide' },
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

type View = 'month' | 'moons'

const VIEWS: readonly { readonly id: View; readonly label: string }[] = [
  { id: 'month', label: 'Month' },
  { id: 'moons', label: '13 Moons' },
]

const sealDot = (sealNumber: number): string => SEAL_COLORS[toSealColor(getSeal(sealNumber).color) ?? 'red'].css

const longDate = (iso: string): string =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

const shortDate = (iso: string): string => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })

function Dot({ seal }: { readonly seal: number }) {
  return <span className={s.dot} style={{ ['--dot' as string]: sealDot(seal) }} aria-hidden />
}

function MonthGrid({ year, month, today, selected, onSelect }: { readonly year: number; readonly month: number; readonly today: string; readonly selected: string; readonly onSelect: (iso: string) => void }) {
  const cells = useMemo(() => monthGrid(year, month), [year, month])
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <div className={s.weekdays} aria-hidden>
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className={s.month}>
        {cells.map((c) => (
          <button
            key={c.iso}
            type="button"
            className={[s.day, c.inMonth ? '' : s.dayOut, c.iso === today ? s.dayToday : ''].join(' ')}
            aria-pressed={c.iso === selected}
            aria-label={`${longDate(c.iso)}, kin ${c.kin}`}
            onClick={() => onSelect(c.iso)}
          >
            <span className={s.dayNum}>{c.day}</span>
            <span className={s.dayKin}>
              <Dot seal={c.seal} />
              {c.kin}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function MoonRow({ moon, selected, onSelect }: { readonly moon: ThirteenMoonMonth; readonly selected: string; readonly onSelect: (iso: string) => void }) {
  return (
    <div className={s.moonRow}>
      <div className={s.moonHead}>
        <span>
          {moon.moon}. {moon.moonName} {moon.totem} Moon
        </span>
        <span className={s.muted}>
          {shortDate(moon.days[0].iso)} to {shortDate(moon.days[moon.days.length - 1].iso)}
        </span>
      </div>
      <div className={s.moonDays}>
        {moon.days.map((cell) => {
          const kin = dateToKin(cell.iso)
          return (
            <button key={cell.iso} type="button" className={s.moonDay} aria-pressed={cell.iso === selected} aria-label={`${longDate(cell.iso)}, kin ${kin}, ${moon.moonName} Moon day ${cell.dayOfMoon}`} onClick={() => onSelect(cell.iso)}>
              <Dot seal={kinToSeal(kin)} />
              {cell.dayOfMoon}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function dayDetail(iso: string) {
  const kin = dateToKin(iso)
  const seal = getSeal(kinToSeal(kin))
  const tone = getTone(kinToTone(kin))
  const ws = getWavespellPosition(kin)
  return { kin, seal, tone, ws, wsSeal: getSeal(ws.wavespell.sealNumber), wsKins: getWavespellKins(ws.wavespell.number), moonDay: thirteenMoonDate(iso) }
}

function TodayAcross() {
  const { enabledSystems, loading } = useSystemPreferences()
  const task = useCallback(async () => {
    const { getTodayAcrossSystems } = await import('@/lib/today-board')
    return getTodayAcrossSystems(new Date())
  }, [])
  const board = useComputed(task)
  if (board.status === 'error') {
    return (
      <ErrorState title="Today did not compute" action={<button type="button" className={`${site.btn} ${site.btnSmall}`} onClick={board.retry}>Try again</button>}>
        {board.error}
      </ErrorState>
    )
  }
  if (board.status !== 'ready' || loading) return <Skeleton height={260} />
  return <Readout columns title="Today across calendars" rows={todayRows(board.value, enabledSystems)} />
}

function Calendar({ today }: { readonly today: string }) {
  const [view, setView] = useState<View>('month')
  const [shown, setShown] = useState(() => monthOf(today))
  const [yearStart, setYearStart] = useState(() => thirteenMoonDate(today).yearStart)
  const [selected, setSelected] = useState(today)
  const moons = useMemo(() => thirteenMoonYear(yearStart), [yearStart])
  const detail = useMemo(() => dayDetail(selected), [selected])

  const step = (delta: number) => (view === 'month' ? setShown((m) => shiftMonth(m, delta)) : setYearStart((y) => y + delta))
  const jumpToday = () => {
    setShown(monthOf(today))
    setYearStart(thirteenMoonDate(today).yearStart)
    setSelected(today)
  }
  const heading =
    view === 'month'
      ? new Date(Date.UTC(shown.year, shown.month, 1)).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
      : `13-Moon year ${yearStart} to ${yearStart + 1}`

  return (
    <>
      <SystemGrid
        spec={CALENDAR_SPEC}
        figure={
          <FigureCard
            label="Calendar"
            actions={
              <>
                <h2 className={site.h3} aria-live="polite">
                  {heading}
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                  <Segmented label="Calendar view" options={VIEWS} value={view} onChange={setView} />
                  <button type="button" className={kit.iconButton} aria-label={view === 'month' ? 'Previous month' : 'Previous year'} onClick={() => step(-1)}>
                    <ChevronLeft size={16} aria-hidden />
                  </button>
                  <button type="button" className={kit.iconButton} aria-label={view === 'month' ? 'Next month' : 'Next year'} onClick={() => step(1)}>
                    <ChevronRight size={16} aria-hidden />
                  </button>
                  <button type="button" className={kit.pill} onClick={jumpToday}>
                    Today
                  </button>
                </div>
              </>
            }
          >
            {view === 'month' ? (
              <MonthGrid year={shown.year} month={shown.month} today={today} selected={selected} onSelect={setSelected} />
            ) : (
              <div className={s.moons}>
                {moons.map((m) => (
                  <MoonRow key={m.moon} moon={m} selected={selected} onSelect={setSelected} />
                ))}
              </div>
            )}
          </FigureCard>
        }
        side={
          <Readout
            title="Selected day"
            head={
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <img src={sealGlyphSrc(detail.seal.number, detail.seal.english)} alt="" className={`${kit.glyph} ${s.sealGlyph}`} />
                <div style={{ display: 'grid', gap: 2 }}>
                  <span className={s.tileValue}>Kin {detail.kin}</span>
                  <span className={s.tileText}>
                    {detail.tone.name} {detail.seal.english}
                  </span>
                </div>
              </div>
            }
            rows={[
              { label: 'Date', value: longDate(selected) },
              { label: 'Seal', value: `${detail.seal.number}. ${detail.seal.english}`, detail: `${detail.seal.mayan}, ${detail.seal.color} family` },
              { label: 'Tone', value: `${detail.tone.number}. ${detail.tone.name}`, detail: detail.tone.keywords.join(', ') },
              { label: 'Wavespell', value: `${detail.wsSeal.english}, day ${detail.ws.position} of ${detail.wsKins.length}`, detail: detail.ws.dayName },
              { label: '13-Moon', value: detail.moonDay.formatted },
            ]}
          />
        }
      />
      <SystemSection id="wavespell" title={`The ${detail.wsSeal.english} wavespell`} lead={`${detail.wsKins.length} days from kin ${detail.wsKins[0]} to kin ${detail.wsKins[detail.wsKins.length - 1]}. The selected day is outlined.`}>
        <div className={s.strip}>
          {detail.wsKins.map((k, i) => (
            <div key={k} className={`${s.stripCell} ${k === detail.kin ? s.stripCurrent : ''}`} title={`Kin ${k}`}>
              <Dot seal={kinToSeal(k)} />
              <span>{i + 1}</span>
              <span className={s.muted}>{k}</span>
            </div>
          ))}
        </div>
      </SystemSection>
      <SystemSection id="today" title="Today across calendars" lead="The rows follow the systems you keep on in settings.">
        <TodayAcross />
      </SystemSection>
    </>
  )
}

export function CalendarView() {
  const today = useToday('local')
  return <SystemPage spec={CALENDAR_SPEC}>{today ? <Calendar today={today} /> : <GridSkeleton spec={CALENDAR_SPEC} rows={5} />}</SystemPage>
}
