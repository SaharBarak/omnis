'use client'

import { useId, useRef, type CSSProperties } from 'react'
import type { AnimationParams } from 'animejs'
import type { SceneAction } from './action'
import c from './circle.module.css'
import f from './figure.module.css'
import kit from '../kit.module.css'
import { PrimaryAction } from '../site/action'
import { CircleDrawing } from '@/components/bento-lab/atlas'
import { TIE_LAYER, tieStroke } from '@/components/bento-lab/atlas/tie-geometry'
import { drawStroke, landsAt, undrawnStroke, useIllustration } from '@/components/bento-lab/motion'
import type { CircleAtlas } from '@/lib/atlas/types'
import { CURVE, DURATION, staggerStep } from '@/lib/design/motion-tokens'
import { centerName } from '@/lib/relations/pair-ties'
import { headlineTie, tieBits, tieName, tieOdds } from '@/lib/relations/tie-text'

/** Heaviest pairs listed under the ring. */
const SHOWN_PAIRS = 3
/** How far beyond their seat people wait, as a share of their distance from the hub. */
const OUTSIDE = 0.4
/** The hub arrives from this scale. */
const HUB_FROM = 0.7
/** Share of the figure on screen that counts as having entered view. */
const ENTERED = 0.35
/** The pair chip's link is the line at this share of its drawn width. */
const LINK_SCALE = 0.5

type Point = readonly [number, number]

const centreOf = (node: Element): Point => {
  const dot = node.querySelector('circle')
  return dot ? [dot.cx.baseVal.value, dot.cy.baseVal.value] : [0, 0]
}

/**
 * Storyboard 4, "Circles" (BENTO_MOTION.md). An illustration that runs once
 * when the ring enters view: people settle into their seats heaviest first,
 * the lines draw heaviest first, and the hub sends one sonar ring outward.
 * The server markup is the drawn circle; with motion off it stays that way.
 */
