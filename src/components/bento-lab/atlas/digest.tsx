'use client'

import { useId, useReducer, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { SEALS } from '@pleiad/engine/data/seals'
import { TONES } from '@pleiad/engine/data/tones'
import type { CardHead } from './card-body'
import d from './digest.module.css'
import s from './atlas.module.css'
import { FactCard, type CardAt } from './fact-card'
import { createInspect, IDLE, type InspectState } from './inspect'
import { MARK_SIZE } from './mark-geometry'
import { MayaNumeral, numeralHeight } from './maya-numeral'
import { BodygraphMark, CentreMark } from './person-atlas'
import { useDismiss } from './use-dismiss'
import { useExplain } from './use-explain'
import { useGrace } from './use-grace'
import { Rolling } from '../motion/rolling'
import { DIGEST_SHAPE, tileEyebrow, tileLayer, tileName, tileOf, tilePin, type FactShape, type TileId } from '@/lib/atlas/digest-shape'
import { DIGEST } from '@/lib/atlas/layers'
import { TYPE_VOICES, voiceCssVars } from '@/lib/design/type-voice'
import { PLACE_NAMES } from '@/lib/atlas/long-count'
import { sealName } from '@/lib/atlas/marks'
import { LARGEST } from '@/lib/atlas/maya-numeral'
import { bodyValue, dayArc, degreeAt, placeAt, signAt, signsOf } from '@/lib/atlas/place'
import { NAME_NEEDED, needsLabel } from '@/lib/atlas/readout'
import { numberWords, readingKey, type NumberRole, type ReadingRef } from '@/lib/atlas/readings'
import type { AtlasLayerId, GlyphRef, PersonAtlas, SkyBody } from '@/lib/atlas/types'

/**
 * One fact in a tile (BENTO_SITE.md, "The digest"): what it refers to, what
 * it is and the person's value, its mark, and the head of the card it opens.
 * In the text the label comes before the value, so assistive tech reads what
 * a value is first.
 */
interface FactView {
  readonly ref: ReadingRef
  readonly label: string
  readonly value: string
  /** A glyph or drawing, aria-hidden; or a number, which is read. */
  readonly mark: ReactNode
  /** The card's head: what the fact is and its full value. */
  readonly head: Omit<CardHead, 'layer' | 'eyebrow'>
  readonly weight: number
}

/** The lead's second line: the label shown before a value (`Kin 60`), or a label of its own (`Strategy …`). */
interface LeadView extends FactView {
  readonly note: { readonly label: string | null; readonly value: string | null }
  /** True where the lead's own label opens the second line; else it is spoken only. */
  readonly labelShown: boolean
  /** The value is a date or number, set in the display face. */
  readonly figure: boolean
}

interface TileView {
  readonly lead: LeadView
  readonly supports: readonly FactView[]
}

/** A glyph drawn in the current colour, so it takes its layer's colour in every palette. */
const Glyph = ({ src }: { src: string }) => <span className={d.glyph} style={{ '--src': `url("${src}")` } as CSSProperties} aria-hidden />

const Glyphs = ({ signs }: { signs: readonly GlyphRef[] }) => (
  <span className={d.glyphs} aria-hidden>
    {signs.map((sign) => (
      <Glyph key={sign.n} src={sign.src} />
    ))}
  </span>
)

/** An empty mark: the fact waits on an input, or has no mark of its own. */
const Open = () => <span className={d.open} aria-hidden />

/** A number as a mark: read aloud, a word of its value's line; it rolls inside a trimmed line, so its clip keeps the digits' ink. */
const Numeral = ({ value }: { value: string | number }) => (
  <span className={d.numeral}>
    <Rolling value={value} />
  </span>
)

/** A Maya numeral standing on its box's floor, in a box as tall as `largest`, so a row of them shares one line. */
const NumeralMark = ({ value, largest }: { value: number; largest: number }) => {
  const width = MARK_SIZE.toneWidth
  const height = numeralHeight(largest, width)
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={d.drawing} aria-hidden>
      <MayaNumeral value={value} x={width / 2} top={height - numeralHeight(value, width)} width={width} />
    </svg>
  )
}

