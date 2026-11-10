'use client'

import { createContext, useContext, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { TIERS, mayDrawEdge } from '@pleiad/engine/services/rarity'
import s from './dash.module.css'
import { Hung, kit } from '@/components/bento-lab'
import { CircleDrawing } from '@/components/bento-lab/atlas/circle-drawing'
import { PairDrawing } from '@/components/bento-lab/atlas/pair-drawing'
import { appHrefs } from '@/components/bento-lab/people/hrefs'
import { CIRCLE_MIN, useTiesAtlases, type TiesAtlases } from '@/components/bento-lab/people/use-ties-atlases'
import { CirclePairs } from '@/components/bento-lab/scenes/circle-pairs'
import { frame as f } from '@/components/bento-v2'
import { hubOf } from '@/lib/atlas/circle-hub'
import type { AtlasPerson } from '@/lib/atlas/pair'
import { TIER_LABEL, tieBits, tieView } from '@/lib/relations/tie-text'

/** The dashboard is v2's own page: its links are v2's. */
const HREFS = appHrefs('v2')

interface Ties extends TiesAtlases {
  readonly self: AtlasPerson | null
  readonly others: readonly AtlasPerson[]
}

const TiesContext = createContext<Ties | null>(null)

const useTies = (): Ties => {
  const ties = useContext(TiesContext)
  if (!ties) throw new Error('A ties panel needs a TiesProvider above it')
  return ties
}

/**
 * The account's ties, read once for every panel that draws them
 * (`useTiesAtlases`): the panels sit apart in the grid, so they read one
 * result through context instead of each ranking the pairs again.
 */
export function TiesProvider({ self, others, today, children }: { readonly self: AtlasPerson | null; readonly others: readonly AtlasPerson[]; readonly today: string; readonly children: ReactNode }) {
  const atlases = useTiesAtlases(self, others, today, { circle: true })
  return <TiesContext.Provider value={{ ...atlases, self, others }}>{children}</TiesContext.Provider>
}

/** A panel's one live region: present from the first render, so every change of state is announced, never only the ones that mount it. */
function Announce({ children }: { readonly children: ReactNode }) {
  return (
    <p className={kit.srOnly} aria-live="polite" aria-atomic>
      {children}
    </p>
  )
}

function AddPerson() {
  return (
    <Link href={HREFS.addPerson} className={`${f.pill} ${f.pillQuiet} ${s.pathAction}`}>
      Add a person <ArrowUpRight size={15} aria-hidden />
    </Link>
  )
}

/**
 * Your strongest tie (BENTO_V2.md "Dashboard"): the heaviest pair drawn as
 * the bento kit draws a pair, two maps with a line for every rare tie; under
 * it the pair's ties counted per rarity tier and a link to the two maps. A
 * pair with no tie rare enough for a line is still drawn, and says so.
 */
export function StrongestTie() {
  const { self, others, best, pair, failed } = useTies()
  const drawn = pair.value
  const ties = drawn?.reading.ties ?? []
  const first = ties.find((tie) => mayDrawEdge(tie.baseRate))
  const rarest = first ? tieView(first) : null
  const counts = TIERS.map((tier) => [tier, ties.filter((tie) => tie.tier === tier).length] as const)
  const most = Math.max(1, ...counts.map(([, n]) => n))
  const empty = !self || others.length === 0
  const said = empty ? '' : failed ? 'The ties could not be read.' : drawn && pair.status === 'ready' ? `The strongest tie is drawn: ${drawn.people[0].name} and ${drawn.people[1].name}.` : 'Reading your ties.'

  return (
    <section className={`${f.panel} ${f.pad} ${s.path}`} aria-labelledby="v2-tie-title">
      <div className={s.cardHead}>
        <Hung as="h2" id="v2-tie-title" className={s.cardTitle}>
          Strongest tie
        </Hung>
        <p className={f.eyebrow}>{best ? `${tieBits(best.reading.bits)} with ${best.other.name}` : 'Weighed by rarity'}</p>
      </div>
      <Announce>{said}</Announce>

      {empty ? (
        <>
          <p className={f.small}>Add a second person and your heaviest tie is drawn here: two maps, a line for every tie rare enough to draw.</p>
          <AddPerson />
        </>
      ) : failed ? (
        <p className={f.small}>The ties could not be read. Reload to try again.</p>
      ) : !drawn ? (
        <p className={f.small}>Reading your ties…</p>
      ) : (
        <>
          <div className={`${f.drawingSlot} ${s.pairSlot}`} aria-busy={pair.status !== 'ready'}>
            <PairDrawing pair={drawn} describedBy="v2-tie-tiers" />
          </div>
          <p className={f.caption}>
            {rarest ? `The rarest: ${rarest.name}, ${rarest.odds}. The thicker the line, the rarer the tie.` : 'No tie between you is rare enough for a line; every tie checked is counted below.'}
          </p>
          <ul id="v2-tie-tiers" className={s.tiers}>
            {counts.map(([tier, n]) => (
              <li key={tier} className={s.tier} data-tier={tier}>
                <span className={f.small}>{TIER_LABEL[tier]}</span>
                <span className={s.tierBar} aria-hidden>
                  <i style={{ transform: `scaleX(${n / most})` }} />
                </span>
                <span className={s.tierCount}>{n}</span>
              </li>
            ))}
          </ul>
          <Link href={HREFS.pair(drawn.people[0].id, drawn.people[1].id)} className={`${f.pill} ${f.pillQuiet} ${s.pathAction}`}>
            Open the two maps <ArrowUpRight size={15} aria-hidden />
          </Link>
        </>
      )}
    </section>
  )
}

/**
 * Your circle (BENTO_V2.md "Dashboard"): you and the people most tied to you,
 * as many as the ring seats, drawn as the bento kit draws a circle, beside
 * its heaviest pairs and the link that saves it.
 */
export function YourCircle() {
  const { self, circle, circleNeeds, circleFailed } = useTies()
  const drawn = circle.value
  const hub = drawn ? hubOf(drawn) : null
  const empty = !self || circleNeeds > 0
  const said = empty ? '' : circleFailed ? 'The circle could not be drawn.' : drawn && circle.status === 'ready' ? `Your circle is drawn: ${drawn.people.length} people${hub ? `, ${hub.name} at the middle` : ''}.` : 'Drawing your circle.'

  return (
    <section className={`${f.panel} ${f.art} ${f.pad} ${s.circle}`} aria-labelledby="v2-circle-title">
      <div className={s.cardHead}>
        <Hung as="h2" id="v2-circle-title" className={s.cardTitle}>
          Your circle
        </Hung>
        <p className={f.eyebrow}>{drawn && hub ? `${drawn.people.length} people · ${hub.name} at the middle` : 'Arranged by what ties it'}</p>
      </div>
      <Announce>{said}</Announce>

      {empty ? (
        <div className={s.circleEmpty}>
          <p className={f.small}>
            A circle needs {CIRCLE_MIN} people. Save {circleNeeds === 1 ? 'one more person' : `${circleNeeds} more people`} and the circle draws itself here.
          </p>
          <AddPerson />
        </div>
      ) : circleFailed ? (
        <p className={f.small}>The circle could not be drawn. Reload to try again.</p>
      ) : !drawn ? (
        <p className={f.small}>Drawing your circle…</p>
      ) : (
        <div className={s.circleBody}>
          <div className={`${f.drawingSlot} ${s.circleSlot}`} aria-busy={circle.status !== 'ready'}>
            <CircleDrawing circle={drawn} describedBy="v2-circle-pairs" fit />
          </div>
          <div className={s.circleSide}>
            <CirclePairs circle={drawn} id="v2-circle-pairs" className={`${f.skinnedList} ${f.skinnedInset}`} />
            <Link href={HREFS.newCircle(drawn.people.map((person) => person.id))} className={`${f.pill} ${f.pillQuiet} ${s.pathAction}`}>
              Save as a circle <ArrowUpRight size={15} aria-hidden />
            </Link>
          </div>
        </div>
      )}
    </section>
  )
}
