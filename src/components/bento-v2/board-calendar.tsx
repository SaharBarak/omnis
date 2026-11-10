'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import c from './board-calendar.module.css'
import { BoardMarkView } from './board-mark'
import f from './frame/frame.module.css'
import { beat } from '@/components/bento-lab/motion/loops'
import { cellKeys, type CalendarCell, type CalendarHead, type CalendarSection, type CalendarView, type LegendEntry } from '@/lib/boards/types'
import { TYPE_VOICES, voiceCssVars } from '@/lib/design/type-voice'

/** The calendar's text levels as custom properties (BENTO_TYPE.md, "The board"). */
const VOICE = voiceCssVars(TYPE_VOICES.calendar)

/** A cell where the grid sets it: its section, row and column, and its place in the view's reading order. */
interface Placed {
  readonly cell: CalendarCell
  readonly section: number
  readonly row: number
  readonly col: number
  readonly index: number
}

/**
 * Every cell of a view, placed (BENTO_BOARDS.md "Views"): where its section
 * places it, or in reading order after the section's blanks (a ladder one to
 * a row), then numbered in reading order, section by section; a ring keeps
 * its cells' order.
 */
function placeAll(view: CalendarView): readonly Placed[] {
  const placed = view.sections.flatMap((section, s) =>
    section.cells.map((cell, i) => {
      const columns = view.layout === 'ladder' ? 1 : section.columns
      const at = (section.offset ?? 0) + i
      const [row, col] = section.places?.[cell.key] ?? [Math.floor(at / columns), at % columns]
      return { cell, section: s, row, col }
    }),
  )
  const ordered = view.layout === 'ring' ? placed : [...placed].sort((a, b) => a.section - b.section || a.row - b.row || a.col - b.col)
  return ordered.map((p, index) => ({ ...p, index }))
}

/** A section's rows as drawn: each row's columns, a cell where one is placed and a blank where none is. */
function rowsOf(placed: readonly Placed[], section: number, columns: number): readonly (readonly (Placed | null)[])[] {
  const cells = placed.filter((p) => p.section === section)
  const rows = cells.reduce((most, p) => Math.max(most, p.row + 1), 0)
  const at = new Map(cells.map((p) => [p.row * columns + p.col, p]))
  return Array.from({ length: rows }, (_, r) => Array.from({ length: columns }, (_, col) => at.get(r * columns + col) ?? null))
}

type Step = 'next' | 'previous' | 'down' | 'up' | 'rowStart' | 'rowEnd' | 'first' | 'last'

/** Where a key moves focus from `from`: along the reading order, to the nearest column a row down or up (into the next section past an edge), or to a row's or the view's ends. */
function stepFrom(placed: readonly Placed[], from: Placed, step: Step, ring: boolean): Placed {
  const last = placed.length - 1
  const at = (i: number) => placed[ring ? (i + placed.length) % placed.length : Math.min(Math.max(i, 0), last)] ?? from
  const sameRow = placed.filter((p) => p.section === from.section && p.row === from.row)
  switch (step) {
    case 'next':
      return at(from.index + 1)
    case 'previous':
      return at(from.index - 1)
    case 'rowStart':
      return sameRow[0] ?? from
    case 'rowEnd':
      return sameRow[sameRow.length - 1] ?? from
    case 'first':
      return placed[0] ?? from
    case 'last':
      return placed[last] ?? from
    case 'down':
    case 'up': {
      if (ring) return at(from.index + (step === 'down' ? 1 : -1))
      const dir = step === 'down' ? 1 : -1
      const inSection = placed.filter((p) => p.section === from.section && Math.sign(p.row - from.row) === dir)
      if (inSection.length > 0) {
        const row = dir > 0 ? Math.min(...inSection.map((p) => p.row)) : Math.max(...inSection.map((p) => p.row))
        return nearest(
          inSection.filter((p) => p.row === row),
          from,
        )
      }
      const section = placed.filter((p) => p.section === from.section + dir)
      if (section.length === 0) return from
      const edge = dir > 0 ? Math.min(...section.map((p) => p.row)) : Math.max(...section.map((p) => p.row))
      return nearest(
        section.filter((p) => p.row === edge),
        from,
      )
    }
  }
}

/** The cell of a row nearest `from`'s column. */
const nearest = (row: readonly Placed[], from: Placed): Placed =>
  row.reduce((best, p) => (Math.abs(p.col - from.col) < Math.abs(best.col - from.col) ? p : best), row[0] ?? from)

const KEYS: Readonly<Record<string, Step>> = {
  ArrowRight: 'next',
  ArrowLeft: 'previous',
  ArrowDown: 'down',
  ArrowUp: 'up',
  Home: 'rowStart',
  End: 'rowEnd',
}

