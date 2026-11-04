import type { ReactNode } from 'react'
import { Bodygraph, Box, Curve, Line, Marks, Move, Note, Plate, Ring, Storyboard, Turn, Viewport, type Pt } from '@/components/bento-lab/wireframe/storyboard'
import { DIGEST, LAYER_META, LAYERS_BY_PIN, systemLabel } from '@/lib/atlas/layers'
import { ATLAS_LAYERS } from '@/lib/atlas/types'

/*
 * Motion storyboards, one per home section (BENTO_MOTION.md "Storyboards").
 * Greyscale; blue dashed arrows are the movement; the tag names the engine.
 */

const ATLAS: Pt = [168, 104]
/** The digest's tiles in the lead order, named as the hero names them. */
const TILES = DIGEST.map((entry) => (entry.kind === 'layer' ? LAYER_META[entry.layer].name : systemLabel(entry.system)))
/** The digest column's top and bottom in the storyboard, and the gap between tiles. */
const COLUMN = { top: 22, bottom: 184, gap: 6 } as const
const TILE_H = (COLUMN.bottom - COLUMN.top - COLUMN.gap * (TILES.length - 1)) / TILES.length

function HeroShell({ digest = 0, children }: { digest?: number; children?: ReactNode }) {
  return (
    <g>
      <Viewport label="one viewport" />
      <Box x={14} y={24} w={80} h={9} solid />
      <Box x={14} y={38} w={64} h={5} dashed />
      <Box x={14} y={54} w={80} h={18} label="birth date" />
      <Box x={14} y={78} w={44} h={14} solid />
      {TILES.map((name, i) => (
        <Box key={name} x={256} y={COLUMN.top + i * (TILE_H + COLUMN.gap)} w={52} h={TILE_H} label={name} dashed={i >= digest} />
      ))}
      {children}
    </g>
  )
}