/** The digest's text levels as custom properties (BENTO_TYPE.md, "The digest"), set once on its root. */
const VOICE = voiceCssVars(TYPE_VOICES.digest)

/** Either sign of a body whose day's arc crosses into the next, never a guess between them. */
const OR = ' or '

const signNames = (signs: readonly GlyphRef[]): string => signs.map((sign) => sign.name).join(OR)

const shapeOf = (tile: TileId, id: FactShape['id']): FactShape => {
  const { lead, supports } = DIGEST_SHAPE[tile]
  const found = [lead, ...supports].find((f) => f.id === id)
  if (!found) throw new Error(`No ${id} fact in the ${tile} tile`)
  return found
}

const fact = (shape: FactShape, { ref, value, mark, head }: Omit<FactView, 'label' | 'weight' | 'head'> & { readonly head?: FactView['head'] }): FactView => ({
  ref,
  label: shape.label,
  value,
  mark,
  head: head ?? { label: shape.label, value },
  weight: shape.weight,
})

const lead = (shape: FactShape, rest: Omit<LeadView, 'label' | 'weight' | 'head' | 'figure'> & { readonly head?: FactView['head']; readonly figure?: boolean }): LeadView => ({
  ...fact(shape, rest),
  note: rest.note,
  labelShown: rest.labelShown,
  figure: rest.figure ?? false,
})

const NO_NOTE = { label: null, value: null } as const

/** The degree a body stands at; none where its day's arc spans a degree or more, since the time decides it (as the readout says). */
const degreeOf = (b: SkyBody): string | null => (dayArc(b) ? null : `${degreeAt(b.longitude)}°`)

const maya = ({ maya: m }: PersonAtlas): TileView => {
  const guide = m.oracle.guide
  return {
    lead: lead(shapeOf('maya', 'kin'), {
      ref: { kind: 'kin' },
      value: m.title,
      mark: <Glyph src={m.seal.src} />,
      note: { label: null, value: String(m.kin) },
      labelShown: true,
      head: { label: `Kin ${m.kin}`, value: m.title },
    }),
    supports: [
      fact(shapeOf('maya', 'tone'), {
        ref: { kind: 'tone' },
        value: m.tone.name,
        mark: <NumeralMark value={m.tone.n} largest={TONES.length} />,
        head: { label: 'Tone', value: `${m.tone.name} ${m.tone.n}` },
      }),
      fact(shapeOf('maya', 'guide'), {
        ref: { kind: 'seat', role: 'guide' },
        value: SEALS[guide.n - 1] ? sealName(guide.n) : guide.name,
        mark: <Glyph src={guide.src} />,
      }),
    ],
  }
}

const body = (atlas: PersonAtlas): TileView => {
  const layer = atlas.body
  const type = shapeOf('body', 'type')
  if (!layer) {
    const needs = needsLabel(atlas.bodyNeeds ?? 'time-and-place')
    return {
      lead: lead(type, { ref: { kind: 'type' }, value: needs, mark: <BodygraphMark body={null} className={d.drawing} />, note: NO_NOTE, labelShown: false }),
      supports: [],
    }
  }
  return {
    lead: lead(type, {
      ref: { kind: 'type' },
      value: layer.type,
      mark: <BodygraphMark body={layer} className={d.drawing} />,
      note: { label: 'Strategy', value: layer.strategy },
      labelShown: false,
    }),
    supports: [
      fact(shapeOf('body', 'profile'), {
        ref: { kind: 'profile' },
        value: layer.profileName,
        mark: <Numeral value={layer.profileLines} />,
        head: { label: 'Profile', value: layer.profile },
      }),
      fact(shapeOf('body', 'authority'), {
        ref: { kind: 'authority' },
        value: layer.authorityWord,
        mark: layer.authorityCentre ? <CentreMark centre={layer.authorityCentre} className={d.drawing} /> : <Open />,
        head: { label: 'Authority', value: layer.authority },
      }),
    ],
  }
}

