'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { Plus } from 'lucide-react'
import { newCircleHref, pairHref } from './hrefs'
import p from './people.module.css'
import { TieRows } from './ties-with-others'
import { useRankedTies, type Tied } from './use-ranked-ties'
import { circleSeats } from '../atlas/circle-drawing'
import { CircleScene } from '../scenes/circle-scene'
import { PairScene } from '../scenes/pair-scene'
import { Section } from '../site/section'
import site from '../site/site.module.css'
import { EmptyState, ErrorState, Loading, Skeleton } from '../site/states'
import { loadCircleAtlasInTurn, loadPairAtlasFrom } from '@/lib/atlas/load'
import { buildMaya } from '@/lib/atlas/maya'
import type { AtlasPerson } from '@/lib/atlas/pair'
import { useDeferredCompute } from '@/lib/hooks/use-deferred-compute'
import { tieBits } from '@/lib/relations/tie-text'
import { siteHref } from '@/lib/site/routes'

const ADD_PERSON = `${siteHref('/app/people')}?add=1`

/** A figure still being read: its shape, so the page does not jump when it lands. */
function FigureSkeleton({ label }: { readonly label: string }) {
  return (
    <Loading label={label}>
      <div className={p.figureSkeleton}>
        <Skeleton height="100%" />
      </div>
    </Loading>
  )
}

const addAction = (
  <Link href={ADD_PERSON} className={`${site.btn} ${site.btnSolid}`}>
    <Plus size={16} aria-hidden />
    Add a person
  </Link>
)

/**
 * Who sits in `self`'s circle: `self`, then the people most tied to them in
 * rank order, while the ring sized by the widest label seated so far still
 * holds them. Someone who would not be seated never shrinks the ring.
 */
const seated = (self: AtlasPerson, ranked: readonly Tied[]): readonly AtlasPerson[] => {
  const people = [self, ...ranked.map((t) => t.other)]
  const labels = people.map((person) => ({ name: person.name, sub: buildMaya(person.input.date).title }))
  const firstLeftOut = people.findIndex((_, i) => i + 1 > circleSeats(labels.slice(0, i + 1)))
  return firstLeftOut === -1 ? people : people.slice(0, firstLeftOut)
}

export interface TiesSectionsProps {
  readonly self: AtlasPerson
  readonly others: readonly AtlasPerson[]
  /** The ISO day the maps are drawn for. */
  readonly today: string
  /** The dashboard also seats the account's circle; a person page lists every tie under the strongest. */
  readonly show: 'dashboard' | 'person'
}

/**
 * `self`'s ties as the home page draws them (BENTO_SITE.md "Signed-in app"):
 * the heaviest pair as a `PairScene`, then either every tie ranked or the
 * circle of the people most tied to `self`. Readings run in the browser, one
 * pair at a time, and only the winning pair is drawn in full.
 */
export function TiesSections({ self, others, today, show }: TiesSectionsProps) {
  const ranked = useRankedTies(self, others)
  const best = ranked.value?.[0] ?? null
  const pair = useDeferredCompute(
    best ? { self, other: best.other, reading: best.reading } : null,
    (ask) => loadPairAtlasFrom(ask.self, ask.other, ask.reading, today),
    null,
    0,
    [today],
  )
  const members = useMemo(() => (ranked.value ? seated(self, ranked.value) : []), [self, ranked.value])
  const circle = useDeferredCompute(show === 'dashboard' && members.length >= 3 ? members : null, loadCircleAtlasInTurn, null, 0)

  const dashboard = show === 'dashboard'
  const failed = ranked.status === 'error' ? ranked.error : pair.status === 'error' ? pair.error : null
  const circleFailed = ranked.status === 'error' ? ranked.error : circle.status === 'error' ? circle.error : null

  return (
    <>
      <Section
        id="tie"
        eyebrow={dashboard ? 'Two people' : 'Ties'}
        title={dashboard ? 'Your strongest tie' : `${self.name} and the people you saved`}
        lead={
          best
            ? `Of everyone saved, ${self.name}'s ties with ${best.other.name} carry the most: ${tieBits(best.reading.bits)}. ${dashboard ? 'The thicker the line, the rarer the tie.' : 'Every other pair is ranked under it.'}`
            : `Each pair is weighed by how rare its ties are, heaviest first.`
        }
      >
        {others.length === 0 ? (
          <EmptyState title="Save a second person" action={addAction}>
            A tie needs two people. Add someone&apos;s birth date and the heaviest tie is drawn here.
          </EmptyState>
        ) : failed ? (
          <ErrorState title="Could not read the ties">{failed}</ErrorState>
        ) : pair.value && best ? (
          <PairScene pair={pair.value} action={{ href: pairHref(self.id, best.other.id), label: 'Open this pair' }} />
        ) : (
          <FigureSkeleton label={`Reading ties with ${others.length} ${others.length === 1 ? 'person' : 'people'}`} />
        )}
        {!dashboard && ranked.value && ranked.value.length > 1 && <TieRows self={self} ranked={ranked.value} />}
      </Section>

      {dashboard && (
        <Section
          id="circle"
          eyebrow="A circle"
          title="Your circle"
          lead={`${self.name} and the people most tied to them, as many as the ring seats. The person whose ties carry the most sits in the middle.`}
        >
          {others.length < 2 ? (
            <EmptyState title="A circle needs three people" action={addAction}>
              Save {others.length === 0 ? 'two more people' : 'one more person'} and the circle draws itself here.
            </EmptyState>
          ) : circleFailed ? (
            <ErrorState title="Could not draw the circle">{circleFailed}</ErrorState>
          ) : circle.value ? (
            <CircleScene circle={circle.value} action={{ href: newCircleHref(members.map((m) => m.id)), label: 'Save as a circle' }} />
          ) : (
            <FigureSkeleton label="Drawing your circle" />
          )}
        </Section>
      )}
    </>
  )
}
