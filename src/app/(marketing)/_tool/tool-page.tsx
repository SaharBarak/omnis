import { PeopleTool, type ToolSeeds } from '@/components/bento-lab/tools'
import { Section } from '@/components/bento-lab/site'
import { buildCircleAtlas, buildPairAtlas, buildPersonAtlas } from '@/lib/atlas/build'
import { isoDay } from '@/lib/atlas/light'
import type { AtlasPerson } from '@/lib/atlas/pair'
import { decodePeople } from '@/lib/atlas/share'
import { siteHref } from '@/lib/site/routes'

/** The sample map, drawn on the server so the first paint is complete. */
const sampleSeeds = (people: readonly AtlasPerson[], today: string): ToolSeeds => {
  if (people.length === 1) return { one: buildPersonAtlas(people[0].input, today) }
  if (people.length === 2) return { pair: buildPairAtlas(people[0], people[1], today) }
  return { circle: buildCircleAtlas(people) }
}

/** A shared link is anyone's input: the server renders its light layers only and the browser computes the rest. */
const NO_SEEDS: ToolSeeds = {}

/**
 * T2 Tool page. Starts from a shared link when `?p=` holds valid people,
 * otherwise from the sample people. The server draws the sample map in full;
 * a shared map arrives as its light layers and draws in the browser.
 */
export function ToolPage({
  path,
  eyebrow,
  title,
  lead,
  samplePeople,
  shared,
}: {
  readonly path: string
  readonly eyebrow: string
  readonly title: string
  readonly lead: string
  readonly samplePeople: readonly AtlasPerson[]
  readonly shared: string | undefined
}) {
  const today = isoDay(new Date())
  const fromLink = decodePeople(shared)
  const people = fromLink ?? samplePeople
  return (
    <Section as="h1" eyebrow={eyebrow} title={title} lead={lead}>
      <PeopleTool people={people} samples={!fromLink} seeds={fromLink ? NO_SEEDS : sampleSeeds(people, today)} today={today} shareBase={siteHref(path)} />
    </Section>
  )
}
