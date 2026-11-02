import type { CSSProperties } from 'react'
import { ZODIAC_SIGNS } from '@pleiad/engine/data/zodiac-signs'
import { SEALS } from '@pleiad/engine/data/seals'
import s from './atlas.module.css'
import {
  arcPath,
  bodyTransform,
  C,
  polar,
  RING,
  sealAngle,
  skyAngle,
  spreadAngles,
  type Point,
} from './geometry'
import {
  CENTER_POSITIONS,
  CHANNEL_PATHS,
  GATE_MOUTHS,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  getCenterPath,
  pointsToPath,
} from '@/components/human-design/bodygraph-layout'
import type { AtlasLayerId, PersonAtlas, SkyLayer, MayaLayer, BodyLayer } from '@/lib/atlas/types'
import { needsLabel } from '@/lib/atlas/readout'
import { sealGlyphSrc, signGlyphSrc } from '@/lib/design/glyph-paths'

const SIGN_GLYPH = 18
const PLANET_GLYPH = 19
const SEAL_GLYPH = 22
const PLANET_GAP = 8
const SEAL_COUNT = 20

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

function Sky({ sky }: { sky: SkyLayer }) {
  const asc = sky.ascendant
  const shown = spreadAngles(
    sky.bodies.map((b) => skyAngle(b.longitude, asc)),
    PLANET_GAP,
  )
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
            <Glyph
              href={signGlyphSrc(sign.number, sign.name)}
              point={polar(RING.signTrack, skyAngle((sign.number - 1) * 30 + 15, asc))}
              size={SIGN_GLYPH}
            />
          </g>
        )
      })}
      {sky.bodies.map((b) =>
        b.arc && Math.abs(b.arc[1] - b.arc[0]) >= 1 ? (
          <path key={`arc-${b.id}`} d={arcPath(RING.arcTrack, skyAngle(b.arc[0], asc), skyAngle(b.arc[1], asc))} className={s.dayArc} />
        ) : null,
      )}
      {sky.bodies.map((b, i) => {
        const truth = skyAngle(b.longitude, asc)
        const [x1, y1] = polar(RING.skyInner, truth)
        const [x2, y2] = polar(RING.planetTrack + PLANET_GLYPH * 0.7, shown[i])
        const point = polar(RING.planetTrack, shown[i])
        return (
          <g key={b.id} className={s.enterSign} style={order(i)}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} className={s.planetLead} />
            <circle {...{ cx: x1, cy: y1 }} r={2.2} className={s.planetDot} />
            {b.src ? (
              <Glyph href={b.src} point={point} size={PLANET_GLYPH} />
            ) : (
              <text {...at(point)} className={s.symbol}>
                {b.symbol}
              </text>
            )}
          </g>
        )
      })}
      {asc !== null && (
        <g>
          <line {...lineProps(polar(RING.skyOuter, 180), polar(RING.mayaOuter, 180))} className={s.ascendant} />
          <text {...at(polar(RING.arcTrack, 186))} className={s.label} textAnchor="middle">
            Asc
          </text>
        </g>
      )}
    </g>
  )
}

const lineProps = ([x1, y1]: Point, [x2, y2]: Point) => ({ x1, y1, x2, y2 })