export function HeroStoryboard() {
  return (
    <Storyboard
      id="m-hero"
      layout="Three columns inside one viewport: claim and date, the drawing, the digest tiles"
      code="H"
      title="Hero"
      kind="Illustration + response, fits one viewport"
      still="The map arrives drawn: every ring, seal, channel and pin in place, the four digest tiles filled. A new date swaps positions without travel."
      frames={[
        {
          at: 't = 0 ms',
          engine: 'anime.js',
          caption: 'Claim and date field are readable at first paint. Contour rings draw outward from the centre (draw token, emphasized curve).',
          draw: (
            <HeroShell>
              <Ring c={ATLAS} r={24} drawn={0.8} />
              <Ring c={ATLAS} r={46} drawn={0.45} />
              <Ring c={ATLAS} r={68} drawn={0.15} />
              <Move a={[168, 92]} b={[168, 46]} />
            </HeroShell>
          ),
        },
        {
          at: 't = 300 ms',
          engine: 'anime.js',
          caption: 'The sky ring sweeps one turn into place; the twelve sign marks fade in behind the sweep.',
          draw: (
            <HeroShell>
              <Ring c={ATLAS} r={24} />
              <Ring c={ATLAS} r={46} />
              <Ring c={ATLAS} r={68} drawn={0.7} />
              <Marks c={ATLAS} r={68} count={12} shown={8} />
              <Turn c={ATLAS} r={80} from={200} to={250} />
            </HeroShell>
          ),
        },
        {
          at: 't = 600 ms',
          engine: 'anime.js',
          caption: 'Twenty seals stagger around the Kin ring, 40 ms apart. The birth seal is ringed when the stagger reaches it.',
          draw: (
            <HeroShell digest={1}>
              <Ring c={ATLAS} r={24} />
              <Ring c={ATLAS} r={46} />
              <Ring c={ATLAS} r={68} />
              <Marks c={ATLAS} r={68} count={12} />
              <Marks c={ATLAS} r={46} count={20} shown={13} lit={6} size={3} />
              <Turn c={ATLAS} r={56} from={130} to={190} />
            </HeroShell>
          ),
        },
        {
          at: 't = 1000 ms',
          engine: 'anime.js',
          caption: 'The bodygraph channels fill from the head down and defined centres turn solid. The number tile counts to the life path.',
          draw: (
            <HeroShell digest={3}>
              <Ring c={ATLAS} r={68} />
              <Marks c={ATLAS} r={68} count={12} />
              <Marks c={ATLAS} r={46} count={20} lit={6} size={3} />
              <Bodygraph c={ATLAS} scale={0.42} filled={5} channels={0.6} />
              <Move a={[168, 70]} b={[168, 128]} />
            </HeroShell>
          ),
        },
        {
          at: 't = 1400 ms',
          engine: 'Motion',
          caption: 'Four pins drop onto their layers on the spring token; the digest tiles settle in the same order. All of it sits inside one viewport.',
          draw: (
            <HeroShell digest={TILES.length}>
              <Ring c={ATLAS} r={68} />
              <Marks c={ATLAS} r={68} count={12} />
              <Marks c={ATLAS} r={46} count={20} lit={6} size={3} />
              <Bodygraph c={ATLAS} scale={0.42} />
              {([[118, 52], [214, 60], [200, 150], [126, 152]] as const).map(([x, y], i) => (
                <g key={i}>
                  <Box x={x - 8} y={y - 8} w={16} h={16} label={String(i + 1)} />
                  <Move a={[x, y - 26]} b={[x, y - 11]} />
                </g>
              ))}
            </HeroShell>
          ),
        },
        {
          at: 'new date',
          engine: 'anime.js',
          caption: 'A new birth date turns each ring the short way to its new position (settle token); tile values roll (Motion). Nothing redraws from zero.',
          draw: (
            <HeroShell digest={TILES.length}>
              <Ring c={ATLAS} r={68} />
              <Marks c={ATLAS} r={68} count={12} />
              <Marks c={ATLAS} r={46} count={20} lit={9} size={3} />
              <Bodygraph c={ATLAS} scale={0.42} filled={4} />
              <Turn c={ATLAS} r={78} from={20} to={70} />
              <Turn c={ATLAS} r={56} from={300} to={340} />
              <Move a={[282, 56]} b={[282, 30]} />
            </HeroShell>
          ),
        },
      ]}
    />
  )
}

/** `lit` counts scroll steps, which follow the lead order; the plates stack outside in. */
function Exploded({ open, lit }: { open: number; lit: number }) {
  const step = LAYERS_BY_PIN[lit]
  return (
    <g>
      <Viewport label="pinned" />
      {[...ATLAS_LAYERS].reverse().map((layer, k) => {
        const cy = 118 - k * (open > 0 ? 18 : 2) - (layer === step ? 14 : 0)
        return <Plate key={layer} cx={160} cy={cy} rx={64} lit={layer === step} />
      })}
      {LAYERS_BY_PIN.map((layer, i) => (
        <Box key={layer} x={22 + i * 70} y={160} w={64} h={26} label={LAYER_META[layer].name} solid={i === lit} />
      ))}
    </g>
  )
}

