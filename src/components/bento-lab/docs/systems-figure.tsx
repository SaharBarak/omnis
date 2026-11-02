import type { CSSProperties } from 'react'
import { Clock } from 'lucide-react'
import kit from '../kit.module.css'
import d from './docs.module.css'
import { LAYER_META } from '@/lib/atlas/layers'
import type { AtlasLayerId } from '@/lib/atlas/types'
import { CHART_SYSTEMS } from '@/lib/site/plans'
import { SYSTEM_CATALOG, type SystemInfo } from '@/lib/system-preferences'

const LAYER_ORDER: readonly AtlasLayerId[] = (Object.keys(LAYER_META) as AtlasLayerId[]).sort((a, b) => LAYER_META[a].pin - LAYER_META[b].pin)
const ON_MAP = new Set<string>(LAYER_ORDER.flatMap((layer) => LAYER_META[layer].systems))
const CHART = SYSTEM_CATALOG.filter((system) => CHART_SYSTEMS.includes(system.key))
const BESIDE = CHART.filter((system) => !ON_MAP.has(system.key))
const DAILY = SYSTEM_CATALOG.filter((system) => system.group === 'readings' && !CHART_SYSTEMS.includes(system.key))
const CALENDARS = SYSTEM_CATALOG.filter((system) => system.group === 'calendars')
const BY_KEY = new Map(SYSTEM_CATALOG.map((system) => [system.key, system]))

const order = (i: number): CSSProperties => ({ '--i': i }) as CSSProperties

function Chip({ system }: { system: SystemInfo }) {
  return (
    <li className={d.systemChip}>
      {system.label}
      {system.requiresTime && (
        <>
          <Clock size={12} aria-hidden />
          <span className={kit.srOnly}>, needs the birth time</span>
        </>
      )}
    </li>
  )
}

function Shelf({ title, systems, start }: { title: string; systems: readonly SystemInfo[]; start: number }) {
  if (systems.length === 0) return null
  return (
    <div className={`${d.systemShelf} ${kit.rise}`} style={order(start)}>
      <span className={kit.eyebrow}>{`${title} · ${systems.length}`}</span>
      <ul className={d.systemChips}>
        {systems.map((system) => (
          <Chip key={system.key} system={system} />
        ))}
      </ul>
    </div>
  )
}

/**
 * Every system the engine reads, placed where it lands: the four map layers
 * (from LAYER_META), the chart systems read beside the map, the daily draws
 * and the calendars. Counts and groups come from the catalog and the plans.
 */
export function SystemsFigure() {
  return (
    <figure className={d.systems} aria-label={`${CHART.length} chart systems: ${ON_MAP.size} on the map's layers, ${BESIDE.length} beside it`}>
      <ol className={d.systemLayers}>
        {LAYER_ORDER.map((layer, i) => {
          const meta = LAYER_META[layer]
          return (
            <li key={layer} className={`${d.systemLayer} ${kit.rise}`} data-layer={layer} style={order(i)}>
              <span className={d.systemLayerHead}>
                <span className={d.systemPin} aria-hidden>
                  {meta.pin}
                </span>
                {meta.name}
              </span>
              <ul className={d.systemChips}>
                {meta.systems.flatMap((key) => {
                  const system = BY_KEY.get(key)
                  return system ? [<Chip key={key} system={system} />] : []
                })}
              </ul>
              <span className={d.systemNeeds}>{meta.needs}</span>
            </li>
          )
        })}
      </ol>
      <Shelf title="Read beside the map" systems={BESIDE} start={LAYER_ORDER.length} />
      <div className={d.systemRow}>
        <Shelf title="Drawn each day" systems={DAILY} start={LAYER_ORDER.length + 1} />
        <Shelf title="Calendars dated each day" systems={CALENDARS} start={LAYER_ORDER.length + 2} />
      </div>
      <figcaption className={d.systemKey}>
        <Clock size={12} aria-hidden /> needs the birth time as well as the date
      </figcaption>
    </figure>
  )
}
