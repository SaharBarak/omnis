'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import c from './board-calendar.module.css'
import { BoardMarkView } from './board-mark'
import f from './frame/frame.module.css'
import { beat } from '@/components/bento-lab/motion/loops'
import { cellKeys, type CalendarCell, type CalendarHead, type CalendarSection, type CalendarView, type LegendEntry } from '@/lib/boards/types'
import { bearing, pointAt, sectorCentre, sectorPath, wheelGeometry, type WheelGeometry } from '@/lib/boards/wheel'
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
  /** On a wheel: the middle of the cell's sector, as a fraction of the turn. */
  readonly mid?: number
}

/**
 * Every cell of a view, placed (BENTO_BOARDS.md "Views"): where its section
 * places it, or in reading order after the section's blanks (a ladder one to
 * a row), then numbered in reading order, section by section; a wheel keeps
 * its cells' order, ring by ring, each with its sector's bearing.
 */
function placeAll(view: CalendarView, wheel: WheelGeometry | null): readonly Placed[] {
  const placed = view.sections.flatMap((section, s) =>
    section.cells.map((cell, i) => {
      const columns = view.layout === 'ladder' ? 1 : section.columns
      const at = (section.offset ?? 0) + i
      const [row, col] = section.places?.[cell.key] ?? [Math.floor(at / columns), at % columns]
      const sector = wheel?.rings[s]?.sectors[i]
      return { cell, section: s, row, col, ...(sector ? { mid: ((((sector.start + sector.end) / 2) % 1) + 1) % 1 } : {}) }
    }),
  )
  const ordered = wheel ? placed : [...placed].sort((a, b) => a.section - b.section || a.row - b.row || a.col - b.col)
  return ordered.map((p, index) => ({ ...p, index }))
}

/** The distance between two bearings round the turn, the short way, so the turn's seam is no gap. */
const apart = (a: number, b: number): number => Math.min(Math.abs(a - b), 1 - Math.abs(a - b))

/**
 * Where a key moves focus on a wheel (BENTO_BOARDS.md "Figures", Wheel):
 * round the cell's own ring, or to the ring outside (up) or inside (down)
 * at the nearest bearing.
 */
