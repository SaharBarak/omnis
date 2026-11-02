import { CircleScene } from '@/components/bento-lab/scenes'
import { Section } from '@/components/bento-lab/site'
import { siteHref } from '@/lib/site/routes'
import type { CircleAtlas } from '@/lib/atlas/types'

export function CircleSection({ circle }: { readonly circle: CircleAtlas }) {
  return (
    <Section
      id="circle"
      eyebrow="A circle"
      title="A group, arranged by what ties it"
      lead="The person whose ties carry the most information sits in the middle. Everyone else sits nearer the people they share the most with."
    >
      <CircleScene circle={circle} action={{ href: siteHref('/circle'), label: 'Map a circle' }} />
    </Section>
  )
}
