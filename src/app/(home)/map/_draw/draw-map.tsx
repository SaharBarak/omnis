'use client'

import { useActionState, useId, useRef } from 'react'
import d from './draw.module.css'
import { keepSketch, type KeepSketchState } from '../actions'
import { kit } from '@/components/bento-lab'
import { BirthFields, birthFieldId } from '@/components/bento-lab/atlas/birth-fields'
import { PrimaryAction } from '@/components/bento-lab/site'
import { MapWindow, frame as f } from '@/components/bento-v2'
import { birthLine } from '@/lib/atlas/birth-line'
import { loadPersonAtlas } from '@/lib/atlas/load'
import type { AtlasPerson } from '@/lib/atlas/pair'
import type { PersonAtlas } from '@/lib/atlas/types'
import { useAtlasDraft } from '@/lib/atlas/use-atlas-draft'
import { INPUT_SETTLE_MS, useDeferredCompute } from '@/lib/hooks/use-deferred-compute'
import { sketchSteps, stepNumeral, type SketchStepId, type SketchStepState } from '@/lib/site/v2-sketch'

const STATE_WORD: Readonly<Record<SketchStepState, string>> = { done: 'done', current: 'current step', todo: 'to do' }

const NO_ERROR: KeepSketchState = { error: null }

/**
 * The steps and the plate of "Draw your map" (BENTO_V2.md). The sample is
 * shown under a veil until the visitor's first date replaces it; the veil's
 * button and every step only move focus. The steps read their state from
 * what the visitor has given, and each moves focus back to its field, so any
 * answer can be changed.
 */
export function DrawMap({ sample, seed, today }: { readonly sample: AtlasPerson; readonly seed: PersonAtlas; readonly today: string }) {
  const fields = useId()
  const form = useAtlasDraft(sample.input, true)
  const mapRef = useRef<HTMLElement>(null)
  const [kept, keep, keeping] = useActionState(keepSketch, NO_ERROR)
  const map = useDeferredCompute(form.input, (input) => loadPersonAtlas(input, today), { input: sample.input, value: seed }, INPUT_SETTLE_MS, [today])

  const mine = !form.sample
  const input = mine ? form.input : null
  const hasDate = input !== null
  const drawn = hasDate && map.status === 'ready'
  const steps = sketchSteps({ hasDate, hasHour: input?.time != null && input.place !== null, drawn })
  const atlas = map.value ?? seed

  const focusStep = (id: SketchStepId) => {
    if (id === 'read') {
      mapRef.current?.focus()
      return
    }
    document.getElementById(birthFieldId(fields, id === 'day' ? 'date' : 'time'))?.focus()
  }

  const veil = form.sample ? (
    <button type="button" className={`${f.pill} ${d.take}`} onClick={() => focusStep('day')}>
      Draw yours
    </button>
  ) : null
  const waiting = mine && !hasDate

  const meta = input ? birthLine({ id: 'you', name: 'You', input }) : mine ? 'No birth date yet' : `${sample.name}, ${birthLine(sample)}`
  const title = !mine ? `Sample · Kin ${seed.maya.kin}` : drawn ? `Your map · Kin ${atlas.maya.kin}` : 'Your map'

  return (
    <>
      <ol className={d.steps} role="list" aria-label="Steps">
        {steps.map((step) => (
          <li key={step.id}>
            <button
              type="button"
              className={d.step}
              data-state={step.state}
              aria-current={step.state === 'current' ? 'step' : undefined}
              onClick={() => focusStep(step.id)}
            >
              <span className={d.disc} aria-hidden>
                {stepNumeral(step.number)}
              </span>
              <span className={d.stepTitle}>
                {step.title}
                <span className={kit.srOnly}>
                  , {STATE_WORD[step.state]}
                  {step.optional ? ', optional' : ''}
                </span>
              </span>
              <span className={d.stepLine}>{step.line}</span>
            </button>
          </li>
        ))}
      </ol>

      <section ref={mapRef} className={d.plate} tabIndex={-1} aria-label={mine ? 'Your map' : 'Sample map'}>
        <MapWindow
          atlas={atlas}
          status={mine ? map : { status: 'ready', error: null }}
          title={title}
          meta={meta}
          head={
            <div className={d.fields}>
              <BirthFields id={fields} form={form} row dense />
              <p className={d.waiting} role="status">
                {waiting ? 'Type a whole birth date to draw your map.' : ''}
              </p>
            </div>
          }
          veil={veil}
          stale={waiting}
          currents={veil === null}
          className={d.window}
        />
      </section>

      <form action={keep} className={d.keep}>
        <input type="hidden" name="input" value={input ? JSON.stringify(input) : ''} />
        <p className={f.caption}>Nothing is saved until you keep it. Kept, it waits in this browser for an hour while you sign up.</p>
        {kept.error ? (
          <p className={d.error} role="alert">
            {kept.error}
          </p>
        ) : null}
        <PrimaryAction type="submit" intent="save" disabled={!hasDate || keeping}>
          {keeping ? 'Keeping' : 'Keep this map'}
        </PrimaryAction>
      </form>
    </>
  )
}
