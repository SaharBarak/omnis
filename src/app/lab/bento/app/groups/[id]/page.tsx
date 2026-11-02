import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { peopleStyles as p, PersonTile, RecordMissing } from '@/components/bento-lab/people'
import { CircleScene } from '@/components/bento-lab/scenes'
import { EmptyState, PageHead, Section, site } from '@/components/bento-lab/site'
import { atlasPeopleOf } from '@/lib/atlas/app/saved-person'
import { ownedCircle, routeId } from '@/lib/atlas/app/owned'
import { buildCircleAtlas } from '@/lib/atlas/build'
import { requireUserId } from '@/lib/auth-server'
import { siteHref } from '@/lib/site/routes'

export const metadata: Metadata = { title: 'Circle' }

const Missing = () => (
  <RecordMissing eyebrow="Circle" title="Circle not found" body="This circle was deleted or the link is wrong." back={siteHref('/app/groups')} backLabel="Back to circles" />
)

/** T11 App relation for a saved circle: the circle scene with its heaviest pairs, then its members. */
export default async function CirclePage({ params }: { readonly params: Promise<{ id: string }> }) {
  const id = routeId((await params).id)
  if (!id) return <Missing />
  const circle = await ownedCircle(await requireUserId(), id)
  if (!circle) return <Missing />

  const { people } = atlasPeopleOf(circle.members)
  const atlas = people.length >= 2 ? buildCircleAtlas(people) : null

  return (
    <>
      <PageHead
        eyebrow="Circle"
        title={circle.name}
        lead={circle.description ?? `${circle.members.length} people${atlas ? `, ${atlas.circle.pairs.length} pairs read` : ''}.`}
      >
        <Link href={siteHref('/app/groups')} className={`${site.btn} ${site.btnSmall}`}>
          <ArrowLeft size={15} aria-hidden />
          All circles
        </Link>
      </PageHead>
      <div className={site.page}>
        {atlas ? (
          <CircleScene circle={atlas} />
        ) : (
          <EmptyState title="A circle needs two people with birth dates">
            This circle has {people.length === 1 ? 'one person' : 'no one'} with a readable birth date.
          </EmptyState>
        )}
      </div>
      <Section id="members" eyebrow="Members" title={`Everyone in ${circle.name}`}>
        {circle.members.length === 0 ? (
          <EmptyState title="No one is in this circle yet">Add people to it from the circles page.</EmptyState>
        ) : (
          <ul className={p.tiles} aria-label="Members">
            {circle.members.map((member) => (
              <PersonTile key={member.id} person={member} />
            ))}
          </ul>
        )}
      </Section>
    </>
  )
}
