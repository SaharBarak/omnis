'use client'

import type { CSSProperties, ReactNode } from 'react'
import { getZodiacSignFromLongitude } from '@pleiad/engine/data/zodiac-signs'
import d from './digest.module.css'
import s from './atlas.module.css'
import { BodygraphFigure, ToneMark } from './person-atlas'
import { Rolling } from '../motion/rolling'
import { LAYER_META } from '@/lib/atlas/layers'
import { needsLabel } from '@/lib/atlas/readout'
import type { AtlasLayerId, GlyphRef, MayaLayer, PersonAtlas } from '@/lib/atlas/types'
import { signGlyphSrc } from '@/lib/design/glyph-paths'

/** A glyph drawn in the current colour, so it takes its layer's colour in every palette. A number is px; a string is any CSS length, such as a type role. */
const Mark = ({ src, size }: { src: string; size: number | string }) => (
  <span className={d.mark} style={{ '--src': `url("${src}")`, '--size': typeof size === 'number' ? `${size}px` : size } as CSSProperties} aria-hidden />
)

/** The sky's signs stand where the other tiles set their figures, so they take the figure's size. */
const SIGN_SIZE = 'var(--type-figure)'

/**
 * How a tile acts: `toggle` brings its layer forward and a second press lets
 * it go (a pressed state); `travel` takes the reader to its layer (the layers
 * scene), so the current one is marked as the step, not as pressed.
 */
export type DigestMode = 'toggle' | 'travel'

interface TileProps {
  readonly layer: AtlasLayerId
  readonly focus: AtlasLayerId | null
  readonly onFocus: (next: AtlasLayerId | null) => void
  readonly mode: DigestMode
  readonly children: ReactNode
}

function Tile({ layer, focus, onFocus, mode, children }: TileProps) {
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
      <span className={d.head}>
        <span className={d.pin} aria-hidden>
          {meta.pin}
        </span>
        {meta.name}
      </span>
      {children}
    </button>
  )
}

const signAt = (longitude: number): GlyphRef => {
  const sign = getZodiacSignFromLongitude(longitude)
  return { n: sign.number, name: sign.name, src: signGlyphSrc(sign.number, sign.name) }
}

function SkyArt({ atlas }: { atlas: PersonAtlas }) {
  const body = (id: string) => atlas.sky.bodies.find((b) => b.id === id)?.sign ?? null
  const trio: readonly (readonly [string, GlyphRef | null])[] = [
    ['Sun', body('sun')],
    ['Moon', body('moon')],
    ['Rising', atlas.sky.ascendant === null ? null : signAt(atlas.sky.ascendant)],
  ]
  return (
    <span className={d.trio}>
      {trio.map(([role, sign]) => (
        <span key={role} className={d.cell}>
          {sign ? <Mark src={sign.src} size={SIGN_SIZE} /> : <span className={d.markEmpty} aria-hidden />}
          <span className={d.value}>{sign?.name ?? 'Needs time'}</span>
          <span className={d.label}>{role}</span>
        </span>
      ))}
    </span>
  )
}

const SEATS = ['guide', 'antipode', 'self', 'analog', 'occult'] as const

function KinArt({ maya }: { maya: MayaLayer }) {
  const seal = (seat: (typeof SEATS)[number]): GlyphRef => (seat === 'self' ? maya.seal : maya.oracle[seat])
  return (
    <span className={d.kin}>
      <span className={d.cross}>
        {SEATS.map((seat) => (
          <span key={seat} className={d.seat} data-seat={seat}>
            <Mark src={seal(seat).src} size={seat === 'self' ? 24 : 19} />
          </span>
        ))}
      </span>
      <span className={d.kinText}>
        <svg viewBox="0 0 24 20" className={d.tone} aria-hidden>
          <ToneMark tone={maya.tone.n} point={[12, 10]} />
        </svg>
        <Rolling value={maya.kin} className={d.numeral} />
        <span className={d.value}>{maya.title}</span>
      </span>
    </span>
  )
}

const PROFILE = /^(\d\/\d)\s*(.*)$/

function BodyArt({ atlas }: { atlas: PersonAtlas }) {
  const body = atlas.body
  const [, numerals, name] = body?.profile.match(PROFILE) ?? [null, null, body?.profile ?? '']
  return (
    <span className={d.body}>
      <BodygraphFigure body={body} className={d.figure} />
      <span className={d.bodyText}>
        {body ? (
          <>
            <Rolling value={numerals ?? body.profile} className={d.numeral} />
            <span className={d.value}>{body.type}</span>
            {name && <span className={d.label}>{name}</span>}
          </>
        ) : (
          <span className={d.value}>{needsLabel(atlas.bodyNeeds ?? 'time-and-place')}</span>
        )}
      </span>
    </span>
  )
}

function NumberArt({ atlas }: { atlas: PersonAtlas }) {
  const n = atlas.number
  const small: readonly (readonly [string, number | null])[] = [
    ['Birthday', n.birthday],
    ['Expression', n.expression],
    ['Year', n.personalYear],
  ]
  return (
    <span className={d.numbers}>
      <span className={d.lifePath}>
        <Rolling value={n.lifePath} className={d.numeral} />
        <span className={d.label}>Life path</span>
      </span>
      <span className={d.smallRow}>
        {small.map(([label, value]) => (
          <span key={label} className={d.cell}>
            <Rolling value={value ?? '–'} className={d.numeralSmall} />
            <span className={d.label}>{label}</span>
          </span>
        ))}
      </span>
    </span>
  )
}

const GROUP_LABEL: Readonly<Record<DigestMode, string>> = {
  toggle: 'Map at a glance; choose a layer to bring it forward',
  travel: 'Map at a glance; choose a layer to go to it',
}

/**
 * The atlas at a glance, one visual tile per layer, numbered like the pins
 * on the drawing. A tile brings its layer forward, or in `travel` mode takes
 * the reader to it; the full text readout stays available to assistive tech
 * through the drawing's description.
 */
export function AtlasDigest({
  atlas,
  focus,
  onFocus,
  mode = 'toggle',
  className,
}: {
  readonly atlas: PersonAtlas
  readonly focus: AtlasLayerId | null
  readonly onFocus: (next: AtlasLayerId | null) => void
  readonly mode?: DigestMode
  readonly className?: string
}) {
  const tile = { focus, onFocus, mode }
  return (
    <div className={[d.digest, s.tokens, className].filter(Boolean).join(' ')} role="group" aria-label={GROUP_LABEL[mode]}>
      <Tile layer="sky" {...tile}>
        <SkyArt atlas={atlas} />
      </Tile>
      <Tile layer="maya" {...tile}>
        <KinArt maya={atlas.maya} />
      </Tile>
      <Tile layer="body" {...tile}>
        <BodyArt atlas={atlas} />
      </Tile>
      <Tile layer="number" {...tile}>
        <NumberArt atlas={atlas} />
      </Tile>
    </div>
  )
}
