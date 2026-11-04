'use client'

import type { CSSProperties, ReactNode } from 'react'
import { TONES } from '@pleiad/engine/data/tones'
import d from './digest.module.css'
import s from './atlas.module.css'
import { MARK_SIZE } from './mark-geometry'
import { MayaNumeral, numeralHeight } from './maya-numeral'
import { BodygraphMark, CentreMark } from './person-atlas'
import { Rolling } from '../motion/rolling'
import { DIGEST, LAYER_META, systemLabel, type BesideSystem, type DigestEntry } from '@/lib/atlas/layers'
import { PLACE_NAMES } from '@/lib/atlas/long-count'
import { LARGEST } from '@/lib/atlas/maya-numeral'
import { signAt, signsOf } from '@/lib/atlas/place'
import { NAME_NEEDED, needsLabel } from '@/lib/atlas/readout'
import type { AtlasLayerId, GlyphRef, PersonAtlas } from '@/lib/atlas/types'

/**
 * How a tile acts: `toggle` brings its layer forward and a second press lets
 * it go (a pressed state); `travel` takes the reader to its layer (the layers
 * scene), so the current one is marked as the step, not as pressed.
 */
export type DigestMode = 'toggle' | 'travel'

/**
 * One fact in a tile. A `mark` fact stands its mark over its value and what
 * it is; a `number` fact's numeral takes the mark's and the value's rows, so
 * every fact's label sits on one line. The label comes first in the text, so
 * assistive tech reads what a value is before the value.
 */
type Fact =
  | { readonly kind: 'mark'; readonly mark: ReactNode; readonly value: string; readonly label: string }
  | { readonly kind: 'number'; readonly value: string | number; readonly label: string }

/** A tile's reading: its facts, and a note beside its name where a layer would show its pin. */
interface Reading {
  readonly facts: readonly Fact[]
  readonly note?: string
}

/** A glyph drawn in the current colour, so it takes its layer's colour in every palette. */
const Glyph = ({ src }: { src: string }) => <span className={d.glyph} style={{ '--src': `url("${src}")` } as CSSProperties} aria-hidden />

/** An empty mark: the fact waits on an input, or has no mark of its own. */
const Open = () => <span className={d.open} aria-hidden />

/** A Maya numeral standing on the mark row's floor, in a box as tall as `largest`, so a row of them shares one line. */
const NumeralMark = ({ value, largest }: { value: number; largest: number }) => {
  const width = MARK_SIZE.toneWidth
  const height = numeralHeight(largest, width)
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={d.drawing} aria-hidden>
      <MayaNumeral value={value} x={width / 2} top={height - numeralHeight(value, width)} width={width} />
    </svg>
  )
}

/** Either sign of a body whose day's arc crosses into the next, never a guess between them. */
const OR = ' or '

/** A sign fact: its glyph, or both glyphs when the body may be in either. */
const signFact = (signs: readonly GlyphRef[], label: string): Fact => ({
  kind: 'mark',
  mark: (
    <span className={d.glyphs}>
      {signs.map((sign) => (
        <Glyph key={sign.n} src={sign.src} />
      ))}
    </span>
  ),
  value: signs.map((sign) => sign.name).join(OR),
  label,
})

const sky = (atlas: PersonAtlas): Reading => {
  const planet = (id: string, label: string): Fact | null => {
    const body = atlas.sky.bodies.find((b) => b.id === id)
    return body ? signFact(signsOf(body), label) : null
  }
  const ascendant = atlas.sky.ascendant === null ? null : signAt(atlas.sky.ascendant)
  const rising: Fact = ascendant
    ? signFact([ascendant], 'Rising')
    : { kind: 'mark', mark: <Open />, value: needsLabel(atlas.bodyNeeds ?? 'time-and-place'), label: 'Rising' }
  return { facts: [planet('sun', 'Sun'), planet('moon', 'Moon'), rising].filter((f): f is Fact => f !== null) }
}

const maya = ({ maya }: PersonAtlas): Reading => ({
  facts: [
    { kind: 'number', value: maya.kin, label: 'Kin' },
    { kind: 'mark', mark: <NumeralMark value={maya.tone.n} largest={TONES.length} />, value: maya.tone.name, label: 'Tone' },
    { kind: 'mark', mark: <Glyph src={maya.seal.src} />, value: `${maya.colour} ${maya.seal.name}`, label: 'Seal' },
  ],
})

const body = (atlas: PersonAtlas): Reading => {
  const layer = atlas.body
  if (!layer) {
    return { facts: [{ kind: 'mark', mark: <BodygraphMark body={null} className={d.drawing} />, value: needsLabel(atlas.bodyNeeds ?? 'time-and-place'), label: 'Bodygraph' }] }
  }
  return {
    facts: [
      { kind: 'mark', mark: <BodygraphMark body={layer} className={d.drawing} />, value: layer.type, label: 'Type' },
      { kind: 'number', value: layer.profileLines, label: 'Profile' },
      {
        kind: 'mark',
        mark: layer.authorityCentre ? <CentreMark centre={layer.authorityCentre} className={d.drawing} /> : <Open />,
        value: layer.authorityWord,
        label: 'Authority',
      },
    ],
  }
}

