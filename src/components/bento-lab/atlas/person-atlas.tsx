import type { CSSProperties, ReactNode } from 'react'
import { ZODIAC_SIGNS } from '@pleiad/engine/data/zodiac-signs'
import { SEALS } from '@pleiad/engine/data/seals'
import s from './atlas.module.css'
import { arcPath, bodyTransform, C, polar, RING, sealAngle, skyAngle, type Point } from './geometry'
import {
  HALO_GAP,
  MARK_SIZE,
  planetPlacements,
  planetPoint,
  RISING_LABEL,
  RISING_LINE,
  SEAL_RADIUS,
  sealPoint,
  sealStyle,
  signPoint,
  TONE_POINT,
  type PlacedMark,
} from './mark-geometry'
import {
  CENTER_POSITIONS,
  CHANNEL_PATHS,
  GATE_MOUTHS,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  getCenterPath,
  pointsToPath,
} from '@/components/human-design/bodygraph-layout'
import { loneGates, markKey, seatsOf } from '@/lib/atlas/marks'
import type { AtlasLayerId, PersonAtlas, SkyLayer, MayaLayer, BodyLayer } from '@/lib/atlas/types'
import { needsLabel } from '@/lib/atlas/readout'
import { sealGlyphSrc, signGlyphSrc } from '@/lib/design/glyph-paths'

const SEAL_COUNT = 20

/** The active mark and the marks lit with it (BENTO_SITE.md, "Marks explain themselves"). */
export interface MarkHighlight {
  readonly active: PlacedMark
  readonly related: ReadonlySet<string>
}

type Lit = MarkHighlight | null

const stateOf = (lit: Lit, key: string): 'active' | 'related' | undefined =>
  !lit ? undefined : lit.active.key === key ? 'active' : lit.related.has(key) ? 'related' : undefined

/** One mark's own group: it carries the mark's key and state, apart from the entrance group around it. */
const Mark = ({ id, lit, children }: { readonly id: string; readonly lit: Lit; readonly children: ReactNode }) => (
  <g className={s.mark} data-mark={id} data-state={stateOf(lit, id)}>
    {children}
  </g>
)

/** On narrow screens the drawing zooms to the focused layer: two rings at a time. */
const ZOOM: Readonly<Record<AtlasLayerId, number>> = {
  sky: 1,
  maya: RING.skyOuter / RING.mayaOuter,
  body: RING.skyOuter / RING.mayaOuter,
  number: RING.skyOuter / RING.mayaOuter,
}

const at = (p: Point) => ({ x: p[0], y: p[1] })

/** A sibling's place in its set, read by the first-paint entrance in atlas.module.css. */
const order = (i: number): CSSProperties => ({ '--i': i }) as CSSProperties

const Glyph = ({ href, point, size, on }: { href: string; point: Point; size: number; on?: boolean }) => (
  <image
    href={href}
    x={point[0] - size / 2}
    y={point[1] - size / 2}
    width={size}
    height={size}
    className={on ? s.glyphOn : s.glyph}
  />
)

/**
 * The outline ring round the active point mark, standing off it by the
 * surface gap. It sits inside its layer's group, so a ring still turning to a
 * new date carries it with the mark. A line mark lights its stroke instead.
 */
function Halo({ lit, layer }: { readonly lit: Lit; readonly layer: AtlasLayerId }) {
  const mark = lit?.active
  if (!mark || mark.layer !== layer || mark.path) return null
  return <circle key={mark.key} cx={mark.anchor[0]} cy={mark.anchor[1]} r={mark.r + HALO_GAP} className={s.halo} data-layer={layer} pathLength={1} />
}