export function LayersStoryboard() {
  return (
    <Storyboard
      id="m-layers"
      layout="Centred: the stack fills the stage, the four digest tiles in one row under it"
      code="2"
      title="Layers"
      kind="Scene, scroll-bound"
      still="The stack stays apart, every layer at full strength; a tile brings its layer forward."
      frames={[
        {
          at: 'scroll 0%',
          engine: 'GSAP',
          caption: 'The section pins on the whole map, face-on: four layers drawn on one another, the digest row under it.',
          draw: <Exploded open={0} lit={-1} />,
        },
        {
          at: 'scroll 25%',
          engine: 'GSAP',
          caption: `The map tilts and parts in depth. ${LAYER_META[LAYERS_BY_PIN[0]].name} lifts first and its tile lights in the row below.`,
          draw: (
            <g>
              <Exploded open={1} lit={0} />
              <Move a={[238, 110]} b={[238, 64]} />
            </g>
          ),
        },
        {
          at: 'scroll 50%',
          engine: 'GSAP',
          caption: `${LAYER_META[LAYERS_BY_PIN[1]].name} lifts and the others dim. One scroll step, one layer.`,
          draw: (
            <g>
              <Exploded open={2} lit={1} />
              <Move a={[238, 96]} b={[238, 70]} />
            </g>
          ),
        },
        {
          at: 'scroll 75%',
          engine: 'GSAP',
          caption: `${LAYER_META[LAYERS_BY_PIN[2]].name} lifts, then ${LAYER_META[LAYERS_BY_PIN[3]].name}. Choosing a tile scrolls to its layer; the star field drifts under the stack.`,
          draw: <Exploded open={3} lit={2} />,
        },
        {
          at: 'scroll 100%',
          engine: 'GSAP',
          caption: 'The layers close back into one map and the pin releases. The reader leaves with the whole atlas, not a fragment.',
          draw: (
            <g>
              <Exploded open={0} lit={-1} />
              <Move a={[238, 60]} b={[238, 100]} />
            </g>
          ),
        },
      ]}
    />
  )
}

const A: Pt = [96, 96]
const B: Pt = [224, 96]

function Pair({ gap, ties = 0, bits = 0 }: { gap: number; ties?: number; bits?: number }) {
  const a: Pt = [A[0] - gap, A[1]]
  const b: Pt = [B[0] + gap, B[1]]
  const marks: readonly (readonly [Pt, Pt, number])[] = [
    [[a[0] + 30, a[1] - 26], [b[0] - 30, b[1] - 26], 44],
    [[a[0] + 38, a[1] + 6], [b[0] - 38, b[1] + 4], 22],
    [[a[0] + 24, a[1] + 32], [b[0] - 26, b[1] + 30], 16],
  ]
  return (
    <g>
      <Ring c={a} r={44} />
      <Marks c={a} r={44} count={20} size={3} />
      <Ring c={b} r={44} />
      <Marks c={b} r={44} count={20} size={3} />
      {marks.slice(0, ties).map(([p, q, lift], i) => (
        <Curve key={i} a={p} b={q} lift={lift} />
      ))}
      {bits > 0 && <Box x={110} y={160} w={100} h={30} label={`${bits} tie rows, bits rolling`} />}
    </g>
  )
}

export function PairStoryboard() {
  return (
    <Storyboard
      id="m-pair"
      layout="Centred: both maps across the full width, the tie rows under them; no side panel"
      code="3"
      title="Two people"
      kind="Scene + illustration"
      still="The pair atlas with every drawable tie already drawn and the tie table filled, rarest first."
      frames={[
        {
          at: 'scroll 0%',
          engine: 'GSAP',
          caption: 'Two atlases enter far apart, each already drawn: two people, two maps.',
          draw: <Pair gap={30} />,
        },
        {
          at: 'scroll 30%',
          engine: 'GSAP',
          caption: 'They slide together until their outer rings nearly touch (transform, scrubbed).',
          draw: (
            <g>
              <Pair gap={10} />
              <Move a={[30, 160]} b={[70, 160]} />
              <Move a={[290, 160]} b={[250, 160]} />
            </g>
          ),
        },
        {
          at: 'enters view',
          engine: 'anime.js',
          caption: 'Tie lines draw mark to mark, rarest first, 40 ms apart. Only ties that pass the edge rule get a line.',
          draw: <Pair gap={0} ties={2} />,
        },
        {
          at: '+ 600 ms',
          engine: 'Motion',
          caption: 'Each tie row settles under the pair with its share of pairs and its bits rolling up to value.',
          draw: <Pair gap={0} ties={3} bits={3} />,
        },
      ]}
    />
  )
}

const HUB: Pt = [160, 100]
const PEOPLE = 7

