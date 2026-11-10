'use client'

import p from './people.module.css'
import { TieRows } from './ties-with-others'
import { CIRCLE_MIN, useTiesAtlases } from './use-ties-atlases'
import { CircleScene } from '../scenes/circle-scene'
import { PairScene } from '../scenes/pair-scene'
import { PrimaryAction } from '../site/action'
import { Section } from '../site/section'
import { EmptyState, ErrorState, Loading, Skeleton } from '../site/states'
import type { AtlasPerson } from '@/lib/atlas/pair'
import { tieBits } from '@/lib/relations/tie-text'
import { useAppearance, useAppHrefs } from '@/components/bento-lab/site/site-tree'

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

function AddAction() {
  const { addPerson } = useAppHrefs()
  return (
    <PrimaryAction href={addPerson} intent="add">
      Add a person
    </PrimaryAction>
  )
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
  const dashboard = show === 'dashboard'
  const hrefs = useAppHrefs()
  const appearance = useAppearance()
  const { ranked, best, pair, members, circle, circleNeeds, failed, circleFailed } = useTiesAtlases(self, others, today, { circle: dashboard })

  return (
    <>
      <Section
        appearance={appearance}
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
          <EmptyState title="Save a second person" action=<AddAction />>
            A tie needs two people. Add someone&apos;s birth date and the heaviest tie is drawn here.
          </EmptyState>
        ) : failed ? (
          <ErrorState title="Could not read the ties">{failed}</ErrorState>
        ) : pair.value && best ? (
          <PairScene pair={pair.value} action={{ href: hrefs.pair(self.id, best.other.id), label: 'Open this pair' }} />
        ) : (
          <FigureSkeleton label={`Reading ties with ${others.length} ${others.length === 1 ? 'person' : 'people'}`} />
        )}
        {!dashboard && ranked.value && ranked.value.length > 1 && <TieRows self={self} ranked={ranked.value} />}
      </Section>

      {dashboard && (
        <Section
          appearance={appearance}
          id="circle"
          eyebrow="A circle"
          title="Your circle"
          lead={`${self.name} and the people most tied to them, as many as the ring seats. The person whose ties carry the most sits in the middle.`}
        >
          {circleNeeds > 0 ? (
            <EmptyState title={`A circle needs ${CIRCLE_MIN} people`} action=<AddAction />>
              Save {circleNeeds === 1 ? 'one more person' : `${circleNeeds} more people`} and the circle draws itself here.
            </EmptyState>
          ) : circleFailed ? (
            <ErrorState title="Could not draw the circle">{circleFailed}</ErrorState>
          ) : circle.value ? (
            <CircleScene circle={circle.value} action={{ href: hrefs.newCircle(members.map((m) => m.id)), label: 'Save as a circle' }} />
          ) : (
            <FigureSkeleton label="Drawing your circle" />
          )}
        </Section>
      )}
    </>
  )
}