/** The right arrow goes to the cell drawn on the right: in a right-to-left page that is the previous in reading order. */
const mirrored = (step: Step, rtl: boolean): Step => (!rtl ? step : step === 'next' ? 'previous' : step === 'previous' ? 'next' : step)

function CellBody({ cell, layout }: { readonly cell: CalendarCell; readonly layout: CalendarView['layout'] }) {
  return (
    <>
      <span className={c.face} aria-hidden>
        {cell.mark && <BoardMarkView mark={cell.mark} className={c.mark} />}
        {cell.label && (
          <span className={c.label} lang={cell.label.lang} dir="auto">
            {cell.label.text}
          </span>
        )}
        {cell.title && <span className={c.title}>{cell.title}</span>}
        {cell.note && <span className={c.note}>{cell.note}</span>}
        {layout === 'ladder' &&
          cell.events?.map((e) => (
            <span key={e.name} className={c.eventText}>
              {e.name}
            </span>
          ))}
      </span>
      {layout !== 'ladder' && cell.events && cell.events.length > 0 && (
        <span className={c.events} aria-hidden>
          {cell.events.map((e) => (e.mark ? <BoardMarkView key={e.name} mark={e.mark} className={c.eventMark} /> : <i key={e.name} className={c.eventDot} />))}
        </span>
      )}
      {cell.state === 'today' && <b className={`${c.ring} ${f.beat}`} {...beat} aria-hidden />}
    </>
  )
}

function Head({ head, role }: { readonly head: CalendarHead; readonly role: 'columnheader' | 'rowheader' }) {
  return (
    <span role={role} aria-label={head.said} className={role === 'rowheader' ? c.rowHead : c.head} data-weekend={head.weekend ? '' : undefined} data-tint={head.tint}>
      {head.mark && <BoardMarkView mark={head.mark} className={c.headMark} />}
      {head.text && <span aria-hidden>{head.text}</span>}
    </span>
  )
}

/** A legend entry's sign: its mark, its band's or source colour's swatch, or the dot that marks an event. */
function LegendSign({ entry, bandStyle }: { readonly entry: LegendEntry; readonly bandStyle: (band: string | undefined) => CSSProperties | undefined }) {
  if (entry.mark) return <BoardMarkView mark={entry.mark} className={c.legendMark} />
  if (entry.tint) return <i className={c.swatch} data-tint={entry.tint} aria-hidden />
  if (entry.band) return <i className={c.swatch} style={bandStyle(entry.band)} data-band={entry.band} aria-hidden />
  return <i className={c.eventDot} aria-hidden />
}

/**
 * The legend as a toolbar of toggles (BENTO_BOARDS.md "Keys"): one tab stop,
 * the arrow keys between entries; pointing at or focusing an entry lights
 * the cells carrying its key, pressing it holds that, one pressed at a time.
 */
function Legend({
  legend,
  pressed,
  onPress,
  onPoint,
  bandStyle,
}: {
  readonly legend: readonly LegendEntry[]
  readonly pressed: string | null
  readonly onPress: (key: string) => void
  readonly onPoint: (key: string | null) => void
  readonly bandStyle: (band: string | undefined) => CSSProperties | undefined
}) {
  const [stop, setStop] = useState(0)
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const move = (e: KeyboardEvent<HTMLElement>) => {
    const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    const to = e.key === 'Home' ? 0 : e.key === 'End' ? legend.length - 1 : delta === 0 ? -1 : (stop + (e.currentTarget.matches(':dir(rtl)') && e.key.startsWith('Arrow') && !e.key.endsWith('Down') && !e.key.endsWith('Up') ? -delta : delta) + legend.length) % legend.length
    if (to < 0) return
    e.preventDefault()
    setStop(to)
    refs.current[to]?.focus()
  }
  return (
    <div role="toolbar" aria-label="Key: an entry lights the days that carry it" className={c.legend} onKeyDown={move} onPointerLeave={() => onPoint(null)}>
      {legend.map((entry, i) => (
        <button
          key={entry.key}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="button"
          className={c.legendEntry}
          tabIndex={i === stop ? 0 : -1}
          aria-pressed={pressed === entry.key}
          onPointerEnter={() => onPoint(entry.key)}
          onFocus={() => {
            setStop(i)
            onPoint(entry.key)
          }}
          onBlur={() => onPoint(null)}
          onClick={() => onPress(entry.key)}
        >
          <LegendSign entry={entry} bandStyle={bandStyle} />
          {entry.words}
        </button>
      ))}
    </div>
  )
}