function Sky({ sky, lit }: { sky: SkyLayer; lit: Lit }) {
  const asc = sky.ascendant
  const placed = planetPlacements(sky)
  return (
    <g className={s.layer} data-layer="sky">
      <circle cx={C} cy={C} r={RING.skyOuter} className={`${s.ring} ${s.draw}`} pathLength={1} />
      <circle cx={C} cy={C} r={RING.skyInner} className={`${s.ring} ${s.draw}`} pathLength={1} />
      {ZODIAC_SIGNS.map((sign) => {
        const start = skyAngle((sign.number - 1) * 30, asc)
        const [x1, y1] = polar(RING.skyInner, start)
        const [x2, y2] = polar(RING.skyOuter, start)
        return (
          <g key={sign.id} className={s.enterSign} style={order(sign.number - 1)}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} className={s.divider} />
            <Mark id={markKey({ kind: 'sign', id: sign.id })} lit={lit}>
              <Glyph href={signGlyphSrc(sign.number, sign.name)} point={signPoint(sign.number, asc)} size={MARK_SIZE.sign} />
            </Mark>
          </g>
        )
      })}
      {sky.bodies.map((b) =>
        b.arc && Math.abs(b.arc[1] - b.arc[0]) >= 1 ? (
          <Mark key={`arc-${b.id}`} id={markKey({ kind: 'planet', id: b.id })} lit={lit}>
            <path d={arcPath(RING.arcTrack, skyAngle(b.arc[0], asc), skyAngle(b.arc[1], asc))} className={s.dayArc} />
          </Mark>
        ) : null,
      )}
      {placed.map((p, i) => {
        const [x1, y1] = polar(RING.skyInner, p.truth)
        const [x2, y2] = polar(RING.planetTrack + MARK_SIZE.planet * 0.7, p.shown)
        const point = planetPoint(p)
        return (
          <g key={p.body.id} className={s.enterSign} style={order(i)}>
            <Mark id={markKey({ kind: 'planet', id: p.body.id })} lit={lit}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} className={s.planetLead} />
              <circle {...{ cx: x1, cy: y1 }} r={2.2} className={s.planetDot} />
              {p.body.src ? (
                <Glyph href={p.body.src} point={point} size={MARK_SIZE.planet} />
              ) : (
                <text {...at(point)} className={s.symbol}>
                  {p.body.symbol}
                </text>
              )}
            </Mark>
          </g>
        )
      })}
      {asc !== null && (
        <Mark id={markKey({ kind: 'rising' })} lit={lit}>
          <line {...lineProps(...RISING_LINE)} className={s.ascendant} strokeWidth={MARK_SIZE.risingStroke} />
          <text {...at(RISING_LABEL)} className={s.label} textAnchor="middle">
            Asc
          </text>
        </Mark>
      )}
      <Halo lit={lit} layer="sky" />
    </g>
  )
}

const lineProps = ([x1, y1]: Point, [x2, y2]: Point) => ({ x1, y1, x2, y2 })

/** The Dreamspell tone in bar-and-dot notation, centred on `point`. */
export function ToneMark({ tone, point }: { readonly tone: number; readonly point: Point }) {
  const bars = Math.floor(tone / 5)
  const dots = tone % 5
  const w = MARK_SIZE.toneWidth
  const step = MARK_SIZE.toneStep
  const top = point[1] - ((bars + (dots > 0 ? 1 : 0)) * step) / 2
  return (
    <g>
      {Array.from({ length: dots }, (_, i) => (
        <circle key={`d${i}`} cx={point[0] + (i - (dots - 1) / 2) * 4} cy={top + 1.5} r={1.6} className={s.toneMark} />
      ))}
      {Array.from({ length: bars }, (_, i) => (
        <rect
          key={`b${i}`}
          x={point[0] - w / 2}
          y={top + (dots > 0 ? step : 0) + i * step}
          width={w}
          height={2.4}
          rx={1.2}
          className={s.toneMark}
        />
      ))}
    </g>
  )
}

