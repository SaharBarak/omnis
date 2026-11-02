import { LayersScene } from '@/components/bento-lab/scenes'
import { Section } from '@/components/bento-lab/site'
import type { PersonAtlas } from '@/lib/atlas/types'

export function LayersSection({ atlas, name }: { readonly atlas: PersonAtlas; readonly name: string }) {
  return (
    <Section
      id="layers"
      eyebrow="Four layers"
      title="One map, taken apart"
      lead={`${name}'s map, one layer at a time. Each is computed by its own tradition's rules, and together they make the map above.`}
    >
      <LayersScene atlas={atlas} />
    </Section>
  )
}