const longcount = ({ longCount }: PersonAtlas): TileView => {
  const place = shapeOf('longcount', 'place')
  const top = longCount.places.length - 1
  return {
    lead: lead(shapeOf('longcount', 'longcount'), {
      ref: { kind: 'longcount' },
      value: longCount.date,
      mark: null,
      note: { label: null, value: longCount.round },
      labelShown: false,
      figure: true,
    }),
    supports: longCount.places.map((value, i) =>
      fact(
        { ...place, label: PLACE_NAMES[top - i] },
        { ref: { kind: 'place', unit: top - i }, value: String(value), mark: <NumeralMark value={value} largest={LARGEST} /> },
      ),
    ),
  }
}

const numberFact = (atlas: PersonAtlas, role: Exclude<NumberRole, 'lifePath'>): FactView => {
  const shape = shapeOf('number', role)
  const n = atlas.number[role]
  if (n === null) return fact(shape, { ref: { kind: 'number', role }, value: NAME_NEEDED, mark: <Open /> })
  const name = numberWords(n)?.name ?? String(n)
  return fact(shape, { ref: { kind: 'number', role }, value: name, mark: <Numeral value={n} />, head: { label: `${shape.label} ${n}`, value: name } })
}

const number = (atlas: PersonAtlas): TileView => {
  const n = atlas.number.lifePath
  const shape = shapeOf('number', 'lifePath')
  const name = numberWords(n)?.name ?? String(n)
  return {
    lead: lead(shape, {
      ref: { kind: 'number', role: 'lifePath' },
      value: name,
      mark: (
        <span className={d.leadNumeral}>
          <Rolling value={n} />
        </span>
      ),
      note: NO_NOTE,
      labelShown: true,
      head: { label: `${shape.label} ${n}`, value: name },
    }),
    supports: [numberFact(atlas, 'birthday'), numberFact(atlas, 'expression')],
  }
}

const placement = (atlas: PersonAtlas, id: 'sun' | 'moon'): { readonly body: SkyBody; readonly signs: readonly GlyphRef[] } | null => {
  const found = atlas.sky.bodies.find((b) => b.id === id)
  return found ? { body: found, signs: signsOf(found) } : null
}

const sky = (atlas: PersonAtlas): TileView => {
  const sun = placement(atlas, 'sun')
  const moon = placement(atlas, 'moon')
  const sunShape = shapeOf('sky', 'sun')
  const risingShape = shapeOf('sky', 'rising')
  const ascendant = atlas.sky.ascendant
  const rising =
    ascendant === null
      ? fact(risingShape, { ref: { kind: 'rising' }, value: needsLabel(atlas.bodyNeeds ?? 'time-and-place'), mark: <Open /> })
      : fact(risingShape, { ref: { kind: 'rising' }, value: signAt(ascendant).name, mark: <Glyphs signs={[signAt(ascendant)]} />, head: { label: 'Rising', value: placeAt(ascendant) } })
  return {
    lead: lead(sunShape, {
      ref: { kind: 'placement', id: 'sun' },
      value: sun ? signNames(sun.signs) : '',
      mark: sun ? <Glyphs signs={sun.signs} /> : <Open />,
      note: { label: null, value: sun ? degreeOf(sun.body) : null },
      labelShown: true,
      head: { label: sunShape.label, value: sun ? bodyValue(sun.body) : '' },
    }),
    supports: [
      ...(moon
        ? [
            fact(shapeOf('sky', 'moon'), {
              ref: { kind: 'placement', id: 'moon' },
              value: signNames(moon.signs),
              mark: <Glyphs signs={moon.signs} />,
              head: { label: 'Moon', value: bodyValue(moon.body) },
            }),
          ]
        : []),
      rising,
    ],
  }
}