const number = ({ number: n }: PersonAtlas): Reading => ({
  facts: [
    { kind: 'number', value: n.lifePath, label: 'Life path' },
    { kind: 'number', value: n.birthday, label: 'Birthday' },
    n.expression !== null
      ? { kind: 'number', value: n.expression, label: 'Expression' }
      : { kind: 'mark', mark: <Open />, value: NAME_NEEDED, label: 'Expression' },
  ],
})

const BESIDE: Readonly<Record<BesideSystem, (atlas: PersonAtlas) => Reading>> = {
  longcount: ({ longCount }) => ({
    facts: longCount.places.map(
      (place, i): Fact => ({
        kind: 'mark',
        mark: <NumeralMark value={place} largest={LARGEST} />,
        value: String(place),
        label: PLACE_NAMES[longCount.places.length - 1 - i],
      }),
    ),
    note: longCount.round,
  }),
}

const LAYER_READING: Readonly<Record<AtlasLayerId, (atlas: PersonAtlas) => Reading>> = { sky, maya, body, number }

function FactCell({ fact }: { fact: Fact }) {
  if (fact.kind === 'number') {
    return (
      <span className={d.fact} data-kind="number">
        <span className={d.label}>{fact.label}</span>
        <Rolling value={fact.value} className={d.numeral} />
      </span>
    )
  }
  return (
    <span className={d.fact}>
      <span className={d.label}>{fact.label}</span>
      <span className={d.mark}>{fact.mark}</span>
      <span className={d.value}>{fact.value}</span>
    </span>
  )
}

function Face({ name, pin, reading }: { name: string; pin: number | null; reading: Reading }) {
  return (
    <>
      <span className={d.head}>
        <span className={d.name}>{name}</span>
        {pin !== null ? (
          <span className={d.pin} aria-hidden>
            {pin}
          </span>
        ) : (
          reading.note && <span className={d.note}>{reading.note}</span>
        )}
      </span>
      <span className={d.facts} style={{ '--facts': reading.facts.length } as CSSProperties}>
        {reading.facts.map((fact) => (
          <FactCell key={fact.label} fact={fact} />
        ))}
      </span>
    </>
  )
}

interface TileProps {
  readonly entry: DigestEntry
  readonly atlas: PersonAtlas
  readonly focus: AtlasLayerId | null
  readonly onFocus: (next: AtlasLayerId | null) => void
  readonly mode: DigestMode
}

function Tile({ entry, atlas, focus, onFocus, mode }: TileProps) {
  if (entry.kind === 'beside') {
    return (
      <div className={d.tile} data-beside={entry.system}>
        <Face name={systemLabel(entry.system)} pin={null} reading={BESIDE[entry.system](atlas)} />
      </div>
    )
  }
  const { layer } = entry
  const meta = LAYER_META[layer]
  const current = focus === layer
  const state = mode === 'toggle' ? { 'aria-pressed': current } : { 'aria-current': current ? ('step' as const) : undefined }
  return (
    <button
      type="button"
      className={d.tile}
      data-layer={layer}
      data-current={current ? '' : undefined}
      {...state}
      onClick={() => onFocus(mode === 'toggle' && current ? null : layer)}
    >
      <Face name={meta.name} pin={meta.pin} reading={LAYER_READING[layer](atlas)} />
    </button>
  )
}

const GROUP_LABEL: Readonly<Record<DigestMode, string>> = {
  toggle: 'Map at a glance; choose a layer to bring it forward',
  travel: 'Map at a glance; choose a layer to go to it',
}

/**
 * The atlas at a glance, one tile per system in the lead order (`DIGEST`):
 * each layer of the map numbered like its pin on the drawing, and the chart
 * systems read beside the map. A layer tile brings its layer forward, or in
 * `travel` mode takes the reader to it; a tile beside the map has nothing to
 * bring forward, so it is text, not a control. The full text readout stays
 * available to assistive tech through the drawing's description.
 */
export function AtlasDigest({
  atlas,
  focus,
  onFocus,
  mode = 'toggle',
  beside = true,
  className,
}: {
  readonly atlas: PersonAtlas
  readonly focus: AtlasLayerId | null
  readonly onFocus: (next: AtlasLayerId | null) => void
  readonly mode?: DigestMode
  /** False where the digest is the legend of the layers alone (the layers scene). */
  readonly beside?: boolean
  readonly className?: string
}) {
  const entries = beside ? DIGEST : DIGEST.filter((entry) => entry.kind === 'layer')
  return (
    <div
      className={[d.digest, s.tokens, className].filter(Boolean).join(' ')}
      role="group"
      aria-label={GROUP_LABEL[mode]}
    >
      {entries.map((entry) => (
        <Tile key={entry.kind === 'layer' ? entry.layer : entry.system} entry={entry} atlas={atlas} focus={focus} onFocus={onFocus} mode={mode} />
      ))}
    </div>
  )
}
