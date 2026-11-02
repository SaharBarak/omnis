import { EDGE_CEILING } from '@pleiad/engine/services/rarity'
import { PairScene } from '@/components/bento-lab/scenes'
import { Section } from '@/components/bento-lab/site'
import { siteHref } from '@/lib/site/routes'
import type { PairAtlas } from '@/lib/atlas/types'

const percent = (share: number): string => `${Math.round(share * 100)}%`

export function PairSection({ pair }: { readonly pair: PairAtlas }) {
  return (
    <Section
      id="pair"
      eyebrow="Two people"
      title="Lines only where the engine finds something rare"
      lead={`A tie gets a line only when fewer than ${percent(EDGE_CEILING)} of random pairs share it. The thicker the line, the more it says about these two.`}
    >
      <PairScene pair={pair} action={{ href: siteHref('/pair'), label: 'Map two people' }} />
    </Section>
  )
}