/**
 * A cell in full (BENTO_BOARDS.md "Inspector"): its mark large, its first
 * phrase as a title, the rest as lines. Compact, at a ring's hub: the mark
 * and the title alone.
 */
export function CellReadout({ cell, compact = false, className }: { readonly cell: CalendarCell; readonly compact?: boolean; readonly className?: string }) {
  const [title, ...lines] = cell.said.split(' · ')
  return (
    <div className={[c.readout, className].filter(Boolean).join(' ')} data-tint={cell.tint} data-compact={compact ? '' : undefined} aria-hidden={compact || undefined}>
      {cell.mark && <BoardMarkView mark={cell.mark} className={c.readoutMark} />}
      <p className={c.readoutText}>
        <b className={c.readoutTitle}>{title}</b>
        {!compact &&
          lines.map((line) => (
            <span key={line} className={c.readoutLine}>
              {line}
            </span>
          ))}
      </p>
    </div>
  )
}

/** Today's cell in a view, if the view holds today. */
export const todayKeyOf = (view: CalendarView): string | null => view.sections.flatMap((section) => section.cells).find((cell) => cell.state === 'today')?.key ?? null

/** A view's cell by key. */
export const cellOf = (view: CalendarView, key: string | null): CalendarCell | undefined => (key === null ? undefined : view.sections.flatMap((section) => section.cells).find((cell) => cell.key === key))

/**
 * A section whose cells are numerals alone (no mark, no name, no note), as
 * the Tzolk'in's module sets its 260: the longest numeral's length, so its
 * cells take that many figures and no more; 0 where any cell carries more.
 */
const numeralsOnly = (section: CalendarSection): number =>
  section.cells.every((cell) => !cell.mark && !cell.title && !cell.note) ? Math.max(0, ...section.cells.map((cell) => [...(cell.label?.text ?? '')].length)) : 0

/** A request from outside the calendar to focus a cell (a Next event pressed, Today); each new request asks again, the same cell or not. */
export interface FocusRequest {
  readonly key: string
}

export interface BoardCalendarProps {
  readonly view: CalendarView
  /** The cell a Next event lights while it is pointed at or focused. */
  readonly spot?: string | null
  /** A request to move focus to a cell (a Next event pressed, Today). */
  readonly focus?: FocusRequest
  /** The cell the board inspects, held at a ring's hub. */
  readonly inspected?: string | null
  /** The cell under the pointer, as it changes; null as the pointer leaves the cells. */
  readonly onPoint?: (key: string | null) => void
  /** The cell holding focus, as it changes; null as focus leaves the calendar. */
  readonly onFocusCell?: (key: string | null) => void
}

/**
 * A board's calendar view (BENTO_BOARDS.md "Views"): its cells as an ARIA
 * grid, one tab stop, under its column and row heads; the legend lights the
 * cells that carry an entry's key, as a Next event lights its own (`spot`).
 * Arrow keys move a cell at a time in the direction pressed, Home and End to
 * the row's ends, Control with them to the view's. Cells run in rows (a
 * month in weeks), round a ring, one under another with their names (a
 * ladder), or where their figure places them (an oracle's cross, the
 * Tzolk'in's module). It reports pointing and focus as they happen; the
 * board says the inspected cell in full (BENTO_BOARDS.md "Inspector"), and
 * a ring holds its mark at the hub.
 */
