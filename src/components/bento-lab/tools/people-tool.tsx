'use client'

import Link from 'next/link'
import { useCallback, useState } from 'react'
import { Link2, Plus } from 'lucide-react'
import { LightPreview } from './light-preview'
import { PersonCard, type Slot } from './person-card'
import s from './tools.module.css'
import { AtlasReadout, AtlasStage, CircleDrawing, CirclePairs, PairDrawing, StageBadge, TieTable } from '../atlas'
import { AtlasDigest } from '../atlas/digest'
import kit from '../kit.module.css'
import { PrimaryAction } from '../site/action'
import site from '../site/site.module.css'
import { loadCircleAtlas, loadPairAtlas, loadPersonAtlas } from '@/lib/atlas/load'
import type { AtlasPerson } from '@/lib/atlas/pair'
import { letterOf } from '@/lib/atlas/person-label'
import { encodePeople, MAX_PEOPLE, SHARE_PARAM } from '@/lib/atlas/share'
import type { AtlasLayerId, BirthInput, CircleAtlas, PairAtlas, PersonAtlas } from '@/lib/atlas/types'
import { INPUT_SETTLE_MS, useDeferredCompute } from '@/lib/hooks/use-deferred-compute'
import { signInHref } from '@/lib/site/routes'

/**
 * Maps the server already drew for the starting people. Every seed is
 * optional: without one (a shared link) the stage shows the light layers and
 * the browser computes the rest.
 */
export interface ToolSeeds {
  readonly one?: PersonAtlas
  readonly pair?: PairAtlas
  readonly circle?: CircleAtlas
}

const BLANK: BirthInput = { date: '', time: null, place: null, name: null, hebrewName: null }

const READOUT_ID = 'tool-findings'

const seedOf = <I, T>(input: I, value: T | undefined) => (value ? { input, value } : null)

function Waiting({ missing }: { missing: readonly string[] }) {
  return (
    <div className={s.waiting} role="status">
      <p className={site.body}>Add a birth date for {missing.join(' and ')} to draw the map.</p>
    </div>
  )
}

/**
 * The public map tool. One person draws the atlas, two draw the pair, three or
 * more draw the circle. Everything computes in the browser; nothing is saved.
 */
