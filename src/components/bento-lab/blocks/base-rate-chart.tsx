'use client'

import { useId, useRef, type CSSProperties, type ReactNode } from 'react'
import { MEASURED_PAIRS } from '@pleiad/engine/services/rarity'
import b from './blocks.module.css'
import { baseRateModel, type BaseRateRow, type BaseRateSample, type ChartModel } from './base-rate-model'
import kit from '../kit.module.css'
import { useScene, type SceneKit } from '../motion'
import { DURATION, seconds } from '@/lib/design/motion-tokens'

/** Scroll-timeline units (scrubbed, so only their ratios matter): bars rise, the sample drops, the threshold sweeps, a hold. */
const TIMING = Object.freeze({ rise: 0.5, riseStagger: 0.08, drop: 0.3, dropStagger: 0.06, sweep: 0.8, light: 0.08, hold: 0.3 })
/** The whole scene played by time instead of scroll: the draw token, then a settle for the threshold to land. */
const PLAY_MS = DURATION.draw + DURATION.settle
/** How far above its seat a sample tie starts its drop, in pixels. */
const DROP_FROM = -72

const share = (n: number): string => `${Math.round(n * 1000) / 10}%`

/**
 * Storyboard 6: bars rise to their measured base rates, the sample's ties
 * drop onto the scale at their weight, then the line-or-no-line threshold
 * sweeps in from the rare end, lighting what it passes. Pinned (the home
 * track), the scroll scrubs it. Unpinned (inside an article), it plays once
 * as the chart comes into view, so a reader who stops scrolling never reads
 * a half-swept threshold; a chart already on screen keeps its final frame.
 * Everything it moves is already in place in CSS; GSAP drives CSS
 * variables, transform and opacity only.
 */
function buildScene({ gsap, ScrollTrigger, root }: SceneKit, model: ChartModel, pinned: boolean): void {
  const field = root.querySelector<HTMLElement>('[data-field]')
  const columns = gsap.utils.toArray<HTMLElement>('[data-column]', root)
  const dots = gsap.utils.toArray<HTMLElement>('[data-dot]', root)
  if (!field) return
  if (!pinned && root.getBoundingClientRect().top < window.innerHeight) return
  const timeline = gsap.timeline({ defaults: { ease: 'none' }, paused: !pinned })
  timeline.fromTo(columns, { '--rise': 0 }, { '--rise': 1, duration: TIMING.rise, stagger: TIMING.riseStagger }, 0)
  const dropAt = timeline.duration()
  if (dots.length > 0) {
    timeline.fromTo(dots, { y: DROP_FROM, opacity: 0 }, { y: 0, opacity: 1, duration: TIMING.drop, stagger: TIMING.dropStagger }, dropAt)
  }
  const sweepAt = timeline.duration()
  timeline.fromTo(field, { '--sweep': 1 }, { '--sweep': 0, duration: TIMING.sweep }, sweepAt)
  const passes = (x: number) => sweepAt + TIMING.sweep * (1 - (x - model.edge.x) / (1 - model.edge.x))
  const lit = [...columns.map((el, i) => [el, model.columns[i]] as const), ...dots.map((el, i) => [el, model.dots[i]] as const)]
  lit.forEach(([el, datum]) => {
    if (!datum?.drawn) return
    timeline.fromTo(el, { '--lit': 0 }, { '--lit': 1, duration: TIMING.light, immediateRender: true }, passes(datum.x))
  })
  timeline.to({}, { duration: TIMING.hold })
  if (pinned) {
    ScrollTrigger.create({ trigger: root, start: 'top 75%', end: 'bottom bottom', scrub: true, animation: timeline })
    return
  }
  timeline.timeScale(timeline.duration() / seconds(PLAY_MS))
  ScrollTrigger.create({ trigger: root, start: 'top 80%', once: true, onEnter: () => void timeline.play() })
}

/**
 * Measured base rates as a chart: one bar per kind of tie, commonest on the
 * left, the threshold where a tie earns a line on the map, and optionally a
 * sample pair's ties on the same scale. Rows come from the engine's measured
 * rates (`measuredRow`, or the lab's `ties`); the threshold is EDGE_CEILING
 * and the lead mark the rarest tier's ceiling. `pin` holds the chart in a
 * sticky frame while the scene plays (the home page); without it the scene
 * plays as the chart crosses the viewport. `children` sit under the chart,
 * inside the frame. With motion off the chart is drawn in full.
 */