const READ: Readonly<Record<TileId, (atlas: PersonAtlas) => TileView>> = { maya, body, longcount, number, sky }

/** What a digest's card shows for one reference: the fact's own head, under the tile's eyebrow. */
interface Shown {
  readonly ref: ReadingRef
  readonly head: CardHead
}

const inspectFacts = createInspect<Shown>((shown) => readingKey(shown.ref))

type Send = (event: Parameters<typeof inspectFacts>[1]) => void

interface FactProps {
  readonly shown: Shown
  readonly cardId: string
  readonly state: InspectState<Shown>
  readonly send: Send
  readonly prime: () => void
  readonly className: string
  readonly style?: CSSProperties
  readonly children: ReactNode
}

const keyOf = (shown: Shown | null): string | null => (shown ? readingKey(shown.ref) : null)

/** A button that opens its fact's card: hover previews it, focus owns it, a press keeps it. */
function FactButton({ shown, cardId, state, send, prime, className, style, children }: FactProps) {
  const key = readingKey(shown.ref)
  const active = keyOf(state.active) === key
  return (
    <button
      type="button"
      className={className}
      style={style}
      data-active={active ? '' : undefined}
      aria-describedby={active ? cardId : undefined}
      onPointerEnter={(e) => {
        if (e.pointerType === 'touch') return
        prime()
        send({ type: 'point', ref: shown })
      }}
      onPointerLeave={(e) => {
        if (e.pointerType !== 'touch') send({ type: 'point', ref: null })
      }}
      onFocus={() => {
        prime()
        send({ type: 'focus', ref: shown })
      }}
      onBlur={() => send({ type: 'blur' })}
      onClick={() => send({ type: 'keep', ref: shown })}
    >
      {children}
    </button>
  )
}

interface TileProps {
  readonly tile: TileId
  readonly atlas: PersonAtlas
  readonly focus: AtlasLayerId | null
  readonly spot: AtlasLayerId | null
  readonly onFocus: (next: AtlasLayerId | null) => void
  readonly facts: Omit<FactProps, 'shown' | 'className' | 'style' | 'children'>
}

function Tile({ tile, atlas, focus, spot, onFocus, facts }: TileProps) {
  const view = READ[tile](atlas)
  const layer = tileLayer(tile)
  const name = tileName(tile)
  const eyebrow = tileEyebrow(tile)
  const pin = tilePin(tile)
  const shown = (f: FactView): Shown => ({ ref: f.ref, head: { layer, eyebrow, ...f.head } })
  const current = layer !== null && focus === layer
  const { lead: l } = view
  const system: ReadingRef = { kind: 'system', id: tile }
  const shownKey = keyOf(facts.state.shown)
  const anchored = [system, l.ref, ...view.supports.map((f) => f.ref)].some((ref) => readingKey(ref) === shownKey)
  return (
    <div
      className={d.tile}
      role="group"
      aria-label={name}
      data-anchor={anchored ? '' : undefined}
      data-layer={layer ?? undefined}
      data-beside={layer === null ? tile : undefined}
      data-current={current ? '' : undefined}
      data-spot={layer !== null && spot === layer && !current ? '' : undefined}
    >
      <div className={d.head}>
        <FactButton {...facts} shown={{ ref: system, head: { layer, eyebrow, label: 'System', value: name } }} className={`${d.fact} ${d.name}`}>
          <span className={d.nameText}>{name}</span>
        </FactButton>
        {layer !== null && pin !== null && (
          <button type="button" className={d.pin} aria-pressed={current} aria-label={`Bring ${name} forward`} onClick={() => onFocus(current ? null : layer)}>
            {pin}
          </button>
        )}
      </div>

      <FactButton {...facts} shown={shown(l)} className={`${d.fact} ${d.lead}`}>
        <span className={d.leadLabel} data-shown={l.labelShown ? '' : undefined}>
          {l.label}
        </span>
        {l.mark !== null && <span className={d.leadMark}>{l.mark}</span>}
        <span className={d.leadValue} data-figure={l.figure ? '' : undefined}>
          {l.figure ? <Rolling value={l.value} /> : l.value}
        </span>
        {(l.note.label || l.note.value) && (
          <span className={d.leadNote}>
            {l.note.label && <span className={d.noteLabel}>{l.note.label}</span>}
            {l.note.label && l.note.value && ' '}
            {l.note.value}
          </span>
        )}
      </FactButton>

      {view.supports.length > 0 && (
        <div className={d.supports}>
          {view.supports.map((f) => (
            <FactButton key={readingKey(f.ref)} {...facts} shown={shown(f)} className={`${d.fact} ${d.support}`} style={{ '--weight': f.weight } as CSSProperties}>
              <span className={d.label}>{f.label}</span>
              <span className={d.mark}>{f.mark}</span>
              <span className={d.value}>{f.value}</span>
            </FactButton>
          ))}
        </div>
      )}
    </div>
  )
}

