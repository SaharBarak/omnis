import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { peopleStyles as p, PersonTile, RecordMissing, appHrefs } from '@/components/bento-lab/people'
import { CircleActions } from '@/components/bento-lab/people/circle-actions'
import { CircleScene } from '@/components/bento-lab/scenes'
import { APPEARANCE, EmptyState, PageBlock, PageHead, PageStack, Section, site } from '@/components/bento-lab/site'
import { atlasPeopleOf } from '@/lib/atlas/app/saved-person'
import { ownedCircle, routeId } from '@/lib/atlas/app/owned'
import { buildCircleAtlas } from '@/lib/atlas/build'
import { requireUserId } from '@/lib/auth-server'
import type { SiteTree } from '@/lib/site/routes'

/** A saved circle's page (T11): the circle scene with its heaviest pairs, then its members; shared or deleted from its head. The same body in either tree. */
export async function CirclePageBody({ tree, params }: { readonly tree: SiteTree; readonly params: Promise<{ readonly id: string }> }) {
  const appearance = APPEARANCE[tree]
  const hrefs = appHrefs(tree)
  const missing = (
    <RecordMissing eyebrow="Circle" title="Circle not found" body="This circle was deleted or the link is wrong." back={hrefs.groups} backLabel="Back to circles" appearance={appearance} />
  )
  const id = routeId((await params).id)
  if (!id) return missing
  const circle = await ownedCircle(await requireUserId(), id)
  if (!circle) return missing

  const { people } = atlasPeopleOf(circle.members)
  const atlas = people.length >= 2 ? buildCircleAtlas(people) : null

  return (
    <PageStack appearance={appearance}>
      <PageHead
        eyebrow="Circle"
        title={circle.name}
        lead={circle.description ?? `${circle.members.length} people${atlas ? `, ${atlas.circle.pairs.length} pairs read` : ''}.`}
        appearance={appearance}
      >
        <Link href={hrefs.groups} className={`${site.btn} ${site.btnSmall}`}>
          <ArrowLeft size={15} aria-hidden />
          All circles
        </Link>
        <CircleActions circle={{ id: circle.id, name: circle.name }} />
      </PageHead>
      <PageBlock appearance={appearance}>
        {atlas ? (
          <CircleScene circle={atlas} />
        ) : (
          <EmptyState title="A circle needs two people with birth dates">
            This circle has {people.length === 1 ? 'one person' : 'no one'} with a readable birth date.
          </EmptyState>
        )}
      </PageBlock>
      <Section id="members" eyebrow="Members" title={`Everyone in ${circle.name}`} appearance={appearance}>
        {circle.members.length === 0 ? (
          <EmptyState title="No one is in this circle yet">Add people to it from the circles page.</EmptyState>
        ) : (
          <ul className={p.tiles} aria-label="Members">
            {circle.members.map((member) => (
              <PersonTile key={member.id} person={member} tree={tree} />
            ))}
          </ul>
        )}
      </Section>
    </PageStack>
  )
}