export function BaseRateChart({
  rows,
  sample,
  pin = false,
  label = 'How often each kind of tie appears between two random people',
  children,
}: {
  readonly rows: readonly BaseRateRow[]
  readonly sample?: BaseRateSample
  readonly pin?: boolean
  readonly label?: string
  readonly children?: ReactNode
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const id = useId()
  const model = baseRateModel(rows, sample)
  const key = rows.map((r) => `${r.type}:${r.share}`).join('|') + (sample?.ties.map((t) => t.key).join('|') ?? '')

  useScene(rootRef, (kit) => buildScene(kit, model, pin), [key, pin])

  const leadWidth = 1 - model.lead.x
  return (
    <div ref={rootRef} className={b.chartTrack} data-pin={pin || undefined} data-scene="base-rates">
      <div className={b.chartFrame}>
        <figure className={`${b.chart} ${kit.starfield}`} aria-labelledby={`${id}-title`}>
          <figcaption id={`${id}-title`} className={b.chartTitle}>
            <span>{label}</span>
            <span className={b.chartSource}>
              {MEASURED_PAIRS.dateOnly.toLocaleString('en-US')} random pairs, {MEASURED_PAIRS.fullBirth.toLocaleString('en-US')} where a birth time is needed
            </span>
          </figcaption>
          <div className={b.field} data-field="" aria-hidden style={{ '--edge': model.edge.x, '--lead': model.lead.x, '--lead-w': leadWidth } as CSSProperties}>
            <div className={b.zones}>
              <span className={b.zoneOff}>Table only</span>
              <span className={b.zoneOn}>
                <span className={b.zoneOnLabel}>Gets a line</span>
              </span>
              <span className={b.zoneLead}>
                <span className={b.zoneLeadLabel}>Leads</span>
              </span>
            </div>
            <div className={b.plot}>
              <span className={b.gridLine} style={{ '--at': 0.5 } as CSSProperties} />
              <span className={b.gridLine} style={{ '--at': 1 } as CSSProperties} />
              <ol className={b.columns} style={{ '--n': model.columns.length } as CSSProperties}>
                {model.columns.map((c) => (
                  <li key={c.type} className={b.column} data-column="" data-drawn={c.drawn || undefined} data-leads={c.leads || undefined} style={{ '--share': c.share } as CSSProperties}>
                    <span className={b.bar} />
                    <span className={b.oddsTrack}>
                      <span className={b.odds}>{c.odds}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            {sample && model.dots.length > 0 && (
              <div className={b.lane} style={{ '--levels': model.levels } as CSSProperties}>
                <span className={b.laneName}>
                  {sample.label}: {model.dots.length} {model.dots.length === 1 ? 'tie' : 'ties'}, {model.dots.filter((d) => d.drawn).length} drawn
                </span>
                {model.dots.map((d) => (
                  <span key={d.key} className={b.dot} data-dot="" data-drawn={d.drawn || undefined} data-end={d.x > 0.82 || undefined} style={{ '--x': d.x, '--level': d.level } as CSSProperties}>
                    {d.drawn && <span className={b.dotLabel}>{d.label}</span>}
                  </span>
                ))}
              </div>
            )}
            <span className={b.edge}>
              <span className={b.edgeLabel}>{model.edge.odds}</span>
            </span>
          </div>
          <ol className={b.names} aria-hidden style={{ '--n': model.columns.length } as CSSProperties}>
            {model.columns.map((c) => (
              <li key={c.type}>
                <span className={b.name}>{c.label}</span>
                <span className={b.nameBits}>{c.bits.toFixed(1)} bits</span>
              </li>
            ))}
          </ol>
          <table className={kit.srOnly}>
            <caption>
              {label}. Ties rarer than {model.edge.odds} get a line on the map; rarer than {model.lead.odds}, they lead it.
            </caption>
            <thead>
              <tr>
                <th scope="col">Tie</th>
                <th scope="col">Random pairs with it</th>
                <th scope="col">Weight</th>
                <th scope="col">On the map</th>
              </tr>
            </thead>
            <tbody>
              {model.columns.map((c) => (
                <tr key={c.type}>
                  <th scope="row">{c.label}</th>
                  <td>{share(c.share)}</td>
                  <td>{c.bits.toFixed(1)} bits</td>
                  <td>{c.leads ? 'Leads the map' : c.drawn ? 'Drawn' : 'Table only'}</td>
                </tr>
              ))}
              {sample &&
                model.dots.map((d) => (
                  <tr key={d.key}>
                    <th scope="row">
                      {sample.label}: {d.label}
                    </th>
                    <td>{share(d.share)}</td>
                    <td>{d.bits.toFixed(1)} bits</td>
                    <td>{d.drawn ? 'Drawn' : 'Table only'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </figure>
        {children}
      </div>
    </div>
  )
}