function Maya({ maya, lit }: { maya: MayaLayer; lit: Lit }) {
  const own = maya.seal.n
  const seats = seatsOf(maya)
  return (
    <g className={s.layer} data-layer="maya">
      <circle cx={C} cy={C} r={RING.mayaOuter} className={`${s.ring} ${s.draw}`} pathLength={1} />
      <circle cx={C} cy={C} r={RING.mayaInner} className={`${s.ring} ${s.draw}`} pathLength={1} />
      {SEALS.map((seal) => {
        const angle = sealAngle(seal.number, own)
        const point = sealPoint(seal.number, own)
        const style = sealStyle(seal.number, own, seats)
        return (
          <g key={seal.number} className={s.enterSeal} style={order(seal.number - 1)}>
            <line {...lineProps(polar(RING.mayaInner, angle + 180 / SEAL_COUNT), polar(RING.mayaOuter, angle + 180 / SEAL_COUNT))} className={s.divider} />
            <Mark id={markKey({ kind: 'seal', n: seal.number })} lit={lit}>
              {style === 'own' && <circle cx={point[0]} cy={point[1]} r={SEAL_RADIUS.own} className={s.litSeal} />}
              {style === 'seat' && <circle cx={point[0]} cy={point[1]} r={SEAL_RADIUS.seat} className={s.seat} />}
              <Glyph href={sealGlyphSrc(seal.number, seal.english)} point={point} size={MARK_SIZE.seal} on={style === 'own'} />
            </Mark>
          </g>
        )
      })}
      <Mark id={markKey({ kind: 'tone' })} lit={lit}>
        <ToneMark tone={maya.tone.n} point={TONE_POINT} />
      </Mark>
      <Halo lit={lit} layer="maya" />
    </g>
  )
}

/** Channels, centres and lone gates in bodygraph-layout coordinates; defined parts filled. */
function BodyMarks({ body, lit = null }: { readonly body: BodyLayer | null; readonly lit?: Lit }) {
  const active = new Set(body?.channels.map((c) => c.id) ?? [])
  const defined = new Set(body?.definedCenters ?? [])
  return (
    <>
      {Object.entries(CHANNEL_PATHS).map(([id, points]) =>
        active.has(id) ? (
          <Mark key={id} id={markKey({ kind: 'channel', id })} lit={lit}>
            <path d={pointsToPath(points)} className={`${s.channelOn} ${s.drawLate}`} strokeWidth={MARK_SIZE.channelStroke} pathLength={1} />
          </Mark>
        ) : (
          <path key={id} d={pointsToPath(points)} className={s.channel} strokeWidth={MARK_SIZE.channelStroke} />
        ),
      )}
      {Object.entries(CENTER_POSITIONS).map(([id, pos], i) => (
        <Mark key={id} id={markKey({ kind: 'centre', id: id as keyof typeof CENTER_POSITIONS })} lit={lit}>
          <path
            d={getCenterPath(pos)}
            className={`${defined.has(id as keyof typeof CENTER_POSITIONS) ? s.centerOn : s.center} ${s.enterCenter}`}
            style={order(i)}
          />
        </Mark>
      ))}
      {(body ? loneGates(body) : [])
        .filter((g) => GATE_MOUTHS[g])
        .map((g) => (
          <Mark key={g} id={markKey({ kind: 'gate', n: g })} lit={lit}>
            <circle cx={GATE_MOUTHS[g][0]} cy={GATE_MOUTHS[g][1]} r={MARK_SIZE.gateDot} className={s.gate} />
          </Mark>
        ))}
    </>
  )
}

/** The bodygraph on its own, for tiles and digests; the atlas places the same marks inside its rings. */
export function BodygraphFigure({ body, className }: { readonly body: BodyLayer | null; readonly className?: string }) {
  return (
    <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} className={[s.bodyFigure, className].filter(Boolean).join(' ')} aria-hidden>
      <BodyMarks body={body} />
    </svg>
  )
}

function Body({ body, needs, lit }: { body: BodyLayer | null; needs: PersonAtlas['bodyNeeds']; lit: Lit }) {
  return (
    <g className={s.layer} data-layer="body">
      <g transform={bodyTransform}>
        <BodyMarks body={body} lit={lit} />
      </g>
      {!body && needs && (
        <text x={C} y={C + 4} className={s.empty}>
          {needsLabel(needs)}
        </text>
      )}
      <Halo lit={lit} layer="body" />
    </g>
  )
}