export function CircleScene({ circle, action }: { readonly circle: CircleAtlas; readonly action?: SceneAction }) {
  const listId = useId()
  const figureRef = useRef<HTMLDivElement>(null)
  const person = (id: string) => circle.people.find((x) => x.id === id)
  const weight = (id: string) => circle.circle.pairs.reduce((sum, pair) => (pair.a === id || pair.b === id ? sum + pair.bits : sum), 0)
  const pairs = [...circle.circle.pairs].sort((x, y) => y.bits - x.bits).slice(0, SHOWN_PAIRS)
  const lead = pairs.map((pair) => headlineTie(pair.ties)).find((t) => t !== null) ?? null

  useIllustration(
    figureRef,
    ({ anime, root, ease }) => {
      if (root.getBoundingClientRect().top < window.innerHeight) return
      const nodes = [...root.querySelectorAll<SVGGElement>('[data-node]')].sort(
        (x, y) => weight(y.dataset.node ?? '') - weight(x.dataset.node ?? '') || (x.dataset.node ?? '').localeCompare(y.dataset.node ?? ''),
      )
      const edges = [...root.querySelectorAll<SVGGElement>('[data-edge]')].sort((x, y) => Number(y.dataset.bits) - Number(x.dataset.bits))
      const hubNode = nodes.find((n) => n.dataset.hub !== undefined)
      const hub = hubNode ? centreOf(hubNode) : null
      if (!hub) return

      const away = (node: SVGGElement): Point => {
        const [x, y] = centreOf(node)
        return [(x - hub[0]) * OUTSIDE, (y - hub[1]) * OUTSIDE]
      }
      const lines = edges.flatMap((e) => [...e.querySelectorAll<SVGElement>('[data-edge-line]')])
      const labels = edges.flatMap((e) => [...e.querySelectorAll<SVGElement>('[data-edge-label]')])
      const seat = staggerStep(nodes.length)
      const draw = staggerStep(edges.length)
      const linesAt = (nodes.length - 1) * seat + DURATION.settle
      const timeline = anime.createTimeline({ autoplay: false })
      nodes.forEach((node, i) => {
        const [dx, dy] = away(node)
        const motion: AnimationParams = node === hubNode ? { scale: [HUB_FROM, 1] } : { translateX: [dx, 0], translateY: [dy, 0] }
        timeline.add(node, { ...motion, opacity: [0, 1], duration: DURATION.settle, ease: ease(CURVE.emphasized) }, i * seat)
      })
      edges.forEach((edge, i) => {
        const at = linesAt + i * draw
        const line = edge.querySelector<SVGElement>('[data-edge-line]')
        const label = edge.querySelector<SVGElement>('[data-edge-label]')
        if (line) timeline.add(line, drawStroke(ease), at)
        if (label) timeline.add(label, { opacity: [0, 1], duration: DURATION.settle, ease: ease(CURVE.standard) }, landsAt(at))
      })
      const sonar = root.querySelector<SVGCircleElement>('[data-sonar]')
      if (sonar) {
        const reach = Math.max(...nodes.map((n) => Math.hypot(centreOf(n)[0] - hub[0], centreOf(n)[1] - hub[1]))) + sonar.r.baseVal.value
        timeline.add(
          sonar,
          { r: [sonar.r.baseVal.value, reach], opacity: [0.7, 0], duration: DURATION.draw, ease: ease(CURVE.standard) },
          landsAt(linesAt),
        )
      }

      // The hidden state goes on after the timeline exists, so reverting either leaves no inline style behind.
      nodes.forEach((node) => {
        const [dx, dy] = away(node)
        anime.utils.set(node, node === hubNode ? { scale: HUB_FROM, opacity: 0 } : { translateX: dx, translateY: dy, opacity: 0 })
      })
      if (lines.length > 0) anime.utils.set(lines, undrawnStroke())
      if (labels.length > 0) anime.utils.set(labels, { opacity: 0 })

      const watch = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return
          watch.disconnect()
          timeline.play()
        },
        { threshold: ENTERED },
      )
      watch.observe(root)
      return () => watch.disconnect()
    },
    [circle],
  )

  return (
    <div className={c.scene}>
      <div ref={figureRef} className={f.shell}>
        <div className={`${f.stage} ${c.rings}`} data-tint={lead ? TIE_LAYER[lead.system] : undefined}>
          <div className={`${f.ground} ${kit.starfield}`} aria-hidden />
          <CircleDrawing circle={circle} describedBy={listId} sonar fit className={c.drawing} />
        </div>
      </div>
      <div className={c.facts} data-action={action ? '' : undefined}>
        <ol id={listId} className={c.pairs} aria-label="Heaviest pairs">
          {pairs.map((pair) => {
            const a = person(pair.a)
            const b = person(pair.b)
            const top = headlineTie(pair.ties)
            return (
              <li key={`${pair.a}-${pair.b}`} className={`${f.surface} ${c.pair}`} data-layer={top ? TIE_LAYER[top.system] : undefined}>
                <span className={c.duo} aria-hidden>
                  <span className={c.seal} style={{ '--src': `url("${a?.maya.seal.src ?? ''}")` } as CSSProperties} />
                  <span className={c.link} style={{ '--w': `${top ? tieStroke(top.bits).width * LINK_SCALE : 1}px` } as CSSProperties} />
                  <span className={c.seal} style={{ '--src': `url("${b?.maya.seal.src ?? ''}")` } as CSSProperties} />
                </span>
                <span className={c.pairText}>
                  <span className={c.names}>
                    {a?.name ?? pair.a} and {b?.name ?? pair.b}
                  </span>
                  <span className={c.tie}>{top ? `${tieName(top, centerName)}, ${tieOdds(top.baseRate)}` : 'Common ties only'}</span>
                </span>
                <span className={c.bits}>{tieBits(pair.bits)}</span>
              </li>
            )
          })}
        </ol>
        {action && (
          <div className={f.action}>
            <PrimaryAction href={action.href}>{action.label}</PrimaryAction>
          </div>
        )}
      </div>
    </div>
  )
}
