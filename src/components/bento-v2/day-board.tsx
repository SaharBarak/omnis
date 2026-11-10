'use client'

import { useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { LocateFixed, X } from 'lucide-react'
import { BoardCalendar, CellReadout, cellOf, todayKeyOf, type FocusRequest } from './board-calendar'
import { BoardMarkView } from './board-mark'
import b from './day-board.module.css'
import { DayArtwork } from '@/components/bento-lab/blocks/board-art'
import type { BoardEvent, BoardFact, CalendarView, MastWord, Script } from '@/lib/boards/types'
import { fromToday, whenWords } from '@/lib/boards/words'
import { TYPE_VOICES, voiceCssVars } from '@/lib/design/type-voice'
import type { V2DayRow } from '@/lib/site/v2-day'

/** The board's text levels as custom properties (BENTO_TYPE.md, "The board"). */
const VOICE = voiceCssVars(TYPE_VOICES.board)

/** Words in a calendar's own script, set in its language and direction. */
function InScript({ script, className }: { readonly script: Script; readonly className?: string }) {
  return (
    <span className={className} lang={script.lang} dir="auto">
      {script.text}
    </span>
  )
}

/**
 * The mast (BENTO_BOARDS.md "Regions"), as the kin tile sets a kin: the
 * calendar's name and script, the figure (the row's drawing, else the
 * value's mark) as tall as the numeral, the numeral, the value's name over
 * its words, and what the tradition reads into it; the close button at its
 * end.
 */
function Mast({ row, onClose }: { readonly row: V2DayRow; readonly onClose?: () => void }) {
  const { board } = row
  const mast = board.mast
  const art = board.art ?? row.face?.art
  const words: readonly MastWord[] = mast?.words ?? [{ text: board.label }]
  return (
    <header className={b.mast}>
      <div className={b.mastTop}>
        <p className={b.name}>
          {row.label}
          {mast?.script && <InScript script={mast.script} className={b.script} />}
        </p>
        {onClose && (
          <button type="button" className={b.close} aria-label={`Close the ${row.label} board`} onClick={onClose}>
            <X size="1em" aria-hidden />
          </button>
        )}
      </div>
      <div className={b.main}>
        <span className={b.figure} data-art={art?.kind} aria-hidden>
          {art ? <DayArtwork art={art} /> : mast?.mark ? <BoardMarkView mark={mast.mark} className={b.figureMark} /> : <i className={b.dot} />}
        </span>
        <p className={b.numeral}>
          <InScript script={mast?.numeral ?? { text: row.face?.big ?? board.value }} />
        </p>
        <div className={b.named}>
          <p className={b.title}>{mast?.title ?? board.value}</p>
          <p className={b.words}>
            {words.map((word, i) => (
              <span key={`${i}-${word.text}`} className={b.word}>
                {word.mark && <BoardMarkView mark={word.mark} className={b.wordMark} />}
                {word.text}
              </span>
            ))}
          </p>
        </div>
      </div>
      {board.meaning && <p className={b.meaning}>{board.meaning}</p>}
    </header>
  )
}

/** Where a Next event points: the cell it lights while pointed or focused in the view shown, and the view and cell it shows when pressed. */
interface Spotlight {
  readonly view: string
  readonly cell: string
}

/**
 * The views as a segmented control (BENTO_BOARDS.md "Bar"): a roving tab
 * stop whose arrow keys select the tab they reach, mirrored in right-to-left
 * text.
 */
function ViewTabs({
  views,
  selected,
  onSelect,
  tabId,
  panelId,
}: {
  readonly views: readonly CalendarView[]
  readonly selected: string
  readonly onSelect: (id: string) => void
  readonly tabId: (id: string) => string
  readonly panelId: string
}) {
  const tabs = useRef(new Map<string, HTMLButtonElement>())
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const at = views.findIndex((v) => v.id === selected)
    const rtl = e.currentTarget.matches(':dir(rtl)')
    const forward = e.key === (rtl ? 'ArrowLeft' : 'ArrowRight')
    const back = e.key === (rtl ? 'ArrowRight' : 'ArrowLeft')
    const to = e.key === 'Home' ? 0 : e.key === 'End' ? views.length - 1 : forward ? (at + 1) % views.length : back ? (at - 1 + views.length) % views.length : -1
    const next = views[to]
    if (!next) return
    e.preventDefault()
    onSelect(next.id)
    tabs.current.get(next.id)?.focus()
  }
  return (
    <div role="tablist" aria-label="Views" className={b.tabs} onKeyDown={onKeyDown}>
      {views.map((v) => (
        <button
          key={v.id}
          ref={(el) => {
            if (el) tabs.current.set(v.id, el)
            else tabs.current.delete(v.id)
          }}
          id={tabId(v.id)}
          type="button"
          role="tab"
          aria-selected={v.id === selected}
          aria-controls={panelId}
          tabIndex={v.id === selected ? 0 : -1}
          className={b.tab}
          onClick={() => onSelect(v.id)}
        >
          {v.tab}
        </button>
      ))}
    </div>
  )
}

