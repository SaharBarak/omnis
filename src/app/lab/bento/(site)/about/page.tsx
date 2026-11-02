import type { Metadata } from 'next'
import Link from 'next/link'
import { EDGE_CEILING, MEASURED_PAIRS } from '@pleiad/engine/services/rarity'
import { BaseRateChart } from '@/components/bento-lab/blocks'
import { DocumentPage, type DocumentSection } from '@/components/bento-lab/docs/document-page'
import { SystemsFigure } from '@/components/bento-lab/docs/systems-figure'
import { buildBentoLab } from '@/lib/data/bento-lab'
import { CHART_SYSTEMS } from '@/lib/site/plans'
import { siteHref } from '@/lib/site/routes'
import { SYSTEM_CATALOG } from '@/lib/system-preferences'

export const metadata: Metadata = {
  title: 'About',
  description: 'What Pleiad computes, where the numbers come from and how a tie between two people is weighed.',
}

/** Systems read from a birth, as the plans count them; the rest of the readings are daily draws. */
const READINGS = SYSTEM_CATALOG.filter((system) => CHART_SYSTEMS.includes(system.key)).map((system) => system.label)

const pairs = (n: number): string => n.toLocaleString('en-US')

const SECTIONS: readonly DocumentSection[] = [
  {
    id: 'readings',
    title: `One map, ${READINGS.length} readings`,
    children: (
      <>
        <SystemsFigure />
        <p>{`The engine reads a person ${READINGS.length} ways from their birth, and Gematria also reads a Hebrew name.`}</p>
      </>
    ),
  },
  {
    id: 'engine',
    title: 'The engine',
    children: (
      <>
        <p>
          The calculations live in one TypeScript package. The public tools run it in your browser, so drawing a map
          needs no account.
        </p>
        <p>Planet positions come from astronomy-engine and circular-natal-horoscope-js, two open-source libraries.</p>
        <p>
          We test the Human Design layer against sources that share no code with ours: NASA JPL Horizons for planet
          longitudes, and a separate build on the Swiss Ephemeris for gates and lines, compared over hundreds of
          random births.
        </p>
      </>
    ),
  },
  {
    id: 'weights',
    title: 'How a tie is weighed',
    children: (
      <>
        <p>
          {`Any two people share something in most systems. To tell a rare tie from a common one, we ran the engine over ${pairs(MEASURED_PAIRS.dateOnly)} random pairs for the date-only systems and ${pairs(MEASURED_PAIRS.fullBirth)} for Human Design and astrology, and counted the share of pairs in which each tie fired.`}
        </p>
        <p>
          {`A tie's weight in bits is minus log two of that rate. The rarer the tie, the heavier its line. A tie found in ${Math.round(EDGE_CEILING * 100)}% of pairs or more gets no line.`}
        </p>
        <BaseRateChart rows={buildBentoLab().ties} />
      </>
    ),
  },
  {
    id: 'dreamspell',
    title: 'Dreamspell is a modern system',
    children: (
      <>
        <p>
          José and Lloydine Argüelles published Dreamspell in 1987. It takes the 260-day count, 20 day signs by 13
          numbers, and gives it a new start date and new meanings.
        </p>
        <p>
          The traditional Tzolkin, kept by Maya daykeepers, runs on its own correlation, so the two counts can put
          one birthday on different days. The map shows both and names each one.
        </p>
      </>
    ),
  },
  {
    id: 'limits',
    title: 'What the map does not claim',
    children: (
      <>
        <p>
          The readings are symbolic systems, and the map reports what each system says. A base rate measures how
          rare a tie is between strangers. It cannot tell you whether the tie holds for two people you know.
        </p>
        <p>
          The <Link href={siteHref('/terms')}>Terms of Service</Link> put the same limit in legal language.
        </p>
      </>
    ),
  },
  {
    id: 'write',
    title: 'Found a reading that looks wrong?',
    children: (
      <p>
        Send it through the <Link href={siteHref('/contact')}>contact page</Link> with the birth date you used and
        the reading you expected.
      </p>
    ),
  },
]

export default function AboutPage() {
  return (
    <DocumentPage
      eyebrow="About"
      title="What Pleiad computes"
      lead="Pleiad turns a birth date into a map of one person, then into the ties between people. Every mark on the map comes out of an engine we test against outside sources."
      sections={SECTIONS}
    />
  )
}