const seat = (i: number, r: number): Pt => {
  const a = ((i / PEOPLE) * 360 - 90) * (Math.PI / 180)
  return [HUB[0] + r * Math.cos(a), HUB[1] + r * Math.sin(a)]
}

function Circle({ seated, edges = 0, sonar = false }: { seated: number; edges?: number; sonar?: boolean }) {
  const pairs: readonly (readonly [number, number])[] = [[0, 3], [1, 5], [2, 6], [0, 4]]
  return (
    <g>
      <Ring c={HUB} r={64} faint />
      {sonar && <Ring c={HUB} r={84} drawn={1} faint />}
      {pairs.slice(0, edges).map(([i, j], k) => (
        <Line key={k} a={seat(i, 64)} b={seat(j, 64)} bold />
      ))}
      {Array.from({ length: PEOPLE }, (_, i) => {
        const [x, y] = i < seated ? seat(i, 64) : seat(i, 92)
        return <circle key={i} cx={x} cy={y} r={7} fill="var(--wf-paper)" stroke="var(--wf-ink)" strokeWidth={1.2} strokeDasharray={i < seated ? undefined : '3 3'} />
      })}
      <circle cx={HUB[0]} cy={HUB[1]} r={9} fill="var(--wf-ink)" />
    </g>
  )
}

export function CirclesStoryboard() {
  return (
    <Storyboard
      id="m-circles"
      layout="Centred: the ring fills the width, the heaviest pairs as a row under it; no side panel"
      code="4"
      title="Circles"
      kind="Illustration"
      still="The circle drawn: every person seated, the strongest ties drawn, no sonar ring."
      frames={[
        {
          at: 'enters view',
          engine: 'anime.js',
          caption: 'People wait outside the ring. The person with the heaviest ties moves first.',
          draw: (
            <g>
              <Circle seated={0} />
              <Move a={seat(0, 88)} b={seat(0, 70)} />
            </g>
          ),
        },
        {
          at: '+ 300 ms',
          engine: 'anime.js',
          caption: 'They settle into the ring in tie-weight order, 40 ms apart.',
          draw: (
            <g>
              <Circle seated={4} />
              <Move a={seat(4, 88)} b={seat(4, 70)} />
            </g>
          ),
        },
        {
          at: '+ 700 ms',
          engine: 'anime.js',
          caption: 'The strongest ties draw across the ring, heaviest first; the rest stay in the table below.',
          draw: <Circle seated={PEOPLE} edges={3} />,
        },
        {
          at: '+ 1400 ms',
          engine: 'anime.js',
          caption: 'The hub sends one sonar ring outward, once. It does not loop.',
          draw: (
            <g>
              <Circle seated={PEOPLE} edges={4} sonar />
              <Move a={[160, 100]} b={[160, 22]} />
            </g>
          ),
        },
      ]}
    />
  )
}

function Odometer({ x, label, value, rolling }: { x: number; label: string; value: string; rolling?: boolean }) {
  return (
    <g>
      <Note x={x + 32} y={46}>
        {label}
      </Note>
      {rolling && <Box x={x} y={34 + 22} w={64} h={18} dashed />}
      <Box x={x} y={78} w={64} h={34} label={value} />
      {rolling && <Box x={x} y={118} w={64} h={18} dashed />}
      {rolling && <Move a={[x + 70, 128]} b={[x + 70, 64]} />}
    </g>
  )
}

