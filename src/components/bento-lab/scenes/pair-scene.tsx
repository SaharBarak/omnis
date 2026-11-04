'use client'

import { createContext, useContext, useId, useRef, useState, type ReactNode } from 'react'
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
import { drawStroke, landsAt, Rolling, undrawnStroke, useMotionAllowed, useSequence } from '@/components/bento-lab/motion'
import type { PairAtlas } from '@/lib/atlas/types'
import { CURVE, DURATION, seconds, staggerStep } from '@/lib/design/motion-tokens'
import { centerName, type Tie } from '@/lib/relations/pair-ties'
import { tieBits, tieName, tieOdds } from '@/lib/relations/tie-text'

/** The maps sit side by side, outer rings nearly touching (the drawing's own margin). */
const GAP = 0
/** The rarity gauge's path length: rarity is out of 100. */
const GAUGE = 100
/** The rarest tie's mark is a half-size copy of its line. */
const MARK_SCALE = 0.5

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
 * (pair.module.css): the pair joined, its facts in one row under it, the tie
 * rows under that. As the section comes into view one sequence slides the
 * two maps together (`--join`, which the stylesheet turns into each map's
 * offset), shows the tie layer, and draws the ties rarest first; Motion then
 * settles the rows and rolls their weights. With motion off, every one of
 * them is the final frame.
 */
export function PairScene({ pair, action }: { readonly pair: PairAtlas; readonly action?: SceneAction }) {
  const tableId = useId()
  const sceneRef = useRef<HTMLDivElement>(null)
  const rowsRef = useRef<HTMLDivElement>(null)
  const allowed = useMotionAllowed()
  /** Lines drawn so far while the sequence runs; null is the final frame. */
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

  useSequence(
    sceneRef,
    ({ anime, root, ease }) => {
      const all = (selector: string) => [...root.querySelectorAll<HTMLElement | SVGElement>(selector)]
      const timeline = anime.createTimeline({ autoplay: false })
      const add = (targets: (HTMLElement | SVGElement)[], params: AnimationParams, at: number) => {
        if (targets.length > 0) timeline.add(targets, params, at)
      }
      add(all('[data-pair-stack]'), { '--join': [0, 1], duration: DURATION.settle, ease: ease(CURVE.emphasized) }, 0)
      add(all('[data-ground]'), { '--drift': [1, 0], duration: DURATION.settle + DURATION.draw, ease: 'linear' }, 0)
      const met = DURATION.settle
      add(all('[data-ties]'), { opacity: [0, 1], duration: DURATION.quick, ease: ease(CURVE.standard) }, met)
      drawn.forEach((_, i) => {
        const part = (selector: string) => all(`[data-tie="${i}"] ${selector}`)
        const at = met + i * step
        const land = landsAt(at)
        add(part('[data-tie-end="from"]'), { opacity: [0, 1], duration: DURATION.quick, ease: ease(CURVE.standard) }, at)
        add(part('[data-tie-line]'), { ...drawStroke(ease), onComplete: () => setLanded((n) => Math.max(n ?? 0, i + 1)) }, at)
        add(part('[data-tie-end="to"]'), { opacity: [0, 1], duration: DURATION.quick, ease: ease(CURVE.standard) }, land)
        add(part('[data-tie-label]'), { opacity: [0, 1], translateY: [8, 0], duration: DURATION.settle, ease: ease(CURVE.emphasized) }, land)
      })
      add(all('[data-mark-line]'), drawStroke(ease), met)
      add(all('[data-gauge]'), { strokeDashoffset: [pair.reading.rarity + 1, 0], duration: DURATION.draw, ease: ease(CURVE.emphasized) }, met)
      anime.utils.set(all('[data-tie-line], [data-mark-line]'), undrawnStroke())
      anime.utils.set(all('[data-tie-end], [data-tie-label]'), { opacity: 0 })
      anime.utils.set(all('[data-gauge]'), { strokeDashoffset: pair.reading.rarity + 1 })
      setLanded(0)
      // Ended any way, every line is in: the rows still wait to be seen before they settle.
      return { timeline, settle: () => setLanded((n) => (n === null ? null : drawn.length)) }
    },
    [pair],
  )

  return (
    <div ref={sceneRef} className={p.scene}>
      <div data-scene="pair">
        <div className={p.frame}>
          <div className={f.shell}>
            <div className={f.stage} data-tint={top ? TIE_LAYER[top.system] : undefined}>
              <div className={`${f.ground} ${kit.starfield}`} data-ground="" aria-hidden />
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
      <div ref={rowsRef} className={`${f.surface} ${p.rows}`}>
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
