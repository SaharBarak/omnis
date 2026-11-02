import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { IdentityStrip, RecordMissing, TiesSections } from '@/components/bento-lab/people'
import { LayersScene, MapFigure } from '@/components/bento-lab/scenes'
import { ErrorState, PageHead, Section, site } from '@/components/bento-lab/site'
import { SystemTiles } from '@/components/bento-lab/systems/system-tiles'
import { atlasPeopleOf, atlasPersonOf, issueLine } from '@/lib/atlas/app/saved-person'
import { BIRTH_FIELD_LABEL } from '@/lib/atlas/birth-input'
import { ownedPeople, ownedPerson, routeId } from '@/lib/atlas/app/owned'
import { buildPersonAtlas } from '@/lib/atlas/build'
import { birthLine } from '@/lib/atlas/birth-line'
import { isoDay } from '@/lib/atlas/light'
import { requireUserId } from '@/lib/auth-server'
import { siteHref } from '@/lib/site/routes'

export const metadata: Metadata = { title: 'Person' }

const Missing = () => (
  <RecordMissing eyebrow="Person" title="Person not found" body="This person was deleted or the link is wrong." back={siteHref('/app/people')} backLabel="Back to people" />
)

const allPeople = (
  <Link href={siteHref('/app/people')} className={`${site.btn} ${site.btnSmall}`}>
    <ArrowLeft size={15} aria-hidden />
    All people
  </Link>
)

/** T10 App person: the map, taken apart, ties with everyone else saved, and every system page. */
export default async function PersonPage({ params }: { readonly params: Promise<{ id: string }> }) {
  const id = routeId((await params).id)
  if (!id) return <Missing />
  const userId = await requireUserId()
  const [person, everyone] = await Promise.all([ownedPerson(userId, id), ownedPeople(userId)])
  if (!person) return <Missing />

  const read = atlasPersonOf(person)
  if (!read.success)
    return (
      <>
        <PageHead eyebrow="Person" title={person.name}>
          {allPeople}
        </PageHead>
        <div className={site.page}>
          <ErrorState title={`This ${BIRTH_FIELD_LABEL[read.error.field]} cannot be read`}>
            {issueLine(read.error)} Fix it in {person.name}&apos;s details to draw the map.
          </ErrorState>
        </div>
      </>
    )

  const self = read.data
  const day = isoDay(new Date())
  const atlas = buildPersonAtlas(self.input, day)
  const others = atlasPeopleOf(everyone.filter((other) => other.id !== person.id)).people

  return (
    <>
      <PageHead eyebrow="Person" title={person.name} lead={birthLine(self)}>
        <IdentityStrip person={person} />
        {allPeople}
      </PageHead>
      <div className={site.page}>
        <MapFigure atlas={atlas} />
      </div>
      <Section id="layers" eyebrow="Four layers" title="One map, taken apart" lead={`${person.name}'s map, one layer at a time, each computed by its own tradition's rules.`}>
        <LayersScene atlas={atlas} />
      </Section>
      <TiesSections key={self.id} self={self} others={others} today={day} show="person" />
      <Section id="systems" eyebrow="Every system" title={`${person.name} in each system`} lead="Each page reads the same birth data through one more tradition.">
        <SystemTiles personId={person.id} />
      </Section>
    </>
  )
}