function stepRound(placed: readonly Placed[], from: Placed, step: Step): Placed {
  const ring = placed.filter((p) => p.section === from.section)
  const at = ring.indexOf(from)
  const round = (i: number) => ring[(i + ring.length) % ring.length] ?? from
  switch (step) {
    case 'next':
      return round(at + 1)
    case 'previous':
      return round(at - 1)
    case 'rowStart':
      return ring[0] ?? from
    case 'rowEnd':
      return ring[ring.length - 1] ?? from
    case 'first':
      return placed[0] ?? from
    case 'last':
      return placed[placed.length - 1] ?? from
    case 'up':
    case 'down': {
      const other = placed.filter((p) => p.section === from.section + (step === 'up' ? 1 : -1))
      return other.reduce((best, p) => (apart(p.mid ?? 0, from.mid ?? 0) < apart(best.mid ?? 0, from.mid ?? 0) ? p : best), other[0] ?? from)
    }
  }
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
function stepFrom(placed: readonly Placed[], from: Placed, step: Step): Placed {
  const last = placed.length - 1
  const at = (i: number) => placed[Math.min(Math.max(i, 0), last)] ?? from
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
        {cell.over && <BoardMarkView mark={cell.over} className={c.over} />}
        {cell.mark && <BoardMarkView mark={cell.mark} className={c.mark} />}
        {cell.label && (
          <span className={c.label} lang={cell.label.lang} dir="auto">
            {cell.label.text}
          </span>
        )}
        {layout !== 'wheel' && cell.title && <span className={c.title}>{cell.title}</span>}
        {layout !== 'wheel' && cell.note && <span className={c.note}>{cell.note}</span>}
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
      {layout !== 'wheel' && cell.state === 'today' && <b className={`${c.ring} ${f.beat}`} {...beat} aria-hidden />}
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

/** Today's hand on a wheel: a line from the hub across every ring, at today's bearing. */
function WheelHand({ view, wheel, hand }: { readonly view: CalendarView; readonly wheel: WheelGeometry; readonly hand: number }) {
  const angle = bearing(view.wheel, hand)
  const [x1, y1] = pointAt(wheel.hub, angle)
  const [x2, y2] = pointAt(wheel.radius, angle)
  return <line x1={x1} y1={y1} x2={x2} y2={y2} className={c.hand} />
}

/** A figure's course (BENTO_BOARDS.md "Figures"): a line through its tiles' centres in the cells' own order, in the lattice's units. */
function Course({ section, placed, columns }: { readonly section: CalendarSection; readonly placed: readonly Placed[]; readonly columns: number }) {
  const at = new Map(placed.map((p) => [p.cell.key, p]))
  const rows = placed.reduce((most, p) => Math.max(most, p.row + 1), 0)
  const points = section.cells.flatMap((cell) => {
    const p = at.get(cell.key)
    return p ? [`${p.col + 1 / 2},${p.row + 1 / 2}`] : []
  })
  return (
    <svg className={c.course} viewBox={`0 0 ${columns} ${rows}`} preserveAspectRatio="none" aria-hidden>
      <polyline points={points.join(' ')} />
    </svg>
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
  /** Whether the view's key is drawn under it; a calendar shown as a figure (BENTO_V2.md "The stage") leaves it to its board. */
  readonly keyed?: boolean
}

/**
 * A board's calendar view (BENTO_BOARDS.md "Views"): its cells as an ARIA
 * grid, one tab stop, under its column and row heads; the legend lights the
 * cells that carry an entry's key, as a Next event lights its own (`spot`).
 * Arrow keys move a cell at a time in the direction pressed, Home and End to
 * the row's ends, Control with them to the view's. Cells run in rows (a
 * month in weeks), as the sectors of a wheel's rings, one under another with
 * their names (a ladder), or as tiles where their tradition's figure places
 * them (a wavespell, an oracle's cross, a rashi chart). It reports pointing and focus as they happen; the
 * board says the inspected cell in full (BENTO_BOARDS.md "Inspector"), and
 * a ring holds its mark at the hub.
 */
export function BoardCalendar({ view, spot = null, focus, inspected = null, onPoint, onFocusCell, keyed = true }: BoardCalendarProps) {
  const wheel = useMemo(() => (view.layout === 'wheel' ? wheelGeometry(view) : null), [view])
  const placed = useMemo(() => placeAll(view, wheel), [view, wheel])
  const today = placed.find((p) => p.cell.state === 'today') ?? placed[0]
  const [active, setActive] = useState<string | null>(null)
  const [pressed, setPressed] = useState<string | null>(null)
  const [hinted, setHinted] = useState<string | null>(null)
  const refs = useRef(new Map<string, HTMLElement>())
  const current = placed.find((p) => p.cell.key === active) ?? today
  const hub = placed.find((p) => p.cell.key === inspected) ?? today
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
    /* A wheel is geometry: its turn is its tradition's, never mirrored with the page. */
    const step = e.ctrlKey && key === 'rowStart' ? 'first' : e.ctrlKey && key === 'rowEnd' ? 'last' : wheel ? key : mirrored(key, rtl)
    const to = wheel ? stepRound(placed, current, step) : stepFrom(placed, current, step)
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

  /* A figure's tile is as wide as the longest word under its mark, so a name wraps between words and never within one. */
  const longest = view.layout === 'figure' ? Math.max(0, ...placed.flatMap((p) => [p.cell.title ?? '', p.cell.note ?? ''].flatMap((words) => words.split(' ').map((word) => word.length)))) : 0
  const figureStyle = wheel ? ({ '--radius': wheel.radius, '--hub': wheel.hub } as CSSProperties) : view.layout === 'figure' ? ({ '--longest': longest } as CSSProperties) : undefined
  const sectorState = (p: Placed) => ({ 'data-state': p.cell.state, 'data-band': p.cell.band, 'data-tint': p.cell.tint, 'data-light': light(p.cell), 'data-events': p.cell.events?.length ? '' : undefined })

  return (
    <div
      className={c.calendar}
      style={{ ...VOICE, ...figureStyle }}
      data-layout={view.layout}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) onFocusCell?.(null)
      }}
    >
      <div role="grid" aria-label={view.name} dir={view.dir} className={c.grid} onKeyDown={onKeyDown} onPointerLeave={() => onPoint?.(null)}>
        {wheel && (
          <svg className={c.wheel} viewBox={`${-wheel.radius} ${-wheel.radius} ${2 * wheel.radius} ${2 * wheel.radius}`} aria-hidden>
            {[...placed].sort((a, b) => Number(a.cell.state === 'today') - Number(b.cell.state === 'today')).map((p) => {
              const ring = wheel.rings[p.section]
              const sector = ring?.sectors.find((x) => x.key === p.cell.key)
              return (
                ring &&
                sector && (
                  <path
                    key={`${p.section}-${p.cell.key}`}
                    d={sectorPath(view.wheel, ring, sector)}
                    className={c.sector}
                    {...sectorState(p)}
                    style={bandStyle(p.cell.band)}
                    onPointerEnter={() => onPoint?.(p.cell.key)}
                    onClick={() => refs.current.get(p.cell.key)?.focus()}
                  />
                )
              )
            })}
            {wheel.hand !== null && <WheelHand view={view} wheel={wheel} hand={wheel.hand} />}
          </svg>
        )}
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
              {section.path && <Course section={section} placed={placed.filter((p) => p.section === s)} columns={columns} />}
              {wheel ? (
                <div role="row" className={c.circle}>
                  {placed
                    .filter((p) => p.section === s)
                    .map((p) => {
                      const ring = wheel.rings[s]
                      const sector = ring?.sectors.find((x) => x.key === p.cell.key)
                      const [x, y] = ring && sector ? sectorCentre(view.wheel, ring, sector) : [0, 0]
                      return (
                        <span key={p.cell.key} {...cellProps(p)} data-fits={sector?.fits ? '' : undefined} style={{ '--x': x, '--y': y } as CSSProperties}>
                          <CellBody cell={p.cell} layout={view.layout} />
                        </span>
                      )
                    })}
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
        {wheel && hub && <CellReadout cell={hub.cell} compact className={c.hub} />}
      </div>
      {keyed && view.legend.length > 0 && (
        <Legend legend={view.legend} pressed={pressed} onPress={(key) => setPressed(pressed === key ? null : key)} onPoint={setHinted} bandStyle={bandStyle} />
      )}
    </div>
  )
}
