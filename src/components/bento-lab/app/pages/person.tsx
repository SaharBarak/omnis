import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { IdentityStrip, RecordMissing, TiesSections, appHrefs } from '@/components/bento-lab/people'
import { PersonActions } from '@/components/bento-lab/people/person-actions'
import { LayersScene, MapFigure } from '@/components/bento-lab/scenes'
import { APPEARANCE, ErrorState, PageBlock, PageHead, PageStack, Section, site } from '@/components/bento-lab/site'
import { SystemTiles } from '@/components/bento-lab/systems/system-tiles'
import { atlasPeopleOf, atlasPersonOf, issueLine } from '@/lib/atlas/app/saved-person'
import { BIRTH_FIELD_LABEL } from '@/lib/atlas/birth-input'
import { ownedPeople, ownedPerson, routeId } from '@/lib/atlas/app/owned'
import { buildPersonAtlas } from '@/lib/atlas/build'
import { birthLine } from '@/lib/atlas/birth-line'
import { isoDay } from '@/lib/atlas/light'
import { requireUserId } from '@/lib/auth-server'
import type { SiteTree } from '@/lib/site/routes'

/**
 * A saved person's page (T10, BENTO_V2.md "The app in v2"): the map, taken
 * apart, ties with everyone else saved, every system page on them, and
 * their details to edit or delete. The same body in either tree.
 */
export async function PersonPageBody({ tree, params }: { readonly tree: SiteTree; readonly params: Promise<{ readonly id: string }> }) {
  const appearance = APPEARANCE[tree]
  const hrefs = appHrefs(tree)
  const missing = (
    <RecordMissing eyebrow="Person" title="Person not found" body="This person was deleted or the link is wrong." back={hrefs.people} backLabel="Back to people" appearance={appearance} />
  )
  const allPeople = (
    <Link href={hrefs.people} className={`${site.btn} ${site.btnSmall}`}>
      <ArrowLeft size={15} aria-hidden />
      All people
    </Link>
  )

  const id = routeId((await params).id)
  if (!id) return missing
  const userId = await requireUserId()
  const [person, everyone] = await Promise.all([ownedPerson(userId, id), ownedPeople(userId)])
  if (!person) return missing
  const actions = <PersonActions person={person} />

  const read = atlasPersonOf(person)
  if (!read.success)
    return (
      <PageStack appearance={appearance}>
        <PageHead eyebrow="Person" title={person.name} appearance={appearance}>
          {allPeople}
          {actions}
        </PageHead>
        <PageBlock appearance={appearance}>
          <ErrorState title={`This ${BIRTH_FIELD_LABEL[read.error.field]} cannot be read`}>
            {issueLine(read.error)} Fix it in {person.name}&apos;s details to draw the map.
          </ErrorState>
        </PageBlock>
      </PageStack>
    )

  const self = read.data
  const day = isoDay(new Date())
  const atlas = buildPersonAtlas(self.input, day)
  const others = atlasPeopleOf(everyone.filter((other) => other.id !== person.id)).people

  return (
    <PageStack appearance={appearance}>
      <PageHead eyebrow="Person" title={person.name} lead={birthLine(self)} appearance={appearance}>
        <IdentityStrip person={person} />
        {allPeople}
        {actions}
      </PageHead>
      <PageBlock appearance={appearance}>
        <MapFigure atlas={atlas} />
      </PageBlock>
      <Section id="layers" eyebrow="Four layers" title="One map, taken apart" lead={`${person.name}'s map, one layer at a time, each computed by its own tradition's rules.`} appearance={appearance}>
        <LayersScene atlas={atlas} />
      </Section>
      <TiesSections key={self.id} self={self} others={others} today={day} show="person" />
      <Section id="systems" eyebrow="Every system" title={`${person.name} in each system`} lead="Each page reads the same birth data through one more tradition." appearance={appearance}>
        <SystemTiles personId={person.id} tree={tree} />
      </Section>
    </PageStack>
  )
}