/** What comes next, nearest first, as a timeline: an event that falls on a cell lights it while pointed or focused, and shows it when pressed. */
function NextList({ events, onPoint, onShow }: { readonly events: readonly BoardEvent[]; readonly onPoint: (at: Spotlight | null) => void; readonly onShow: (at: Spotlight) => void }) {
  return (
    <ol role="list" className={b.next}>
      {events.map((e) => {
        const body = (
          <>
            <span className={b.eventSign} aria-hidden>
              {e.mark ? <BoardMarkView mark={e.mark} className={b.eventMark} /> : <i className={b.eventDot} />}
            </span>
            <span className={b.eventName}>{e.name}</span>
            <span className={b.when}>
              <time dateTime={e.date}>{whenWords(e.date, e.inDays)}</time>
              <span className={b.away}>{fromToday(e.inDays)}</span>
            </span>
          </>
        )
        const at = e.at
        return (
          <li key={`${e.name}-${e.date}`} className={b.event}>
            {at ? (
              <button
                type="button"
                className={b.eventButton}
                onPointerEnter={() => onPoint(at)}
                onPointerLeave={() => onPoint(null)}
                onFocus={() => onPoint(at)}
                onBlur={() => onPoint(null)}
                onClick={() => onShow(at)}
              >
                {body}
              </button>
            ) : (
              <span className={b.eventRow}>{body}</span>
            )}
          </li>
        )
      })}
    </ol>
  )
}

/** The facts' label column: as wide as their longest label, so values align down every column of the band. */
const labelCh = (facts: readonly BoardFact[]): number => Math.max(...facts.map((fact) => fact.label.length))

function Facts({ facts }: { readonly facts: readonly BoardFact[] }) {
  return (
    <dl className={b.facts} style={{ '--label-ch': labelCh(facts) } as CSSProperties}>
      {facts.map((fact) => (
        <div key={fact.label} className={b.fact}>
          <dt>{fact.label}</dt>
          <dd>
            {fact.mark && <BoardMarkView mark={fact.mark} className={b.factMark} />}
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * A calendar's board (BENTO_BOARDS.md "The board"): one skeleton for every
 * calendar. The mast says what the day is; the bar holds the controls (the
 * views, Today) and stays in view; the stage draws the view shown with its
 * key; the side says the cell in focus in full, then what comes next; the
 * facts run under both as a band. The board owns which cell is inspected:
 * today's at rest, else the one pointed at, lit by a Next event, or focused.
 */
export function DayBoardBody({ row, onClose }: { readonly row: V2DayRow; readonly onClose?: () => void }) {
  const { board } = row
  const views = board.views ?? []
  const base = useId()
  const [selected, setSelected] = useState(views[0]?.id ?? '')
  const [lit, setLit] = useState<Spotlight | null>(null)
  const [pointed, setPointed] = useState<string | null>(null)
  const [focused, setFocused] = useState<string | null>(null)
  const [focus, setFocus] = useState<FocusRequest | undefined>(undefined)
  const view = views.find((v) => v.id === selected) ?? views[0]
  const spot = lit && view && lit.view === view.id ? lit.cell : null
  const todayKey = view ? todayKeyOf(view) : null
  const firstKey = view?.sections[0]?.cells[0]?.key ?? null
  /* The first of these the view holds: a key from elsewhere (another view, a day gone) falls through to the next. */
  const inspected = view ? [pointed, spot, focused, todayKey, firstKey].map((key) => cellOf(view, key)).find(Boolean) : undefined
  const tabId = (id: string) => `${base}-tab-${id}`
  const panelId = `${base}-panel`
  const many = views.length > 1

  const select = (id: string) => {
    setSelected(id)
    setPointed(null)
    setFocused(null)
    setFocus(undefined)
  }
  const ask = (key: string) => setFocus({ key })
  const show = (at: Spotlight) => {
    select(at.view)
    ask(at.cell)
  }
  const toToday = () => {
    if (!todayKey) return
    setLit(null)
    setPointed(null)
    ask(todayKey)
  }

  return (
    <div className={b.board} style={{ ...VOICE, '--tile': `var(${row.tone})` } as CSSProperties}>
      <Mast row={row} onClose={onClose} />
      {view && (
        <div className={b.bar}>
          {many ? <ViewTabs views={views} selected={view.id} onSelect={select} tabId={tabId} panelId={panelId} /> : <span className={b.single}>{view.tab}</span>}
          <button
            type="button"
            className={b.today}
            onClick={toToday}
            aria-disabled={todayKey ? undefined : true}
            title={todayKey ? undefined : `${view.name} holds no single day`}
            aria-label={todayKey ? `Today, in ${view.name}` : `Today: ${view.name} holds no single day`}
          >
            <LocateFixed size="1em" aria-hidden />
            Today
          </button>
        </div>
      )}
      <div className={b.body}>
        {view && (
          <section id={panelId} className={b.stage} role={many ? 'tabpanel' : undefined} aria-labelledby={many ? tabId(view.id) : `${panelId}-name`}>
            <div className={b.stageHead}>
              <h3 id={`${panelId}-name`} className={b.partName}>
                {view.name}
              </h3>
              <p className={b.caption}>{view.caption}</p>
            </div>
            <BoardCalendar key={view.id} view={view} spot={spot} focus={focus} inspected={inspected?.key ?? null} onPoint={setPointed} onFocusCell={setFocused} />
          </section>
        )}
        <div className={b.side}>
          {inspected && (
            <section className={b.inspector} aria-label="In focus">
              <h3 className={b.partName}>
                In focus
                {inspected.state === 'today' && <span className={b.todayChip}>Today</span>}
              </h3>
              <CellReadout cell={inspected} />
            </section>
          )}
          {board.next.length > 0 && (
            <section className={b.part}>
              <h3 className={b.partName}>Next</h3>
              <NextList events={board.next} onPoint={setLit} onShow={show} />
            </section>
          )}
        </div>
      </div>
      {board.facts.length > 0 && (
        <section className={`${b.part} ${b.band}`}>
          <h3 className={b.partName}>Facts</h3>
          <Facts facts={board.facts} />
        </section>
      )}
    </div>
  )
}