const NUMBER_SEATS = [
  ['Birthday', 210],
  ['Expression', 330],
  ['Year', 90],
] as const

/** The number layer as a ring: the life path at the centre, three more numbers around it. */
function NumberRing({ number }: { number: PersonAtlas['number'] }) {
  const values: Readonly<Record<(typeof NUMBER_SEATS)[number][0], number | null>> = {
    Birthday: number.birthday,
    Expression: number.expression,
    Year: number.personalYear,
  }
  return (
    <g className={s.layer} data-layer="number">
      <circle cx={C} cy={C} r={RING.bodyRadius} className={s.ring} />
      <text x={C} y={C + 34} className={s.numberBig}>
        {number.lifePath}
      </text>
      <text x={C} y={C + 70} className={s.label} textAnchor="middle">
        Life path
      </text>
      {NUMBER_SEATS.map(([label, angle]) => {
        const [x, y] = polar(RING.bodyRadius * 0.72, angle)
        return (
          <g key={label}>
            <text x={x} y={y + 8} className={s.numberSmall}>
              {values[label] ?? '–'}
            </text>
            <text x={x} y={y + 30} className={s.label} textAnchor="middle">
              {label}
            </text>
          </g>
        )
      })}
    </g>
  )
}

/** One layer drawn on its own in atlas coordinates, for the exploded view; stacked, the four make the whole map. */
export function LayerPlate({ atlas, layer, className }: { readonly atlas: PersonAtlas; readonly layer: AtlasLayerId; readonly className?: string }) {
  return (
    <svg viewBox={`0 0 ${C * 2} ${C * 2}`} className={[s.svg, s.tokens, className].filter(Boolean).join(' ')} aria-hidden>
      {layer === 'sky' && <Sky sky={atlas.sky} lit={null} />}
      {layer === 'maya' && <Maya maya={atlas.maya} lit={null} />}
      {layer === 'body' && <Body body={atlas.body} needs={atlas.bodyNeeds} lit={null} />}
      {layer === 'number' && <NumberRing number={atlas.number} />}
    </svg>
  )
}

/** The three drawn rings in atlas coordinates (0..640), for nesting in pair and circle views. */
export function AtlasLayers({ atlas, lit = null }: { readonly atlas: PersonAtlas; readonly lit?: Lit }) {
  return (
    <>
      <Sky sky={atlas.sky} lit={lit} />
      <Maya maya={atlas.maya} lit={lit} />
      <Body body={atlas.body} needs={atlas.bodyNeeds} lit={lit} />
    </>
  )
}

export interface PersonAtlasProps {
  readonly atlas: PersonAtlas
  readonly focus?: AtlasLayerId | null
  /** The mark being read and the marks lit with it. */
  readonly highlight?: MarkHighlight | null
  /** id of the element holding the text readout. */
  readonly describedBy?: string
  readonly className?: string
  /** Laid over the drawing, inside its box: the mark targets. */
  readonly children?: ReactNode
}

/** One person's map: sky, Maya ring, bodygraph. The number layer is drawn by NumberStrip. */
export function PersonAtlasDrawing({ atlas, focus = null, highlight = null, describedBy, className, children }: PersonAtlasProps) {
  const who = atlas.input.name ?? atlas.input.date
  const label = `Atlas for ${who}: kin ${atlas.maya.kin} ${atlas.maya.title}${atlas.body ? `, ${atlas.body.type} ${atlas.body.profile}` : ''}`
  return (
    <div
      className={[s.atlas, className].filter(Boolean).join(' ')}
      data-focus={focus ?? undefined}
      data-inspect={highlight ? '' : undefined}
      style={{ '--atlas-zoom': ZOOM[focus ?? 'body'] } as CSSProperties}
    >
      <svg viewBox={`0 0 ${C * 2} ${C * 2}`} className={s.svg} role="img" aria-label={label} aria-describedby={describedBy}>
        <g className={s.zoom} data-zoom="">
          <AtlasLayers atlas={atlas} lit={highlight} />
        </g>
      </svg>
      {children}
    </div>
  )
}