export function BoardCalendar({ view, spot = null, focus, inspected = null, onPoint, onFocusCell }: BoardCalendarProps) {
  const placed = useMemo(() => placeAll(view), [view])
  const today = placed.find((p) => p.cell.state === 'today') ?? placed[0]
  const [active, setActive] = useState<string | null>(null)
  const [pressed, setPressed] = useState<string | null>(null)
  const [hinted, setHinted] = useState<string | null>(null)
  const refs = useRef(new Map<string, HTMLElement>())
  const current = placed.find((p) => p.cell.key === active) ?? today
  const hub = placed.find((p) => p.cell.key === inspected) ?? today
  const ring = view.layout === 'ring'
  const days = view.sections.some((s) => s.heads)
  const lit = hinted ?? pressed

  /* A focus request makes its cell the roving stop as it arrives and clears a held key, then takes focus once drawn. */
  const [requested, setRequested] = useState(focus)
  if (focus !== requested) {
    setRequested(focus)
    if (focus) {
      setActive(focus.key)
      setPressed(null)
      setHinted(null)
    }
  }
  useEffect(() => {
    if (focus) refs.current.get(focus.key)?.focus()
  }, [focus])

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (!current) return
    const key = KEYS[e.key]
    if (!key) return
    const rtl = e.currentTarget.matches(':dir(rtl)')
    const step = e.ctrlKey && key === 'rowStart' ? 'first' : e.ctrlKey && key === 'rowEnd' ? 'last' : mirrored(key, rtl)
    const to = stepFrom(placed, current, step, ring)
    e.preventDefault()
    setActive(to.cell.key)
    refs.current.get(to.cell.key)?.focus()
  }

  const bands = useMemo(() => [...new Set(placed.flatMap((p) => (p.cell.band ? [p.cell.band] : [])))], [placed])
  const bandStyle = (band: string | undefined): CSSProperties | undefined => (band ? ({ '--band': bands.indexOf(band) + 1, '--bands': bands.length } as CSSProperties) : undefined)
  /** A cell lit by the legend or a Next event, or quieted beside the lit ones. */
  const light = (cell: CalendarCell): 'lit' | 'quiet' | undefined => {
    if (spot !== null) return cell.key === spot ? 'lit' : 'quiet'
    if (lit === null) return undefined
    return cellKeys(cell).includes(lit) ? 'lit' : 'quiet'
  }

  const cellProps = (p: Placed) => ({
    ref: (el: HTMLElement | null) => {
      if (el) refs.current.set(p.cell.key, el)
      else refs.current.delete(p.cell.key)
    },
    role: 'gridcell',
    tabIndex: p === current ? 0 : -1,
    'aria-label': p.cell.said,
    'aria-current': p.cell.state === 'today' ? (days ? ('date' as const) : true) : undefined,
    className: c.cell,
    'data-state': p.cell.state,
    'data-band': p.cell.band,
    'data-tint': p.cell.tint,
    'data-light': light(p.cell),
    onFocus: () => {
      setActive(p.cell.key)
      onFocusCell?.(p.cell.key)
    },
    onPointerEnter: () => onPoint?.(p.cell.key),
  })

  const ringStyle = ring
    ? ({ '--n': placed.length, '--longest': Math.max(0, ...placed.flatMap((p) => [p.cell.title?.length ?? 0, p.cell.note?.length ?? 0])) } as CSSProperties)
    : undefined

  return (
    <div
      className={c.calendar}
      style={{ ...VOICE, ...ringStyle }}
      data-layout={view.layout}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) onFocusCell?.(null)
      }}
    >
      <div role="grid" aria-label={view.name} dir={view.dir} className={c.grid} onKeyDown={onKeyDown} onPointerLeave={() => onPoint?.(null)}>
        {view.sections.map((section, s) => {
          const columns = view.layout === 'ladder' ? 1 : section.columns
          const headed = (section.rowHeads?.length ?? 0) > 0
          const numerals = numeralsOnly(section)
          return (
            <div
              key={section.name ?? s}
              role="rowgroup"
              aria-label={section.name}
              className={c.section}
              data-headed={headed ? '' : undefined}
              data-numerals={numerals ? '' : undefined}
              style={{ '--columns': columns, ...(numerals ? { '--label-ch': numerals } : {}) } as CSSProperties}
            >
              {section.name && (
                <div className={c.sectionName} aria-hidden>
                  {section.name}
                </div>
              )}
              {section.heads && (
                <div role="row" className={c.heads}>
                  {headed && <span role="columnheader" className={c.corner} />}
                  {section.heads.map((h) => (
                    <Head key={h.said} head={h} role="columnheader" />
                  ))}
                </div>
              )}
              {ring ? (
                <div role="row" className={c.circle}>
                  {placed
                    .filter((p) => p.section === s)
                    .map((p) => (
                      <span key={p.cell.key} {...cellProps(p)} style={{ ...bandStyle(p.cell.band), '--i': p.index } as CSSProperties}>
                        <CellBody cell={p.cell} layout={view.layout} />
                      </span>
                    ))}
                </div>
              ) : (
                rowsOf(placed, s, columns).map((row, r) => (
                  <div key={r} role="row" className={c.row}>
                    {headed && section.rowHeads?.[r] && <Head head={section.rowHeads[r]} role="rowheader" />}
                    {row.map((p, i) =>
                      p ? (
                        <span key={p.cell.key} {...cellProps(p)} style={bandStyle(p.cell.band)}>
                          <CellBody cell={p.cell} layout={view.layout} />
                        </span>
                      ) : (
                        <span key={`blank-${i}`} role="gridcell" className={c.blank} />
                      ),
                    )}
                  </div>
                ))
              )}
            </div>
          )
        })}
      </div>
      {ring && hub && <CellReadout cell={hub.cell} compact className={c.hub} />}
      {view.legend.length > 0 && (
        <Legend legend={view.legend} pressed={pressed} onPress={(key) => setPressed(pressed === key ? null : key)} onPoint={setHinted} bandStyle={bandStyle} />
      )}
    </div>
  )
}