/** A name per digest for the shown fact's anchor, from React's id: letters and digits only. */
const anchorName = (id: string): string => `--fact-${id.replace(/[^a-zA-Z0-9]/g, '')}`

/**
 * The atlas at a glance (BENTO_SITE.md, "The digest"): one tile per system in
 * the lead order, each a head, a lead fact and its supports. A layer tile's
 * pin toggle brings its layer forward and a second press lets it go; every
 * other part of a tile is a button that opens a card with what the fact is
 * and what the tradition reads into it. `spot` lights a layer the page is
 * showing on its own (the layers tour) without pressing its tile.
 */
export function AtlasDigest({
  atlas,
  focus,
  spot = null,
  onFocus,
  beside = true,
  cardAt = 'side',
  className,
}: {
  readonly atlas: PersonAtlas
  readonly focus: AtlasLayerId | null
  readonly spot?: AtlasLayerId | null
  readonly onFocus: (next: AtlasLayerId | null) => void
  /** False where the digest is the legend of the layers alone (the layers scene). */
  readonly beside?: boolean
  /** Where a fact's card hangs from its tile: beside it where tiles stack one per row, above it where they sit in a row. */
  readonly cardAt?: CardAt
  readonly className?: string
}) {
  const id = useId()
  const cardId = `${id}-card`
  const anchor = anchorName(id)
  const rootRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const [state, dispatch] = useReducer(inspectFacts, IDLE)
  const [seen, setSeen] = useState(atlas)
  if (seen !== atlas) {
    setSeen(atlas)
    dispatch({ type: 'reset' })
  }
  const { send, hold } = useGrace(dispatch)
  const { explainer, prime } = useExplain()
  const open = state.active !== null
  const kept = state.kept
  useDismiss(open, kept, dispatch, rootRef, cardRef)


  const tiles = DIGEST.filter((entry) => beside || entry.kind === 'layer').map(tileOf)
  const facts = { cardId, state, send, prime }
  const shown = state.shown
  return (
    <div
      ref={rootRef}
      className={[d.digest, s.tokens, className].filter(Boolean).join(' ')}
      style={{ ...VOICE, '--fact-anchor': anchor } as CSSProperties}
      role="group"
      aria-label="Map at a glance"
    >
      {tiles.map((tile) => (
        <Tile key={tile} tile={tile} atlas={atlas} focus={focus} spot={spot} onFocus={onFocus} facts={facts} />
      ))}
      <FactCard
        id={cardId}
        cardRef={cardRef}
        at={cardAt}
        head={shown?.head ?? null}
        reading={shown && explainer ? explainer.explainReading(atlas, shown.ref) : null}
        open={open}
        kept={kept}
        onPointerEnter={hold}
        onPointerLeave={() => send({ type: 'point', ref: null })}
      />
    </div>
  )
}