export function DailyStoryboard() {
  return (
    <Storyboard
      id="m-daily"
      layout="One full-width board of tiles, the brief in one line under it"
      code="5"
      title="Every day"
      kind="Response"
      still="Today's values in place; changing the day swaps them without travel."
      frames={[
        {
          at: 'enters view',
          engine: 'Motion',
          caption: "Today's board: kin, moon, sky, number. Values are blank-shaped while they compute, never a spinner.",
          draw: (
            <g>
              {['Kin', 'Moon', 'Sky', 'Number'].map((l, i) => (
                <Odometer key={l} x={14 + i * 76} label={l} value="" />
              ))}
            </g>
          ),
        },
        {
          at: '+ 220 ms',
          engine: 'Motion',
          caption: 'Values roll up into place like an odometer, one tile after another (quick token, 40 ms stagger).',
          draw: (
            <g>
              {(['Kin', 'Moon', 'Sky', 'Number'] as const).map((l, i) => (
                <Odometer key={l} x={14 + i * 76} label={l} value={i < 2 ? ['kin', 'phase'][i] : ''} rolling={i === 2} />
              ))}
            </g>
          ),
        },
        {
          at: '+ 600 ms',
          engine: 'anime.js',
          caption: "The kin glyph turns once to the day's seal; the moon disc fills to its phase.",
          draw: (
            <g>
              {(['Kin', 'Moon', 'Sky', 'Number'] as const).map((l, i) => (
                <Odometer key={l} x={14 + i * 76} label={l} value={['kin', 'phase', 'sign', 'day no.'][i]} />
              ))}
              <Ring c={[46, 160]} r={16} />
              <Turn c={[46, 160]} r={24} from={20} to={110} />
              <Ring c={[122, 160]} r={16} drawn={0.78} />
            </g>
          ),
        },
        {
          at: 'next day',
          engine: 'Motion',
          caption: 'Next day rolls every value upward; previous day rolls them down. The direction says which way time went.',
          draw: (
            <g>
              {(['Kin', 'Moon', 'Sky', 'Number'] as const).map((l, i) => (
                <Odometer key={l} x={14 + i * 76} label={l} value={['kin + 1', 'phase', 'sign', 'day no.'][i]} rolling />
              ))}
            </g>
          ),
        },
      ]}
    />
  )
}

const BARS = [0.92, 0.7, 0.44, 0.22, 0.09] as const

function Rarity({ risen, dropped = 0, threshold }: { risen: number; dropped?: number; threshold?: number }) {
  const base = 150
  return (
    <g>
      <Line a={[20, base]} b={[300, base]} />
      <Note x={20} y={base + 14} anchor="start">
        common
      </Note>
      <Note x={300} y={base + 14} anchor="end">
        rare
      </Note>
      {BARS.map((share, i) => {
        const h = share * 110 * risen
        return <Box key={i} x={34 + i * 54} y={base - h} w={30} h={Math.max(h, 0.5)} solid={threshold !== undefined && 34 + i * 54 >= threshold} />
      })}
      {Array.from({ length: dropped }, (_, i) => (
        <circle key={i} cx={60 + i * 62} cy={28} r={5} fill="var(--wf-ink)" />
      ))}
      {threshold !== undefined && <Line a={[threshold - 6, 20]} b={[threshold - 6, base]} bold />}
    </g>
  )
}

export function MethodStoryboard() {
  return (
    <Storyboard
      id="m-method"
      layout="One full-width chart, the rule in one line under it"
      code="6"
      title="Method"
      kind="Scene, scroll-bound"
      still="The finished chart: measured base rates as bars, the ties on the scale, the line-or-no-line threshold drawn."
      frames={[
        {
          at: 'scroll 0%',
          engine: 'GSAP',
          caption: 'An empty rarity scale, common on the left, rare on the right.',
          draw: <Rarity risen={0} />,
        },
        {
          at: 'scroll 35%',
          engine: 'GSAP',
          caption: 'Measured base rates rise as bars, scrubbed to scroll: how often each kind of tie appears across all measured pairs.',
          draw: (
            <g>
              <Rarity risen={0.7} />
              <Move a={[49, 140]} b={[49, 90]} />
            </g>
          ),
        },
        {
          at: 'scroll 65%',
          engine: 'GSAP',
          caption: "The sample pair's ties drop onto the scale at their weight.",
          draw: (
            <g>
              <Rarity risen={1} dropped={4} />
              <Move a={[122, 36]} b={[122, 80]} />
            </g>
          ),
        },
        {
          at: 'scroll 100%',
          engine: 'GSAP',
          caption: 'The threshold sweeps in from the right. Ties past it earn a line on the map; the rest stay in the table.',
          draw: (
            <g>
              <Rarity risen={1} dropped={4} threshold={194} />
              <Move a={[290, 30]} b={[200, 30]} />
            </g>
          ),
        },
      ]}
    />
  )
}