export function PeopleTool({
  people: initial,
  samples,
  seeds,
  today,
  shareBase,
}: {
  readonly people: readonly AtlasPerson[]
  readonly samples: boolean
  readonly seeds: ToolSeeds
  readonly today: string
  /** Absolute path of the page, for the share link. */
  readonly shareBase: string
}) {
  const [slots, setSlots] = useState<readonly Slot[]>(() => initial.map((p) => ({ key: p.id, seed: p.input, sample: samples })))
  const [reports, setReports] = useState<Readonly<Record<string, AtlasPerson | null>>>(() =>
    Object.fromEntries(initial.map((p) => [p.id, p])),
  )
  const [focus, setFocus] = useState<AtlasLayerId | null>(null)
  const [copied, setCopied] = useState<'idle' | 'done' | 'failed'>('idle')

  const onReport = useCallback((key: string, person: AtlasPerson | null) => {
    setReports((prev) => (JSON.stringify(prev[key]) === JSON.stringify(person) ? prev : { ...prev, [key]: person }))
  }, [])

  const add = () =>
    setSlots((prev) => {
      if (prev.length >= MAX_PEOPLE) return prev
      const used = new Set(prev.map((p) => p.key))
      const key = Array.from({ length: MAX_PEOPLE + 1 }, (_, i) => `p${i + 1}`).find((k) => !used.has(k)) ?? `p${prev.length + 1}`
      return [...prev, { key, seed: BLANK, sample: false }]
    })

  const remove = (key: string) => {
    setSlots((prev) => prev.filter((p) => p.key !== key))
    setReports((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => k !== key)))
  }

  const people = slots.map((slot) => reports[slot.key] ?? null)
  const ready = people.every((p): p is AtlasPerson => p !== null) ? (people as AtlasPerson[]) : null
  const missing = slots.flatMap((slot, i) => (reports[slot.key] ? [] : [`person ${letterOf(i)}`]))
  const count = slots.length

  const one = useDeferredCompute(
    count === 1 && ready ? ready[0].input : null,
    (input) => loadPersonAtlas(input, today),
    seedOf(initial[0]?.input, seeds.one),
    INPUT_SETTLE_MS,
    [today],
  )
  const two = useDeferredCompute(
    count === 2 && ready ? { a: ready[0], b: ready[1] } : null,
    ({ a, b }) => loadPairAtlas(a, b, today),
    initial.length >= 2 ? seedOf({ a: initial[0], b: initial[1] }, seeds.pair) : null,
    INPUT_SETTLE_MS,
    [today],
  )
  const many = useDeferredCompute(count >= 3 && ready ? ready : null, (list) => loadCircleAtlas(list), seedOf(initial, seeds.circle))

  const share = async () => {
    if (!ready) return
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${shareBase}?${SHARE_PARAM}=${encodePeople(ready)}`)
      setCopied('done')
    } catch {
      setCopied('failed')
    }
  }

  const relation = count === 1 ? one : count === 2 ? two : many
  const idle = (() => {
    if (count === 2 && two.value) return `Rarity ${two.value.reading.rarity} of 100`
    if (count >= 3 && many.value) return `${many.value.circle.pairs.length} pairs read`
    return count === 1 ? 'Waiting for a birth date' : 'Waiting for birth dates'
  })()

  const drawing = (() => {
    if (count === 2 && two.value) return <PairDrawing pair={two.value} describedBy={READOUT_ID} />
    if (count >= 3 && many.value) return <CircleDrawing circle={many.value} describedBy={READOUT_ID} />
    if (ready) return <LightPreview people={ready} today={today} />
    return <Waiting missing={missing} />
  })()

  const stage =
    count === 1 && one.value ? (
      <AtlasStage atlas={one.value} status={one} focus={focus} onFocus={setFocus} readoutId={READOUT_ID} className={s.stageSlot} />
    ) : (
      <div className={`${s.relationStage} ${s.stageSlot}`} aria-busy={relation.status === 'loading'}>
        <div className={s.relationTop}>
          <span className={kit.eyebrow}>{count === 1 ? 'One person' : count === 2 ? 'Two people' : `${count} people`}</span>
          <StageBadge {...relation} idle={idle} />
        </div>
        <div className={s.relationBody} data-busy={relation.status === 'loading' ? '' : undefined}>
          {drawing}
        </div>
      </div>
    )

  const findings = (() => {
    if (count === 1 && one.value) return <AtlasReadout atlas={one.value} id={READOUT_ID} focus={focus} />
    if (count === 2 && two.value) {
      const names = Object.fromEntries(two.value.people.map((p) => [p.id, p.name]))
      return <TieTable reading={two.value.reading} names={names} id={READOUT_ID} />
    }
    if (count >= 3 && many.value) return <CirclePairs circle={many.value} id={READOUT_ID} />
    if (relation.status === 'error') return <p className={site.body}>The map could not be drawn, so there are no findings yet.</p>
    if (ready) return <p className={site.body}>The findings appear as soon as the map is drawn.</p>
    return <p className={site.body}>The findings appear once every person has a birth date.</p>
  })()

  return (
    <>
      <div className={s.tool} data-count={count === 1 ? 'one' : 'many'}>
        <div className={s.rail} aria-label="People">
          {slots.map((slot, i) => (
            <PersonCard
              key={slot.key}
              slot={slot}
              index={i}
              onReport={onReport}
              onRemove={count > 1 ? remove : undefined}
              startOpen={initial.length === 1 || !initial.some((p) => p.id === slot.key)}
            />
          ))}
          {count < MAX_PEOPLE && (
            <button type="button" className={site.btn} onClick={add}>
              <Plus size={16} aria-hidden />
              Add a person
            </button>
          )}
        </div>
        <div className={s.main}>
          {stage}
          <aside className={s.findings} aria-label="Findings">
            {count === 1 && one.value && <AtlasDigest atlas={one.value} focus={focus} onFocus={setFocus} className={s.digest} />}
            <div className={s.card}>{findings}</div>
          </aside>
        </div>
      </div>
      <div className={s.saveBar}>
        <span className={site.body}>Nothing here is saved. A share link carries these birth details in its address; an account keeps them private.</span>
        <div className={site.actions}>
          <button type="button" className={`${site.btn} ${site.btnSmall}`} onClick={() => void share()} disabled={!ready}>
            <Link2 size={14} aria-hidden />
            {copied === 'done' ? 'Link copied' : copied === 'failed' ? 'Copy failed' : 'Copy share link'}
          </button>
          <PrimaryAction href={signInHref('/app/people')} size="small">
            Keep these people
          </PrimaryAction>
        </div>
      </div>
    </>
  )
}
