'use client'

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import type { AnimationParams } from 'animejs'
import { m, useInView, type Variants } from 'framer-motion'
import { mayDrawEdge } from '@pleiad/engine/services/rarity'
import type { SceneAction } from './action'
import f from './figure.module.css'
import p from './pair.module.css'
import kit from '../kit.module.css'
import { PrimaryAction } from '../site/action'
import { PairDrawing, TieTable } from '@/components/bento-lab/atlas'
import { TIE_LAYER, tieStroke } from '@/components/bento-lab/atlas/tie-geometry'
import { drawStroke, landsAt, Rolling, undrawnStroke, useIllustration, useMotionAllowed, useScene } from '@/components/bento-lab/motion'
import type { PairAtlas } from '@/lib/atlas/types'
import { CURVE, DURATION, seconds, staggerStep } from '@/lib/design/motion-tokens'
import { centerName, type Tie } from '@/lib/relations/pair-ties'
import { tieBits, tieName, tieOdds } from '@/lib/relations/tie-text'

/** The maps sit side by side, outer rings nearly touching (the drawing's own margin). */
const GAP = 0
/** How far each map starts from its seat, as a share of the drawing's width (or height, stacked). */
const SPREAD = 0.15
/** Where the maps start: a little smaller and dimmer, as if further off. */
const APART = Object.freeze({ scale: 0.92, opacity: 0.55 })
/** Share of the scrubbed track at which the maps meet; the rest holds the joined pair. */
const JOIN = 0.6
/** The rarity gauge's path length: rarity is out of 100. */
const GAUGE = 100
/** The rarest tie's mark is a half-size copy of its line. */
const MARK_SCALE = 0.5

/** A scene tells the illustration when to draw: once, when the maps meet. */
interface Cue {
  fired: boolean
  play: (() => void) | null
}

/** True once a row has settled, so its weight rolls after it arrives. */
const Arrived = createContext(true)

const ROW: Variants = {
  out: { opacity: 0, y: 14 },
  in: (delay: number) => ({ opacity: 1, y: 0, transition: { duration: seconds(DURATION.settle), ease: CURVE.emphasized, delay } }),
}

function SettlingRow({ shown, delay, children }: { shown: boolean; delay: number; children: ReactNode }) {
  const [arrived, setArrived] = useState(shown)
  return (
    <m.tr initial={false} animate={shown ? 'in' : 'out'} variants={ROW} custom={delay} onAnimationComplete={(definition) => setArrived(definition === 'in')}>
      <Arrived.Provider value={shown && arrived}>{children}</Arrived.Provider>
    </m.tr>
  )
}

/** `shown` rolls to each new value; assistive tech reads only `final`. */
function Shown({ shown, final }: { shown: string | number; final: string | number }) {
  return (
    <>
      <span aria-hidden>
        <Rolling value={shown} />
      </span>
      <span className={kit.srOnly}>{final}</span>
    </>
  )
}

/** A tie's weight, rolling up to its value once its row has arrived. */
function RowBits({ bits }: { bits: number }) {
  const arrived = useContext(Arrived)
  const allowed = useMotionAllowed()
  return <Shown shown={!allowed || arrived ? tieBits(bits) : tieBits(0)} final={tieBits(bits)} />
}

function TieMark({ tie }: { tie: Tie }) {
  return (
    <svg viewBox="0 0 64 40" className={p.mark} data-layer={TIE_LAYER[tie.system]} aria-hidden>
      <path d="M 8 32 C 16 6, 48 6, 56 32" className={p.markLine} strokeWidth={tieStroke(tie.bits).width * MARK_SCALE} pathLength={1} data-mark-line="" />
      <circle cx={8} cy={32} r={4} className={p.markEnd} />
      <circle cx={56} cy={32} r={4} className={p.markEnd} />
    </svg>
  )
}

function Fact({ visual, label, value, meta, layer }: { visual: ReactNode; label: string; value: ReactNode; meta: string; layer?: string }) {
  return (
    <li className={`${f.surface} ${p.fact}`} data-layer={layer}>
      {visual}
      <span className={p.factText}>
        <span className={p.factLabel}>{label}</span>
        <span className={p.factValue}>{value}</span>
        <span className={p.factMeta}>{meta}</span>
      </span>
    </li>
  )
}