/** The Dreamspell tone in bar-and-dot notation, centred on `point`. */
export function ToneMark({ tone, point }: { readonly tone: number; readonly point: Point }) {
  const bars = Math.floor(tone / 5)
  const dots = tone % 5
  const w = 16
  const step = 4
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

function Maya({ maya }: { maya: MayaLayer }) {
  const lit = maya.seal.n
  const seats = new Set([maya.oracle.guide.n, maya.oracle.analog.n, maya.oracle.antipode.n, maya.oracle.occult.n])
  return (
    <g className={s.layer} data-layer="maya">
      <circle cx={C} cy={C} r={RING.mayaOuter} className={`${s.ring} ${s.draw}`} pathLength={1} />
      <circle cx={C} cy={C} r={RING.mayaInner} className={`${s.ring} ${s.draw}`} pathLength={1} />
      {SEALS.map((seal) => {
        const angle = sealAngle(seal.number, lit)
        const point = polar(RING.sealTrack, angle)
        const isLit = seal.number === lit
        return (
          <g key={seal.number} className={s.enterSeal} style={order(seal.number - 1)}>
            <line {...lineProps(polar(RING.mayaInner, angle + 180 / SEAL_COUNT), polar(RING.mayaOuter, angle + 180 / SEAL_COUNT))} className={s.divider} />
            {isLit && <circle cx={point[0]} cy={point[1]} r={SEAL_GLYPH * 0.85} className={s.litSeal} />}
            {seats.has(seal.number) && !isLit && (
              <circle cx={point[0]} cy={point[1]} r={SEAL_GLYPH * 0.72} className={s.seat} />
            )}
            <Glyph href={sealGlyphSrc(seal.number, seal.english)} point={point} size={SEAL_GLYPH} on={isLit} />
          </g>
        )
      })}
      <ToneMark tone={maya.tone.n} point={polar(RING.mayaOuter + 9, 90)} />
    </g>
  )
}

/** Channels, centres and lone gates in bodygraph-layout coordinates; defined parts filled. */
function BodyMarks({ body }: { readonly body: BodyLayer | null }) {
  const active = new Set(body?.channels.map((c) => c.id) ?? [])
  const defined = new Set(body?.definedCenters ?? [])
  const inChannel = new Set(body?.channels.flatMap((c) => c.gates) ?? [])
  return (
    <>
      {Object.entries(CHANNEL_PATHS).map(([id, points]) =>
        active.has(id) ? (
          <path key={id} d={pointsToPath(points)} className={`${s.channelOn} ${s.drawLate}`} pathLength={1} />
        ) : (
          <path key={id} d={pointsToPath(points)} className={s.channel} />
        ),
      )}
      {Object.entries(CENTER_POSITIONS).map(([id, pos], i) => (
        <path
          key={id}
          d={getCenterPath(pos)}
          className={`${defined.has(id as keyof typeof CENTER_POSITIONS) ? s.centerOn : s.center} ${s.enterCenter}`}
          style={order(i)}
        />
      ))}
      {(body?.gates ?? [])
        .filter((g) => !inChannel.has(g) && GATE_MOUTHS[g])
        .map((g) => (
          <circle key={g} cx={GATE_MOUTHS[g][0]} cy={GATE_MOUTHS[g][1]} r={5} className={s.gate} />
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

function Body({ body, needs }: { body: BodyLayer | null; needs: PersonAtlas['bodyNeeds'] }) {
  return (
    <g className={s.layer} data-layer="body">
      <g transform={bodyTransform}>
        <BodyMarks body={body} />
      </g>
      {!body && needs && (
        <text x={C} y={C + 4} className={s.empty}>
          {needsLabel(needs)}
        </text>
      )}
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
      {layer === 'sky' && <Sky sky={atlas.sky} />}
      {layer === 'maya' && <Maya maya={atlas.maya} />}
      {layer === 'body' && <Body body={atlas.body} needs={atlas.bodyNeeds} />}
      {layer === 'number' && <NumberRing number={atlas.number} />}
    </svg>
  )
}

/** The three drawn rings in atlas coordinates (0..640), for nesting in pair and circle views. */
export function AtlasLayers({ atlas }: { readonly atlas: PersonAtlas }) {
  return (
    <>
      <Sky sky={atlas.sky} />
      <Maya maya={atlas.maya} />
      <Body body={atlas.body} needs={atlas.bodyNeeds} />
    </>
  )
}

export interface PersonAtlasProps {
  readonly atlas: PersonAtlas
  readonly focus?: AtlasLayerId | null
  /** id of the element holding the text readout. */
  readonly describedBy?: string
  readonly className?: string
}

/** One person's map: sky, Maya ring, bodygraph. The number layer is drawn by NumberStrip. */
export function PersonAtlasDrawing({ atlas, focus = null, describedBy, className }: PersonAtlasProps) {
  const who = atlas.input.name ?? atlas.input.date
  const label = `Atlas for ${who}: kin ${atlas.maya.kin} ${atlas.maya.title}${atlas.body ? `, ${atlas.body.type} ${atlas.body.profile}` : ''}`
  return (
    <div
      className={[s.atlas, className].filter(Boolean).join(' ')}
      data-focus={focus ?? undefined}
      style={{ '--atlas-zoom': ZOOM[focus ?? 'body'] } as CSSProperties}
    >
      <svg viewBox={`0 0 ${C * 2} ${C * 2}`} className={s.svg} role="img" aria-label={label} aria-describedby={describedBy}>
        <g className={s.zoom}>
          <AtlasLayers atlas={atlas} />
        </g>
      </svg>
    </div>
  )
}
