'use client'

import { useId, useRef, type CSSProperties, type ReactNode } from 'react'
import { MEASURED_PAIRS } from '@pleiad/engine/services/rarity'
import b from './blocks.module.css'
import { baseRateModel, type BaseRateRow, type BaseRateSample, type ChartModel } from './base-rate-model'
import kit from '../kit.module.css'
import { useSequence, type IllustrationKit, type Sequence } from '../motion'
import { CURVE, DURATION } from '@/lib/design/motion-tokens'

/** The sequence's beats as shares of its length (only their ratios matter): bars rise, the sample drops, the threshold sweeps, a hold. */
const TIMING = Object.freeze({ rise: 0.5, riseStagger: 0.08, drop: 0.3, dropStagger: 0.06, sweep: 0.8, light: 0.08, hold: 0.3 })
/** The whole sequence: the draw token, then a settle for the threshold to land. */
const PLAY_MS = DURATION.draw + DURATION.settle
/** The beats are written in thousandths of a share, then stretched to `PLAY_MS`. */
const UNIT = 1000
/** How far above its seat a sample tie starts its drop, in pixels. */
const DROP_FROM = -72

const share = (n: number): string => `${Math.round(n * 1000) / 10}%`

/**
 * Storyboard 6: bars rise to their measured base rates, the sample's ties
 * drop onto the scale at their weight, then the line-or-no-line threshold
 * sweeps in from the rare end, lighting what it passes. It plays once, by
 * time, as the chart comes into view, so a reader never rests on a
 * half-swept threshold; a chart already on screen keeps its final frame.
 * Everything it moves is already in place in CSS; the sequence tweens CSS
 * variables, transform and opacity only, and each ends at the stylesheet's
 * own value.
 */
function buildSequence({ anime, root, ease }: IllustrationKit, model: ChartModel): Sequence | null {
  const field = root.querySelector<HTMLElement>('[data-field]')
  const columns = [...root.querySelectorAll<HTMLElement>('[data-column]')]
  const dots = [...root.querySelectorAll<HTMLElement>('[data-dot]')]
  if (!field) return null
  const at = (share: number) => share * UNIT
  const timeline = anime.createTimeline({ autoplay: false })
  columns.forEach((column, i) => {
    timeline.add(column, { '--rise': [0, 1], duration: at(TIMING.rise), ease: ease(CURVE.standard) }, at(i * TIMING.riseStagger))
  })
  const dropAt = timeline.duration
  dots.forEach((dot, i) => {
    timeline.add(dot, { translateY: [DROP_FROM, 0], opacity: [0, 1], duration: at(TIMING.drop), ease: ease(CURVE.emphasized) }, dropAt + at(i * TIMING.dropStagger))
  })
  const sweepAt = timeline.duration
  // Linear, so the moment the threshold passes a bar is where it is drawn.
  timeline.add(field, { '--sweep': [1, 0], duration: at(TIMING.sweep), ease: 'linear' }, sweepAt)
  const passes = (x: number) => sweepAt + at(TIMING.sweep) * (1 - (x - model.edge.x) / (1 - model.edge.x))
  const lit = [...columns.map((el, i) => [el, model.columns[i]] as const), ...dots.map((el, i) => [el, model.dots[i]] as const)]
  lit.forEach(([el, datum]) => {
    if (datum?.drawn) timeline.add(el, { '--lit': [0, 1], duration: at(TIMING.light), ease: 'linear' }, passes(datum.x))
  })
  timeline.add(field, { '--sweep': 0, duration: at(TIMING.hold) }, timeline.duration)
  timeline.stretch(PLAY_MS)
  return { timeline }
}

/**
 * Measured base rates as a chart: one bar per kind of tie, commonest on the
 * left, the threshold where a tie earns a line on the map, and optionally a
 * sample pair's ties on the same scale. Rows come from the engine's measured
 * rates (`measuredRow`, or the lab's `ties`); the threshold is EDGE_CEILING
 * and the lead mark the rarest tier's ceiling. It plays once as it comes
 * into view. `children` sit under the chart, inside the frame. With motion
 * off the chart is drawn in full.
 */
export function BaseRateChart({
  rows,
  sample,
  label = 'How often each kind of tie appears between two random people',
  children,
}: {
  readonly rows: readonly BaseRateRow[]
  readonly sample?: BaseRateSample
  readonly label?: string
  readonly children?: ReactNode
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const id = useId()
  const model = baseRateModel(rows, sample)
  const key = rows.map((r) => `${r.type}:${r.share}`).join('|') + (sample?.ties.map((t) => t.key).join('|') ?? '')

  useSequence(rootRef, (kit) => buildSequence(kit, model), [key])

  const leadWidth = 1 - model.lead.x
  return (
    <div ref={rootRef} className={b.chartTrack} data-scene="base-rates">
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
