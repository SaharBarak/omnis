'use client'

import { Fragment, type CSSProperties, type ReactNode } from 'react'
import { getZodiacSignFromLongitude } from '@pleiad/engine/data/zodiac-signs'
import d from './digest.module.css'
import s from './atlas.module.css'
import { MayaNumeral, numeralHeight, numeralStep } from './maya-numeral'
import { BodygraphFigure, KinMark } from './person-atlas'
import { MARK_SIZE } from './mark-geometry'
import kit from '../kit.module.css'
import { Rolling } from '../motion/rolling'
import { DIGEST, LAYER_META, systemLabel, type BesideSystem, type DigestEntry } from '@/lib/atlas/layers'
import { LARGEST } from '@/lib/atlas/maya-numeral'
import { signsOf } from '@/lib/atlas/place'
import { needsLabel, needsPhrase } from '@/lib/atlas/readout'
import type { AtlasLayerId, GlyphRef, LongCountReading, PersonAtlas } from '@/lib/atlas/types'
import { signGlyphSrc } from '@/lib/design/glyph-paths'

/**
 * How a tile acts: `toggle` brings its layer forward and a second press lets
 * it go (a pressed state); `travel` takes the reader to its layer (the layers
 * scene), so the current one is marked as the step, not as pressed.
 */
export type DigestMode = 'toggle' | 'travel'

/** What every tile shows: a figure, and beside it the reading's strong line and one line of support. */
interface Reading {
  readonly figure: ReactNode
  readonly strong: ReactNode
  /** Short phrases; a narrow tile breaks the line between them, never inside one. */
  readonly support: readonly string[] | string | null
}

/** A glyph drawn in the current colour, so it takes its layer's colour in every palette. */
const Mark = ({ src }: { src: string }) => <span className={d.mark} style={{ '--src': `url("${src}")` } as CSSProperties} aria-hidden />

/** A strong line: the value, then what it is in the label's voice. `rank` orders a text value so it rolls the way it moved. */
const Strong = ({ value, unit, rank }: { value: string | number; unit?: string; rank?: number }) => (
  <>
    <Rolling value={value} rank={rank} className={d.value} />
    {unit && <span className={d.unit}>{unit}</span>}
  </>
)

/** Either sign of a body whose day's arc crosses into the next, never a guess between them. */
const OR = ' or '

const signAt = (longitude: number): GlyphRef => {
  const sign = getZodiacSignFromLongitude(longitude)
  return { n: sign.number, name: sign.name, src: signGlyphSrc(sign.number, sign.name) }
}

const sky = (atlas: PersonAtlas): Reading => {
  const body = (id: string) => atlas.sky.bodies.find((b) => b.id === id) ?? null
  const sun = body('sun')
  const moon = body('moon')
  const rising = atlas.sky.ascendant === null ? null : signAt(atlas.sky.ascendant)
  return {
    figure: sun ? <Mark src={sun.sign.src} /> : null,
    strong: <Strong value={sun ? signsOf(sun).join(OR) : '–'} unit="Sun" />,
    support: [
      moon ? `${signsOf(moon).join(OR)} moon` : null,
      rising ? `${rising.name} rising` : needsPhrase('Rising', atlas.bodyNeeds ?? 'time-and-place'),
    ].filter((phrase): phrase is string => phrase !== null),
  }
}

const maya = (atlas: PersonAtlas): Reading => ({
  figure: <KinMark maya={atlas.maya} className={d.drawing} />,
  strong: <Strong value={atlas.maya.kin} unit="Kin" />,
  support: atlas.maya.title,
})

const body = (atlas: PersonAtlas): Reading => {
  const layer = atlas.body
  const figure = <BodygraphFigure body={layer} className={d.drawing} />
  if (!layer) return { figure, strong: needsLabel(atlas.bodyNeeds ?? 'time-and-place'), support: null }
  return { figure, strong: <Strong value={layer.type} />, support: layer.profile }
}

const number = (atlas: PersonAtlas): Reading => {
  const n = atlas.number
  return {
    figure: (
      <span className={d.ring} aria-hidden>
        <Rolling value={n.lifePath} className={d.ringValue} />
      </span>
    ),
    // The ring shows the number; the words name it, and carry it for assistive tech.
    strong: (
      <span className={d.value}>
        Life path<span className={kit.srOnly}> {n.lifePath}</span>
      </span>
    ),
    support: [`Birthday ${n.birthday}`, n.expression === null ? null : `Expression ${n.expression}`].filter((phrase): phrase is string => phrase !== null),
  }
}

/** Maya inscriptions read in paired columns, left to right, then down. */
const COLUMNS = 2
/** The Long Count's places as bar-and-dot numerals, in the paired columns of an inscription. */
function LongCountFigure({ reading }: { reading: LongCountReading }) {
  const width = MARK_SIZE.toneWidth
  const step = numeralStep(width)
  // Every cell is as tall as the tallest numeral's ink, so the numerals in a row stand on one line.
  const cell = numeralHeight(LARGEST, width)
  const rows = Math.ceil(reading.places.length / COLUMNS)
  const box = { width: COLUMNS * width + (COLUMNS - 1) * step, height: rows * cell + (rows - 1) * step }
  return (
    <svg viewBox={`0 0 ${box.width} ${box.height}`} className={d.drawing} aria-hidden>
      {reading.places.map((place, i) => {
        const col = i % COLUMNS
        const row = Math.floor(i / COLUMNS)
        const bottom = row * (cell + step) + cell
        const alone = i === reading.places.length - 1 && col === 0 && reading.places.length % COLUMNS !== 0
        const x = alone ? box.width / 2 : col * (width + step) + width / 2
        return <MayaNumeral key={i} value={place} x={x} top={bottom - numeralHeight(place, width)} width={width} />
      })}
    </svg>
  )
}

const BESIDE: Readonly<Record<BesideSystem, (atlas: PersonAtlas) => Reading>> = {
  longcount: (atlas) => ({
    figure: <LongCountFigure reading={atlas.longCount} />,
    strong: <Strong value={atlas.longCount.date} rank={atlas.longCount.days} />,
    support: atlas.longCount.round,
  }),
}

const LAYER_READING: Readonly<Record<AtlasLayerId, (atlas: PersonAtlas) => Reading>> = { sky, maya, body, number }

const SEPARATOR = ' ·'

function Support({ phrases }: { phrases: readonly string[] | string }) {
  const list = typeof phrases === 'string' ? [phrases] : phrases
  return (
    <span className={d.support}>
      {list.map((phrase, i) => (
        <Fragment key={phrase}>
          <span className={d.phrase}>
            {phrase}
            {i < list.length - 1 && SEPARATOR}
          </span>
          {i < list.length - 1 && ' '}
        </Fragment>
      ))}
    </span>
  )
}

function Face({ name, pin, reading }: { name: string; pin: number | null; reading: Reading }) {
  return (
    <span className={d.face}>
      <span className={d.figure}>
        {reading.figure}
        {pin !== null && (
          <span className={d.pin} aria-hidden>
            {pin}
          </span>
        )}
      </span>
      <span className={d.text}>
        <span className={d.name}>{name}</span>
        <span className={d.strong}>{reading.strong}</span>
        {reading.support && <Support phrases={reading.support} />}
      </span>
    </span>
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
      style={{ '--tiles': entries.length } as CSSProperties}
      role="group"
      aria-label={GROUP_LABEL[mode]}
    >
      {entries.map((entry) => (
        <Tile key={entry.kind === 'layer' ? entry.layer : entry.system} entry={entry} atlas={atlas} focus={focus} onFocus={onFocus} mode={mode} />
      ))}
    </div>
  )
}
