import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { EDGE_CEILING, TIER_CEILING } from '@pleiad/engine/services/rarity'
import { BaseRateChart, type BaseRateSample } from '@/components/bento-lab/blocks'
import { Section, site } from '@/components/bento-lab/site'
import type { PairAtlas } from '@/lib/atlas/types'
import type { BentoLabData } from '@/lib/data/bento-lab'
import { centerName } from '@/lib/relations/pair-ties'
import { tieName, tieOdds } from '@/lib/relations/tie-text'
import { siteHref } from '@/lib/site/routes'

const [RAREST_TIER] = TIER_CEILING

/** A pair's ties on the base-rate scale, named the way the tie table names them. */
const sampleOf = (pair: PairAtlas): BaseRateSample => ({
  label: `${pair.people[0].name} and ${pair.people[1].name}`,
  ties: pair.reading.ties.map((tie, i) => ({ key: `${tie.type}-${i}`, label: tieName(tie, centerName), share: tie.baseRate, bits: tie.bits })),
})

/**
 * Storyboard 6, "Method": one full-width chart of measured base rates with
 * the sample pair's ties on the same scale, and the rule in one line under
 * it. `pair` is the sample the page draws above.
 */
export function MethodSection({ lab, pair }: { readonly lab: BentoLabData; readonly pair: PairAtlas }) {
  return (
    <Section
      id="method"
      eyebrow="Method"
      title="Every tie is weighed against strangers"
      lead="A tie's weight is how surprising it is: minus log two of the share of random pairs that have it. A tie most pairs share says nothing about these two."
    >
      <BaseRateChart rows={lab.ties} sample={sampleOf(pair)}>
        <p className={site.figureLine}>
          <span>
            Rarer than {tieOdds(EDGE_CEILING)}, a tie gets a line on the map
            {RAREST_TIER ? `; rarer than ${tieOdds(RAREST_TIER[1])}, it leads` : ''}. The rest stay in the table.
          </span>
          <Link href={siteHref('/learn')} className={`${site.textLink} ${site.figureLineLink}`}>
            Read how each system is computed
            <ArrowRight size={15} aria-hidden />
          </Link>
        </p>
      </BaseRateChart>
    </Section>
  )
}