function Plans({ lifted = -1, rows = 0 }: { lifted?: number; rows?: number }) {
  return (
    <g>
      {[0, 1, 2].map((i) => (
        <Box key={i} x={16 + i * 98} y={i === lifted ? 14 : 20} w={88} h={72} label={['Free', 'Plus', 'Founding'][i]} />
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <Box key={i} x={16} y={100 + i * 18} w={284} h={14} dashed={i >= rows} />
      ))}
    </g>
  )
}

export function PricingStoryboard() {
  return (
    <Storyboard
      id="m-pricing"
      layout="Plans in one row, the ledger full width under them"
      code="7"
      title="Pricing"
      kind="Response"
      still="Plans and the full ledger at rest; hover changes the border only."
      frames={[
        { at: 'at rest', engine: 'still', caption: 'Plans side by side, the ledger below them.', draw: <Plans rows={0} /> },
        {
          at: 'hover',
          engine: 'Motion',
          caption: 'The plan under the pointer lifts 4 px with a tinted shadow (quick token). Press sinks it 1 px (instant).',
          draw: (
            <g>
              <Plans lifted={1} rows={0} />
              <Move a={[158, 30]} b={[158, 14]} />
            </g>
          ),
        },
        {
          at: 'ledger in view',
          engine: 'Motion',
          caption: 'Ledger rows reveal one after another, 40 ms apart, fade and 8 px rise.',
          draw: (
            <g>
              <Plans rows={3} />
              <Move a={[306, 108]} b={[306, 150]} />
            </g>
          ),
        },
      ]}
    />
  )
}

/** The atlas rings for the marks storyboard; `lit` rings one seal, and `dim` greys the rest. */
function MarkRings({ lit, dim = false }: { lit?: number; dim?: boolean }) {
  return (
    <g opacity={dim ? 0.4 : 1}>
      <Ring r={78} />
      <Ring r={58} />
      <Marks r={68} count={12} />
      <Marks r={48} count={20} size={3} lit={dim ? undefined : lit} />
      <Bodygraph scale={0.5} filled={4} channels={2} />
    </g>
  )
}

/** The seal at twelve o'clock on the Kin ring, where the frames below point. */
const SEAL: Pt = [160, 52]

export function AtlasMarksStoryboard() {
  return (
    <Storyboard
      id="m-marks"
      layout="Inside the atlas wherever it is drawn; the card hangs toward the centre, and docks to the far edge under 720 px"
      code="A"
      title="Atlas marks"
      kind="Response"
      still="With motion off the outline ring, the dimming and the card appear at once; nothing is lost."
      frames={[
        { at: 'at rest', engine: 'still', caption: 'Every mark drawn; the pointer is off the drawing.', draw: <MarkRings /> },
        {
          at: 'hover or focus',
          engine: 'CSS',
          caption: 'The nearest mark in reach gets an outline ring that draws itself in (quick, emphasized). Its oracle seats and tone stay lit; the rest dim (quick).',
          draw: (
            <g>
              <MarkRings dim />
              <Marks r={48} count={20} size={3} shown={1} lit={0} />
              <Ring c={SEAL} r={8} />
              <Note x={160} y={30}>
                nearest mark in reach
              </Note>
            </g>
          ),
        },
        {
          at: 'card in',
          engine: 'CSS',
          caption: 'The card fades in, travelling 4 px from the mark toward the centre (quick, standard): layer, label, the value as the strong line, meaning, facts.',
          draw: (
            <g>
              <MarkRings dim />
              <Ring c={SEAL} r={8} />
              <Box x={170} y={58} w={110} h={58} label="card" />
              <Move a={[164, 64]} b={[176, 70]} />
            </g>
          ),
        },
        {
          at: 'kept, narrow',
          engine: 'CSS',
          caption: 'A tap, click or Enter keeps the card; its edge takes the layer colour. Under 720 px it docks to the edge away from its mark. Escape or a press outside lets it go.',
          draw: (
            <g>
              <MarkRings dim />
              <Ring c={SEAL} r={8} />
              <Box x={60} y={150} w={200} h={36} solid label="kept card" />
            </g>
          ),
        },
      ]}
    />
  )
}