/**
 * Storyboard 3, "Two people" (BENTO_MOTION.md). The layout is CSS
 * (pair.module.css): a track with a sticky frame holding the pair and its
 * facts, the tie rows under it. GSAP scrubs the two person layers together
 * and shows the tie layer once they meet; anime.js then draws the ties rarest
 * first; Motion settles the rows and rolls their weights. With motion off,
 * every one of them is the final frame.
 */
export function PairScene({ pair, action }: { readonly pair: PairAtlas; readonly action?: SceneAction }) {
  const tableId = useId()
  const afterId = useId()
  const sceneRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const rowsRef = useRef<HTMLDivElement>(null)
  const cue = useRef<Cue>({ fired: false, play: null })
  const allowed = useMotionAllowed()
  /** Lines drawn so far while the illustration runs; null is the final frame. */
  const [landed, setLanded] = useState<number | null>(null)
  const rowsInView = useInView(rowsRef, { once: true, amount: 0.2 })

  const ties = pair.reading.ties
  const drawn = ties.filter((t) => mayDrawEdge(t.baseRate))
  const top = drawn[0]
  const names = Object.fromEntries(pair.people.map((x) => [x.id, x.name]))
  const live = allowed && landed !== null
  const lit = live ? landed : drawn.length
  const rowsShown = !live || (landed >= drawn.length && rowsInView)
  const step = staggerStep(drawn.length)

  const fire = useCallback(() => {
    if (cue.current.fired) return
    cue.current.fired = true
    cue.current.play?.()
  }, [])

  useEffect(() => {
    if (rowsInView) fire()
  }, [rowsInView, fire])

  useScene(
    trackRef,
    ({ gsap, ScrollTrigger, root }) => {
      const timeline = gsap.timeline({ defaults: { ease: 'none' } })
      gsap.utils.toArray<SVGSVGElement>('[data-side]', root).forEach((side) => {
        const away = (side.dataset.side === 'a' ? -SPREAD : SPREAD) * 100
        const axis = side.parentElement?.dataset.axis === 'y' ? 'yPercent' : 'xPercent'
        timeline.fromTo(side, { [axis]: away, ...APART }, { [axis]: 0, scale: 1, opacity: 1, duration: JOIN }, 0)
      })
      timeline.fromTo(gsap.utils.toArray<SVGSVGElement>('[data-ties]', root), { opacity: 0 }, { opacity: 1, duration: 0.001 }, JOIN)
      timeline.to({}, { duration: 1 - JOIN }, JOIN)
      const ground = root.querySelector<HTMLElement>('[data-ground]')
      if (ground) timeline.fromTo(ground, { '--contour-y': '0px' }, { '--contour-y': '-160px', duration: 1 }, 0)
      const trigger = ScrollTrigger.create({
        trigger: root,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        animation: timeline,
        onUpdate: (self) => {
          if (self.progress >= JOIN) fire()
        },
      })
      if (trigger.progress >= JOIN) fire()
    },
    [pair],
  )

  useIllustration(
    sceneRef,
    ({ anime, root, ease }) => {
      if (cue.current.fired || root.getBoundingClientRect().top < window.innerHeight) {
        setLanded(null)
        return
      }
      const all = (selector: string) => [...root.querySelectorAll<SVGElement>(selector)]
      const timeline = anime.createTimeline({ autoplay: false })
      const add = (targets: SVGElement[], params: AnimationParams, at: number) => {
        if (targets.length > 0) timeline.add(targets, params, at)
      }
      drawn.forEach((_, i) => {
        const part = (selector: string) => all(`[data-tie="${i}"] ${selector}`)
        const at = i * step
        const land = landsAt(at)
        add(part('[data-tie-end="from"]'), { opacity: [0, 1], duration: DURATION.quick, ease: ease(CURVE.standard) }, at)
        add(
          part('[data-tie-line]'),
          { ...drawStroke(ease), onComplete: () => setLanded((n) => Math.max(n ?? 0, i + 1)) },
          at,
        )
        add(part('[data-tie-end="to"]'), { opacity: [0, 1], duration: DURATION.quick, ease: ease(CURVE.standard) }, land)
        add(part('[data-tie-label]'), { opacity: [0, 1], translateY: [8, 0], duration: DURATION.settle, ease: ease(CURVE.emphasized) }, land)
      })
      add(all('[data-mark-line]'), drawStroke(ease), 0)
      add(all('[data-gauge]'), { strokeDashoffset: [pair.reading.rarity + 1, 0], duration: DURATION.draw, ease: ease(CURVE.emphasized) }, 0)
      // The hidden state goes on after the timeline exists, so reverting either leaves no inline style behind.
      anime.utils.set(all('[data-tie-line], [data-mark-line]'), undrawnStroke())
      anime.utils.set(all('[data-tie-end], [data-tie-label]'), { opacity: 0 })
      anime.utils.set(all('[data-gauge]'), { strokeDashoffset: pair.reading.rarity + 1 })
      setLanded(0)
      let current = true
      cue.current.play = () => {
        if (current) timeline.play()
      }
      return () => {
        current = false
        cue.current.play = null
      }
    },
    [pair],
  )

  return (
    <div ref={sceneRef} className={p.scene}>
      <a href={`#${afterId}`} className={kit.skip}>
        Skip past the drawing
      </a>
      <div ref={trackRef} className={p.track} data-scene="pair">
        <div className={p.frame}>
          <div className={f.shell}>
            <div className={f.stage} data-tint={top ? TIE_LAYER[top.system] : undefined}>
              <div className={`${f.ground} ${kit.contours}`} data-ground="" aria-hidden />
              <PairDrawing pair={pair} describedBy={tableId} gap={GAP} layered className={p.drawing} />
            </div>
          </div>
          <ul className={p.facts} data-action={action ? '' : undefined}>
            {top ? (
              <Fact visual={<TieMark tie={top} />} label="Rarest tie" value={tieName(top, centerName)} meta={tieOdds(top.baseRate)} layer={TIE_LAYER[top.system]} />
            ) : (
              <Fact visual={<span className={p.markEmpty} aria-hidden />} label="Rarest tie" value="None drawn" meta="Common ties only" />
            )}
            <Fact
              visual={
                <span className={p.dots} aria-hidden>
                  {ties.map((t, i) => (
                    <span
                      key={`${t.system}-${t.type}-${i}`}
                      className={p.dot}
                      data-layer={mayDrawEdge(t.baseRate) ? TIE_LAYER[t.system] : undefined}
                      data-lit={i < lit ? '' : undefined}
                    />
                  ))}
                </span>
              }
              label="Lines drawn"
              value={
                <>
                  <Shown shown={lit} final={drawn.length} /> of {ties.length}
                </>
              }
              meta="ties checked"
            />
            <Fact
              visual={
                <svg viewBox="0 0 44 44" className={p.gauge} aria-hidden>
                  <circle cx={22} cy={22} r={18} className={p.gaugeTrack} />
                  <circle
                    cx={22}
                    cy={22}
                    r={18}
                    className={p.gaugeArc}
                    pathLength={GAUGE}
                    strokeDasharray={`${pair.reading.rarity} ${2 * GAUGE}`}
                    transform="rotate(-90 22 22)"
                    data-gauge=""
                  />
                </svg>
              }
              label="Rarity"
              value={pair.reading.rarity}
              meta="of 100, against random pairs"
            />
            {action && (
              <li className={f.action}>
                <PrimaryAction href={action.href}>{action.label}</PrimaryAction>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div ref={rowsRef} id={afterId} className={`${f.surface} ${p.rows}`}>
        <TieTable
          reading={pair.reading}
          names={names}
          id={tableId}
          className={p.table}
          drawnRows={{
            row: ({ index, cells }) => (
              <SettlingRow shown={rowsShown} delay={seconds(index * step)}>
                {cells}
              </SettlingRow>
            ),
            bits: (tie) => <RowBits bits={tie.bits} />,
          }}
        />
      </div>
    </div>
  )
}