function Faq({ open }: { open: number }) {
  return (
    <g>
      {[0, 1, 2, 3].map((i) => {
        const y = 20 + i * 34 + (open >= 0 && i > open ? 44 : 0)
        return (
          <g key={i}>
            <Box x={20} y={y} w={280} h={26} label={`question ${i + 1}`} />
            {i === open && <Box x={30} y={y + 30} w={260} h={36} dashed label="answer" />}
          </g>
        )
      })}
    </g>
  )
}

export function FaqStoryboard() {
  return (
    <Storyboard
      id="m-faq"
      layout="One centred column"
      code="8"
      title="FAQ"
      kind="Response"
      still="Answers open and close at once."
      frames={[
        { at: 'closed', engine: 'still', caption: 'Questions only.', draw: <Faq open={-1} /> },
        {
          at: 'open',
          engine: 'Motion',
          caption: 'The answer opens with height and fade together (settle token, standard curve), no bounce; rows below move with layout.',
          draw: (
            <g>
              <Faq open={1} />
              <Move a={[160, 100]} b={[160, 128]} />
            </g>
          ),
        },
      ]}
    />
  )
}

export function CloseStoryboard() {
  return (
    <Storyboard
      id="m-close"
      layout="Centred over the artwork"
      code="9"
      title="Close"
      kind="Scene, scroll-bound"
      still="The portal artwork at rest behind one action."
      frames={[
        {
          at: 'scroll 0%',
          engine: 'GSAP',
          caption: 'The portal artwork sits behind the closing line at its rest scale.',
          draw: (
            <g>
              <Ring r={60} faint />
              <Ring r={40} faint />
              <Box x={100} y={150} w={120} h={20} dashed />
            </g>
          ),
        },
        {
          at: 'scroll 60%',
          engine: 'GSAP',
          caption: 'The artwork pushes in as the page ends (scale, scrubbed); the closing line rises into place.',
          draw: (
            <g>
              <Ring r={84} faint />
              <Ring r={60} faint />
              <Box x={100} y={150} w={120} h={20} />
              <Move a={[160, 40]} b={[160, 14]} />
            </g>
          ),
        },
        {
          at: 'scroll 100%',
          engine: 'Motion',
          caption: 'One action, solid. It responds to press like every button; nothing else moves.',
          draw: (
            <g>
              <Ring r={92} faint />
              <Ring r={68} faint />
              <Box x={110} y={90} w={100} h={24} solid />
            </g>
          ),
        },
      ]}
    />
  )
}

export const MOTION_INDEX = [
  ['m-hero', 'H Hero'],
  ['m-marks', 'A Atlas marks'],
  ['m-layers', '2 Layers'],
  ['m-pair', '3 Two people'],
  ['m-circles', '4 Circles'],
  ['m-daily', '5 Every day'],
  ['m-method', '6 Method'],
  ['m-pricing', '7 Pricing'],
  ['m-faq', '8 FAQ'],
  ['m-close', '9 Close'],
] as const

export function MotionStoryboards() {
  return (
    <>
      <HeroStoryboard />
      <AtlasMarksStoryboard />
      <LayersStoryboard />
      <PairStoryboard />
      <CirclesStoryboard />
      <DailyStoryboard />
      <MethodStoryboard />
      <PricingStoryboard />
      <FaqStoryboard />
      <CloseStoryboard />
    </>
  )
}
